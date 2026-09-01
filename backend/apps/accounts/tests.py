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

    def test_student_registration_auth_endpoint(self):
        """Test student registration via the canonical /api/auth/register/ endpoint (Task 2.1)"""
        data = {
            'full_name': 'Jane Doe',
            'email': 'authuser@example.com',
            'password': 'SecurePass123!',
            'phone': '+1234567890',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email='authuser@example.com').exists())

    def test_registration_creates_inactive_user_and_student_shell(self):
        """User is created is_active=False with an empty StudentProfile shell until verified (Task 2.1)"""
        data = {
            'full_name': 'Jane Doe',
            'email': 'shell@example.com',
            'password': 'SecurePass123!',
            'phone': '+1234567890',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='shell@example.com')
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_email_verified)

        from apps.students.models import StudentProfile
        self.assertTrue(StudentProfile.objects.filter(user=user).exists())
        profile = StudentProfile.objects.get(user=user)
        self.assertEqual(profile.phone, '+1234567890')

    def test_registration_duplicate_email_returns_400(self):
        """Registering twice with the same email returns 400 with a field error (not 500)"""
        data = {
            'full_name': 'Jane Doe',
            'email': 'dupe@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }
        first = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(first.status_code, status.HTTP_201_CREATED)

        # Second attempt with the same email must be 400, not 500
        second = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', second.data)

    def test_student_registration_password_mismatch(self):
        """Test registration with mismatched passwords"""
        data = {
            'full_name': 'Jane Doe',
            'email': 'newuser@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'differentpass'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_registration_weak_password(self):
        """Test registration with weak password"""
        data = {
            'full_name': 'Jane Doe',
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': '123',
            'password_confirm': '123'
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_student_registration_missing_full_name(self):
        """Test registration without full_name is rejected"""
        data = {
            'email': 'noname@example.com',
            'password': 'SecurePass123!',
            'password_confirm': 'SecurePass123!',
        }
        response = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('full_name', response.data)

    def test_student_login(self):
        """Test student login endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        user.is_email_verified = True
        user.is_active = True
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

    def test_unified_login_success_issues_tokens_with_role_claim(self):
        """Valid credentials -> 200 with access + refresh and role in claims (Task 2.3, Figure 5.1)"""
        from .services import create_student_user

        user = create_student_user(
            email='login@example.com',
            username='loginuser',
            password='testpass123',
        )
        user.is_email_verified = True
        user.is_active = True
        user.save()

        response = self.client.post('/api/auth/login/', {
            'email': 'login@example.com',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['role'], 'student')

        # Decode the access token and assert the role claim is embedded
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken(response.data['access'])
        self.assertEqual(token['role'], 'student')
        self.assertEqual(token['email'], 'login@example.com')

    def test_unified_login_wrong_password_401(self):
        """Wrong password -> 401 (Task 2.3)"""
        from .services import create_student_user

        user = create_student_user(
            email='wrongpw@example.com',
            username='wrongpw',
            password='testpass123',
        )
        user.is_email_verified = True
        user.is_active = True
        user.save()

        response = self.client.post('/api/auth/login/', {
            'email': 'wrongpw@example.com',
            'password': 'incorrect',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_unified_login_inactive_account_403(self):
        """Inactive / unverified account -> 403 with 'verify your email' (Task 2.3 alternate path)"""
        from .services import create_student_user

        # Account created by registration is inactive + unverified (Task 2.1)
        create_student_user(
            email='unverified@example.com',
            username='unverified',
            password='testpass123',
        )

        response = self.client.post('/api/auth/login/', {
            'email': 'unverified@example.com',
            'password': 'testpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn('verify', response.data['detail'].lower())

    def test_protected_endpoint_no_token_returns_401(self):
        """Calling a protected endpoint with no token -> 401 (Task 2.4)"""
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_protected_endpoint_invalid_token_returns_401(self):
        """Calling a protected endpoint with a garbage token -> 401 (Task 2.4)"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer not-a-real-token')
        response = self.client.get('/api/accounts/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_endpoint(self):
        """POST /api/auth/refresh/ with a valid refresh token issues new tokens (Task 2.4)"""
        from .services import create_student_user

        user = create_student_user(
            email='refresh@example.com',
            username='refreshuser',
            password='testpass123',
        )
        user.is_email_verified = True
        user.is_active = True
        user.save()

        login = self.client.post('/api/auth/login/', {
            'email': 'refresh@example.com',
            'password': 'testpass123',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        refresh_token = login.data['refresh']

        refresh = self.client.post('/api/auth/refresh/', {
            'refresh': refresh_token,
        }, format='json')

        self.assertEqual(refresh.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh.data)
        self.assertIn('refresh', refresh.data)

        # The new access token must be usable on a protected endpoint
        new_access = refresh.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
        me = self.client.get('/api/accounts/me/')
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data['email'], 'refresh@example.com')

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

    def test_student_token_denied_on_admin_endpoint(self):
        """A student JWT hitting an admin-only endpoint -> 403 (Task 2.6 / Section 6.7.2)"""
        from .services import create_student_user

        # Real student account (role=student) with a valid JWT
        student = create_student_user(
            email='rbac_student@example.com',
            username='rbacstudent',
            password='testpass123',
        )
        student.is_email_verified = True
        student.is_active = True
        student.save()

        login = self.client.post('/api/auth/login/', {
            'email': 'rbac_student@example.com',
            'password': 'testpass123',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data['user']['role'], 'student')

        access = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        # Admin-only endpoint must reject a student JWT with 403
        response = self.client.get('/api/internships/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_token_allowed_on_admin_endpoint(self):
        """An admin JWT is allowed on an admin-only endpoint (Task 2.6)"""
        User = get_user_model()

        admin = User.objects.create_superuser(
            email='rbac_admin@example.com',
            username='rbacadmin',
            password='adminpass123',
        )
        self.assertEqual(admin.role, User.Role.ADMIN)

        # Obtain an admin JWT
        login = self.client.post('/api/auth/login/', {
            'email': 'rbac_admin@example.com',
            'password': 'adminpass123',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data['user']['role'], 'admin')

        access = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        response = self.client.get('/api/internships/admin/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_token_denied_on_student_endpoint(self):
        """An admin JWT is rejected on a student-only endpoint -> 403 (Task 2.6)"""
        User = get_user_model()

        admin = User.objects.create_superuser(
            email='rbac_admin2@example.com',
            username='rbacadmin2',
            password='adminpass123',
        )

        login = self.client.post('/api/auth/login/', {
            'email': 'rbac_admin2@example.com',
            'password': 'adminpass123',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)

        access = login.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')

        # Student-only endpoint must reject an admin JWT with 403
        response = self.client.get('/api/internships/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_logout(self):
        """Test logout endpoint"""
        from .services import create_student_user
        user = create_student_user(
            email='test@example.com',
            username='testuser',
            password='testpass123'
        )
        user.is_email_verified = True
        user.is_active = True
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

    def test_verify_email_link_activates_account(self):
        """Valid GET link flips is_email_verified=True and is_active=True (Task 2.2)"""
        from .services import create_student_user
        from .tokens import email_verification_token
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        user = create_student_user(
            email='activate@example.com',
            username='activator',
            password='testpass123',
        )
        self.assertFalse(user.is_active)

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)

        response = self.client.get(
            f'/api/auth/verify-email/{uid}/{token}/'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_email_verified)
        self.assertTrue(user.is_active)

    def test_verify_email_link_single_use(self):
        """Reusing the same verification token fails (single-use, Task 2.2)"""
        from .services import create_student_user
        from .tokens import email_verification_token
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        user = create_student_user(
            email='single@example.com',
            username='singleuse',
            password='testpass123',
        )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)

        first = self.client.get(f'/api/auth/verify-email/{uid}/{token}/')
        self.assertEqual(first.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_active)

        # Second use of the same token must fail with 400
        second = self.client.get(f'/api/auth/verify-email/{uid}/{token}/')
        self.assertEqual(second.status_code, status.HTTP_400_BAD_REQUEST)

    def test_verify_email_link_tampered_token_fails(self):
        """Tampered/expired token returns 400 (Task 2.2)"""
        from .services import create_student_user
        from .tokens import email_verification_token
        from django.utils.http import urlsafe_base64_encode
        from django.utils.encoding import force_bytes

        user = create_student_user(
            email='tampered@example.com',
            username='tamperer',
            password='testpass123',
        )

        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Use a bogus token for the existing user
        response = self.client.get(
            f'/api/auth/verify-email/{uid}/not-a-real-token/'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        user.refresh_from_db()
        self.assertFalse(user.is_active)
        self.assertFalse(user.is_email_verified)

        # A uid that does not decode / match any user also fails
        bad_uid = urlsafe_base64_encode(force_bytes(99999))
        valid_token = email_verification_token.make_token(user)
        response = self.client.get(
            f'/api/auth/verify-email/{bad_uid}/{valid_token}/'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

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

    def test_password_reset_round_trip(self):
        """Full round trip: request reset -> extract token from outbox -> confirm -> login (Task 2.5)"""
        import re
        from django.core import mail
        from .services import create_student_user

        user = create_student_user(
            email='reset@example.com',
            username='resetuser',
            password='oldPass123!',
        )
        user.is_email_verified = True
        user.is_active = True
        user.save()

        # 1. Request the reset
        response = self.client.post('/api/auth/password-reset/', {
            'email': 'reset@example.com',
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Extract uid + token from the emailed link (test-mode outbox)
        self.assertEqual(len(mail.outbox), 1)
        body = mail.outbox[0].body
        match = re.search(
            r'/api/auth/password-reset-confirm/(?P<uid>[^/]+)/(?P<token>[^/]+)/',
            body,
        )
        self.assertIsNotNone(match, f"Could not parse reset link from email: {body}")
        uid = match.group('uid')
        token = match.group('token')

        # 3. Confirm with a new password
        confirm = self.client.post(
            f'/api/auth/password-reset-confirm/{uid}/{token}/',
            {
                'password': 'newPass123!',
                'password_confirm': 'newPass123!',
            },
            format='json',
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)

        # 4. New password logs in; old password fails
        login_new = self.client.post('/api/auth/login/', {
            'email': 'reset@example.com',
            'password': 'newPass123!',
        }, format='json')
        self.assertEqual(login_new.status_code, status.HTTP_200_OK)

        login_old = self.client.post('/api/auth/login/', {
            'email': 'reset@example.com',
            'password': 'oldPass123!',
        }, format='json')
        self.assertEqual(login_old.status_code, status.HTTP_401_UNAUTHORIZED)

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

    # =========================================================================
    # Definition of Done (Phase 2) — Table 6.1 TC001–TC003, driven entirely via API
    # =========================================================================

    def test_tc001_registration_via_api(self):
        """TC001: Register via API -> 201, inactive user + Student shell; duplicate email -> 400."""
        from apps.students.models import StudentProfile

        data = {
            'full_name': 'TC One',
            'email': 'tc001@example.com',
            'password': 'SecurePass123!',
            'phone': '+1122334455',
        }

        # Successful registration
        resp = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)

        user = User.objects.get(email='tc001@example.com')
        self.assertFalse(user.is_active, "New account must be inactive until verified")
        self.assertFalse(user.is_email_verified)
        self.assertEqual(user.first_name, 'TC')
        self.assertEqual(user.last_name, 'One')
        self.assertTrue(StudentProfile.objects.filter(user=user, phone='+1122334455').exists())

        # Duplicate registration -> 400 field error (not 500)
        dup = self.client.post('/api/auth/register/', data, format='json')
        self.assertEqual(dup.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', dup.data)

    def test_tc002_verify_and_login_via_api(self):
        """TC002: Verify email (activates account) then login issues JWT with role claim."""
        import re
        from django.core import mail

        # Register
        self.client.post('/api/auth/register/', {
            'full_name': 'TC Two',
            'email': 'tc002@example.com',
            'password': 'SecurePass123!',
        }, format='json')

        user = User.objects.get(email='tc002@example.com')

        # Login before verification -> alternate path (403)
        pre = self.client.post('/api/auth/login/', {
            'email': 'tc002@example.com',
            'password': 'SecurePass123!',
        }, format='json')
        self.assertEqual(pre.status_code, status.HTTP_403_FORBIDDEN)

        # Extract verification link from the outbox and hit it (GET)
        match = re.search(
            r'/api/auth/verify-email/(?P<uid>[^/]+)/(?P<token>[^/]+)/',
            mail.outbox[0].body,
        )
        self.assertIsNotNone(match)
        verify = self.client.get(
            f"/api/auth/verify-email/{match.group('uid')}/{match.group('token')}/"
        )
        self.assertEqual(verify.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.is_email_verified)

        # Login after verification -> 200 with tokens + role claim
        login = self.client.post('/api/auth/login/', {
            'email': 'tc002@example.com',
            'password': 'SecurePass123!',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertIn('access', login.data)
        self.assertIn('refresh', login.data)
        self.assertEqual(login.data['user']['role'], 'student')

    def test_tc003_refresh_reset_and_rbac_via_api(self):
        """TC003: Refresh tokens, full password reset round trip, and RBAC cross-role block."""
        import re
        from django.core import mail

        # Register + verify
        self.client.post('/api/auth/register/', {
            'full_name': 'TC Three',
            'email': 'tc003@example.com',
            'password': 'OrigPass123!',
        }, format='json')
        user = User.objects.get(email='tc003@example.com')

        vmatch = re.search(
            r'/api/auth/verify-email/(?P<uid>[^/]+)/(?P<token>[^/]+)/',
            mail.outbox[0].body,
        )
        self.client.get(f"/api/auth/verify-email/{vmatch.group('uid')}/{vmatch.group('token')}/")
        user.refresh_from_db()
        self.assertTrue(user.is_active)

        # Login
        login = self.client.post('/api/auth/login/', {
            'email': 'tc003@example.com',
            'password': 'OrigPass123!',
        }, format='json')
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        refresh_token = login.data['refresh']

        # (a) Token refresh issues new tokens; new access works on a protected route
        refresh = self.client.post('/api/auth/refresh/', {
            'refresh': refresh_token,
        }, format='json')
        self.assertEqual(refresh.status_code, status.HTTP_200_OK)
        self.assertIn('access', refresh.data)
        new_access = refresh.data['access']
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {new_access}')
        me = self.client.get('/api/accounts/me/')
        self.assertEqual(me.status_code, status.HTTP_200_OK)

        # (b) Full password reset round trip
        self.client.credentials()  # clear auth
        rq = self.client.post('/api/auth/password-reset/', {
            'email': 'tc003@example.com',
        }, format='json')
        self.assertEqual(rq.status_code, status.HTTP_200_OK)

        rmatch = re.search(
            r'/api/auth/password-reset-confirm/(?P<uid>[^/]+)/(?P<token>[^/]+)/',
            mail.outbox[-1].body,
        )
        self.assertIsNotNone(rmatch)
        confirm = self.client.post(
            f"/api/auth/password-reset-confirm/{rmatch.group('uid')}/{rmatch.group('token')}/",
            {'password': 'NewPass456!', 'password_confirm': 'NewPass456!'},
            format='json',
        )
        self.assertEqual(confirm.status_code, status.HTTP_200_OK)

        new_login = self.client.post('/api/auth/login/', {
            'email': 'tc003@example.com',
            'password': 'NewPass456!',
        }, format='json')
        self.assertEqual(new_login.status_code, status.HTTP_200_OK)

        # (c) RBAC: student token is denied on an admin-only endpoint (Section 6.7.2)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {new_login.data['access']}")
        admin_resp = self.client.get('/api/internships/admin/dashboard/')
        self.assertEqual(admin_resp.status_code, status.HTTP_403_FORBIDDEN)
