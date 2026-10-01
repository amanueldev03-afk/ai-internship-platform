import logging
from typing import Optional, Dict, Any
from django.conf import settings
from django.core.mail import send_mail

logger = logging.getLogger(__name__)


def notify_user(
    user: Any,
    title: str,
    message: str,
    alert_type: str = "general",
    metadata: Optional[Dict[str, Any]] = None,
) -> bool:
    """
    Standardized notification dispatcher (Phase 17 notify_user).
    Delivers in-app alert records and optional email notifications
    to advisors, mentors, students, or institutional staff.
    """
    if not user:
        logger.warning("notify_user called without a target user.")
        return False

    metadata = metadata or {}
    email = getattr(user, "email", None)

    # 1. In-app alert dispatch (LogbookAlert if logbook metadata present)
    logbook_id = metadata.get("logbook_id")
    if logbook_id:
        try:
            from apps.projects.models import WeeklyLogbook, LogbookAlert
            logbook = WeeklyLogbook.objects.filter(id=logbook_id).first()
            if logbook:
                LogbookAlert.objects.get_or_create(
                    logbook=logbook,
                    recipient=user,
                    alert_type=alert_type,
                    defaults={
                        "title": title,
                        "message": message,
                        "metadata": metadata,
                    },
                )
        except Exception as e:
            logger.debug(f"Could not record LogbookAlert in notify_user: {e}")

    # 2. Email notification
    if email and getattr(settings, "EMAIL_NOTIFICATIONS_ENABLED", True):
        try:
            send_mail(
                subject=title,
                message=message,
                from_email=getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@smartintern.et"),
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f"Failed to send email to {email}: {e}")

    logger.info(f"Notification delivered to user {user} ({email}): {title}")
    return True
