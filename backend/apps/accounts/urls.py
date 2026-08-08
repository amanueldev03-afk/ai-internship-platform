from django.urls import path

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)
from .views import CustomTokenObtainPairView

from .views import (
    LoginView,
    StudentRegistrationView,
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
        "register/",
        StudentRegistrationView.as_view(),
        name="student-register",
    ),
    path(
        "login/",
        LoginView.as_view(),
        name="login",
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
    "token/",
    CustomTokenObtainPairView.as_view(),
    name="token_obtain_pair",
),

path(
    "token/refresh/",
    TokenRefreshView.as_view(),
    name="token_refresh",
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