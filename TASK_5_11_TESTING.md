# Task 5.11 — Idempotency & Fault Isolation Testing Guide

## Overview
This guide provides instructions for verifying that the data source collection pipeline implements proper fault isolation as specified in Task 5.11 (NFR, Section 2.5). The key requirement is that one source failing should never block other sources from completing their collection.

## Implementation Summary

### Changes to `backend/apps/data_sources/tasks.py`

#### 1. `collect_data_source` Task
- **Added try/except around adapter fetch**: If `adapter.fetch()` fails, the task logs the error and returns gracefully with `status: "fetch_failed"` instead of crashing
- **Added try/except around listing processing**: Each individual listing is wrapped in try/except, so one bad listing doesn't prevent others from being processed
- **Added `records_processing_errors` counter**: Tracks how many listings failed to process
- **Enhanced logging**: All failures are logged with full context (source name, ID, type, error details)

#### 2. `schedule_data_source_collections` Task
- **Added try/except around task queuing**: Each source's task queuing is wrapped individually
- **Enhanced return value**: Now returns `sources_queued`, `sources_failed`, and `errors` array
- **Detailed error tracking**: Each failed source is logged with source_id, source_name, source_type, and error message
- **Fault isolation**: One source failing to queue never prevents other sources from being queued

## Testing Instructions

### Test 1: Unit Tests

Run the fault isolation tests:

```bash
cd backend
python manage.py test apps.data_sources.tests.FaultIsolationTest -v 2
```

**Expected results:**
- `test_one_failing_source_doesnt_block_others`: Verifies that when one source fails to queue, others still succeed
- `test_adapter_fetch_failure_logged_and_continues`: Verifies that adapter fetch failures are handled gracefully
- `test_listing_processing_failure_logged_and_continues`: Verifies that individual listing processing failures don't block other listings

### Test 2: Manual Integration Test - Break One Adapter

1. **Create a test adapter that fails**:

Add this temporary adapter to `backend/apps/data_sources/adapters/__init__.py` for testing:

```python
class TestFailingAdapter(BaseAdapter):
    """Test adapter that deliberately fails mid-fetch."""
    
    def fetch(self):
        # Simulate a failure after some work
        raise Exception("Simulated adapter failure for fault isolation test")
    
    def normalize(self, raw):
        return normalize_raw_to_schema(raw)
```

2. **Register the test adapter** in `backend/apps/data_sources/adapters/registry.py`:

```python
from . import TestFailingAdapter

ADAPTER_REGISTRY = {
    DataSource.Type.API: APIAdapter,
    DataSource.Type.RSS: RSSAdapter,
    DataSource.Type.CAREER_SITE: CareerSiteAdapter,
    "test_failing": TestFailingAdapter,  # Add this for testing
}
```

3. **Create multiple data sources** in Django admin or via shell:

```python
from apps.data_sources.models import DataSource

# Working API source
DataSource.objects.create(
    name="Working API Source",
    type=DataSource.Type.API,
    base_url="https://api.example.com/jobs",
    is_active=True,
)

# Working RSS source
DataSource.objects.create(
    name="Working RSS Source",
    type=DataSource.Type.RSS,
    base_url="https://feeds.example.com/feed.xml",
    is_active=True,
)

# Failing test source
DataSource.objects.create(
    name="Test Failing Source",
    type="test_failing",
    base_url="https://failing.example.com/jobs",
    is_active=True,
)
```

4. **Trigger the scheduled collection**:

```python
from apps.data_sources.tasks import schedule_data_source_collections

# Run without type filter to test all sources
result = schedule_data_source_collections.run()

print(f"Sources queued: {result['sources_queued']}")
print(f"Sources failed: {result['sources_failed']}")
print(f"Errors: {result['errors']}")
```

5. **Expected behavior**:
- `sources_queued`: 2 (API and RSS sources)
- `sources_failed`: 1 (test failing source)
- `errors`: Array containing details about the failing source
- The working sources should still have their tasks queued and executed
- Logs should show error details for the failing source

### Test 3: Verify Listing-Level Fault Isolation

1. **Create a data source with a mock adapter that returns some bad data**:

```python
from apps.data_sources.adapters import BaseAdapter, normalize_raw_to_schema

class PartiallyBadAdapter(BaseAdapter):
    """Adapter that returns some good and some bad listings."""
    
    def fetch(self):
        return [
            {
                "external_id": "GOOD-001",
                "title": "Good Listing",
                "organization_name": "Good Corp",
                "description": "Valid description",
                "required_skills": ["Python"],
                "application_url": "https://example.com/apply/good",
                "application_deadline": "2026-12-31",
            },
            {
                "external_id": "BAD-001",
                "title": "Bad Listing",
                # Missing required fields - will fail normalization
            },
            {
                "external_id": "GOOD-002",
                "title": "Another Good Listing",
                "organization_name": "Good Corp",
                "description": "Another valid description",
                "required_skills": ["Django"],
                "application_url": "https://example.com/apply/good2",
                "application_deadline": "2026-12-31",
            },
        ]
    
    def normalize(self, raw):
        return normalize_raw_to_schema(raw)
```

2. **Run collection on this source**:

```python
from apps.data_sources.tasks import collect_data_source

source = DataSource.objects.get(name="Test Source with Bad Data")
result = collect_data_source.run(source.id)

print(f"Records found: {result['records_found']}")
print(f"Records created: {result['records_created']}")
print(f"Processing errors: {result['records_processing_errors']}")
```

3. **Expected behavior**:
- `records_found`: 3
- `records_created`: 2 (the good listings)
- `records_processing_errors`: 1 (the bad listing)
- The good listings should still be stored in the database
- Logs should show warning about the failed listing

### Test 4: Monitor Logs

Run Celery with verbose logging to see fault isolation in action:

```bash
cd backend
celery -A config worker -l info
```

Trigger a collection that includes a failing source and watch the logs:

- You should see error logs for the failing source
- You should see success logs for the working sources
- The worker should not crash or stop processing

## Verification Checklist

- [ ] One source failing to queue doesn't prevent other sources from being queued
- [ ] Adapter fetch failures are logged and return gracefully
- [ ] Individual listing processing failures don't block other listings
- [ ] Error logs include full context (source name, ID, type, error details)
- [ ] Task return values include failure counts and error details
- [ ] Celery worker continues running after handling failures
- [ ] Working sources still update their `last_synced_at` timestamp
- [ ] Unit tests pass for all fault isolation scenarios

## Production Considerations

### Monitoring
- Set up alerts for `sources_failed > 0` in scheduled task results
- Monitor `records_processing_errors` to detect data quality issues
- Track error patterns to identify problematic data sources

### Retry Strategy
- The `collect_data_source` task already has `autoretry_for=(Exception,)` with 3 retries
- Failed sources will be retried automatically by Celery
- Consider increasing `max_retries` for transient failures

### Error Aggregation
- Consider adding periodic error summary reports
- Track which sources fail most frequently
- Use error data to improve adapter implementations

## Files Modified

1. **backend/apps/data_sources/tasks.py**:
   - Added fault isolation to `collect_data_source` task
   - Added fault isolation to `schedule_data_source_collections` task
   - Enhanced error logging and return values

2. **backend/apps/data_sources/tests.py**:
   - Added `FailingAdapter` test class
   - Added `FaultIsolationTest` test class with 3 test methods
   - Tests verify fault isolation at both source and listing levels

3. **TASK_5_11_TESTING.md** - This testing guide

## Rollback

If you need to remove the fault isolation changes, revert the changes to:
- `backend/apps/data_sources/tasks.py` (remove try/except blocks and error tracking)
- `backend/apps/data_sources/tests.py` (remove `FailingAdapter` and `FaultIsolationTest` classes)
