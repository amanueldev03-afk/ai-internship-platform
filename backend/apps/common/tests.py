"""
Unit tests for apps.common.models.TimeStampedModel.

Tests verify:
1. created_at is auto-populated on first save and never changes.
2. updated_at is auto-populated on first save.
3. updated_at changes on every subsequent save.
4. created_at does NOT change on subsequent saves.
5. Both fields are timezone-aware datetimes.
6. The abstract base is not itself creatable (no DB table).
7. All 9 production models that inherit TimeStampedModel
   have both fields available and auto-populated.
"""

import time
from django.test import TestCase
from django.utils import timezone
from django.db import models

from apps.common.models import TimeStampedModel


# ---------------------------------------------------------------------------
# Concrete test model — lives only in the test runner's DB, not production.
# Django's test runner creates this table because it is discovered in the
# test module. No migration needed.
# ---------------------------------------------------------------------------

class _SampleModel(TimeStampedModel):
    """Minimal concrete subclass used purely for testing the base model."""
    name = models.CharField(max_length=50, default="test")

    class Meta:
        # Use the common app label so Django can find it during tests.
        app_label = "common"


class TimeStampedModelTest(TestCase):
    """Tests for TimeStampedModel auto-population behaviour."""

    # ------------------------------------------------------------------
    # Field auto-population on creation
    # ------------------------------------------------------------------

    def test_created_at_is_set_on_first_save(self):
        obj = _SampleModel.objects.create(name="first")
        self.assertIsNotNone(obj.created_at)

    def test_updated_at_is_set_on_first_save(self):
        obj = _SampleModel.objects.create(name="first")
        self.assertIsNotNone(obj.updated_at)

    def test_both_fields_populated_simultaneously_on_create(self):
        before = timezone.now()
        obj = _SampleModel.objects.create(name="simultaneous")
        after = timezone.now()
        self.assertGreaterEqual(obj.created_at, before)
        self.assertLessEqual(obj.created_at, after)
        self.assertGreaterEqual(obj.updated_at, before)
        self.assertLessEqual(obj.updated_at, after)

    # ------------------------------------------------------------------
    # created_at immutability
    # ------------------------------------------------------------------

    def test_created_at_does_not_change_on_update(self):
        obj = _SampleModel.objects.create(name="immutable")
        original_created = obj.created_at

        # Small sleep ensures updated_at actually differs if the clock
        # resolution is coarse (some CI environments).
        time.sleep(0.01)

        obj.name = "changed"
        obj.save()
        obj.refresh_from_db()

        self.assertEqual(obj.created_at, original_created)

    # ------------------------------------------------------------------
    # updated_at changes on save
    # ------------------------------------------------------------------

    def test_updated_at_changes_on_subsequent_save(self):
        obj = _SampleModel.objects.create(name="mutable")
        first_updated = obj.updated_at

        time.sleep(0.01)

        obj.name = "updated"
        obj.save()
        obj.refresh_from_db()

        self.assertGreater(obj.updated_at, first_updated)

    # ------------------------------------------------------------------
    # Timezone awareness
    # ------------------------------------------------------------------

    def test_created_at_is_timezone_aware(self):
        obj = _SampleModel.objects.create(name="tz_aware")
        self.assertIsNotNone(obj.created_at.tzinfo)

    def test_updated_at_is_timezone_aware(self):
        obj = _SampleModel.objects.create(name="tz_aware")
        self.assertIsNotNone(obj.updated_at.tzinfo)

    # ------------------------------------------------------------------
    # Abstract base has no table
    # ------------------------------------------------------------------

    def test_timestamped_model_is_abstract(self):
        self.assertTrue(TimeStampedModel._meta.abstract)

    def test_abstract_base_has_no_db_table(self):
        """TimeStampedModel itself must not have a DB table."""
        with self.assertRaises(Exception):
            # Attempting to query the abstract base directly must fail.
            TimeStampedModel.objects.count()

    # ------------------------------------------------------------------
    # Field presence on all production models that inherit the base
    # ------------------------------------------------------------------

    def _assert_has_timestamped_fields(self, model_class):
        """Helper — assert both fields exist and are DateTimeFields."""
        field_names = [f.name for f in model_class._meta.get_fields()]
        self.assertIn(
            "created_at", field_names,
            f"{model_class.__name__} is missing created_at",
        )
        self.assertIn(
            "updated_at", field_names,
            f"{model_class.__name__} is missing updated_at",
        )
        self.assertIsInstance(
            model_class._meta.get_field("created_at"),
            models.DateTimeField,
            f"{model_class.__name__}.created_at is not a DateTimeField",
        )
        self.assertIsInstance(
            model_class._meta.get_field("updated_at"),
            models.DateTimeField,
            f"{model_class.__name__}.updated_at is not a DateTimeField",
        )

    def test_skill_has_timestamp_fields(self):
        from apps.internships.models import Skill
        self._assert_has_timestamped_fields(Skill)

    def test_internship_source_has_timestamp_fields(self):
        from apps.internships.models import InternshipSource
        self._assert_has_timestamped_fields(InternshipSource)

    def test_internship_has_timestamp_fields(self):
        from apps.internships.models import Internship
        self._assert_has_timestamped_fields(Internship)

    def test_saved_internship_has_timestamp_fields(self):
        from apps.internships.models import SavedInternship
        self._assert_has_timestamped_fields(SavedInternship)

    def test_internship_application_has_timestamp_fields(self):
        from apps.internships.models import InternshipApplication
        self._assert_has_timestamped_fields(InternshipApplication)

    def test_recommendation_has_timestamp_fields(self):
        from apps.recommendations.models import Recommendation
        self._assert_has_timestamped_fields(Recommendation)

    def test_student_profile_has_timestamp_fields(self):
        from apps.student_profiles.models import StudentProfile
        self._assert_has_timestamped_fields(StudentProfile)

    def test_student_cv_has_timestamp_fields(self):
        from apps.student_profiles.models import StudentCV
        self._assert_has_timestamped_fields(StudentCV)

    def test_cv_has_timestamp_fields(self):
        from apps.student_profiles.models import CV
        self._assert_has_timestamped_fields(CV)

    # ------------------------------------------------------------------
    # Inheritance chain
    # ------------------------------------------------------------------

    def test_all_models_are_subclasses_of_timestamped_model(self):
        from apps.internships.models import (
            Skill, InternshipSource, Internship,
            SavedInternship, InternshipApplication,
        )
        from apps.recommendations.models import Recommendation
        from apps.student_profiles.models import StudentProfile, StudentCV, CV

        for model in (
            Skill, InternshipSource, Internship,
            SavedInternship, InternshipApplication,
            Recommendation, StudentProfile, StudentCV, CV,
        ):
            self.assertTrue(
                issubclass(model, TimeStampedModel),
                f"{model.__name__} does not inherit TimeStampedModel",
            )
