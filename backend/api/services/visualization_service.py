"""
DataPilot renders its interactive charts on the frontend with Recharts, so
this module's job is just to shape the *data* those charts need — not to
draw images. The one exception is PDF generation, where Matplotlib images
are built directly in pdf_service.py since ReportLab needs static images.
"""
import numpy as np


def class_distribution(y):
    values, counts = np.unique(y, return_counts=True)
    return [{"label": str(v), "count": int(c)} for v, c in zip(values, counts)]


def actual_vs_predicted(y_true, y_pred, max_points=500):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    n = len(y_true)
    if n > max_points:
        idx = np.random.choice(n, max_points, replace=False)
        y_true, y_pred = y_true[idx], y_pred[idx]
    return [
        {"actual": float(a), "predicted": float(p)} for a, p in zip(y_true, y_pred)
    ]


def residual_plot_data(y_true, y_pred, max_points=500):
    y_true = np.asarray(y_true)
    y_pred = np.asarray(y_pred)
    residuals = y_true - y_pred
    n = len(y_true)
    if n > max_points:
        idx = np.random.choice(n, max_points, replace=False)
        y_pred, residuals = y_pred[idx], residuals[idx]
    return [
        {"predicted": float(p), "residual": float(r)} for p, r in zip(y_pred, residuals)
    ]


def feature_importance_data(model, feature_names):
    """Returns None if the fitted estimator doesn't expose an importance-like
    attribute (e.g. plain KNN, SVC without a linear kernel)."""
    importances = None
    if hasattr(model, "feature_importances_"):
        importances = np.asarray(model.feature_importances_)
    elif hasattr(model, "coef_"):
        coef = np.asarray(model.coef_)
        importances = np.abs(coef).mean(axis=0) if coef.ndim > 1 else np.abs(coef)

    if importances is None or len(importances) != len(feature_names):
        return None

    pairs = sorted(zip(feature_names, importances.tolist()), key=lambda p: p[1], reverse=True)
    return [{"feature": name, "importance": round(float(val), 4)} for name, val in pairs[:15]]
