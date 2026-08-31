# Task 5.10 — Celery Beat Scheduling Testing Guide

## Overview
This guide provides instructions for verifying that Celery Beat scheduled tasks fire correctly and that the manual sync endpoint works as specified in Task 5.10 (Section 3.10.1, Figure 3.8).

## Prerequisites
- Redis running (default: `redis://127.0.0.1:6379/0`)
- Django backend configured with Celery
- At least one active `DataSource` in the database

## Implementation Status

### 1. Celery Beat Schedule Configuration
Located in `backend/config/celery_schedule.py`:

- **API Collection**: Every 2 hours (`crontab(minute=0, hour='*/2')`)
- **RSS Collection**: Every 6 hours (`crontab(minute=0, hour='*/6')`)
- **Career Site Collection**: Daily at 04:00 UTC (`crontab(hour=4, minute=0)`)
- **Expiry Check**: Daily at midnight UTC (`crontab(hour=0, minute=0)`)

### 2. Manual Sync Endpoint
- **Endpoint**: `POST /api/admin/data-sources/<id>/sync-now/`
- **Implementation**: `backend/apps/data_sources/views.py` - `DataSourceSyncNowView`
- **Permission**: Admin only (`IsAdminRole`)
- **Behavior**: Queues the same `collect_data_source` task that Celery Beat runs

## Testing Instructions

### Test 1: Manual Sync Endpoint

1. **Start the Django development server**:
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **Start Celery worker** (in a separate terminal):
   ```bash
   cd backend
   celery -A config worker -l info
   ```

3. **Test the manual sync endpoint**:
   ```bash
   # Get an admin JWT token first
   curl -X POST http://localhost:8000/api/auth/login/ \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "your_password"}'

   # Trigger sync for a specific data source (replace <id> and <token>)
   curl -X POST http://localhost:8000/api/admin/data-sources/<id>/sync-now/ \
     -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json"
   ```

4. **Expected response**:
   ```json
   {
     "message": "Data source sync started.",
     "source": "Source Name",
     "task_id": "uuid-here",
     "status": "queued"
   }
   ```

5. **Verify task execution**:
   - Check Celery worker logs for task execution
   - Verify `DataSource.last_synced_at` is updated in database
   - Check for new/duplicate/near-duplicate internship listings

### Test 2: Celery Beat with Shortened Intervals

1. **Use test settings with shortened intervals**:
   ```bash
   cd backend
   DJANGO_SETTINGS_MODULE=config.settings._task510_test python manage.py runserver
   ```

2. **Start Celery Beat** (in a separate terminal):
   ```bash
   cd backend
   DJANGO_SETTINGS_MODULE=config.settings._task510_test celery -A config beat -l info
   ```

3. **Start Celery worker** (in another terminal):
   ```bash
   cd backend
   DJANGO_SETTINGS_MODULE=config.settings._task510_test celery -A config worker -l info
   ```

4. **Shortened test intervals**:
   - API sources: Every 2 minutes (instead of 2 hours)
   - RSS sources: Every 5 minutes (instead of 6 hours)
   - Career sites: Every 10 minutes (instead of daily)

5. **Monitor Celery Beat logs**:
   - Watch for scheduled task triggers every 2/5/10 minutes
   - Verify tasks are queued and executed by the worker
   - Check that `schedule_data_source_collections` runs with correct `source_type` args

6. **Verify task execution**:
   ```bash
   # Check Celery worker output for task completion
   # Should see logs like:
   # [tasks] apps.data_sources.tasks.schedule_data_source_collections[source_type='api']
   # [tasks] apps.data_sources.tasks.collect_data_source[source_id=X]
   ```

### Test 3: Database Scheduler Verification

1. **Run Django migrations** (if using django-celery-beat database scheduler):
   ```bash
   cd backend
   python manage.py migrate
   ```

2. **Access Django Admin**:
   - Navigate to `http://localhost:8000/admin/`
   - Go to "Periodic Tasks" section
   - Verify scheduled tasks are registered

3. **Check task schedules**:
   - `collect-api-data-sources` - every 2 minutes (test) / 2 hours (prod)
   - `collect-rss-data-sources` - every 5 minutes (test) / 6 hours (prod)
   - `collect-career-site-data-sources` - every 10 minutes (test) / daily at 04:00 (prod)

## Production Deployment

When deploying to production, use the standard settings (not `_task510_test.py`):

```bash
# Production settings use original intervals
CELERY_BROKER_URL=redis://your-redis-host:6379/0
CELERY_RESULT_BACKEND=redis://your-redis-host:6379/1
```

Start Celery Beat with production settings:
```bash
celery -A config beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

## Troubleshooting

### Tasks not firing
- Verify Redis is running: `redis-cli ping`
- Check Celery Beat logs for errors
- Ensure `CELERY_BEAT_SCHEDULER` is set in settings

### Manual sync endpoint returns 503
- Celery broker may be unavailable
- Check Redis connection
- Verify Celery worker is running

### Tasks executing but not updating data
- Check DataSource is active (`is_active=True`)
- Verify adapter configuration for the source type
- Check logs for adapter fetch errors

## Files Modified/Created

1. **backend/config/celery_schedule.py** - Celery Beat schedule configuration (existing)
2. **backend/apps/data_sources/tasks.py** - Task implementations (existing)
3. **backend/apps/data_sources/views.py** - Manual sync endpoint (existing)
4. **backend/config/urls.py** - URL routing (existing)
5. **backend/config/settings/_task510_test.py** - Test settings with shortened intervals (created)
6. **TASK_5_10_TESTING.md** - This testing guide (created)
