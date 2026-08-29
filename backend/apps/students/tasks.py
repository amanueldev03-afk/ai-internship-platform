import logging
from celery import shared_task
from django.utils import timezone

from .models import CV, StudentProfile
from .services.cv_extraction import extract_cv_text
from .services.cv_analysis import analyze_cv                    # deterministic parser
from .services.ai_cv_analysis import analyze_cv_intelligently   # AI merger
from .services.skill_sync import sync_cv_skills_to_profile
from ..internships.services.embedding_service import regenerate_student_embedding

logger = logging.getLogger(__name__)

_UNRECOVERABLE = (ValueError, FileNotFoundError)


def _mark_failed(cv, reason: str) -> None:
    """Persist FAILED status without raising."""
    try:
        cv.processing_status = CV.STATUS_FAILED
        cv.processing_error  = str(reason)[:2000]
        cv.save(update_fields=["processing_status", "processing_error"])
        logger.error(f"CV {cv.id} marked FAILED: {reason}")
    except Exception as e:
        logger.error(f"Could not persist FAILED status for CV {cv.id}: {e}")


@shared_task(bind=True, max_retries=3)
def test_celery_task(self):
    """Simple task to verify Celery is working."""
    logger.info("Test Celery task executed successfully")
    return "Celery is working"


@shared_task(bind=True, max_retries=3)
def process_cv(self, cv_id: int):
    """
    Process a student CV end-to-end:

      1. Load CV record
      2. Set PROCESSING
      3. Open file from Django storage and extract raw text
      4. Run deterministic parser  → basic_analysis  (always works)
      5. Run OpenAI analysis       → merged_analysis (falls back to basic on failure)
      6. Save all extracted fields
      7. Sync skills to student profile M2M
      8. Generate student embedding INLINE (avoids broker subtask issue)
      9. Set COMPLETED + processed_at
     10. Bust recommendation cache
    """
    logger.info(f"process_cv started — cv_id={cv_id}")

    # ------------------------------------------------------------------
    # 1. Load CV
    # ------------------------------------------------------------------
    try:
        cv = CV.objects.select_related("student").get(id=cv_id)
    except CV.DoesNotExist:
        logger.error(f"CV {cv_id} not found — aborting.")
        return

    # ------------------------------------------------------------------
    # 2. Mark PROCESSING
    # ------------------------------------------------------------------
    cv.processing_status = CV.STATUS_PROCESSING
    cv.processing_error  = None
    cv.save(update_fields=["processing_status", "processing_error"])
    logger.info(f"CV {cv_id} → PROCESSING")

    # ------------------------------------------------------------------
    # 3. Extract text from file
    #    Use cv.file.open() so this works in Celery workers that run in a
    #    different process/container from the web server.
    # ------------------------------------------------------------------
    try:
        cv.file.open("rb")
        text = extract_cv_text(cv.file)
        cv.file.close()
    except _UNRECOVERABLE as exc:
        _mark_failed(cv, str(exc))
        return
    except Exception as exc:
        logger.error(f"CV {cv_id} extraction error: {exc}", exc_info=True)
        if self.request.retries >= self.max_retries:
            _mark_failed(cv, str(exc))
            raise
        raise self.retry(exc=exc, countdown=30 * (self.request.retries + 1))

    if not text or len(text.strip()) < 30:
        reason = (
            f"Extracted text too short ({len(text.strip()) if text else 0} chars). "
            "The PDF may contain scanned images rather than selectable text."
        )
        _mark_failed(cv, reason)
        return

    logger.info(f"CV {cv_id} — extracted {len(text)} chars")

    # ------------------------------------------------------------------
    # 4. Deterministic parser — always produces something useful
    # ------------------------------------------------------------------
    try:
        basic_analysis = analyze_cv(text)
        logger.info(
            f"CV {cv_id} — deterministic parse: "
            f"{len(basic_analysis.get('skills', []))} skills, "
            f"{len(basic_analysis.get('experience', []))} experience items"
        )
    except Exception as exc:
        logger.warning(f"CV {cv_id} deterministic parse error: {exc}")
        basic_analysis = {
            "skills": [], "education": [],
            "experience": [], "projects": [], "certifications": [],
        }

    # ------------------------------------------------------------------
    # 5. AI analysis — merges with deterministic result; falls back on any failure
    # ------------------------------------------------------------------
    try:
        analysis = analyze_cv_intelligently(text, basic_analysis)
        logger.info(
            f"CV {cv_id} — final analysis: "
            f"{len(analysis.get('skills', []))} skills"
        )
    except Exception as exc:
        logger.warning(f"CV {cv_id} AI analysis error (using basic): {exc}")
        analysis = basic_analysis

    # Guarantee we always have at least the deterministic skills
    if not analysis.get("skills") and basic_analysis.get("skills"):
        analysis["skills"] = basic_analysis["skills"]

    # ------------------------------------------------------------------
    # 6. Persist extracted data
    # ------------------------------------------------------------------
    cv.extracted_text           = text
    cv.extracted_skills         = analysis.get("skills",         [])
    cv.extracted_education      = analysis.get("education",      [])
    cv.extracted_experience     = analysis.get("experience",     [])
    cv.extracted_projects       = analysis.get("projects",       [])
    cv.extracted_certifications = analysis.get("certifications", [])
    cv.save(update_fields=[
        "extracted_text",
        "extracted_skills",
        "extracted_education",
        "extracted_experience",
        "extracted_projects",
        "extracted_certifications",
    ])
    logger.info(f"CV {cv_id} — extracted data saved to DB")

    # ------------------------------------------------------------------
    # 7. Sync skills to student profile M2M
    # ------------------------------------------------------------------
    try:
        profile = StudentProfile.objects.get(user=cv.student)
        sync_cv_skills_to_profile(profile, cv.extracted_skills)
        logger.info(f"CV {cv_id} — {len(cv.extracted_skills)} skills synced to profile")
    except StudentProfile.DoesNotExist:
        logger.warning(f"CV {cv_id} — no StudentProfile for user {cv.student_id}, skipping sync")
        profile = None
    except Exception as exc:
        logger.warning(f"CV {cv_id} — skill sync failed (non-fatal): {exc}")
        try:
            profile = StudentProfile.objects.get(user=cv.student)
        except Exception:
            profile = None

    # ------------------------------------------------------------------
    # 8. Generate student embedding INLINE
    #    We do NOT use .delay() here because calling broker.send from inside
    #    a Celery worker can fail with connection errors on some setups.
    #    Running it inline is safe — the model is already cached in this worker.
    # ------------------------------------------------------------------
    if profile:
        try:
            embedding = regenerate_student_embedding(profile)
            logger.info(
                f"CV {cv_id} — student embedding generated "
                f"(dim={len(embedding) if embedding else 0})"
            )
        except Exception as exc:
            logger.warning(f"CV {cv_id} — embedding generation failed (non-fatal): {exc}")
    else:
        logger.warning(f"CV {cv_id} — skipping embedding, no profile available")

    # ------------------------------------------------------------------
    # 9. Mark COMPLETED
    # ------------------------------------------------------------------
    cv.processing_status = CV.STATUS_COMPLETED
    cv.processed_at      = timezone.now()
    cv.save(update_fields=["processing_status", "processed_at"])
    logger.info(f"CV {cv_id} → COMPLETED at {cv.processed_at}")

    # ------------------------------------------------------------------
    # 10. Bust recommendation cache
    # ------------------------------------------------------------------
    try:
        from apps.recommendations.views import bust_recommendation_cache
        bust_recommendation_cache(cv.student_id)
        logger.info(f"CV {cv_id} — recommendation cache busted for user {cv.student_id}")
    except Exception as exc:
        logger.warning(f"CV {cv_id} — cache bust failed (non-fatal): {exc}")

    return {
        "cv_id":          cv.id,
        "status":         "completed",
        "skills_count":   len(cv.extracted_skills),
        "education_count": len(cv.extracted_education),
        "experience_count": len(cv.extracted_experience),
    }


@shared_task(bind=True, max_retries=3)
def generate_student_embedding_task(self, profile_id: int):
    """
    Standalone task for regenerating a student embedding on demand
    (e.g. after profile update or skill add).
    Does NOT spawn sub-tasks — runs the embedding inline.
    """
    logger.info(f"generate_student_embedding_task — profile_id={profile_id}")
    try:
        profile   = StudentProfile.objects.get(id=profile_id)
        embedding = regenerate_student_embedding(profile)
        logger.info(f"Embedding generated — profile={profile_id}, dim={len(embedding)}")
        return {"profile_id": profile_id, "status": "completed"}
    except StudentProfile.DoesNotExist:
        logger.error(f"StudentProfile {profile_id} not found")
        raise
    except Exception as exc:
        logger.error(f"Embedding failed for profile {profile_id}: {exc}", exc_info=True)
        if self.request.retries >= self.max_retries:
            raise
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@shared_task(bind=True, max_retries=3)
def generate_missing_student_embeddings(self):
    """Backfill embeddings for every StudentProfile that has none."""
    logger.info("generate_missing_student_embeddings started")
    try:
        profiles = StudentProfile.objects.filter(embedding__isnull=True)
        count    = profiles.count()
        for profile in profiles:
            generate_student_embedding_task.delay(profile.id)
        logger.info(f"Queued {count} embedding tasks")
        return {"status": "queued", "count": count}
    except Exception as exc:
        logger.error(f"Bulk embedding generation failed: {exc}", exc_info=True)
        raise
