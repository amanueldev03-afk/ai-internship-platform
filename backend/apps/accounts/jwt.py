from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate


class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer for admin login with username/password.
    """

    username_field = "username"

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom JWT claims
        token["role"] = user.role
        token["email"] = user.email

        return token

    def validate(self, attrs):
        username = attrs.get("username")
        password = attrs.get("password")

        # Authenticate using username instead of email
        user = authenticate(username=username, password=password)

        if user is None:
            raise serializers.ValidationError(
                {
                    "detail": "Invalid username or password."
                }
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {
                    "detail": "Your account is inactive."
                }
            )

        # Check if user is admin (role == ADMIN, is_superuser, or is_staff)
        is_admin = (
            user.role == "ADMIN" 
            or user.is_superuser 
            or user.is_staff
        )

        if not is_admin:
            raise serializers.ValidationError(
                {
                    "detail": "Only administrators can login with username/password."
                }
            )

        # Skip email verification check for admin users
        if not user.is_email_verified:
            # Admins can login without email verification
            pass

        # Generate tokens
        refresh = self.get_token(user)

        data = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "message": "Admin login successful.",
            "user": {
                "id": user.id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "is_superuser": user.is_superuser,
                "is_staff": user.is_staff,
            }
        }

        return data


class StudentTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer for student login with email/password.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom JWT claims
        token["role"] = user.role
        token["email"] = user.email

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Require email verification for students
        if not self.user.is_email_verified:
            raise serializers.ValidationError(
                {
                    "detail": (
                        "Please verify your email "
                        "before logging in."
                    )
                }
            )

        data["message"] = "Student login successful."

        data["user"] = {
            "id": self.user.id,
            "email": self.user.email,
            "username": self.user.username,
            "role": self.user.role,
        }

        return data