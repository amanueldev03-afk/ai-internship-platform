from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Skill, InternshipSource, Internship, SavedInternship, InternshipApplication
from .services.semantic_matching import (
    build_student_text,
    build_internship_text,
    generate_embedding,
    update_student_embedding,
    update_internship_embedding,
    calculate_stored_semantic_similarity,
)
from .services.hybrid_matching import calculate_hybrid_match
from .services.recommendation_engine_v2 import (
    calculate_skill_score,
    get_matched_skills,
    calculate_location_score,
    calculate_final_score,
    build_explanation,
)

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
        self.assertIn('results', response.data)
        self.assertIsInstance(response.data['results'], list)


class SemanticMatchingTest(TestCase):
    """Test cases for semantic matching functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        from apps.student_profiles.models import StudentProfile
        self.profile = StudentProfile.objects.create(
            user=self.user,
            bio='Software engineering student',
            country='USA',
            city='New York'
        )
        self.skill = Skill.objects.create(name='Python')
        self.profile.skills.add(self.skill)
        
        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api'
        )
        self.internship = Internship.objects.create(
            title='Python Developer Intern',
            organization_name='Tech Company',
            description='Python development internship',
            application_url='https://example.com/apply',
            source=self.source,
            status=Internship.STATUS_ACTIVE
        )
        self.internship.required_skills.add(self.skill)

    def test_build_student_text(self):
        """Test building student text for embedding"""
        text = build_student_text(self.profile)
        self.assertIn('Python', text)
        self.assertIn('Software engineering student', text)
        self.assertIn('USA', text)
        self.assertIn('New York', text)

    def test_build_internship_text(self):
        """Test building internship text for embedding"""
        text = build_internship_text(self.internship)
        self.assertIn('Python Developer Intern', text)
        self.assertIn('Python development internship', text)
        self.assertIn('Python', text)

    def test_generate_embedding(self):
        """Test embedding generation"""
        text = "Software engineering with Python and Django"
        embedding = generate_embedding(text)
        self.assertIsInstance(embedding, list)
        self.assertEqual(len(embedding), 384)

    def test_generate_empty_embedding(self):
        """Test embedding generation with empty text"""
        embedding = generate_embedding('')
        self.assertEqual(embedding, [])

    def test_update_student_embedding(self):
        """Test updating student embedding"""
        embedding = update_student_embedding(self.profile)
        self.assertIsInstance(embedding, list)
        self.assertEqual(len(embedding), 384)
        self.profile.refresh_from_db()
        self.assertEqual(len(self.profile.embedding), 384)

    def test_update_internship_embedding(self):
        """Test updating internship embedding"""
        embedding = update_internship_embedding(self.internship)
        self.assertIsInstance(embedding, list)
        self.assertEqual(len(embedding), 384)
        self.internship.refresh_from_db()
        self.assertEqual(len(self.internship.embedding), 384)

    def test_calculate_stored_semantic_similarity(self):
        """Test semantic similarity calculation with stored embeddings"""
        update_student_embedding(self.profile)
        update_internship_embedding(self.internship)
        
        similarity = calculate_stored_semantic_similarity(
            self.profile,
            self.internship
        )
        self.assertIsInstance(similarity, float)
        self.assertGreaterEqual(similarity, 0.0)
        self.assertLessEqual(similarity, 100.0)

    def test_semantic_similarity_with_no_embeddings(self):
        """Test semantic similarity when embeddings don't exist"""
        # Clear any existing embeddings
        self.profile.embedding = None
        self.internship.embedding = None
        self.profile.save()
        self.internship.save()
        
        similarity = calculate_stored_semantic_similarity(
            self.profile,
            self.internship
        )
        # Should auto-generate embeddings and calculate similarity
        self.assertIsInstance(similarity, float)
        self.assertGreaterEqual(similarity, 0.0)


class HybridMatchingTest(TestCase):
    """Test cases for hybrid matching functionality"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        from apps.student_profiles.models import StudentProfile
        self.profile = StudentProfile.objects.create(
            user=self.user,
            bio='Software engineering student',
            preferred_locations=['Remote'],
            compensation_preference='either',
            work_type='either',
            internship_type='any'
        )
        self.skill = Skill.objects.create(name='Python')
        self.profile.skills.add(self.skill)
        
        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api'
        )
        self.internship = Internship.objects.create(
            title='Python Developer Intern',
            organization_name='Tech Company',
            description='Python development internship',
            application_url='https://example.com/apply',
            source=self.source,
            status=Internship.STATUS_ACTIVE,
            internship_type='remote',
            work_type='full_time',
            compensation_type='paid'
        )
        self.internship.required_skills.add(self.skill)

    def test_calculate_hybrid_match(self):
        """Test hybrid matching calculation"""
        update_student_embedding(self.profile)
        update_internship_embedding(self.internship)
        
        result = calculate_hybrid_match(self.profile, self.internship)
        
        self.assertIsInstance(result, dict)
        self.assertIn('eligible', result)
        self.assertIn('score', result)
        self.assertIn('preference_score', result)
        self.assertIn('semantic_score', result)
        self.assertIn('score_breakdown', result)
        self.assertIn('explanation', result)
        self.assertTrue(result['eligible'])
        self.assertGreaterEqual(result['score'], 0.0)
        self.assertLessEqual(result['score'], 100.0)

    def test_hybrid_match_without_embeddings(self):
        """Test hybrid matching when embeddings don't exist"""
        # Clear any existing embeddings
        self.profile.embedding = None
        self.internship.embedding = None
        self.profile.save()
        self.internship.save()
        
        result = calculate_hybrid_match(self.profile, self.internship)
        
        # Should auto-generate embeddings and calculate similarity
        self.assertIsInstance(result, dict)
        self.assertIn('score', result)
        self.assertIn('preference_score', result)
        self.assertIn('semantic_score', result)
        self.assertGreaterEqual(result['semantic_score'], 0.0)

    def test_hybrid_match_explanation(self):
        """Test hybrid match explanation generation"""
        update_student_embedding(self.profile)
        update_internship_embedding(self.internship)
        
        result = calculate_hybrid_match(self.profile, self.internship)
        explanation = result['explanation']
        
        self.assertIn('summary', explanation)
        self.assertIn('matched_skills', explanation)
        self.assertIn('missing_skills', explanation)
        self.assertIn('preferences_matched', explanation)
        self.assertIsInstance(explanation['matched_skills'], list)
        self.assertIsInstance(explanation['missing_skills'], list)


class RecommendationEngineV2Test(TestCase):
    """Test cases for Recommendation Engine V2"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        from apps.student_profiles.models import StudentProfile
        self.profile = StudentProfile.objects.create(
            user=self.user,
            bio='Software engineering student',
            country='USA',
            city='New York'
        )
        self.skill = Skill.objects.create(name='Python')
        self.profile.skills.add(self.skill)

        self.source = InternshipSource.objects.create(
            name='LinkedIn',
            source_type='api'
        )
        self.internship = Internship.objects.create(
            title='Python Developer Intern',
            organization_name='Tech Company',
            description='Python development internship',
            application_url='https://example.com/apply',
            source=self.source,
            status=Internship.STATUS_ACTIVE,
            internship_type='remote',
            work_type='full_time',
            compensation_type='paid',
            minimum_compensation=1000,
            maximum_compensation=2000,
            country='USA',
            city='New York'
        )
        self.internship.required_skills.add(self.skill)

    def test_calculate_skill_score(self):
        """Test skill score calculation"""
        student_skills = ['Python', 'Django', 'React']
        internship_skills = ['Python', 'Django', 'JavaScript']
        score = calculate_skill_score(student_skills, internship_skills)
        self.assertEqual(score, 2/3)  # 2 matches out of 3

    def test_get_matched_skills(self):
        """Test matched skills extraction"""
        student_skills = ['Python', 'Django', 'React']
        internship_skills = ['python', 'DJANGO', 'JavaScript']
        matched = get_matched_skills(student_skills, internship_skills)
        self.assertIn('Python', matched)
        self.assertIn('Django', matched)
        self.assertEqual(len(matched), 2)

    def test_calculate_location_score(self):
        """Test location score calculation"""
        score = calculate_location_score(self.internship, self.profile)
        self.assertEqual(score, 1.0)  # Same city
        
        self.profile.city = 'Boston'
        self.profile.save()
        score = calculate_location_score(self.internship, self.profile)
        self.assertEqual(score, 0.5)  # Same country, different city

    def test_calculate_final_score(self):
        """Test final weighted score calculation"""
        semantic = 0.8
        skill = 0.6
        preference = 0.7
        location = 0.5
        salary = 0.9
        
        score = calculate_final_score(semantic, skill, preference, location, salary)
        self.assertGreaterEqual(score, 0.0)
        self.assertLessEqual(score, 100.0)

    def test_build_explanation(self):
        """Test explanation building"""
        explanation = build_explanation(
            semantic_score=0.85,
            skill_score=0.75,
            preference_score=0.80,
            matched_skills=['Python', 'Django'],
            internship=self.internship
        )
        self.assertIsInstance(explanation, list)
        self.assertGreater(len(explanation), 0)

    def test_student_recommendations_v2(self):
        """Test student recommendations endpoint with v2 engine"""
        from apps.student_profiles.models import StudentProfile
        from apps.accounts.services import create_student_user
        from rest_framework.test import APIClient
        
        # Create student with profile
        student = create_student_user(
            email='student2@example.com',
            username='student2',
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
        
        client = APIClient()
        client.force_authenticate(user=student)
        response = client.get('/api/internships/recommendations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)
        self.assertIsInstance(response.data['results'], list)
        
        # Check new v2 response format
        if len(response.data['results']) > 0:
            result = response.data['results'][0]
            self.assertIn('match_score', result)
            self.assertIn('explanation', result)
            self.assertIsInstance(result['explanation'], list)
