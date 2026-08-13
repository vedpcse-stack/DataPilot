import io

import numpy as np
import pandas as pd

from api.exceptions import DataPilotError

MIN_ROWS = 10
MAX_COLUMNS_PREVIEW = 5


def read_csv_safely(csv_bytes, filename):
    if not filename.lower().endswith(".csv"):
        raise DataPilotError("Only .csv files are supported.")

    if len(csv_bytes) == 0:
        raise DataPilotError("The uploaded file is empty.")

    try:
        df = pd.read_csv(io.BytesIO(csv_bytes))
    except pd.errors.EmptyDataError:
        raise DataPilotError("The uploaded CSV has no data.")
    except pd.errors.ParserError:
        raise DataPilotError("This file doesn't look like a valid CSV. Please check the format.")
    except UnicodeDecodeError:
        try:
            df = pd.read_csv(io.BytesIO(csv_bytes), encoding="latin-1")
        except Exception:
            raise DataPilotError("Couldn't read this file's text encoding. Please save it as UTF-8 CSV.")
    except Exception:
        raise DataPilotError("Couldn't parse this CSV file.")

    if df.shape[1] == 0:
        raise DataPilotError("No columns found in this CSV.")

    if df.shape[1] == 1:
        raise DataPilotError(
            "This dataset only has one column. DataPilot needs at least one "
            "independent column and one target column."
        )

    if df.shape[0] < MIN_ROWS:
        raise DataPilotError(
            f"This dataset only has {df.shape[0]} rows. Please upload a dataset with at "
            f"least {MIN_ROWS} rows so a model can be trained reliably."
        )

    if df.columns.duplicated().any():
        dupes = df.columns[df.columns.duplicated()].unique().tolist()
        raise DataPilotError(f"Duplicate column names found: {', '.join(map(str, dupes))}.")

    # Normalize unnamed / blank headers so the frontend never sees "Unnamed: 0"
    df.columns = [
        str(c) if str(c).strip() and not str(c).startswith("Unnamed:") else f"column_{i+1}"
        for i, c in enumerate(df.columns)
    ]

    return df


def _column_dtype_label(series: pd.Series) -> str:
    if pd.api.types.is_bool_dtype(series):
        return "Boolean"
    if pd.api.types.is_numeric_dtype(series):
        return "Numeric"
    if pd.api.types.is_datetime64_any_dtype(series):
        return "Datetime"
    return "Categorical"


def profile_dataset(df: pd.DataFrame, filename: str, file_size_bytes: int) -> dict:
    row_count, col_count = df.shape
    total_cells = row_count * col_count
    missing_total = int(df.isna().sum().sum())
    duplicate_rows = int(df.duplicated().sum())

    columns = []
    for col in df.columns:
        series = df[col]
        columns.append(
            {
                "name": str(col),
                "dtype": _column_dtype_label(series),
                "unique_count": int(series.nunique(dropna=True)),
                "missing_count": int(series.isna().sum()),
            }
        )

    preview_df = df.head(MAX_COLUMNS_PREVIEW).replace({np.nan: None})
    preview_rows = preview_df.to_dict(orient="records")

    return {
        "filename": filename,
        "file_size_bytes": file_size_bytes,
        "row_count": row_count,
        "column_count": col_count,
        "total_cells": total_cells,
        "missing_value_count": missing_total,
        "duplicate_row_count": duplicate_rows,
        "columns": columns,
        "preview_rows": preview_rows,
        "column_order": [str(c) for c in df.columns],
    }


CLASSIFICATION_UNIQUE_THRESHOLD = 5


def analyze_target(df: pd.DataFrame, target_column: str, feature_columns) -> dict:
    if target_column not in df.columns:
        raise DataPilotError(f"Target column '{target_column}' was not found in the dataset.")

    if target_column in feature_columns:
        raise DataPilotError("The target column can't also be selected as an independent column.")

    if not feature_columns:
        raise DataPilotError("Select at least one independent column.")

    unknown = [c for c in feature_columns if c not in df.columns]
    if unknown:
        raise DataPilotError(f"Unknown independent column(s): {', '.join(unknown)}.")

    series = df[target_column]
    non_null = series.dropna()

    if non_null.empty:
        raise DataPilotError(f"Target column '{target_column}' has no non-missing values.")

    unique_count = int(non_null.nunique())
    missing_count = int(series.isna().sum())
    dtype_label = _column_dtype_label(series)

    if unique_count < 2:
        raise DataPilotError(
            f"Target column '{target_column}' only has one distinct value, so a model "
            "can't be trained on it."
        )

    # --- task detection -----------------------------------------------
    # Rule of thumb requested: numeric + many distinct values -> regression.
    # Numeric/categorical + few distinct discrete values -> classification.
    # Non-numeric columns are always treated as classification targets.
    is_numeric = pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series)

    looks_like_discrete_codes = False
    if is_numeric:
        non_null_int_like = np.all(np.equal(np.mod(non_null.astype(float), 1), 0))
        looks_like_discrete_codes = non_null_int_like and unique_count < CLASSIFICATION_UNIQUE_THRESHOLD

    if not is_numeric:
        task = "classification"
    elif looks_like_discrete_codes:
        task = "classification"
    else:
        task = "regression"

    if task == "classification" and unique_count > 50:
        raise DataPilotError(
            f"Target column '{target_column}' has {unique_count} distinct classes, which is too "
            "many for classification. Choose a target with fewer categories, or a continuous "
            "numeric target for regression."
        )

    value_counts = non_null.value_counts().head(10)
    distribution = [
        {"value": str(k), "count": int(v)} for k, v in value_counts.items()
    ]

    return {
        "target_column": target_column,
        "dtype": dtype_label,
        "unique_count": unique_count,
        "missing_count": missing_count,
        "detected_task": task,
        "distribution": distribution,
    }
