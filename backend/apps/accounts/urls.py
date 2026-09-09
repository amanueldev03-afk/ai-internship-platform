from django.urls import path

from .views import (
    LogoutView,
    CurrentUserView,
    ResendVerificationView,
    ChangePasswordView,
    EmailVerificationLinkView,
    LegacyEmailVerificationView,
    LoginView,
    PasswordResetView,
)

urlpatterns = [
    # Backward-compatible aliases retained for existing clients.
    path("student/login/", LoginView.as_view(), name="legacy-student-login"),
    path(
        "verify-email/",
        LegacyEmailVerificationView.as_view(),
        name="legacy-verify-email",
    ),
    path("forgot-password/", PasswordResetView.as_view(),
         name="legacy-forgot-password"),
    path(
        "verify-email/<str:uid>/<str:token>/",
        EmailVerificationLinkView.as_view(),
        name="legacy-verify-email-link",
    ),
    path(
        "logout/",
        LogoutView.as_view(),
        name="logout",
    ),
    path(
        "me/",
        CurrentUserView.as_view(),
        name="current-user",
    ),
    path(
        "resend-verification/",
        ResendVerificationView.as_view(),
        name="resend-verification",
    ),
    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]
