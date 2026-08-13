"""
DataPilot intentionally has no database. Instead, each uploaded dataset
and each trained model gets a random UUID and lives as a handful of
files inside DATAPILOT_TMP_DIR:

    tmp_storage/
      datasets/<dataset_id>/data.csv
      datasets/<dataset_id>/meta.json      (profiling info, dtypes, etc.)
      models/<model_id>/pipeline.pkl       (preprocessing + estimator)
      models/<model_id>/meta.json          (columns, task type, metrics...)

The frontend just carries the dataset_id / model_id around between
requests instead of a server-side session. A background-ish sweep
(run opportunistically on each request) deletes anything older than
DATAPILOT_SESSION_TTL_SECONDS so this never grows unbounded.
"""
import json
import os
import shutil
import time
import uuid

from django.conf import settings


def _root(*parts):
    path = os.path.join(settings.DATAPILOT_TMP_DIR, *parts)
    os.makedirs(path, exist_ok=True)
    return path


def new_id():
    return uuid.uuid4().hex


def dataset_dir(dataset_id, create=False):
    base = os.path.join(settings.DATAPILOT_TMP_DIR, "datasets", dataset_id)
    if create:
        os.makedirs(base, exist_ok=True)
    return base


def model_dir(model_id, create=False):
    base = os.path.join(settings.DATAPILOT_TMP_DIR, "models", model_id)
    if create:
        os.makedirs(base, exist_ok=True)
    return base


def save_dataset(dataset_id, csv_bytes, meta):
    d = dataset_dir(dataset_id, create=True)
    with open(os.path.join(d, "data.csv"), "wb") as f:
        f.write(csv_bytes)
    with open(os.path.join(d, "meta.json"), "w") as f:
        json.dump(meta, f)


def load_dataset_meta(dataset_id):
    d = dataset_dir(dataset_id)
    meta_path = os.path.join(d, "meta.json")
    if not os.path.exists(meta_path):
        return None
    with open(meta_path) as f:
        return json.load(f)


def dataset_csv_path(dataset_id):
    path = os.path.join(dataset_dir(dataset_id), "data.csv")
    return path if os.path.exists(path) else None


def save_model(model_id, pipeline_path_src, meta):
    d = model_dir(model_id, create=True)
    dest = os.path.join(d, "pipeline.pkl")
    if pipeline_path_src != dest:
        shutil.copyfile(pipeline_path_src, dest)
    with open(os.path.join(d, "meta.json"), "w") as f:
        json.dump(meta, f)
    return dest


def model_pipeline_path(model_id):
    path = os.path.join(model_dir(model_id), "pipeline.pkl")
    return path if os.path.exists(path) else None


def load_model_meta(model_id):
    meta_path = os.path.join(model_dir(model_id), "meta.json")
    if not os.path.exists(meta_path):
        return None
    with open(meta_path) as f:
        return json.load(f)


def save_report(model_id, pdf_bytes):
    d = model_dir(model_id, create=True)
    with open(os.path.join(d, "report.pdf"), "wb") as f:
        f.write(pdf_bytes)


def report_path(model_id):
    path = os.path.join(model_dir(model_id), "report.pdf")
    return path if os.path.exists(path) else None


def cleanup_expired():
    """Best-effort sweep of anything older than the configured TTL."""
    ttl = settings.DATAPILOT_SESSION_TTL_SECONDS
    now = time.time()
    for kind in ("datasets", "models"):
        base = _root(kind)
        try:
            entries = os.listdir(base)
        except FileNotFoundError:
            continue
        for entry in entries:
            path = os.path.join(base, entry)
            try:
                if now - os.path.getmtime(path) > ttl:
                    shutil.rmtree(path, ignore_errors=True)
            except FileNotFoundError:
                pass
