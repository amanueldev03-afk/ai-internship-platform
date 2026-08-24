from django.urls import path
from .views import (
    StudentProfileView,
    StudentCVUploadView,
)
 
urlpatterns = [
    path(
        "",
        StudentProfileView.as_view(),
        name="student-profile",
    ),
    path(
        "cv/upload/",
        StudentCVUploadView.as_view(),
        name="student-cv-upload",
    ),
]
