import numpy as np
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    f1_score,
    mean_absolute_error,
    mean_squared_error,
    precision_score,
    r2_score,
    recall_score,
)


def classification_metrics(y_true, y_pred):
    return {
        "accuracy": round(float(accuracy_score(y_true, y_pred)) * 100, 2),
        "precision": round(float(precision_score(y_true, y_pred, average="weighted", zero_division=0)) * 100, 2),
        "recall": round(float(recall_score(y_true, y_pred, average="weighted", zero_division=0)) * 100, 2),
        "f1": round(float(f1_score(y_true, y_pred, average="weighted", zero_division=0)) * 100, 2),
    }


def regression_metrics(y_true, y_pred):
    mse = float(mean_squared_error(y_true, y_pred))
    return {
        "r2": round(float(r2_score(y_true, y_pred)), 4),
        "mse": round(mse, 4),
        "rmse": round(float(np.sqrt(mse)), 4),
        "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
    }


def confusion_matrix_data(y_true, y_pred, class_labels):
    cm = confusion_matrix(y_true, y_pred, labels=range(len(class_labels)))
    return {"labels": [str(c) for c in class_labels], "matrix": cm.tolist()}
