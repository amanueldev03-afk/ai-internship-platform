from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from apps.internships.permissions import IsAdminRole

from .models import DataSource
from .tasks import collect_data_source


class DataSourceSyncNowView(APIView):
    """
    Manually trigger collection of one ``DataSource`` immediately
    (Task 5.10, Section 3.10.1 / Figure 3.8).

    Queues the same ``collect_data_source`` task that Celery Beat runs
    on its periodic schedule, so a manual sync fires the identical
    logic right away rather than waiting for the next interval.
    """

    permission_classes = [IsAdminRole]

    @extend_schema(
        tags=["Admin Data Sources"],
        summary="Trigger DataSource sync",
        description=(
            "Queue an immediate collection run for a single data source. "
            "Admin only."
        ),
        request=None,
        responses={
            202: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "source": {"type": "string"},
                    "task_id": {"type": "string"},
                    "status": {"type": "string"},
                },
            },
            503: {
                "type": "object",
                "properties": {
                    "message": {"type": "string"},
                    "source": {"type": "string"},
                    "status": {"type": "string"},
                },
            },
        },
    )
    def post(self, request, pk):
        try:
            source = DataSource.objects.get(pk=pk)
        except DataSource.DoesNotExist:
            return Response(
                {"detail": "Data source not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not source.is_active:
            return Response(
                {"detail": "This data source is inactive."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            task = collect_data_source.delay(source.id)
        except (AttributeError, RuntimeError, ConnectionError) as exc:  # broker unavailable — surface it
            import logging

            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to queue data source sync: {exc}")
            return Response(
                {
                    "message": (
                        "Failed to start sync. Celery may not be available."
                    ),
                    "source": source.name,
                    "status": "failed",
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        return Response(
            {
                "message": "Data source sync started.",
                "source": source.name,
                "task_id": task.id,
                "status": "queued",
            },
            status=status.HTTP_202_ACCEPTED,
        )
