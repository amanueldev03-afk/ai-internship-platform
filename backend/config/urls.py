from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenRefreshView
from apps.accounts.views import (
    StudentRegistrationView,
    EmailVerificationLinkView,
    LoginView,
    PasswordResetView,
    PasswordResetConfirmView,
)


def health_check(request):
    """Lightweight endpoint — proves the backend is reachable from the frontend."""
    return JsonResponse({"status": "OK"})


urlpatterns = [
    path("admin/", admin.site.urls),
    # Health check — used by frontend to verify backend connectivity
    path("api/health/", health_check, name="health-check"),
    # API Documentation (kept public — override the global IsAuthenticated)
    path(
        "api/schema/",
        SpectacularAPIView.as_view(permission_classes=[AllowAny]),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema", permission_classes=[AllowAny]),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema", permission_classes=[AllowAny]),
        name="redoc",
    ),
    path(
        "api/accounts/", 
        include("apps.accounts.urls")
        ),
    # Phase 2 Task 2.1 — canonical auth registration endpoint
    path(
        "api/auth/register/",
        StudentRegistrationView.as_view(),
        name="auth-register",
    ),
    # Phase 2 Task 2.3 — unified login (JWT, role claim, Figure 5.1)
    path(
        "api/auth/login/",
        LoginView.as_view(),
        name="auth-login",
    ),
    # Phase 2 Task 2.4 — token refresh (public by SimpleJWT permission_classes)
    path(
        "api/auth/refresh/",
        TokenRefreshView.as_view(),
        name="auth-token-refresh",
    ),
    # Phase 2 Task 2.5 — password reset (request + confirm with path token)
    path(
        "api/auth/password-reset/",
        PasswordResetView.as_view(),
        name="auth-password-reset",
    ),
    path(
        "api/auth/password-reset-confirm/<str:uid>/<str:token>/",
        PasswordResetConfirmView.as_view(),
        name="auth-password-reset-confirm",
    ),
    # Phase 2 Task 2.2 — canonical email verification link (single-use)
    path(
        "api/auth/verify-email/<str:uid>/<str:token>/",
        EmailVerificationLinkView.as_view(),
        name="auth-verify-email-link",
    ),
    path(
        "accounts/",
        include("allauth.urls")
         ),
    path(
        "api/profile/",
        include("apps.students.urls"),
    ),
    path(
        "api/students/",
        include("apps.students.urls"),
    ),
    path(
        "api/internships/",
        include("apps.internships.urls"),
    ),
    path(
        "api/recommendations/",
        include("apps.recommendations.urls"),
    ),
    path(
        "api/companies/",
        include("apps.companies.urls"),
    ),
    path(
        "api/applications/",
        include("apps.applications.urls"),
    ),
    path(
        "api/notifications/",
        include("apps.notifications.urls"),
    ),
    path(
        "api/analytics/",
        include("apps.analytics.urls"),
    ),
    path(
        "api/data-sources/",
        include("apps.data_sources.urls"),
    ),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)