from django.contrib.auth import get_user_model
from rest_framework import serializers
from .services import (
    create_student_user,
    send_verification_email,
    send_password_reset_email,
    validate_email_address,
)
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import get_user_model
from .tokens import email_verification_token
from django.utils.encoding import force_str
from django.contrib.auth.password_validation import validate_password

User = get_user_model()


class StudentRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for student registration (Task 2.1).

    Accepts ``full_name``, ``email``, ``password`` and optionally ``phone``.
    The account is created INACTIVE and only activated once the email is
    verified.
    """

    full_name = serializers.CharField(
        write_only=True,
        required=False,
    )

    password = serializers.CharField(
        write_only=True,
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    phone = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    username = serializers.CharField(
        write_only=True,
        required=False,
        allow_blank=True,
    )

    class Meta:
        model = User

        fields = (
            "full_name",
            "email",
            "username",
            "phone",
            "password",
            "password_confirm",
        )

    def validate(self, attrs):

        # Full name is required per Task 2.1 (`full_name`).
        full_name = attrs.get("full_name", "").strip()
        if not full_name:
            raise serializers.ValidationError(
                {
                    "full_name": "Full name is required."
                }
            )

        if attrs.get("password_confirm"):
            if attrs["password"] != attrs["password_confirm"]:
                raise serializers.ValidationError(
                    {
                        "password_confirm": "Passwords do not match."
                    }
                )

        validate_password(
            attrs["password"],
            user=User(
                email=attrs.get("email"),
                username=attrs.get("username"),
            ),
        )

        # Validate that the email is real and can receive emails
        if not validate_email_address(attrs["email"]):
            raise serializers.ValidationError(
                {
                    "email": "Please provide a valid email address with a real domain."
                }
            )

        return attrs

    def create(self, validated_data):

        from django.db import transaction
        from apps.students.models import StudentProfile

        validated_data.pop("password_confirm", None)

        full_name = validated_data.pop("full_name", "").strip()
        parts = full_name.split(maxsplit=1)
        first_name = parts[0] if parts else ""
        last_name = parts[1] if len(parts) > 1 else ""

        phone = validated_data.pop("phone", "")

        with transaction.atomic():
            user = create_student_user(
                email=validated_data["email"],
                username=validated_data.get("username") or None,
                password=validated_data["password"],
                first_name=first_name,
                last_name=last_name,
            )

            # Empty StudentProfile shell (Task 2.1 — completes during onboarding).
            StudentProfile.objects.create(
                user=user,
                phone=phone,
            )

        email_sent = send_verification_email(user)
        
        if not email_sent:
            # Log warning but don't fail registration
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Verification email failed to send to {user.email}")

        return user



class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the authenticated user.
    """
    profile_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "username",
            "role",
            "first_name",
            "last_name",
            "profile_photo",
            "profile_photo_url",
            "date_joined",
        )

    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            return obj.profile_photo.url
        return None


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    """
    Writable serializer for authenticated user profile updates
    (profile photo, name). Used by PATCH /api/accounts/me/.
    """

    class Meta:
        model = User

        fields = (
            "first_name",
            "last_name",
            "profile_photo",
        )

    def validate_profile_photo(self, value):
        """Validate profile photo file type and size."""
        if value:
            # Check file size (max 5MB)
            max_size = 5 * 1024 * 1024  # 5MB
            if value.size > max_size:
                raise serializers.ValidationError(
                    "Profile photo must be less than 5MB."
                )
            
            # Check file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
            if value.content_type not in allowed_types:
                raise serializers.ValidationError(
                    "Profile photo must be a JPEG, PNG, GIF, or WebP image."
                )
        return value

class LogoutSerializer(serializers.Serializer):
    """
    Logout by blacklisting the refresh token.
    """

    refresh = serializers.CharField()

    def validate(self, attrs):

        self.token = attrs["refresh"]

        return attrs

    def save(self, **kwargs):

        try:
            token = RefreshToken(self.token)

            token.blacklist()

        except Exception:
            raise serializers.ValidationError(
                {
                    "refresh": "Invalid or expired refresh token."
                }
            )

class EmailVerificationSerializer(serializers.Serializer):
    """
    Verify a user's email address.
    """

    uid = serializers.CharField()
    token = serializers.CharField()

    def validate(self, attrs):


        User = get_user_model()

        try:
            user_id = urlsafe_base64_decode(
                attrs["uid"]
            ).decode()

            user = User.objects.get(
                pk=user_id
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            raise serializers.ValidationError(
                {
                    "detail": "Invalid verification link."
                }
            )

        # Single-use enforcement (Task 2.2): a token that has already been
        # redeemed must not succeed again.
        if user.is_email_verified:
            raise serializers.ValidationError(
                {
                    "detail": "Email has already been verified."
                }
            )

        if not email_verification_token.check_token(
            user,
            attrs["token"],
        ):
            raise serializers.ValidationError(
                {
                    "detail": "Invalid or expired verification token."
                }
            )

        attrs["user"] = user

        return attrs

    def save(self, **kwargs):

        user = self.validated_data["user"]

        user.is_email_verified = True

        # Activate the account now that the email is confirmed (Task 2.1).
        user.is_active = True

        user.save(
            update_fields=["is_email_verified", "is_active"]
        )

        return user


class ResendVerificationSerializer(serializers.Serializer):
    """
    Resend the email verification link.
    """

    email = serializers.EmailField()

    def validate(self, attrs):

        email = attrs["email"]

        # Validate that the email is real and can receive emails
        if not validate_email_address(email):
            raise serializers.ValidationError(
                {
                    "email": "Please provide a valid email address with a real domain."
                }
            )

        try:
            user = User.objects.get(
                email=email
            )
        except User.DoesNotExist:
            raise serializers.ValidationError(
                {
                    "email": "No account found with this email."
                }
            )

        if user.is_email_verified:
            raise serializers.ValidationError(
                {
                    "email": "This email is already verified."
                }
            )

        attrs["user"] = user

        return attrs

    def save(self, **kwargs):

        user = self.validated_data["user"]

        send_verification_email(user)

        return user


class ForgotPasswordSerializer(serializers.Serializer):
    """
    Request a password reset email.
    """

    email = serializers.EmailField()

    def validate(self, attrs):

        email = attrs["email"]

        # Validate that the email is real and can receive emails
        if not validate_email_address(email):
            raise serializers.ValidationError(
                {
                    "email": "Please provide a valid email address with a real domain."
                }
            )

        try:
            user = User.objects.get(
                email=email
            )
        except User.DoesNotExist:
            user = None

        attrs["user"] = user

        return attrs

    def save(self, **kwargs):

        user = self.validated_data["user"]

        if user is not None:
            send_password_reset_email(user)

        return user


class ResetPasswordSerializer(serializers.Serializer):
    """
    Reset a user's password using a valid reset token.
    """

    uid = serializers.CharField()
    token = serializers.CharField()

    password = serializers.CharField(
        write_only=True
    )

    password_confirm = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {
                    "password_confirm":
                    "Passwords do not match."
                }
            )

        try:
            user_id = force_str(
                urlsafe_base64_decode(
                    attrs["uid"]
                )
            )

            user = User.objects.get(
                pk=user_id
            )

        except (
            TypeError,
            ValueError,
            OverflowError,
            User.DoesNotExist,
        ):
            raise serializers.ValidationError(
                {
                    "detail":
                    "Invalid password reset link."
                }
            )

        if not default_token_generator.check_token(
            user,
            attrs["token"],
        ):
            raise serializers.ValidationError(
                {
                    "detail":
                    "Invalid or expired password reset token."
                }
            )

        try:
            validate_password(
                attrs["password"],
                user=user,
            )
        except serializers.ValidationError as exc:
            raise serializers.ValidationError(
                {
                    "password": exc.messages
                }
            )

        attrs["user"] = user

        return attrs

    def save(self, **kwargs):

        user = self.validated_data["user"]

        user.set_password(
            self.validated_data["password"]
        )

        user.save(
            update_fields=["password"]
        )

        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    Change password for the authenticated user.
    """

    old_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True
    )

    new_password_confirm = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):

        user = self.context["request"].user

        # Check current password
        if not user.check_password(
            attrs["old_password"]
        ):
            raise serializers.ValidationError(
                {
                    "old_password":
                    "Current password is incorrect."
                }
            )

        # Check new passwords match
        if (
            attrs["new_password"]
            != attrs["new_password_confirm"]
        ):
            raise serializers.ValidationError(
                {
                    "new_password_confirm":
                    "New passwords do not match."
                }
            )

        # Prevent using the same password
        if user.check_password(
            attrs["new_password"]
        ):
            raise serializers.ValidationError(
                {
                    "new_password":
                    "New password must be different from the current password."
                }
            )

        # Django password validation
        validate_password(
            attrs["new_password"],
            user=user,
        )

        return attrs

    def save(self, **kwargs):

        user = self.context["request"].user

        user.set_password(
            self.validated_data["new_password"]
        )

        user.save(
            update_fields=["password"]
        )

        return user