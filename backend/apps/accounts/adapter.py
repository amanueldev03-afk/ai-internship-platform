from django.conf import settings
from urllib.parse import urlencode
from allauth.account.adapter import DefaultAccountAdapter
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from rest_framework_simplejwt.tokens import RefreshToken


def build_oauth_callback_url(user):
    """Build the frontend callback URL with fresh JWT tokens for ``user``."""
    from django.contrib.auth import get_user_model

    User = get_user_model()
    refresh = RefreshToken.for_user(user)
    refresh["role"] = user.role
    refresh["email"] = user.email

    base = getattr(
        settings,
        "FRONTEND_OAUTH_CALLBACK_URL",
        "http://localhost:5173/auth/callback",
    )
    query = urlencode(
        {
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "email": user.email,
            "role": user.role,
        }
    )
    return f"{base.rstrip('/')}?{query}"


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    """
    Handles the social (Google) signup flow.

    Google verifies the email at the OAuth consent level, so accounts
    created via the social flow are immediately active and verified.
    The user's role defaults to ``student``.
    """

    def pre_social_login(self, request, sociallogin):
        return None

    def get_connect_redirect_url(self, request, socialaccount):
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            return build_oauth_callback_url(user)
        return super().get_connect_redirect_url(request, socialaccount)

    def save_user(self, request, sociallogin, form=None):
        user = super().save_user(request, sociallogin, form=form)

        user.is_email_verified = True
        user.is_active = True

        from django.contrib.auth import get_user_model

        User = get_user_model()
        if getattr(user, "role", None) in (None, ""):
            user.role = User.Role.STUDENT

        user.save()
        return user


class CustomAccountAdapter(DefaultAccountAdapter):
    """
    Redirects allauth logins (including Google OAuth) to the SPA callback
    route, swallowing JWT access/refresh tokens in the query string so a
    stateless frontend authenticates without relying on the session cookie.
    """

    def get_login_redirect_url(self, request):
        user = getattr(request, "user", None)
        if user is not None and user.is_authenticated:
            return build_oauth_callback_url(user)
        return super().get_login_redirect_url(request)
