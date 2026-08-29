import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=2,
)
def refresh_student_recommendations(self, user_id):
    """
    Refresh recommendations for a specific student in the background.
    Clears the cached recommendations so the next request re-generates them.
    """
    logger.info(f"Starting recommendation refresh for user ID: {user_id}")

    try:
        from django.contrib.auth import get_user_model
        from django.core.cache import cache

        User = get_user_model()
        user = User.objects.get(id=user_id)

        # Invalidate cached recommendations so next request re-generates them
        cache_key = f"recommendations:user:{user.id}"
        cache.delete(cache_key)

        logger.info(
            f"Recommendation cache cleared for user {user_id} "
            f"({user.email}). Fresh results will be generated on next request."
        )

        return {
            "user_id": user.id,
            "status": "completed",
            "message": "Recommendation cache cleared successfully.",
        }

    except Exception as exc:
        logger.error(
            f"Recommendation refresh failed for user {user_id}: {exc}",
            exc_info=True,
        )

        if self.request.retries >= self.max_retries:
            logger.error(
                f"Recommendation refresh failed after {self.max_retries} retries"
            )
            raise

        logger.warning(
            f"Retrying recommendation refresh, "
            f"attempt {self.request.retries + 1}/{self.max_retries}"
        )
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))
