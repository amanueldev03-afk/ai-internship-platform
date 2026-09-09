from django.urls import path

from .views import (
    AdminCompanyListCreateView,
    AdminCompanyDetailView,
)

app_name = "companies"

urlpatterns = [
    path(
        "",
        AdminCompanyListCreateView.as_view(),
        name="company-list-create",
    ),
    path(
        "<int:pk>/",
        AdminCompanyDetailView.as_view(),
        name="company-detail",
    ),
]