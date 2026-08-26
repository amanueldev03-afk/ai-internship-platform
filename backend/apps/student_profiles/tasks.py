import logging
from celery import shared_task
from django.db import transaction
from django.utils import timezone

from .models import CV, StudentProfile
from .services.cv_extraction import extract_cv_text
from .services.ai_cv_analysis import analyze_cv_intelligently
from .services.skill_sync import sync_cv_skills_to_profile
from ..internships.services.embedding_service import regenerate_student_embedding


logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
)
def test_celery_task(self):
    """
    Simple test task to verify Celery is working.
    """
    logger.info("Test Celery task executed successfully")
    return "Celery is working"


@shared_task(
    bind=True,
    max_retries=3,
)
def process_cv(self, cv_id):
    """
    Process a CV in the background:
    1. Extract text from CV file
    2. Analyze CV with AI
    3. Extract skills, education, experience, projects
    4. Save analysis to CV model
    5. Sync skills to student profile
    6. Queue student embedding generation
    7. Update CV status to COMPLETED
    """
    logger.info(f"Starting CV processing for CV ID: {cv_id}")
    
    try:
        # 1. Load CV
        cv = CV.objects.get(id=cv_id)
        logger.info(f"CV found: {cv.id}")
        
        # 2. Update status to PROCESSING
        cv.processing_status = CV.STATUS_PROCESSING
        cv.processing_error = None
        cv.save(update_fields=["processing_status", "processing_error"])
        logger.info(f"CV status updated to PROCESSING")
        
        # 3. Extract text
        logger.info(f"Extracting text from CV file")
        text = extract_cv_text(cv.file)
        
        if not text or len(text.strip()) < 50:
            raise ValueError("Extracted CV text is too short or empty")
        
        logger.info(f"Text extracted successfully, length: {len(text)}")
        
        # 4. Analyze CV with AI
        logger.info(f"Analyzing CV with AI")
        basic_analysis = {
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
        }
        analysis = analyze_cv_intelligently(text, basic_analysis)
        logger.info(f"AI analysis completed")
        
        # 5. Save extracted information to CV
        cv.extracted_text = text
        cv.extracted_skills = analysis.get("skills", [])
        cv.extracted_education = analysis.get("education", [])
        cv.extracted_experience = analysis.get("experience", [])
        cv.extracted_projects = analysis.get("projects", [])
        cv.extracted_certifications = analysis.get("certifications", [])
        cv.save(
            update_fields=[
                "extracted_text",
                "extracted_skills",
                "extracted_education",
                "extracted_experience",
                "extracted_projects",
                "extracted_certifications",
            ]
        )
        logger.info(f"CV analysis saved")
        
        # 6. Sync skills to student profile
        logger.info(f"Syncing skills to student profile")
        sync_cv_skills_to_profile(cv, analysis.get("skills", []))
        logger.info(f"Skills synced successfully")
        
        # 7. Queue student embedding generation
        try:
            student_profile = StudentProfile.objects.get(user=cv.student)
            logger.info(f"Queueing student embedding generation for profile {student_profile.id}")
            generate_student_embedding_task.delay(student_profile.id)
        except StudentProfile.DoesNotExist:
            logger.warning(f"Student profile not found for user {cv.student.id}")
        
        # 8. Update status to COMPLETED
        cv.processing_status = CV.STATUS_COMPLETED
        cv.processed_at = timezone.now()
        cv.save(update_fields=["processing_status", "processed_at"])
        logger.info(f"CV processing completed successfully for CV ID: {cv_id}")
        
        return {
            "cv_id": cv.id,
            "status": "completed",
            "skills_count": len(analysis.get("skills", [])),
        }
        
    except Exception as exc:
        logger.error(f"CV processing failed for CV ID {cv_id}: {str(exc)}", exc_info=True)
        
        # Update status to FAILED if max retries reached
        if self.request.retries >= self.max_retries:
            cv.processing_status = CV.STATUS_FAILED
            cv.processing_error = str(exc)
            cv.save(update_fields=["processing_status", "processing_error"])
            logger.error(f"CV marked as FAILED after {self.max_retries} retries")
            raise
        
        # Retry with exponential backoff
        logger.warning(f"Retrying CV processing, attempt {self.request.retries + 1}/{self.max_retries}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@shared_task(
    bind=True,
    max_retries=3,
)
def generate_student_embedding_task(self, profile_id):
    """
    Generate embedding for a student profile in the background.
    This task is idempotent - it will update the embedding if it already exists.
    """
    logger.info(f"Starting student embedding generation for profile ID: {profile_id}")
    
    try:
        # 1. Load student profile
        profile = StudentProfile.objects.get(id=profile_id)
        logger.info(f"Student profile found: {profile.id}")
        
        # 2. Generate embedding (idempotent - updates if exists)
        logger.info(f"Generating embedding")
        embedding = regenerate_student_embedding(profile)
        logger.info(f"Embedding generated successfully")
        
        return {
            "profile_id": profile.id,
            "status": "completed",
        }
        
    except StudentProfile.DoesNotExist:
        logger.error(f"Student profile not found: {profile_id}")
        raise
    except Exception as exc:
        logger.error(f"Student embedding generation failed for profile {profile_id}: {str(exc)}", exc_info=True)
        
        if self.request.retries >= self.max_retries:
            logger.error(f"Student embedding generation failed after {self.max_retries} retries")
            raise
        
        logger.warning(f"Retrying student embedding generation, attempt {self.request.retries + 1}/{self.max_retries}")
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))


@shared_task(
    bind=True,
    max_retries=3,
)
def generate_missing_student_embeddings(self):
    """
    Bulk task to generate embeddings for all student profiles that don't have one.
    This is useful for migrating existing data after Celery implementation.
    """
    logger.info("Starting bulk student embedding generation")
    
    try:
        # Find all profiles without embeddings
        profiles_without_embeddings = StudentProfile.objects.filter(embedding__isnull=True)
        count = profiles_without_embeddings.count()
        logger.info(f"Found {count} profiles without embeddings")
        
        # Queue individual embedding tasks
        for profile in profiles_without_embeddings:
            generate_student_embedding_task.delay(profile.id)
        
        logger.info(f"Queued {count} student embedding tasks")
        return {
            "status": "queued",
            "count": count,
        }
        
    except Exception as exc:
        logger.error(f"Bulk student embedding generation failed: {str(exc)}", exc_info=True)
        raise