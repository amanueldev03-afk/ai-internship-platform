from .base import *
from decouple import Csv, config
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
import os
import logging

DEBUG = False

from .validators import validate_production_settings

# Host configuration
ALLOWED_HOSTS = config(
    "ALLOWED_HOSTS",
    default="127.0.0.1,localhost,backend,frontend",
    cast=Csv(),
)

# CSRF Trusted Origins
_csrf_trusted = config(
    "CSRF_TRUSTED_ORIGINS",
    default="",
    cast=Csv(),
)
if _csrf_trusted:
    CSRF_TRUSTED_ORIGINS = list(_csrf_trusted)

# CORS configuration
_cors_origins = config(
    "CORS_ALLOWED_ORIGINS",
    default="",
    cast=Csv(),
)
if _cors_origins:
    CORS_ALLOWED_ORIGINS = list(_cors_origins)

# Header used by reverse proxies (Nginx / Load Balancers) to indicate HTTPS
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# -----------------------------------------------------------------------------
# Sentry Error Tracking (Task 11.7)
# -----------------------------------------------------------------------------
SENTRY_DSN = config("SENTRY_DSN", default="")
SENTRY_ENVIRONMENT = config("SENTRY_ENVIRONMENT", default="production")
SENTRY_RELEASE = config("SENTRY_RELEASE", default="")

if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=SENTRY_ENVIRONMENT,
        release=SENTRY_RELEASE,
        integrations=[
            DjangoIntegration(
                # Capture HTTP request data but scrub sensitive fields
                request_bodies="medium",
                # Don't send cookies to Sentry
                send_default_pii=False,
            ),
            CeleryIntegration(
                # Capture Celery task failures
                monitor_beat_tasks=True,
            ),
            LoggingIntegration(
                # Capture ERROR and WARNING logs as breadcrumbs
                level=logging.INFO,
                event_level=logging.ERROR,
            ),
        ],
        # Sample rate for performance monitoring (keep low for production)
        traces_sample_rate=0.1,
        # Sample rate for session replay (disabled by default)
        replays_session_sample_rate=0.0,
        replays_on_error_sample_rate=0.0,
        # Before sending event, scrub sensitive data
        before_send=before_sentry_send,
        # Ignore expected client errors
        ignore_errors=[
            # 4xx errors that are expected
        ],
    )

def before_sentry_send(event, hint):
    """
    Scrub sensitive data from Sentry events before sending.
    """
    # Remove sensitive fields from request headers
    if "request" in event and "headers" in event["request"]:
        sensitive_headers = ["authorization", "cookie", "x-api-key"]
        event["request"]["headers"] = {
            k: v for k, v in event["request"]["headers"].items()
            if k.lower() not in sensitive_headers
        }
    
    # Remove sensitive fields from request data
    if "request" in event and "data" in event["request"]:
        sensitive_fields = ["password", "password_confirm", "old_password", "new_password", "token", "api_key", "secret"]
        if isinstance(event["request"]["data"], dict):
            event["request"]["data"] = {
                k: v for k, v in event["request"]["data"].items()
                if k.lower() not in sensitive_fields
            }
    
    return event

# Production logging to stdout with structured JSON format
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s %(pathname)s %(lineno)d %(funcName)s %(process)d %(thread)d",
        },
        "verbose": {
            "format": "{levelname} {asctime} {module} {process:d} {thread:d} {message}",
            "style": "{",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": config("LOG_LEVEL", default="INFO"),
    },
    "loggers": {
        "django": {
            "handlers": ["console"],
            "level": config("DJANGO_LOG_LEVEL", default="INFO"),
            "propagate": False,
        },
        "celery": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.db.backends": {
            "handlers": ["console"],
            "level": "WARNING",
            "propagate": False,
        },
    },
}

# -----------------------------------------------------------------------------
# Fail-Fast Startup Validation
# -----------------------------------------------------------------------------
validate_production_settings(dict(locals()))