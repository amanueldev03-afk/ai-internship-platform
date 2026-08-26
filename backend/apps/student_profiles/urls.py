from django.urls import path
from .views import (
    StudentProfileView,
    StudentSkillsAddView,
    StudentPreferencesView,
    StudentCVUploadView,
    CVStatusView,
    CVStatusLatestView,
)

urlpatterns = [
    path(
        "",
        StudentProfileView.as_view(),
        name="student-profile",
    ),
    path(
        "skills/add/",
        StudentSkillsAddView.as_view(),
        name="student-skills-add",
    ),
    path(
        "preferences/",
        StudentPreferencesView.as_view(),
        name="student-preferences",
    ),
    path(
        "cv/upload/",
        StudentCVUploadView.as_view(),
        name="student-cv-upload",
    ),
    path(
        "cv/status/",
        CVStatusLatestView.as_view(),
        name="cv-status-latest",
    ),
    path(
        "cv/<int:cv_id>/status/",
        CVStatusView.as_view(),
        name="cv-status",
    ),
]
