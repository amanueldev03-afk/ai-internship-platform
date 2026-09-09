from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model


class LoginSerializer(serializers.Serializer):
    """
    Unified login serializer for Task 2.3 / Figure 5.1.

    Verifies credentials and account state, then issues access/refresh tokens
    with the user's ``role`` embedded in the claims so the frontend can route
    to the correct dashboard without an extra API call.

    Outcome flags used by the view to return the correct status code:
      * ``invalid``  -> 401 (bad email/password)
      * ``inactive`` -> 403 (unverified/inactive account — the alternate path)
      * ``ok``       -> 200 with tokens
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        User = get_user_model()

        email = attrs.get("email")
        password = attrs.get("password")

        self.outcome = "invalid"

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        if not user.check_password(password):
            raise serializers.ValidationError(
                {"detail": "Invalid email or password."}
            )

        # Account is dormant until the email is verified (Task 2.1 / 2.2).
        # This is the alternate path in Figure 5.1 -> HTTP 403.
        if not user.is_active or not user.is_email_verified:
            self.outcome = "inactive"
            raise serializers.ValidationError(
                {"detail": "Please verify your email before logging in."}
            )

        # Embed the role claim so the frontend can route without a lookup.
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        refresh["email"] = user.email

        self.outcome = "ok"

        attrs["user"] = user
        attrs["refresh"] = str(refresh)
        attrs["access"] = str(refresh.access_token)

        return attrs


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

        # Check if user is admin (role == admin, is_superuser, or is_staff)
        is_admin = (
            user.role == "admin" 
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