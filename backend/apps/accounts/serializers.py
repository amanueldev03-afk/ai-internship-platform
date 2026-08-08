from django.contrib.auth import get_user_model
from rest_framework import serializers
from .services import (
    create_student_user,
    send_verification_email,
    send_password_reset_email,
    validate_email_address,
)
from django.contrib.auth import authenticate
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
    Serializer for student registration.
    """

    password = serializers.CharField(
    write_only=True,
)

    password_confirm = serializers.CharField(
        write_only=True,
    )

    class Meta:
        model = User

        fields = (
            "email",
            "username",
            "password",
            "password_confirm",
        )

    def validate(self, attrs):

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

        validated_data.pop("password_confirm")

        user = create_student_user(
            email=validated_data["email"],
            username=validated_data["username"],
            password=validated_data["password"],
        )

        email_sent = send_verification_email(user)
        
        if not email_sent:
            # Log warning but don't fail registration
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Verification email failed to send to {user.email}")

        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    """

    email = serializers.EmailField()

    password = serializers.CharField(
        write_only=True,
    )

    def validate(self, attrs):

        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            username=email,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                {
                    "detail": "Invalid email or password."
                }
            )

        if not user.is_active:
            raise serializers.ValidationError(
                {
                    "detail": "Your account is inactive."
                }
            )

        attrs["user"] = user

        return attrs

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the authenticated user.
    """

    class Meta:
        model = User

        fields = (
            "id",
            "email",
            "username",
            "role",
            "first_name",
            "last_name",
            "date_joined",
        )

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

        user.save(
            update_fields=["is_email_verified"]
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

        if not user.is_active:
            raise serializers.ValidationError(
                {
                    "email": "This account is inactive."
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