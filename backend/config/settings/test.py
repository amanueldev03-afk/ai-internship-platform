from .base import *

DEBUG = True

# Disable throttling during automated tests so anonymous/anonymous-heavy test
# suites do not trip the AnonRateThrottle (100/day) budget mid-run.
REST_FRAMEWORK["DEFAULT_THROTTLE_CLASSES"] = []
REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"] = {}

# Capture emails in-memory (django.core.mail.outbox) for round-trip tests.
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# Phase 3 Task 3.5 — run Celery tasks synchronously during tests so the
# resume-parsing pipeline can be verified without a live broker/Redis.
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
