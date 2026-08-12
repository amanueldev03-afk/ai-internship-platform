from django.urls import path

from .views import (
    InternshipListView,
    InternshipDetailView,
    AdminInternshipListCreateView,
    AdminInternshipDetailView,
    LatestInternshipListView,
)


urlpatterns = [
    path(
        "",
        InternshipListView.as_view(),
        name="internship-list",
    ),

    path(
        "<int:pk>/",
        InternshipDetailView.as_view(),
        name="internship-detail",
    ),
    path(
        "admin/",
        AdminInternshipListCreateView.as_view(),
        name="admin-internship-list-create",
    ),

    path(
        "admin/<int:pk>/",
        AdminInternshipDetailView.as_view(),
        name="admin-internship-detail",
    ),
    path(
        "latest/",
        LatestInternshipListView.as_view(),
        name="latest-internships",
    ),
]