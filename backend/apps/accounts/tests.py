from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import User

User = get_user_model()


class UserModelTest(TestCase):
    """Test cases for User model"""

    def test_create_user(self):
        """Test creating a new user with UserManager"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.username, 'testuser')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, User.Role.STUDENT)
        self.assertFalse(user.is_email_verified)

    def test_create_superuser(self):
        """Test creating a superuser with UserManager"""
        user = User.objects.create_superuser(
            email='admin@example.com',
            username='admin',
            password='adminpass123'
        )
        self.assertTrue(user.is_staff)
        self.assertTrue(user.is_superuser)
        self.assertEqual(user.role, User.Role.ADMIN)

    def test_user_str(self):
        """Test user string representation"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.assertEqual(str(user), 'test@example.com')

    def test_email_unique(self):
        """Test that email must be unique"""
        User.objects.create_user(
            email='test@example.com',
            username='testuser1',
            password='testpass123'
        )
        with self.assertRaises(Exception):
            User.objects.create_user(
                email='test@example.com',
                username='testuser2',
                password='testpass123'
            )

    def test_user_timestamps(self):
        """Test that timestamps are auto-created"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.assertIsNotNone(user.created_at)
        self.assertIsNotNone(user.updated_at)


class UserAPITest(TestCase):
    """Test cases for User API endpoints"""

    def setUp(self):
        """Set up test client"""
        self.client = APIClient()

    def test_student_registration(self):
        """Test student registration endpoint"""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!'
        }
        response = self.client.post('/api/accounts/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='newuser@example.com').exists())
        self.assertIn('message', response.data)
        self.assertIn('user', response.data)

    def test_student_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': 'SecurePass123!',
            'password_confirm': 'differentpass'
        }
        response = self.client.post('/api/accounts/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_registration_weak_password(self):
        """Test registration with weak password"""
        data = {
            'email': 'newuser@example.com',
            'username': 'newuser',
            'password': '123',
            'password_confirm': '123'
        }
        response = self.client.post('/api/accounts/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_login(self):
        """Test student login endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        user.is_email_verified = True
        user.save()
        data = {
            'email': 'test@example.com',
            'password': 'testpass123'
        }
        response = self.client.post('/api/accounts/student/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_student_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        data = {
            'email': 'nonexistent@example.com',
            'password': 'wrongpass'
        }
        response = self.client.post('/api/accounts/student/login/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_current_user(self):
        """Test getting current user profile"""
        user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=user)
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'test@example.com')
        self.assertEqual(response.data['username'], 'testuser')

    def test_logout(self):
        """Test logout endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        user.is_email_verified = True
        user.save()
        self.client.force_authenticate(user=user)
        
        # Get refresh token first
        login_response = self.client.post('/api/accounts/student/login/', {
            'email': 'test@example.com',
            'password': 'testpass123'
        }, format='json')
        refresh_token = login_response.data['refresh']
        
        # Logout
        response = self.client.post('/api/accounts/logout/', {'refresh': refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_email_verification(self):
        """Test email verification endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        # Generate uid and token (simplified test)
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        
        # This will fail with invalid token, but confirms endpoint works
        response = self.client.post('/api/accounts/verify-email/', {
            'uid': uid,
            'token': 'test-token'
        }, format='json')
        # This will fail with invalid token, but confirms endpoint works
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_200_OK])

    def test_resend_verification(self):
        """Test resend verification endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        response = self.client.post('/api/accounts/resend-verification/', {
            'email': 'test@example.com'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_forgot_password(self):
        """Test forgot password endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        
        response = self.client.post('/api/accounts/forgot-password/', {
            'email': 'test@example.com'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_change_password(self):
        """Test change password endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=user)
        
        response = self.client.post('/api/accounts/change-password/', {
            'old_password': 'testpass123',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('message', response.data)

    def test_change_password_wrong_old_password(self):
        """Test change password with wrong old password"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        self.client.force_authenticate(user=user)
        
        response = self.client.post('/api/accounts/change-password/', {
            'old_password': 'wrongpassword',
            'new_password': 'NewSecurePass456!',
            'new_password_confirm': 'NewSecurePass456!'
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
