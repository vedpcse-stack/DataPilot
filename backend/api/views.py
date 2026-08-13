import os

import joblib
import pandas as pd
from django.conf import settings
from django.http import FileResponse
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from api.exceptions import DataPilotError
from api.serializers import (
    PredictRequestSerializer,
    TargetAnalysisRequestSerializer,
    TrainRequestSerializer,
)
from api.services import dataset_service, pdf_service, storage_service, training_service


def _human_size(num_bytes):
    for unit in ["B", "KB", "MB", "GB"]:
        if num_bytes < 1024:
            return f"{num_bytes:.1f} {unit}" if unit != "B" else f"{int(num_bytes)} {unit}"
        num_bytes /= 1024
    return f"{num_bytes:.1f} TB"


def _load_dataset_df(dataset_id):
    csv_path = storage_service.dataset_csv_path(dataset_id)
    if not csv_path:
        raise DataPilotError(
            "This dataset session has expired or was not found. Please upload the CSV again.",
            status_code=410,
        )
    return pd.read_csv(csv_path)


class DatasetAnalyzeView(APIView):
    """POST /api/dataset/analyze/  (multipart/form-data, field name: file)"""

    def post(self, request):
        storage_service.cleanup_expired()

        upload = request.FILES.get("file")
        if not upload:
            raise DataPilotError("No file was uploaded. Please attach a .csv file.")

        if upload.size > settings.MAX_UPLOAD_SIZE_BYTES:
            max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
            raise DataPilotError(f"File is too large. Maximum allowed size is {max_mb} MB.")

        csv_bytes = upload.read()
        df = dataset_service.read_csv_safely(csv_bytes, upload.name)
        profile = dataset_service.profile_dataset(df, upload.name, upload.size)
        profile["file_size_display"] = _human_size(upload.size)

        dataset_id = storage_service.new_id()
        storage_service.save_dataset(dataset_id, csv_bytes, profile)

        return Response({"dataset_id": dataset_id, "profile": profile})


class TargetAnalyzeView(APIView):
    """POST /api/dataset/target-analysis/"""

    def post(self, request):
        serializer = TargetAnalysisRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        df = _load_dataset_df(data["dataset_id"])
        analysis = dataset_service.analyze_target(df, data["target_column"], data["feature_columns"])
        return Response(analysis)


AVAILABLE_MODELS = {
    "classification": [
        {"key": "knn", "label": "K-Nearest Neighbors (KNN)"},
        {"key": "decision_tree", "label": "Decision Tree"},
        {"key": "random_forest", "label": "Random Forest"},
        {"key": "svc", "label": "Support Vector Classifier (SVC)"},
        {"key": "auto", "label": "Auto Model (compare all)"},
    ],
    "regression": [
        {"key": "linear_regression", "label": "Linear Regression"},
        {"key": "polynomial_regression", "label": "Polynomial Regression"},
        {"key": "auto", "label": "Auto Model (compare all)"},
    ],
}


@api_view(["GET"])
def available_models(request):
    task = request.query_params.get("task")
    if task not in AVAILABLE_MODELS:
        raise DataPilotError("Query param 'task' must be 'classification' or 'regression'.")
    return Response({"models": AVAILABLE_MODELS[task]})


class TrainModelView(APIView):
    """POST /api/model/train/"""

    def post(self, request):
        serializer = TrainRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        df = _load_dataset_df(data["dataset_id"])
        dataset_meta = storage_service.load_dataset_meta(data["dataset_id"]) or {}

        # Re-validate columns/target against this dataset for safety.
        target_info = dataset_service.analyze_target(df, data["target_column"], data["feature_columns"])
        if target_info["detected_task"] != data["task"]:
            raise DataPilotError(
                f"The target column looks like {target_info['detected_task']}, not {data['task']}. "
                "Please re-check target analysis."
            )

        result = training_service.train(
            df=df,
            feature_columns=data["feature_columns"],
            target_column=data["target_column"],
            task=data["task"],
            model_key=data["model_key"],
            test_size=data["test_size"],
            random_state=data["random_state"],
        )

        model_id = storage_service.new_id()
        model_dir = storage_service.model_dir(model_id, create=True)
        pipeline_path = os.path.join(model_dir, "pipeline.pkl")
        joblib.dump(
            {
                "pipeline": result.pop("pipeline"),
                "label_encoder": result.pop("label_encoder"),
                "feature_columns": data["feature_columns"],
                "target_column": data["target_column"],
                "task": data["task"],
            },
            pipeline_path,
        )

        meta = {
            "dataset_id": data["dataset_id"],
            "feature_columns": data["feature_columns"],
            "target_column": data["target_column"],
            "dataset_profile": dataset_meta,
            "target_analysis": target_info,
            "training": result,
        }
        storage_service.save_model(model_id, pipeline_path, meta)

        response_payload = {"model_id": model_id, **result}
        return Response(response_payload)


class PredictView(APIView):
    """POST /api/model/predict/"""

    def post(self, request):
        serializer = PredictRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        pipeline_path = storage_service.model_pipeline_path(data["model_id"])
        if not pipeline_path:
            raise DataPilotError(
                "This trained model session has expired. Please train a model again.", status_code=410
            )

        bundle = joblib.load(pipeline_path)
        feature_columns = bundle["feature_columns"]
        missing = [c for c in feature_columns if c not in data["inputs"]]
        if missing:
            raise DataPilotError(f"Missing input value(s) for: {', '.join(missing)}.")

        row = {col: data["inputs"][col] for col in feature_columns}
        try:
            input_df = pd.DataFrame([row])
            for col in feature_columns:
                # Attempt numeric coercion; leave as-is if it's genuinely categorical text.
                try:
                    input_df[col] = pd.to_numeric(input_df[col])
                except (ValueError, TypeError):
                    pass
            prediction = bundle["pipeline"].predict(input_df)
        except DataPilotError:
            raise
        except Exception:
            raise DataPilotError("Couldn't generate a prediction with the values provided. Please check your inputs.")

        if bundle["task"] == "classification" and bundle["label_encoder"] is not None:
            label = bundle["label_encoder"].inverse_transform(prediction.astype(int))[0]
            return Response({"prediction": str(label)})

        return Response({"prediction": float(prediction[0])})


class DownloadModelView(APIView):
    """GET /api/model/download/?model_id=..."""

    def get(self, request):
        model_id = request.query_params.get("model_id")
        pipeline_path = storage_service.model_pipeline_path(model_id) if model_id else None
        if not pipeline_path:
            raise DataPilotError("Trained model not found or session expired.", status_code=410)
        return FileResponse(
            open(pipeline_path, "rb"), as_attachment=True, filename="datapilot_model.pkl"
        )


class DownloadReportView(APIView):
    """GET /api/report/download/?model_id=..."""

    def get(self, request):
        model_id = request.query_params.get("model_id")
        meta = storage_service.load_model_meta(model_id) if model_id else None
        if not meta:
            raise DataPilotError("Trained model not found or session expired.", status_code=410)

        profile = meta["dataset_profile"]
        column_lookup = {c["name"]: c for c in profile.get("columns", [])}
        column_details = [
            column_lookup[c] for c in meta["feature_columns"] if c in column_lookup
        ]

        report_data = {
            "dataset": {
                "filename": profile.get("filename", "dataset.csv"),
                "row_count": profile.get("row_count", 0),
                "column_count": profile.get("column_count", 0),
                "file_size_display": profile.get("file_size_display", "—"),
                "missing_value_count": profile.get("missing_value_count", 0),
                "duplicate_row_count": profile.get("duplicate_row_count", 0),
            },
            "feature_columns": meta["feature_columns"],
            "target_column": meta["target_column"],
            "column_details": column_details,
            "target_analysis": meta["target_analysis"],
            "training": meta["training"],
        }

        pdf_bytes = pdf_service.generate_report(report_data)
        storage_service.save_report(model_id, pdf_bytes)
        report_file = storage_service.report_path(model_id)
        return FileResponse(
            open(report_file, "rb"), as_attachment=True, filename="datapilot_report.pdf"
        )
