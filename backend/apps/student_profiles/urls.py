from django.urls import path

from .views import (
    StudentProfileView,
    StudentSkillsAddView,
    StudentCVUploadView,
    CVStatusView,
    CVStatusLatestView,
)

urlpatterns = [
    # ----------------------------------------------------------------
    # Profile — GET (retrieve) / PUT / PATCH (update + optional CV)
    # POST is intentionally removed: always update, never create separately.
    # ----------------------------------------------------------------
    path(
        "",
        StudentProfileView.as_view(),
        name="student-profile",
    ),

    # ----------------------------------------------------------------
    # Skills — add by skill IDs
    # ----------------------------------------------------------------
    path(
        "skills/add/",
        StudentSkillsAddView.as_view(),
        name="student-skills-add",
    ),

    # ----------------------------------------------------------------
    # CV — dedicated upload endpoint (file only, no profile fields)
    # ----------------------------------------------------------------
    path(
        "cv/upload/",
        StudentCVUploadView.as_view(),
        name="student-cv-upload",
    ),

    # ----------------------------------------------------------------
    # CV status — latest / by ID
    # ----------------------------------------------------------------
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
