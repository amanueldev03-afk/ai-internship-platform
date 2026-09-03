from django.urls import path

from .views import (
    AdminStudentListView,
    AdminStudentDeactivateView,
    AdminStudentActivateView,
    AdminStudentActivityView,
)

app_name = "administration"

urlpatterns = [
    path(
        "",
        AdminStudentListView.as_view(),
        name="admin-student-list",
    ),
    path(
        "<int:pk>/deactivate/",
        AdminStudentDeactivateView.as_view(),
        name="admin-student-deactivate",
    ),
    path(
        "<int:pk>/activate/",
        AdminStudentActivateView.as_view(),
        name="admin-student-activate",
    ),
    path(
        "<int:pk>/activity/",
        AdminStudentActivityView.as_view(),
        name="admin-student-activity",
    ),
]
