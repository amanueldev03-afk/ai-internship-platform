from django.urls import path

from .views import (
    AdminLoginView,
    StudentLoginView,
    LogoutView,
    CurrentUserView,
    EmailVerificationView,
    ResendVerificationView,
    ForgotPasswordView,
    ResetPasswordView,
    ChangePasswordView,
)

urlpatterns = [
    path(
        "admin/login/",
        AdminLoginView.as_view(),
        name="admin-login",
    ),
    path(
        "student/login/",
        StudentLoginView.as_view(),
        name="student-login",
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
        "verify-email/",
        EmailVerificationView.as_view(),
        name="verify-email",
    ),
    path(
        "resend-verification/",
        ResendVerificationView.as_view(),
        name="resend-verification",
    ),
    path(
        "forgot-password/",
        ForgotPasswordView.as_view(),
        name="forgot-password",
    ),
    path(
        "reset-password/",
        ResetPasswordView.as_view(),
        name="reset-password",
    ),
    path(
        "change-password/",
        ChangePasswordView.as_view(),
        name="change-password",
    ),
]