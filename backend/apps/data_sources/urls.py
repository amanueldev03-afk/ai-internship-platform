from django.urls import path

from .views import DataSourceSyncNowView

app_name = "data_sources"

# Admin endpoints under ``api/admin/data-sources/`` (mounted in config/urls.py).
urlpatterns = [
    path(
        "<int:pk>/sync-now/",
        DataSourceSyncNowView.as_view(),
        name="data-source-sync-now",
    ),
]
