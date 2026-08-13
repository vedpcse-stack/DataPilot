import io

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

CHARCOAL = colors.HexColor("#2B2825")
CREAM = colors.HexColor("#F4F1EA")
BORDER = colors.HexColor("#D8D0C0")
ACCENT = colors.HexColor("#3D3833")

plt.rcParams.update(
    {
        "figure.facecolor": "white",
        "axes.facecolor": "white",
        "axes.edgecolor": "#3D3833",
        "axes.labelcolor": "#2B2825",
        "text.color": "#2B2825",
        "xtick.color": "#2B2825",
        "ytick.color": "#2B2825",
        "font.size": 9,
    }
)
BAR_COLOR = "#3D3833"
POINT_COLOR = "#8A7F68"


def _fig_to_image(fig, width=15 * cm):
    buf = io.BytesIO()
    fig.tight_layout()
    fig.savefig(buf, format="png", dpi=160)
    plt.close(fig)
    buf.seek(0)
    img = Image(buf, width=width, height=width * 0.62)
    return img


def _confusion_matrix_image(cm_data):
    labels = cm_data["labels"]
    matrix = np.array(cm_data["matrix"])
    fig, ax = plt.subplots(figsize=(5, 4))
    im = ax.imshow(matrix, cmap="Greys")
    ax.set_xticks(range(len(labels)))
    ax.set_yticks(range(len(labels)))
    ax.set_xticklabels(labels, rotation=45, ha="right")
    ax.set_yticklabels(labels)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")
    for i in range(matrix.shape[0]):
        for j in range(matrix.shape[1]):
            val = matrix[i, j]
            color = "white" if val > matrix.max() / 2 else "#2B2825"
            ax.text(j, i, str(val), ha="center", va="center", color=color, fontsize=8)
    ax.set_title("Confusion Matrix")
    return _fig_to_image(fig)


def _class_distribution_image(dist):
    labels = [d["label"] for d in dist]
    counts = [d["count"] for d in dist]
    fig, ax = plt.subplots(figsize=(5, 3.2))
    ax.bar(labels, counts, color=BAR_COLOR)
    ax.set_ylabel("Count")
    ax.set_title("Class Distribution")
    plt.setp(ax.get_xticklabels(), rotation=30, ha="right")
    return _fig_to_image(fig)


def _model_comparison_image(comparison, task):
    fig, ax = plt.subplots(figsize=(5.5, 3.2))
    models = [row["model"] for row in comparison]
    metric_key = "accuracy" if task == "classification" else "r2"
    values = [row[metric_key] for row in comparison]
    ax.bar(models, values, color=BAR_COLOR)
    ax.set_ylabel("Accuracy (%)" if task == "classification" else "R\u00b2")
    ax.set_title("Model Comparison")
    plt.setp(ax.get_xticklabels(), rotation=20, ha="right")
    return _fig_to_image(fig)


def _actual_vs_predicted_image(points):
    actual = [p["actual"] for p in points]
    predicted = [p["predicted"] for p in points]
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.scatter(actual, predicted, s=10, alpha=0.6, color=POINT_COLOR)
    lims = [min(actual + predicted), max(actual + predicted)]
    ax.plot(lims, lims, color="#2B2825", linewidth=1)
    ax.set_xlabel("Actual")
    ax.set_ylabel("Predicted")
    ax.set_title("Actual vs Predicted")
    return _fig_to_image(fig)


def _residual_image(points):
    predicted = [p["predicted"] for p in points]
    residual = [p["residual"] for p in points]
    fig, ax = plt.subplots(figsize=(5, 4))
    ax.scatter(predicted, residual, s=10, alpha=0.6, color=POINT_COLOR)
    ax.axhline(0, color="#2B2825", linewidth=1)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Residual")
    ax.set_title("Residual Plot")
    return _fig_to_image(fig)


def _feature_importance_image(items):
    items = list(reversed(items))
    names = [i["feature"] for i in items]
    values = [i["importance"] for i in items]
    fig, ax = plt.subplots(figsize=(5.5, 4))
    ax.barh(names, values, color=BAR_COLOR)
    ax.set_xlabel("Importance")
    ax.set_title("Feature Importance")
    return _fig_to_image(fig)


def _styles():
    styles = getSampleStyleSheet()
    styles.add(
        ParagraphStyle(
            "DPTitle", parent=styles["Title"], textColor=CHARCOAL, fontSize=22, spaceAfter=4
        )
    )
    styles.add(
        ParagraphStyle(
            "DPSubtitle", parent=styles["Normal"], textColor=ACCENT, fontSize=12, spaceAfter=16
        )
    )
    styles.add(
        ParagraphStyle(
            "DPSection", parent=styles["Heading2"], textColor=CHARCOAL, spaceBefore=14, spaceAfter=8
        )
    )
    styles.add(ParagraphStyle("DPBody", parent=styles["Normal"], textColor=colors.HexColor("#2B2825")))
    return styles


def _table(data, col_widths=None):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), CHARCOAL),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, CREAM]),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return t


def generate_report(report_data: dict) -> bytes:
    """report_data is the full payload assembled in views.py — see
    ReportBuilderSerializer for the exact shape expected."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm, leftMargin=2 * cm, rightMargin=2 * cm
    )
    styles = _styles()
    story = []

    # Header
    story.append(Paragraph("DataPilot", styles["DPTitle"]))
    story.append(Paragraph("Machine Learning Training Report", styles["DPSubtitle"]))

    # Dataset details
    ds = report_data["dataset"]
    story.append(Paragraph("Dataset Details", styles["DPSection"]))
    story.append(
        _table(
            [
                ["Field", "Value"],
                ["Dataset name", ds["filename"]],
                ["Rows", str(ds["row_count"])],
                ["Columns", str(ds["column_count"])],
                ["File size", ds["file_size_display"]],
                ["Missing values", str(ds["missing_value_count"])],
                ["Duplicate rows", str(ds["duplicate_row_count"])],
            ],
            col_widths=[5 * cm, 10 * cm],
        )
    )

    # Selected columns
    story.append(Paragraph("Selected Columns", styles["DPSection"]))
    story.append(Paragraph(f"<b>Independent columns:</b> {', '.join(report_data['feature_columns'])}", styles["DPBody"]))
    story.append(Paragraph(f"<b>Dependent column:</b> {report_data['target_column']}", styles["DPBody"]))
    story.append(Spacer(1, 8))

    col_rows = [["Column", "Type", "Unique values", "Missing values"]]
    for c in report_data["column_details"]:
        col_rows.append([c["name"], c["dtype"], str(c["unique_count"]), str(c["missing_count"])])
    story.append(_table(col_rows, col_widths=[6 * cm, 3.5 * cm, 3 * cm, 3 * cm]))

    # Target analysis
    ta = report_data["target_analysis"]
    story.append(Paragraph("Target Analysis", styles["DPSection"]))
    story.append(
        _table(
            [
                ["Field", "Value"],
                ["Target name", report_data["target_column"]],
                ["Target type", ta["dtype"]],
                ["Unique values", str(ta["unique_count"])],
                ["Detected task", ta["detected_task"].capitalize()],
            ],
            col_widths=[5 * cm, 10 * cm],
        )
    )

    # Training configuration
    tc = report_data["training"]
    story.append(Paragraph("Training Configuration", styles["DPSection"]))
    config_rows = [
        ["Field", "Value"],
        ["Selected model", tc["selected_model_label"]],
        ["Test size", f"{int(tc['test_size'] * 100)}%"],
        ["Random state", str(tc["random_state"])],
        ["Training time", f"{tc['training_time_seconds']} s"],
        ["Training samples", str(tc["train_samples"])],
        ["Testing samples", str(tc["test_samples"])],
    ]
    story.append(_table(config_rows, col_widths=[5 * cm, 10 * cm]))

    if tc.get("comparison"):
        story.append(Spacer(1, 10))
        story.append(Paragraph("All models tested (Auto Model)", styles["DPBody"]))
        if tc["task"] == "classification":
            header = ["Model", "Accuracy %", "Precision %", "Recall %", "F1 %"]
            rows = [[r["model"], r["accuracy"], r["precision"], r["recall"], r["f1"]] for r in tc["comparison"]]
        else:
            header = ["Model", "R\u00b2", "MSE", "RMSE", "MAE"]
            rows = [[r["model"], r["r2"], r["mse"], r["rmse"], r["mae"]] for r in tc["comparison"]]
        story.append(_table([header] + [[str(v) for v in row] for row in rows]))

    # Results
    story.append(Paragraph("Results", styles["DPSection"]))
    metrics = tc["metrics"]
    if tc["task"] == "classification":
        rows = [
            ["Accuracy", f"{metrics['accuracy']}%"],
            ["Precision", f"{metrics['precision']}%"],
            ["Recall", f"{metrics['recall']}%"],
            ["F1 Score", f"{metrics['f1']}%"],
        ]
    else:
        rows = [
            ["R\u00b2 Score", metrics["r2"]],
            ["MSE", metrics["mse"]],
            ["RMSE", metrics["rmse"]],
            ["MAE", metrics["mae"]],
        ]
    story.append(_table([["Metric", "Value"]] + [[str(a), str(b)] for a, b in rows], col_widths=[5 * cm, 10 * cm]))

    # Graphs
    story.append(PageBreak())
    story.append(Paragraph("Graphs", styles["DPSection"]))

    if tc["task"] == "classification":
        story.append(_confusion_matrix_image(tc["confusion_matrix"]))
        story.append(Spacer(1, 10))
        if tc.get("comparison"):
            story.append(_model_comparison_image(tc["comparison"], "classification"))
            story.append(Spacer(1, 10))
        if tc.get("class_distribution"):
            story.append(_class_distribution_image(tc["class_distribution"]))
    else:
        story.append(_actual_vs_predicted_image(tc["actual_vs_predicted"]))
        story.append(Spacer(1, 10))
        story.append(_residual_image(tc["residuals"]))
        story.append(Spacer(1, 10))
        if tc.get("feature_importance"):
            story.append(_feature_importance_image(tc["feature_importance"]))
            story.append(Spacer(1, 10))
        if tc.get("comparison"):
            story.append(_model_comparison_image(tc["comparison"], "regression"))

    if tc["task"] == "classification" and tc.get("feature_importance"):
        story.append(Spacer(1, 10))
        story.append(_feature_importance_image(tc["feature_importance"]))

    doc.build(story)
    buf.seek(0)
    return buf.read()
