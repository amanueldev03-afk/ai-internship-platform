import os

from celery import Celery
from django.conf import settings


os.environ.setdefault(
    "DJANGO_SETTINGS_MODULE",
    "config.settings",
)


app = Celery(
    "config",
)


app.config_from_object(
    "django.conf:settings",
    namespace="CELERY",
)


app.autodiscover_tasks()

# Phase 3 Task 3.5 — honour eager mode explicitly.
# ``config_from_object`` maps ``CELERY_*`` → Celery options, but to guarantee
# ``parse_resume`` (and any task) runs synchronously in dev/tests when
# ``CELERY_TASK_ALWAYS_EAGER=True`` (before the Phase 5 broker is wired up),
# we also apply the eager flags directly on the app conf from Django settings.
app.conf.task_always_eager = getattr(
    settings, "CELERY_TASK_ALWAYS_EAGER", False
)
app.conf.task_eager_propagates = getattr(
    settings, "CELERY_TASK_EAGER_PROPAGATES", False
)
