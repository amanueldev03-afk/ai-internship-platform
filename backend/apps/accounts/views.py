from rest_framework import (
    generics,
    status
)
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .jwt import LoginSerializer
from .serializers import ( 
    EmailVerificationSerializer,
    StudentRegistrationSerializer,
    LogoutSerializer,
    UserSerializer,
    ResendVerificationSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ChangePasswordSerializer
)


@extend_schema(tags=["Authentication"])
class AuthTokenRefreshView(TokenRefreshView):
    """
    Refresh an expired access token using a valid refresh token.
    """
    throttle_classes = [AnonRateThrottle]


@extend_schema(tags=["Authentication"])
class StudentRegistrationView(generics.CreateAPIView):
    """
    Register a new student.
    """

    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        tags=["Authentication"],
        operation_id="student_register",
        summary="Student Registration",
        description="Register a new student account with email verification requirement",
        responses={
            201: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'integer'},
                            'email': {'type': 'string'},
                            'username': {'type': 'string'},
                        }
                    }
                }
            }
        },
        examples=[
            OpenApiExample(
                "Student Registration",
                value={
                    "full_name": "Student Name",
                    "email": "student@example.com",
                    "phone": "+1234567890",
                    "password": "SecurePassword123!",
                    "password_confirm": "SecurePassword123!"
                }
            )
        ]
    )
    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        full_name = " ".join(
            filter(None, [user.first_name, user.last_name])
        )

        return Response(
            {
                "message": (
                    "Registration successful. "
                    "Please check your email "
                    "to verify your account."
                ),
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "full_name": full_name,
                },
            },
            status=status.HTTP_201_CREATED,
        )


class LogoutView(GenericAPIView):
    """
    JWT Logout.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = LogoutSerializer

    @extend_schema(
        tags=["Authentication"],
        operation_id="user_logout",
        summary="User Logout",
        description="Logout by invalidating the JWT refresh token",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'}
                }
            }
        },
        examples=[
            OpenApiExample(
                "Logout",
                value={"refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."},
            )
        ]
    )
    def post(self, request):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            {
                "message": "Logout successful."
            },
            status=status.HTTP_200_OK,
        )


class CurrentUserView(GenericAPIView):
    """
    Return the currently authenticated user.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    @extend_schema(
        tags=["Authentication"],
        operation_id="get_current_user",
        summary="Get Current User",
        description="Retrieve account details and role information of the currently authenticated user",
        responses={200: UserSerializer}
    )
    def get(self, request):

        serializer = self.get_serializer(request.user)

        return Response(serializer.data)



class LoginView(APIView):
    """
    Unified login (Task 2.3 / Figure 5.1).

    ``POST /api/auth/login/``

    Verifies credentials and account state, then issues access + refresh
    tokens with the user's ``role`` embedded in the claims.

    Returns:
      * ``200`` with tokens on success
      * ``401`` on invalid email/password
      * ``403`` when the account is inactive / email not verified
    """

    permission_classes = [AllowAny]
    serializer_class = LoginSerializer
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        tags=["Authentication"],
        operation_id="token_obtain_pair",
        summary="Unified Login",
        description=(
            "Authenticate with email and password. Returns JWT access/refresh "
            "tokens with the user's role embedded in the claims for routing."
        ),
        request=LoginSerializer,
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'access': {'type': 'string'},
                    'refresh': {'type': 'string'},
                    'user': {
                        'type': 'object',
                        'properties': {
                            'id': {'type': 'integer'},
                            'email': {'type': 'string'},
                            'role': {'type': 'string'},
                        }
                    }
                }
            },
            401: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string'}
                }
            },
            403: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string'}
                }
            },
        },
        examples=[
            OpenApiExample(
                "Login",
                value={
                    "email": "student@example.com",
                    "password": "SecurePassword123!",
                },
            )
        ]
    )
    def post(self, request):

        serializer = self.serializer_class(data=request.data)

        if not serializer.is_valid():
            # Map the serializer outcome to the correct status code.
            if getattr(serializer, "outcome", "invalid") == "inactive":
                return Response(
                    {
                        "detail": (
                            "Please verify your email "
                            "before logging in."
                        )
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )
            return Response(
                serializer.errors,
                status=status.HTTP_401_UNAUTHORIZED,
            )

        user = serializer.validated_data["user"]

        return Response(
            {
                "access": serializer.validated_data["access"],
                "refresh": serializer.validated_data["refresh"],
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                    "role": user.role,
                },
            },
            status=status.HTTP_200_OK,
        )



class EmailVerificationLinkView(GenericAPIView):
    """
    Verify a student's email address via a GET link (Task 2.2).

    Endpoint: ``GET /api/auth/verify-email/<uid>/<token>/``

    Decodes the signed token, checks expiry, and flips the account to
    ``is_active=True``. A token may only be used once — reusing it fails
    with 400.
    """

    permission_classes = [AllowAny]
    serializer_class = EmailVerificationSerializer

    @extend_schema(
        tags=["Authentication"],
        summary="Verify Email via Link",
        description=(
            "Verify user email and activate the account using the UID and "
            "verification token embedded in the emailed link. Single-use."
        ),
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'}
                }
            },
            400: {
                'type': 'object',
                'properties': {
                    'detail': {'type': 'string'}
                }
            },
        },
    )
    def get(self, request, uid, token):

        serializer = self.get_serializer(
            data={
                "uid": uid,
                "token": token,
            }
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": "Email verified successfully. "
                           "Your account is now active."
            },
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(GenericAPIView):
    """
    Resend email verification link.
    """

    permission_classes = [AllowAny]
    serializer_class = ResendVerificationSerializer
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        tags=["Authentication"],
        summary="Resend Verification Email",
        description="Resend account verification email to user",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'}
                }
            }
        },
        examples=[
            OpenApiExample(
                "Resend Verification",
                value={"email": "user@example.com"},
            )
        ]
    )
    def post(self, request):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "A new verification email "
                    "has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetView(GenericAPIView):
    """
    Request a password reset email (Task 2.5).

    ``POST /api/auth/password-reset/`` with ``{"email": ...}`` in the body.
    """

    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        tags=["Authentication"],
        summary="Request Password Reset",
        description="Request a password reset email (Task 2.5)",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'}
                }
            }
        },
        examples=[
            OpenApiExample(
                "Request Password Reset",
                value={"email": "user@example.com"},
            )
        ]
    )
    def post(self, request):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": (
                    "If an account exists with this "
                    "email, a password reset link "
                    "has been sent."
                )
            },
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(GenericAPIView):
    """
    Confirm a password reset (Task 2.5).

    ``POST /api/auth/password-reset-confirm/<uid>/<token>/`` with
    ``{"password": ..., "password_confirm": ...}`` in the body.
    """

    permission_classes = [AllowAny]
    serializer_class = ResetPasswordSerializer
    throttle_classes = [AnonRateThrottle]

    @extend_schema(
        tags=["Authentication"],
        summary="Confirm Password Reset",
        description="Set a new password using the reset token (Task 2.5)",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'}
                }
            }
        },
        examples=[
            OpenApiExample(
                "Confirm Password Reset",
                value={
                    "password": "newSecurePassword123",
                    "password_confirm": "newSecurePassword123",
                },
            )
        ]
    )
    def post(self, request, uid, token):

        data = request.data.copy()
        data["uid"] = uid
        data["token"] = token

        serializer = self.get_serializer(
            data=data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": "Password reset successfully."
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(GenericAPIView):
    """
    Change password for the authenticated user.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    @extend_schema(
        tags=["Authentication"],
        summary="Change Password",
        description="Change password for the currently logged in user",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'message': {'type': 'string'}
                }
            }
        },
        examples=[
            OpenApiExample(
                "Change Password",
                value={
                    "old_password": "oldPassword123",
                    "new_password": "newSecurePassword123"
                },
            )
        ]
    )
    def post(self, request):

        serializer = self.get_serializer(
            data=request.data,
            context={
                "request": request
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message": "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )