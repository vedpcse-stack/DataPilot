import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def split_feature_types(df: pd.DataFrame, feature_columns):
    numeric_cols, categorical_cols = [], []
    for col in feature_columns:
        series = df[col]
        if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
            numeric_cols.append(col)
        else:
            categorical_cols.append(col)
    return numeric_cols, categorical_cols


def build_preprocessor(df: pd.DataFrame, feature_columns):
    """A single ColumnTransformer that imputes + scales numeric columns and
    imputes + one-hot-encodes categorical columns. This is fit ONCE during
    training and reused unchanged at prediction time, so train/predict can
    never drift apart."""
    numeric_cols, categorical_cols = split_feature_types(df, feature_columns)

    transformers = []
    if numeric_cols:
        numeric_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler()),
            ]
        )
        transformers.append(("numeric", numeric_pipeline, numeric_cols))

    if categorical_cols:
        categorical_pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="most_frequent")),
                ("encoder", OneHotEncoder(handle_unknown="ignore")),
            ]
        )
        transformers.append(("categorical", categorical_pipeline, categorical_cols))

    preprocessor = ColumnTransformer(transformers=transformers, remainder="drop")
    return preprocessor, numeric_cols, categorical_cols
