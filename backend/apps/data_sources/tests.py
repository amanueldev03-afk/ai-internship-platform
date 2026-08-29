from django.test import TestCase
from django.db import IntegrityError
from django.utils import timezone
from apps.common.models import TimeStampedModel
from .models import DataSource


class DataSourceModelTest(TestCase):
    """Test cases for DataSource model (Section 3.6 / Task 1.4)."""

    def test_create_data_source(self):
        """Test creating a data source with all fields."""
        ds = DataSource.objects.create(
            name="Remotive API",
            type=DataSource.Type.API,
            base_url="https://remotive.com/api/remote-jobs",
            config={"api_key": "secret", "rate_limit": 60},
            is_active=True,
            last_synced_at=timezone.now(),
        )
        self.assertEqual(ds.name, "Remotive API")
        self.assertEqual(ds.type, "api")
        self.assertEqual(ds.base_url, "https://remotive.com/api/remote-jobs")
        self.assertEqual(ds.config["api_key"], "secret")
        self.assertTrue(ds.is_active)
        self.assertIsNotNone(ds.last_synced_at)
        self.assertIsNotNone(ds.created_at)
        self.assertIsNotNone(ds.updated_at)
        self.assertTrue(issubclass(DataSource, TimeStampedModel))

    def test_data_source_str_representation(self):
        """Test string representation of DataSource."""
        ds = DataSource.objects.create(
            name="Feed RSS",
            type=DataSource.Type.RSS,
        )
        self.assertIn("Feed RSS", str(ds))
        self.assertIn("RSS Feed", str(ds))

    def test_data_source_name_unique(self):
        """Test that data source name must be unique."""
        DataSource.objects.create(name="Unique Source")
        with self.assertRaises(IntegrityError):
            DataSource.objects.create(name="Unique Source")

