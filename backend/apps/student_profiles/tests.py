from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from .models import StudentProfile
from apps.internships.models import Skill

User = get_user_model()


class StudentProfileModelTest(TestCase):
    """Test cases for StudentProfile model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            first_name='Test',
            last_name='User',
            password='testpass123'
        )
        self.skill = Skill.objects.create(name='Python')

    def test_create_student_profile(self):
        """Test creating a student profile"""
        profile = StudentProfile.objects.create(
            user=self.user,
            phone='+1234567890',
            country='USA',
            city='New York',
            education_level='bachelor',
            field_of_study='Computer Science',
            university='MIT'
        )
        profile.skills.add(self.skill)
        self.assertEqual(profile.user, self.user)
        self.assertEqual(profile.education_level, 'bachelor')

    def test_profile_str(self):
        """Test profile string representation"""
        profile = StudentProfile.objects.create(user=self.user)
        self.assertEqual(str(profile), 'test@example.com - Student Profile')

    def test_compensation_validation_paid(self):
        """Test compensation validation for paid preference"""
        profile = StudentProfile(
            user=self.user,
            compensation_preference='paid',
            minimum_compensation=None,
            maximum_compensation=None
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_compensation_validation_range(self):
        """Test compensation range validation"""
        profile = StudentProfile(
            user=self.user,
            compensation_preference='paid',
            minimum_compensation=5000,
            maximum_compensation=3000
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_duration_validation(self):
        """Test internship duration validation"""
        profile = StudentProfile(
            user=self.user,
            internship_duration_min_weeks=12,
            internship_duration_max_weeks=8
        )
        with self.assertRaises(ValidationError):
            profile.full_clean()

    def test_unique_profile_per_user(self):
        """Test that each user can have only one profile"""
        StudentProfile.objects.create(user=self.user)
        with self.assertRaises(Exception):
            StudentProfile.objects.create(user=self.user)

    def test_default_preferences(self):
        """Test default preference values"""
        profile = StudentProfile.objects.create(user=self.user)
        self.assertEqual(profile.internship_type, 'any')
        self.assertEqual(profile.work_type, 'either')
        self.assertEqual(profile.compensation_preference, 'either')
        self.assertEqual(profile.compensation_currency, 'USD')

    def test_skills_relationship(self):
        """Test skills many-to-many relationship"""
        profile = StudentProfile.objects.create(user=self.user)
        profile.skills.add(self.skill)
        self.assertEqual(profile.skills.count(), 1)
        self.assertIn(self.skill, profile.skills.all())

    def test_json_fields(self):
        """Test JSON field storage"""
        profile = StudentProfile.objects.create(
            user=self.user,
            interests=['AI', 'Machine Learning', 'Web Development'],
            preferred_locations=['New York', 'San Francisco', 'Remote'],
            preferred_industries=['Tech', 'Finance'],
            preferred_roles=['Software Engineer', 'Data Scientist']
        )
        self.assertEqual(len(profile.interests), 3)
        self.assertIn('AI', profile.interests)
        self.assertEqual(len(profile.preferred_locations), 3)

    def test_willing_to_relocate(self):
        """Test willing to relocate field"""
        profile = StudentProfile.objects.create(
            user=self.user,
            willing_to_relocate=True
        )
        self.assertTrue(profile.willing_to_relocate)
