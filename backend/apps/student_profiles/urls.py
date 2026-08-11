from django.urls import path

from .views import (
    StudentProfileView,
    StudentCVView,
)


urlpatterns = [
    path(
        "",
        StudentProfileView.as_view(),
        name="student-profile",
    ),

    path(
        "cv/",
        StudentCVView.as_view(),
        name="student-cv",
    ),
]