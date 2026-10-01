from django.urls import path
from .views import (
    WeeklyLogbookListCreateView,
    WeeklyLogbookDetailView,
    WeeklyLogbookAdvisorApprovalView,
    LogbookAlertListView,
    LogbookAlertMarkReadView,
    ProjectTeamDetailView,
    SRSDocumentUploadView,
    SRSAdvisorReviewView,
    ProjectTeamSprintBoardView,
    InHouseCohortBalanceView,
    ProjectTeamListView,
    InHouseCohortListCreateView,
    ProjectTeamMessageListCreateView,
    MyTeamChannelView,
)

app_name = "projects"

urlpatterns = [
    path("logbooks/", WeeklyLogbookListCreateView.as_view(), name="logbook-list-create"),
    path("logbooks/<uuid:pk>/", WeeklyLogbookDetailView.as_view(), name="logbook-detail"),
    path("logbooks/<uuid:pk>/approve/", WeeklyLogbookAdvisorApprovalView.as_view(), name="logbook-approve"),
    path("alerts/", LogbookAlertListView.as_view(), name="alert-list"),
    path("alerts/<uuid:pk>/read/", LogbookAlertMarkReadView.as_view(), name="alert-mark-read"),
    path("teams/", ProjectTeamListView.as_view(), name="team-list"),
    path("teams/<uuid:pk>/", ProjectTeamDetailView.as_view(), name="team-detail"),
    path("teams/<uuid:pk>/srs/upload/", SRSDocumentUploadView.as_view(), name="team-srs-upload"),
    path("teams/<uuid:pk>/srs/review/", SRSAdvisorReviewView.as_view(), name="team-srs-review"),
    path("teams/<uuid:pk>/sprint-board/", ProjectTeamSprintBoardView.as_view(), name="team-sprint-board"),
    path("teams/<uuid:team_id>/messages/", ProjectTeamMessageListCreateView.as_view(), name="team-messages"),
    path("my-channel/", MyTeamChannelView.as_view(), name="my-team-channel"),
    path("cohorts/", InHouseCohortListCreateView.as_view(), name="cohort-list-create"),
    path("cohorts/<uuid:cohort_id>/balance/", InHouseCohortBalanceView.as_view(), name="cohort-balance"),
]
