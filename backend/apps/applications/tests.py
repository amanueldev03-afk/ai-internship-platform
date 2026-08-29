from django.test import TestCase
from django.db import IntegrityError
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.common.models import TimeStampedModel
from apps.internships.models import Internship
from .models import ApplicationHistory

User = get_user_model()


class ApplicationHistoryModelTest(TestCase):
    """Test cases for ApplicationHistory model (Section 3.6 / Task 1.6)."""

    def setUp(self):
        self.user = User.objects.create_user(
            email="applicant@example.com",
            password="TestPassword123!",
            role=User.Role.STUDENT,
        )
        self.internship = Internship.objects.create(
            title="Software Engineering Intern",
            organization_name="Tech Corp",
            description="Internship details",
            application_url="https://example.com/apply",
            internship_type="remote",
            status=Internship.STATUS_ACTIVE,
        )

    def test_create_application_history(self):
        """Test creating an application history record."""
        app_hist = ApplicationHistory.objects.create(
            student=self.user,
            internship=self.internship,
            clicked_apply=True,
            applied_date=timezone.now(),
        )
        self.assertEqual(app_hist.student, self.user)
        self.assertEqual(app_hist.internship, self.internship)
        self.assertTrue(app_hist.clicked_apply)
        self.assertTrue(app_hist.apply_clicked)
        self.assertIsNotNone(app_hist.applied_date)
        self.assertIsNotNone(app_hist.created_at)
        self.assertIsNotNone(app_hist.updated_at)
        self.assertTrue(issubclass(ApplicationHistory, TimeStampedModel))

    def test_application_history_str_representation(self):
        """Test string representation of ApplicationHistory."""
        app_hist = ApplicationHistory.objects.create(
            student=self.user,
            internship=self.internship,
        )
        self.assertIn(self.user.email, str(app_hist))
        self.assertIn(self.internship.title, str(app_hist))

    def test_unique_together_student_internship(self):
        """Test unique constraint on (student, internship)."""
        ApplicationHistory.objects.create(
            student=self.user,
            internship=self.internship,
        )
        with self.assertRaises(IntegrityError):
            ApplicationHistory.objects.create(
                student=self.user,
                internship=self.internship,
            )

    def test_cascade_deletion(self):
        """Test that deleting student or internship cascades."""
        app_hist = ApplicationHistory.objects.create(
            student=self.user,
            internship=self.internship,
        )
        app_hist_id = app_hist.id
        self.user.delete()
        self.assertFalse(ApplicationHistory.objects.filter(id=app_hist_id).exists())

