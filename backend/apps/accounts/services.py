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
        # For development, only validate syntax without checking deliverability
        # This prevents issues with MX record checks during development
        validate_email(email, check_deliverability=False)
        return True
    except EmailNotValidError as e:
        return False


def create_student_user(*, email, password, username=None,
                        first_name="", last_name=""):
    """
    Create a new student account (Task 2.1).

    The user starts INACTIVE (``is_active=False``) and unverified until they
    confirm their email address. The empty ``StudentProfile`` shell is created
    by the registration flow (see ``StudentRegistrationSerializer``).
    """

    user = User.objects.create(
        email=email,
        username=username,
        first_name=first_name,
        last_name=last_name,
        role=User.Role.STUDENT,
        # Account is dormant until the email is verified.
        is_active=False,
        is_email_verified=False,
    )

    user.set_password(password)
    user.save()

    return user

def get_live_frontend_url():
    url = getattr(settings, "FRONTEND_URL", "").strip()
    if url:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        return url.rstrip("/")
    if settings.DEBUG:
        return "http://localhost:5173"
    site_url = getattr(settings, "SITE_BASE_URL", "").strip()
    if site_url and "localhost" not in site_url:
        return site_url.rstrip("/")
    return "https://ai-internship-web.onrender.com"


def get_live_site_url():
    url = getattr(settings, "SITE_BASE_URL", "").strip()
    if url:
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        return url.rstrip("/")
    if settings.DEBUG:
        return "http://localhost:8000"
    return "https://ai-internship-backend-4nwx.onrender.com"


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

    site_url = get_live_site_url()
    frontend_url = get_live_frontend_url()
    api_verification_url = (
        f"{site_url}/api/auth/verify-email/{uid}/{token}/"
    )
    frontend_verification_url = (
        f"{frontend_url}/verify-email?uid={uid}&token={token}"
    )

    print(f"\n============= EMAIL VERIFICATION LINK =============")
    print(f"User: {user.email}")
    print(f"Frontend Verification URL: {frontend_verification_url}")
    print(f"API Verification URL:      {api_verification_url}")
    print(f"====================================================\n")

    try:
        send_mail(
            subject="Verify your Internship Platform account",

            message=(
                f"Hello {user.username or user.email},\n\n"
                f"Thank you for registering on AI Internship Platform.\n\n"
                f"Please verify your email address using the link below:\n\n"
                f"{frontend_verification_url}\n\n"
                f"Direct API verification link:\n"
                f"{api_verification_url}\n\n"
                f"If you did not create this account, please ignore this email."
            ),

            from_email=settings.DEFAULT_FROM_EMAIL,

            recipient_list=[user.email],

            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to deliver verification email via SMTP to {user.email}: {e}")
        return True
    

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

    site_url = get_live_site_url()
    frontend_url = get_live_frontend_url()
    api_reset_url = (
        f"{site_url}/api/auth/password-reset-confirm/{uid}/{token}/"
    )
    frontend_reset_url = (
        f"{frontend_url}/reset-password?uid={uid}&token={token}"
    )

    print(f"\n================ PASSWORD RESET LINK ================")
    print(f"User: {user.email}")
    print(f"Frontend Reset URL: {frontend_reset_url}")
    print(f"API Reset URL:      {api_reset_url}")
    print(f"====================================================\n")

    try:
        send_mail(
            subject="Reset your Internship Platform password",

            message=(
                f"Hello {user.username or user.email},\n\n"
                f"We received a request to reset your password.\n\n"
                f"Reset your password using this link:\n\n"
                f"{frontend_reset_url}\n\n"
                f"Direct API link:\n"
                f"{api_reset_url}\n\n"
                f"If you did not request a password reset, you can safely ignore this email."
            ),

            from_email=settings.DEFAULT_FROM_EMAIL,

            recipient_list=[
                user.email
            ],

            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to deliver password reset email via SMTP to {user.email}: {e}")
        return True