from django.urls import path
from apps.uil_profiles.views import (
    ResumeUploadView,
    ResumeStatusView,
    ResumeConfirmView,
    DeanStudentListView,
    DeanVerifyStudentView,
    StudentForwardToUILView,
    DeanUnsealScoreSheetView,
    DeanScheduleDefenseView,
    DeanSubmitFinalGradeView,
)

app_name = "uil_profiles"

urlpatterns = [
    path("resume/", ResumeUploadView.as_view(), name="resume-upload"),
    path("resume/status/<int:pk>/", ResumeStatusView.as_view(), name="resume-status"),
    path("resume/confirm/<int:pk>/", ResumeConfirmView.as_view(), name="resume-confirm"),
    path("resume/<int:pk>/confirm/", ResumeConfirmView.as_view(), name="resume-confirm-alt"),

    # Track 1 Department Dean & Student Document Forwarding Endpoints
    path("dean/students/", DeanStudentListView.as_view(), name="dean-students"),
    path("dean/verify-student/<str:pk>/", DeanVerifyStudentView.as_view(), name="dean-verify-student"),
    path("student/forward-to-uil/", StudentForwardToUILView.as_view(), name="student-forward-to-uil"),
    path("dean/unseal-score-sheet/<uuid:team_id>/", DeanUnsealScoreSheetView.as_view(), name="dean-unseal-score-sheet"),
    path("dean/schedule-defense/<uuid:team_id>/", DeanScheduleDefenseView.as_view(), name="dean-schedule-defense"),
    path("dean/submit-final-grade/<uuid:team_id>/", DeanSubmitFinalGradeView.as_view(), name="dean-submit-final-grade"),
]
