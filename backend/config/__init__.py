import os

# Only import Celery if explicitly needed (not during normal Django startup)
if os.environ.get('CELERY_WORKER', '').lower() == 'true':
    from .celery import app as celery_app
    __all__ = ("celery_app",)
else:
    __all__ = ()