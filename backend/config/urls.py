from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView


def health_check(request):
    """Lightweight endpoint — proves the backend is reachable from the frontend."""
    return JsonResponse({"status": "OK"})


urlpatterns = [
    path("admin/", admin.site.urls),
    # Health check — used by frontend to verify backend connectivity
    path("api/health/", health_check, name="health-check"),
    # API Documentation
    path(
        "api/schema/",
        SpectacularAPIView.as_view(),
        name="schema",
    ),
    path(
        "api/docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    path(
        "api/redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
    path(
        "api/accounts/", 
        include("apps.accounts.urls")
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