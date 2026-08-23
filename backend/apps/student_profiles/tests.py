from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from rest_framework.test import APIClient
from rest_framework import status
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


class StudentProfileAPITest(TestCase):
    """Test cases for Student Profile API endpoints"""

    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.skill = Skill.objects.create(name='Python')

    def test_get_profile(self):
        """Test getting student profile"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/profile/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Profile should be auto-created
        self.assertIn('user', response.data)

    def test_update_profile(self):
        """Test updating student profile"""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch('/api/profile/', {
            'phone': '+1234567890',
            'country': 'USA',
            'education_level': 'bachelor'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['phone'], '+1234567890')

    def test_update_profile_with_skills(self):
        """Test updating profile with skills"""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch('/api/profile/', {
            'skills': [self.skill.id],
            'interests': ['AI', 'Machine Learning']
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_compensation_validation_api(self):
        """Test compensation validation through API"""
        self.client.force_authenticate(user=self.user)
        response = self.client.patch('/api/profile/', {
            'compensation_preference': 'paid',
            'minimum_compensation': None,
            'maximum_compensation': None
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_upload_cv(self):
        """Test CV upload endpoint"""
        self.client.force_authenticate(user=self.user)
        
        # Create a simple test file
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        cv_content = b"Test CV content"
        cv_file = SimpleUploadedFile(
            "test_cv.pdf",
            cv_content,
            content_type="application/pdf"
        )
        
        response = self.client.post('/api/profile/cv/', {'cv': cv_file})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_upload_cv_invalid_format(self):
        """Test CV upload with invalid file format"""
        self.client.force_authenticate(user=self.user)
        
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        invalid_file = SimpleUploadedFile(
            "test.txt",
            b"Invalid file",
            content_type="text/plain"
        )
        
        response = self.client.post('/api/profile/cv/', {'cv': invalid_file})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_cv(self):
        """Test CV deletion endpoint"""
        self.client.force_authenticate(user=self.user)
        
        # First upload a CV
        from io import BytesIO
        from django.core.files.uploadedfile import SimpleUploadedFile
        
        cv_content = b"Test CV content"
        cv_file = SimpleUploadedFile(
            "test_cv.pdf",
            cv_content,
            content_type="application/pdf"
        )
        
        self.client.post('/api/profile/cv/', {'cv': cv_file})
        
        # Then delete it
        response = self.client.delete('/api/profile/cv/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_cv_no_cv(self):
        """Test deleting CV when none exists"""
        self.client.force_authenticate(user=self.user)
        response = self.client.delete('/api/profile/cv/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
