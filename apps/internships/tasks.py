from celery import shared_task
from django.utils import timezone

from .models import Internship, InternshipSource
from .services.collector import collect_source


@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    retry_kwargs={
        "max_retries": 3,
    },
)
def collect_internships_from_source(
    self,
    source_id,
):
    """
    Collect internships from one source
    in a background Celery worker.
    """

    source = InternshipSource.objects.get(
        id=source_id
    )

    if not source.is_active:
        return {
            "status": "skipped",
            "message": (
                "Source is inactive."
            ),
            "source_id": source.id,
        }

    log = collect_source(source)

    return {
        "status": log.status,
        "source_id": source.id,
        "collection_log_id": log.id,
        "records_found": log.records_found,
        "records_created": (
            log.records_created
        ),
        "records_updated": (
            log.records_updated
        ),
        "records_failed": (
            log.records_failed
        ),
    }


@shared_task
def schedule_active_source_collections():
    """
    Queue collection jobs for every active
    internship source.
    """

    sources = InternshipSource.objects.filter(
        is_active=True
    )

    queued = 0

    for source in sources:

        collect_internships_from_source.delay(
            source.id
        )

        queued += 1

    return {
        "status": "success",
        "sources_queued": queued,
    }


@shared_task
def expire_internships():
    """
    Automatically expire active internships whose
    application deadline has passed.
    """

    now = timezone.now()

    expired_count = (
        Internship.objects
        .filter(
            status=Internship.STATUS_ACTIVE,
            application_deadline__isnull=False,
            application_deadline__lte=now,
        )
        .update(
            status=Internship.STATUS_EXPIRED,
        )
    )

    return {
        "status": "success",
        "expired_count": expired_count,
    }