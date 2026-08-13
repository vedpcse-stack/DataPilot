"""
Django settings for the DataPilot backend.

No database, no auth — this project only exposes stateless-ish ML
processing endpoints. "State" between calls (an uploaded dataset, a
trained model) lives in a short-lived temp-file store, see
api/services/storage_service.py.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --------------------------------------------------------------------------
# Core
# --------------------------------------------------------------------------
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key-change-me")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"
ALLOWED_HOSTS = ["*"]

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.security.SecurityMiddleware",
]

ROOT_URLCONF = "datapilot_backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "datapilot_backend.wsgi.application"

# No database is used by this project at all.
DATABASES = {}

# --------------------------------------------------------------------------
# CORS — the React dev server runs on a different port.
# --------------------------------------------------------------------------
CORS_ALLOW_ALL_ORIGINS = True

# --------------------------------------------------------------------------
# DRF
# --------------------------------------------------------------------------
REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
        "rest_framework.parsers.MultiPartParser",
        "rest_framework.parsers.FormParser",
    ],
    # DataPilot has no accounts at all — every endpoint is open, and we
    # explicitly disable DRF's default auth/permission classes so they
    # never try to touch django.contrib.auth (which isn't installed).
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.AllowAny"],
    "UNAUTHENTICATED_USER": None,
    "EXCEPTION_HANDLER": "api.exceptions.datapilot_exception_handler",
}

# --------------------------------------------------------------------------
# Uploads
# --------------------------------------------------------------------------
MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_BYTES
DATA_UPLOAD_MAX_MEMORY_SIZE = MAX_UPLOAD_SIZE_BYTES

# Where DataPilot keeps temporary datasets / trained models / reports.
# Nothing here is permanent — see storage_service for TTL cleanup.
DATAPILOT_TMP_DIR = os.environ.get(
    "DATAPILOT_TMP_DIR", str(BASE_DIR / "tmp_storage")
)
os.makedirs(DATAPILOT_TMP_DIR, exist_ok=True)

# How long an uploaded dataset / trained model is kept before it's
# eligible for cleanup, in seconds.
DATAPILOT_SESSION_TTL_SECONDS = 60 * 60 * 2  # 2 hours

STATIC_URL = "static/"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

USE_TZ = True
