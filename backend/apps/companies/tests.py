from django.test import TestCase
from django.db import IntegrityError
from apps.common.models import TimeStampedModel
from .models import Company


class CompanyModelTest(TestCase):
    """Test cases for Company model (Section 3.6 / Task 1.4)."""

    def test_create_company(self):
        """Test creating a company with all fields."""
        company = Company.objects.create(
            name="Google LLC",
            website="https://careers.google.com",
            country="United States",
            industry="Technology",
        )
        self.assertEqual(company.name, "Google LLC")
        self.assertEqual(company.website, "https://careers.google.com")
        self.assertEqual(company.country, "United States")
        self.assertEqual(company.industry, "Technology")
        self.assertIsNotNone(company.created_at)
        self.assertIsNotNone(company.updated_at)
        self.assertTrue(issubclass(Company, TimeStampedModel))

    def test_company_str_representation(self):
        """Test string representation of Company."""
        company = Company.objects.create(name="DeepMind")
        self.assertEqual(str(company), "DeepMind")

    def test_company_name_unique(self):
        """Test that company name must be unique."""
        Company.objects.create(name="Unique Corp")
        with self.assertRaises(IntegrityError):
            Company.objects.create(name="Unique Corp")

