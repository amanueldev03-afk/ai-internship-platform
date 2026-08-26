"""
Celery Beat schedule configuration.

This file defines all periodic tasks that should be executed
by Celery Beat on a schedule.
"""

from celery.schedules import crontab

# Celery Beat Schedule
CELERY_BEAT_SCHEDULE = {
    # ==========================================================
    # INTERNSHIP MANAGEMENT
    # ==========================================================
    
    # Expire internships whose deadline has passed
    # Runs every hour
    'expire-internships-hourly': {
        'task': 'apps.internships.tasks.expire_internships',
        'schedule': crontab(minute=0),  # Every hour at minute 0
    },
    
    # ==========================================================
    # EMBEDDING MAINTENANCE
    # ==========================================================
    
    # Generate missing internship embeddings
    # Runs daily at 2 AM UTC
    'generate-missing-internship-embeddings': {
        'task': 'apps.internships.tasks.generate_missing_internship_embeddings',
        'schedule': crontab(hour=2, minute=0),  # Daily at 2 AM UTC
    },
    
    # Generate missing student embeddings
    # Runs daily at 3 AM UTC
    'generate-missing-student-embeddings': {
        'task': 'apps.student_profiles.tasks.generate_missing_student_embeddings',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM UTC
    },
    
    # ==========================================================
    # FUTURE TASKS (for Step 42 and beyond)
    # ==========================================================
    
    # Refresh student recommendations
    # This will be implemented in Step 42 when behavior tracking is added
    # 'refresh-student-recommendations': {
    #     'task': 'apps.internships.tasks.refresh_student_recommendations',
    #     'schedule': crontab(hour=4, minute=0),  # Daily at 4 AM UTC
    # },
    
    # ==========================================================
    # DATA COLLECTION
    # ==========================================================
    
    # Schedule active internship source collections
    # Runs every 6 hours
    'schedule-internship-collections': {
        'task': 'apps.internships.tasks.schedule_active_source_collections',
        'schedule': crontab(minute=0, hour='*/6'),  # Every 6 hours
    },
}
