from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Skill, InternshipSource, Internship, SavedInternship, InternshipApplication

User = get_user_model()


class SkillModelTest(TestCase):
    """Test cases for Skill model"""

    def test_create_skill(self):
        """Test creating a new skill"""
        skill = Skill.objects.create(
            name='Python',
            description='Programming language'
        )
        self.assertEqual(skill.name, 'Python')
        self.assertTrue(skill.is_active)

    def test_skill_str(self):
        """Test skill string representation"""
        skill = Skill.objects.create(name='Python')
        self.assertEqual(str(skill), 'Python')


class InternshipSourceModelTest(TestCase):
    """Test cases for InternshipSource model"""

    def test_create_source(self):
        """Test creating a new internship source"""
        source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api',
            website_url='https://linkedin.com'
        )
        self.assertEqual(source.name, 'LinkedIn')
        self.assertEqual(source.source_type, 'api')

    def test_source_str(self):
        """Test source string representation"""
        source = InternshipSource.objects.create(name='LinkedIn', source_type='api')
        self.assertEqual(str(source), 'LinkedIn')


class InternshipModelTest(TestCase):
    """Test cases for Internship model"""

    def setUp(self):
        """Set up test data"""
        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api',
            website_url='https://linkedin.com'
        )
        self.skill = Skill.objects.create(name='Python')

    def test_create_internship(self):
        """Test creating a new internship"""
        internship = Internship.objects.create(
            title='Software Engineer Intern',
            organization_name='Tech Company',
            description='Software engineering internship',
            application_url='https://example.com/apply',
            source=self.source,
            internship_type='remote',
            work_type='full_time',
            compensation_type='paid',
            minimum_compensation=1000,
            maximum_compensation=2000
        )
        internship.required_skills.add(self.skill)
        self.assertEqual(internship.title, 'Software Engineer Intern')
        self.assertEqual(internship.status, Internship.STATUS_DRAFT)

    def test_internship_str(self):
        """Test internship string representation"""
        internship = Internship.objects.create(
            title='Software Engineer Intern',
            organization_name='Tech Company',
            description='Software engineering internship',
            application_url='https://example.com/apply',
            source=self.source
        )
        self.assertEqual(str(internship), 'Software Engineer Intern - Tech Company')

    def test_is_expired(self):
        """Test internship expiration check"""
        past_deadline = timezone.now() - timezone.timedelta(days=1)
        future_deadline = timezone.now() + timezone.timedelta(days=30)

        expired_internship = Internship.objects.create(
            title='Expired Internship',
            organization_name='Company',
            description='Expired',
            application_url='https://example.com/apply',
            source=self.source,
            external_id='expired_1',
            application_deadline=past_deadline
        )

        active_internship = Internship.objects.create(
            title='Active Internship',
            organization_name='Company',
            description='Active',
            application_url='https://example.com/apply',
            source=self.source,
            application_deadline=future_deadline
        )

        self.assertTrue(expired_internship.is_expired())
        self.assertFalse(active_internship.is_expired())

    def test_compensation_validation(self):
        """Test compensation validation for paid internships"""
        internship = Internship(
            title='Software Engineer Intern',
            organization_name='Tech Company',
            description='Software engineering internship',
            application_url='https://example.com/apply',
            source=self.source,
            compensation_type='paid',
            minimum_compensation=None,
            maximum_compensation=None
        )
        with self.assertRaises(Exception):
            internship.full_clean()


class SavedInternshipModelTest(TestCase):
    """Test cases for SavedInternship model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api'
        )
        self.internship = Internship.objects.create(
            title='Software Engineer Intern',
            organization_name='Tech Company',
            description='Software engineering internship',
            application_url='https://example.com/apply',
            source=self.source,
            status=Internship.STATUS_ACTIVE
        )

    def test_save_internship(self):
        """Test saving an internship"""
        saved = SavedInternship.objects.create(
            student=self.user,
            internship=self.internship
        )
        self.assertEqual(saved.student, self.user)
        self.assertEqual(saved.internship, self.internship)

    def test_unique_saved_internship(self):
        """Test that a user can't save the same internship twice"""
        SavedInternship.objects.create(
            student=self.user,
            internship=self.internship
        )
        with self.assertRaises(Exception):
            SavedInternship.objects.create(
                student=self.user,
                internship=self.internship
            )


class InternshipApplicationModelTest(TestCase):
    """Test cases for InternshipApplication model"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api'
        )
        self.internship = Internship.objects.create(
            title='Software Engineer Intern',
            organization_name='Tech Company',
            description='Software engineering internship',
            application_url='https://example.com/apply',
            source=self.source
        )

    def test_create_application(self):
        """Test creating an internship application"""
        application = InternshipApplication.objects.create(
            student=self.user,
            internship=self.internship,
            status=InternshipApplication.STATUS_APPLIED
        )
        self.assertEqual(application.status, InternshipApplication.STATUS_APPLIED)
        self.assertEqual(application.student, self.user)

    def test_unique_application(self):
        """Test that a user can't apply to the same internship twice"""
        InternshipApplication.objects.create(
            student=self.user,
            internship=self.internship
        )
        with self.assertRaises(Exception):
            InternshipApplication.objects.create(
                student=self.user,
                internship=self.internship
            )


class InternshipAPITest(TestCase):
    """Test cases for Internship API endpoints"""

    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.admin = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123'
        )
        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api'
        )
        self.skill = Skill.objects.create(name='Python')
        self.internship = Internship.objects.create(
            title='Software Engineer Intern',
            organization_name='Tech Company',
            description='Software engineering internship',
            application_url='https://example.com/apply',
            source=self.source,
            status=Internship.STATUS_ACTIVE,
            is_verified=True
        )
        self.internship.required_skills.add(self.skill)

    def test_list_internships(self):
        """Test listing internships"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/internships/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_internship_detail(self):
        """Test getting internship details"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(f'/api/internships/{self.internship.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Software Engineer Intern')

    def test_latest_internships(self):
        """Test getting latest internships"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/internships/latest/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_save_internship(self):
        """Test saving an internship"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/internships/saved/add/', {
            'internship': self.internship.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_saved_internships_list(self):
        """Test listing saved internships"""
        SavedInternship.objects.create(
            student=self.user,
            internship=self.internship
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/internships/saved/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_create_application(self):
        """Test creating an application"""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/api/internships/applications/add/', {
            'internship': self.internship.id
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_applications_list(self):
        """Test listing applications"""
        InternshipApplication.objects.create(
            student=self.user,
            internship=self.internship
        )
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/internships/applications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_student_dashboard(self):
        """Test student dashboard"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/internships/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('saved_internships', response.data)
        self.assertIn('total_applications', response.data)

    def test_student_recommendations(self):
        """Test student recommendations endpoint"""
        from apps.student_profiles.models import StudentProfile
        from apps.accounts.services import create_student_user
        
        # Create student with profile
        student = create_student_user(
            email='student@example.com',
            username='student',
            password='testpass123'
        )
        student.is_email_verified = True
        student.save()
        
        profile = StudentProfile.objects.create(
            user=student,
            preferred_locations=['Remote'],
            compensation_preference='either',
            work_type='either',
            internship_type='any'
        )
        profile.skills.add(self.skill)
        
        self.client.force_authenticate(user=student)
        response = self.client.get('/api/internships/recommendations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsInstance(response.data, list)
