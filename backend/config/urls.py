from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path(
        "admin/", 
        admin.site.urls
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
        include("apps.student_profiles.urls"),
    ),
]

urlpatterns += static(
    settings.MEDIA_URL,
    document_root=settings.MEDIA_ROOT,
)