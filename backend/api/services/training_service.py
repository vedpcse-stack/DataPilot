import time

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LinearRegression
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder, PolynomialFeatures
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier

from api.exceptions import DataPilotError
from api.services import metrics_service, preprocessing_service, visualization_service

CLASSIFICATION_MODELS = {
    "knn": ("K-Nearest Neighbors", lambda: KNeighborsClassifier(n_neighbors=5)),
    "decision_tree": ("Decision Tree", lambda: DecisionTreeClassifier(random_state=42)),
    "random_forest": ("Random Forest", lambda: RandomForestClassifier(n_estimators=100, random_state=42)),
    "svc": ("Support Vector Classifier", lambda: SVC(random_state=42)),
}

REGRESSION_MODELS = {
    "linear_regression": ("Linear Regression", None),
    "polynomial_regression": ("Polynomial Regression", None),
}

AUTO_KEY = "auto"


def _build_estimator_pipeline(preprocessor, task, model_key):
    if task == "classification":
        if model_key not in CLASSIFICATION_MODELS:
            raise DataPilotError(f"Unknown classification model '{model_key}'.")
        label, factory = CLASSIFICATION_MODELS[model_key]
        steps = [("preprocessor", preprocessor), ("model", factory())]
        return label, Pipeline(steps=steps)

    if model_key == "linear_regression":
        steps = [("preprocessor", preprocessor), ("model", LinearRegression())]
        return "Linear Regression", Pipeline(steps=steps)

    if model_key == "polynomial_regression":
        steps = [
            ("preprocessor", preprocessor),
            ("poly", PolynomialFeatures(degree=2, include_bias=False)),
            ("model", LinearRegression()),
        ]
        return "Polynomial Regression", Pipeline(steps=steps)

    raise DataPilotError(f"Unknown regression model '{model_key}'.")


def _feature_names_out(pipeline, raw_feature_columns):
    try:
        preprocessor = pipeline.named_steps["preprocessor"]
        names = list(preprocessor.get_feature_names_out())
        if "poly" in pipeline.named_steps:
            return None  # polynomial-expanded names aren't meaningfully interpretable here
        return names
    except Exception:
        return raw_feature_columns


def _evaluate_classification(pipeline, X_train, X_test, y_train, y_test, class_labels):
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = metrics_service.classification_metrics(y_test, y_pred)
    return pipeline, metrics, y_pred


def _evaluate_regression(pipeline, X_train, X_test, y_train, y_test):
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    metrics = metrics_service.regression_metrics(y_test, y_pred)
    return pipeline, metrics, y_pred


def _cv_score(pipeline, X_train, y_train, task):
    scoring = "accuracy" if task == "classification" else "r2"
    try:
        cv = min(5, max(2, len(X_train) // 20))
        scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring=scoring)
        return float(np.mean(scores))
    except Exception:
        return None


def train(
    df: pd.DataFrame,
    feature_columns,
    target_column,
    task,
    model_key,
    test_size=0.2,
    random_state=42,
):
    if not (0.1 <= test_size <= 0.8):
        raise DataPilotError("Test size must be between 20% and 80%.")

    work_df = df[feature_columns + [target_column]].copy()
    work_df = work_df.dropna(subset=[target_column])

    if len(work_df) < 10:
        raise DataPilotError("Not enough rows with a known target value to train a model.")

    X = work_df[feature_columns]
    y_raw = work_df[target_column]

    label_encoder = None
    class_labels = None
    if task == "classification":
        label_encoder = LabelEncoder()
        y = label_encoder.fit_transform(y_raw.astype(str))
        class_labels = list(label_encoder.classes_)
    else:
        y = y_raw.astype(float).values

    stratify = y if (task == "classification" and len(np.unique(y)) > 1 and
                      min(np.bincount(y)) >= 2) else None

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, stratify=stratify
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state
        )

    preprocessor, numeric_cols, categorical_cols = preprocessing_service.build_preprocessor(
        df, feature_columns
    )

    allowed_keys = (
        list(CLASSIFICATION_MODELS.keys()) if task == "classification" else list(REGRESSION_MODELS.keys())
    )

    start = time.time()
    comparison = []
    best = None  # (key, label, pipeline, metrics, y_pred, primary_score)

    keys_to_try = allowed_keys if model_key == AUTO_KEY else [model_key]

    for key in keys_to_try:
        preproc, _, _ = preprocessing_service.build_preprocessor(df, feature_columns)
        label, pipeline = _build_estimator_pipeline(preproc, task, key)

        if task == "classification":
            fitted, metrics, y_pred = _evaluate_classification(
                pipeline, X_train, X_test, y_train, y_test, class_labels
            )
            primary_score = metrics["accuracy"]
            comparison.append({"key": key, "model": label, **metrics})
        else:
            fitted, metrics, y_pred = _evaluate_regression(pipeline, X_train, X_test, y_train, y_test)
            primary_score = metrics["r2"]
            comparison.append({"key": key, "model": label, **metrics})

        if best is None or primary_score > best[5]:
            best = (key, label, fitted, metrics, y_pred, primary_score)

    training_time = round(time.time() - start, 3)

    best_key, best_label, best_pipeline, best_metrics, y_pred, _ = best

    feature_names = _feature_names_out(best_pipeline, feature_columns)
    fitted_model = best_pipeline.named_steps["model"]
    feature_importance = None
    if feature_names is not None:
        feature_importance = visualization_service.feature_importance_data(fitted_model, feature_names)

    result = {
        "task": task,
        "selected_model_key": best_key,
        "selected_model_label": best_label,
        "was_auto": model_key == AUTO_KEY,
        "metrics": best_metrics,
        "comparison": comparison if model_key == AUTO_KEY else None,
        "training_time_seconds": training_time,
        "train_samples": int(len(X_train)),
        "test_samples": int(len(X_test)),
        "test_size": test_size,
        "random_state": random_state,
        "feature_importance": feature_importance,
        "pipeline": best_pipeline,
        "label_encoder": label_encoder,
    }

    if task == "classification":
        result["class_labels"] = class_labels
        result["confusion_matrix"] = metrics_service.confusion_matrix_data(y_test, y_pred, class_labels)
        result["class_distribution"] = visualization_service.class_distribution(y_raw.astype(str).values)
    else:
        result["actual_vs_predicted"] = visualization_service.actual_vs_predicted(y_test, y_pred)
        result["residuals"] = visualization_service.residual_plot_data(y_test, y_pred)

    return result
