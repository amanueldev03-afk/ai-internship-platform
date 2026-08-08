from django.contrib.auth import get_user_model
from django.conf import settings
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import default_token_generator
from email_validator import validate_email, EmailNotValidError

from .tokens import email_verification_token

User = get_user_model()


def validate_email_address(email):
    """
    Validate that the email is properly formatted and has a real domain.
    Checks syntax and MX records to ensure the email domain can receive emails.
    """
    try:
        # Validate syntax and check MX records for real email domain
        validate_email(email, check_deliverability=True)
        return True
    except EmailNotValidError as e:
        return False


def create_student_user(*, email, username, password):
    """
    Create a new student account.
    """

    user = User.objects.create(
        email=email,
        username=username,
        role=User.Role.STUDENT,
        is_active=True,
        is_email_verified=False,
    )

    user.set_password(password)
    user.save()

    return user

def send_verification_email(user):
    """
    Send a real email verification link.
    """

    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    token = email_verification_token.make_token(
        user
    )

    verification_url = (
        f"http://localhost:3000/verify-email/"
        f"{uid}/{token}/"
    )

    try:
        send_mail(
            subject="Verify your Internship Platform account",

            message=(
                f"Hello {user.username},\n\n"
                f"Thank you for registering.\n\n"
                f"Please verify your email address "
                f"using the link below:\n\n"
                f"{verification_url}\n\n"
                f"If you did not create this account, "
                f"please ignore this email."
            ),

            from_email=settings.DEFAULT_FROM_EMAIL,

            recipient_list=[user.email],

            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send verification email to {user.email}: {e}")
        return False
    

def send_password_reset_email(user):
    """
    Send a password reset email.
    """

    uid = urlsafe_base64_encode(
        force_bytes(user.pk)
    )

    token = default_token_generator.make_token(
        user
    )

    reset_url = (
        f"http://localhost:3000/reset-password/"
        f"{uid}/{token}/"
    )

    send_mail(
        subject="Reset your Internship Platform password",

        message=(
            f"Hello {user.username},\n\n"
            f"We received a request to reset "
            f"your password.\n\n"
            f"Reset your password using this link:\n\n"
            f"{reset_url}\n\n"
            f"If you did not request a password reset, "
            f"you can safely ignore this email."
        ),

        from_email=settings.DEFAULT_FROM_EMAIL,

        recipient_list=[
            user.email
        ],

        fail_silently=False,
    )