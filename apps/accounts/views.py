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
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from .jwt import AdminTokenObtainPairSerializer, StudentTokenObtainPairSerializer
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
 


class StudentRegistrationView(generics.CreateAPIView):
    """
    Register a new student.
    """

    serializer_class = StudentRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

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
                },
            },
            status=status.HTTP_201_CREATED,
        )
    



class LogoutView(APIView):
    """
    JWT Logout.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = LogoutSerializer(
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

class CurrentUserView(APIView):
    """
    Return the currently authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        serializer = UserSerializer(request.user)

        return Response(serializer.data)

class AdminLoginView(TokenObtainPairView):
    """
    Admin login endpoint using username/password.
    """
    serializer_class = AdminTokenObtainPairSerializer


class StudentLoginView(TokenObtainPairView):
    """
    Student login endpoint using email/password.
    """
    serializer_class = StudentTokenObtainPairSerializer


class EmailVerificationView(GenericAPIView):
    """
    Verify a student's email address.
    """

    permission_classes = [AllowAny]
    serializer_class = EmailVerificationSerializer

    @extend_schema(
        examples=[
            OpenApiExample(
                "Email Verification",
                value={"uid": "MQ", "token": "abc123xyz"},
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
                "message": "Email verified successfully."
            },
            status=status.HTTP_200_OK,
        )

class ResendVerificationView(APIView):
    """
    Resend email verification link.
    """

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ResendVerificationSerializer(
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


class ForgotPasswordView(APIView):
    """
    Request a password reset email.
    """

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ForgotPasswordSerializer(
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


class ResetPasswordView(APIView):
    """
    Reset password using a valid reset token.
    """

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = ResetPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                "Password reset successfully."
            },
            status=status.HTTP_200_OK,
        )


class ChangePasswordView(APIView):
    """
    Change password for the authenticated user.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = ChangePasswordSerializer(
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
                "message":
                "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )