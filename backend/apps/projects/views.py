import logging
from rest_framework import generics, permissions, status, exceptions
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from apps.accounts.permissions import IsStudent, IsAcademicAdvisor, IsCompanyMentor
from .models import WeeklyLogbook, LogbookAlert, ProjectTeam, TeamMember, ProjectTeamMessage
from .serializers import (
    WeeklyLogbookSerializer,
    WeeklyLogbookApprovalSerializer,
    LogbookAlertSerializer,
    ProjectTeamSerializer,
    TeamMemberSerializer,
    SRSDocumentUploadSerializer,
    SRSAdvisorReviewSerializer,
    InHouseCohortSerializer,
    ProjectTeamMessageSerializer,
)
from .tasks import verify_logbook_task

logger = logging.getLogger(__name__)
User = get_user_model()


class WeeklyLogbookListCreateView(generics.ListCreateAPIView):
    """
    POST: Submit a weekly logbook (student role). Enqueues asynchronous plagiarism verification.
          Enforces the Track 1 SRS Documentation Gate: If student belongs to an in-house project
          team, srs_status must be 'APPROVED' before coding-phase actions and weekly log submissions unlock.
    GET: List logbooks relevant to the requesting user (student, advisor, mentor, admin).
    """
    serializer_class = WeeklyLogbookSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        if role == User.Role.STUDENT:
            return WeeklyLogbook.objects.filter(student=user)
        elif role == User.Role.ADVISOR:
            # Advisors view their supervised logbooks or all unassigned student logbooks
            supervised = WeeklyLogbook.objects.filter(academic_advisor=user)
            if supervised.exists():
                return supervised
            return WeeklyLogbook.objects.all()
        elif role == User.Role.COMPANY_MENTOR:
            # Mentors view their mentored logbooks
            mentored = WeeklyLogbook.objects.filter(company_mentor=user)
            if mentored.exists():
                return mentored
            return WeeklyLogbook.objects.all()
        elif user.is_staff or role == User.Role.ADMIN:
            return WeeklyLogbook.objects.all()

        return WeeklyLogbook.objects.filter(student=user)

    def create(self, request, *args, **kwargs):
        user = request.user

        # Track 1 Documentation Gate: Check if student belongs to an In-House ProjectTeam
        profile = getattr(user, "student_profile", None)
        if not profile:
            from apps.accounts.models import StudentProfile
            profile = StudentProfile.objects.filter(user=user).first()

        associated_team = None
        if profile:
            membership = TeamMember.objects.filter(student=profile).select_related("team").first()
            if membership and membership.team:
                associated_team = membership.team

        # Also support explicit team in payload if specified
        target_team_id = request.data.get("project_team") or request.data.get("team_id")
        if target_team_id:
            try:
                associated_team = ProjectTeam.objects.get(id=target_team_id)
            except (ProjectTeam.DoesNotExist, ValueError):
                pass

        if associated_team and associated_team.srs_status != ProjectTeam.SRSStatus.APPROVED:
            return Response(
                {
                    "detail": "Documentation (SRS) must be approved before coding-phase actions (Git commit logging, daily tasks, weekly sprint submissions) are unlocked.",
                    "srs_status": associated_team.srs_status,
                    "srs_feedback": associated_team.srs_feedback,
                    "srs_revision_deadline": associated_team.srs_revision_deadline,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer, project_team=associated_team)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer, project_team=None):
        if project_team and "project_team" not in serializer.validated_data:
            logbook = serializer.save(student=self.request.user, project_team=project_team)
        else:
            logbook = serializer.save(student=self.request.user)
        logger.info(f"Logbook {logbook.id} submitted by {self.request.user.email} for week {logbook.week_number}")
        # Enqueue async verification task
        try:
            verify_logbook_task.delay(str(logbook.id))
        except Exception as exc:
            # In test or non-celery environment, fallback if needed or log
            logger.warning(f"Could not enqueue verify_logbook_task via Celery: {exc}")


class WeeklyLogbookDetailView(generics.RetrieveAPIView):
    """
    GET: Retrieve details of a weekly logbook including similarity score and review status.
    """
    queryset = WeeklyLogbook.objects.all()
    serializer_class = WeeklyLogbookSerializer
    permission_classes = [permissions.IsAuthenticated]


class WeeklyLogbookAdvisorApprovalView(generics.UpdateAPIView):
    """
    PATCH: Academic advisor approval and feedback submission.
    """
    queryset = WeeklyLogbook.objects.all()
    serializer_class = WeeklyLogbookApprovalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        logbook = self.get_object()
        serializer = self.get_serializer(logbook, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        logger.info(
            f"Logbook {logbook.id} updated by {request.user.email}: "
            f"approved={logbook.advisor_approved}"
        )
        full_serializer = WeeklyLogbookSerializer(logbook)
        return Response(full_serializer.data, status=status.HTTP_200_OK)


class LogbookAlertListView(generics.ListAPIView):
    """
    GET: List in-app alerts dispatched to the authenticated supervisor (Advisor or Mentor).
    """
    serializer_class = LogbookAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LogbookAlert.objects.filter(recipient=self.request.user)


class LogbookAlertMarkReadView(generics.UpdateAPIView):
    """
    PATCH: Mark an in-app alert as read.
    """
    queryset = LogbookAlert.objects.all()
    serializer_class = LogbookAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, *args, **kwargs):
        alert = self.get_object()
        if alert.recipient != request.user and not request.user.is_staff:
            return Response({"detail": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)
        alert.is_read = True
        alert.save(update_fields=["is_read", "updated_at"])
        return Response(self.get_serializer(alert).data, status=status.HTTP_200_OK)


class ProjectTeamDetailView(generics.RetrieveAPIView):
    """
    GET: Retrieve details of a project squad including members and SRS status.
    """
    queryset = ProjectTeam.objects.all()
    serializer_class = ProjectTeamSerializer
    permission_classes = [permissions.IsAuthenticated]


class SRSDocumentUploadView(generics.GenericAPIView):
    """
    POST: Upload Software Requirements Specification (SRS) PDF for a project squad.
    Transitions SRS status to 'SUBMITTED'.
    """
    queryset = ProjectTeam.objects.all()
    serializer_class = SRSDocumentUploadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        team = self.get_object()
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        team.srs_document = serializer.validated_data["srs_document"]
        team.srs_status = ProjectTeam.SRSStatus.SUBMITTED
        team.save(update_fields=["srs_document", "srs_status", "updated_at"])
        logger.info(f"Team {team.id} uploaded SRS document (status=SUBMITTED)")

        return Response(
            ProjectTeamSerializer(team).data,
            status=status.HTTP_200_OK,
        )


class SRSAdvisorReviewView(generics.GenericAPIView):
    """
    PATCH / POST: Advisor review for the uploaded SRS document.
    - If 'APPROVED': unlocks sprint board and coding-phase actions.
    - If 'REJECTED': opens a 2-week revision deadline with advisor feedback notes.
    """
    queryset = ProjectTeam.objects.all()
    serializer_class = SRSAdvisorReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        return self._handle_review(request)

    def patch(self, request, *args, **kwargs):
        return self._handle_review(request)

    def _handle_review(self, request):
        user = request.user
        role = getattr(user, "role", None)
        team = self.get_object()

        # Permission check: must be advisor, UIL officer, admin, or staff
        if role not in [User.Role.ADVISOR, User.Role.ADMIN, User.Role.UIL_OFFICER] and not user.is_staff:
            if team.assigned_advisor != user:
                return Response(
                    {"detail": "Only academic advisors or administrators can evaluate SRS documents."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        new_status = serializer.validated_data["srs_status"]
        feedback = serializer.validated_data.get("srs_feedback", "")

        if new_status == ProjectTeam.SRSStatus.APPROVED:
            team.approve_srs(feedback=feedback)
            logger.info(f"Team {team.id} SRS APPROVED by {user.email}")
        elif new_status == ProjectTeam.SRSStatus.REJECTED:
            team.reject_srs(feedback=feedback, revision_days=14)
            logger.info(f"Team {team.id} SRS REJECTED by {user.email}. 2-week revision deadline set.")

        # Post automatic advisory feedback message to squad channel
        if feedback:
            try:
                ProjectTeamMessage.objects.create(
                    team=team,
                    sender=user,
                    message=f"SRS Review Decision: {new_status}.\n\nAdvisor Notes: {feedback}",
                    message_type=ProjectTeamMessage.MessageType.SRS_FEEDBACK,
                )
            except Exception as e:
                logger.warning(f"Could not auto-post SRS review message: {e}")

        return Response(
            ProjectTeamSerializer(team).data,
            status=status.HTTP_200_OK,
        )


class ProjectTeamSprintBoardView(generics.RetrieveAPIView):
    """
    GET: Retrieve the implementation sprint board for a project squad.
    Enforces Documentation Gate: returns HTTP 403 Forbidden if srs_status != 'APPROVED'.
    """
    queryset = ProjectTeam.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        team = self.get_object()
        if team.srs_status != ProjectTeam.SRSStatus.APPROVED:
            return Response(
                {
                    "detail": "Implementation sprint board is locked until Documentation (SRS) is approved by your advisor.",
                    "unlocked": False,
                    "srs_status": team.srs_status,
                    "srs_feedback": team.srs_feedback,
                    "srs_revision_deadline": team.srs_revision_deadline,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        return Response(
            {
                "unlocked": True,
                "team_id": str(team.id),
                "team_name": team.team_name,
                "project_title": team.project_title,
                "srs_status": team.srs_status,
                "channels_active": team.channels_active,
                "members": TeamMemberSerializer(team.members.all(), many=True).data,
            },
            status=status.HTTP_200_OK,
        )


class InHouseCohortBalanceView(generics.GenericAPIView):
    """
    POST: Formulate balanced squads for a Track 1 in-house cohort.
    Triggered by UIL Head Officer or Admin.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, cohort_id, *args, **kwargs):
        user = request.user
        role = getattr(user, "role", None)
        if role not in [User.Role.UIL_OFFICER, User.Role.ADMIN] and not user.is_staff:
            return Response(
                {"detail": "Only UIL Officers or Administrators can trigger team formulation."},
                status=status.HTTP_403_FORBIDDEN,
            )

        from .services.balancer import balance_inhouse_teams
        squad_size = int(request.data.get("squad_size", 5))

        try:
            teams = balance_inhouse_teams(str(cohort_id), squad_size=squad_size)
            return Response(
                ProjectTeamSerializer(teams, many=True).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class ProjectTeamListView(generics.ListAPIView):
    """
    GET: List project squads.
    - If Academic Advisor: lists assigned squads (or all if none specifically assigned).
    - If Student: lists the squad the student is a member of.
    - If Company Mentor: lists squads mentored by the user.
    - If UIL Officer, Dean, or Admin: lists all squads.
    Supports query parameters: ?cohort_id=... and ?srs_status=...
    """
    serializer_class = ProjectTeamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_upper = str(getattr(user, "role", "")).upper()
        qs = ProjectTeam.objects.select_related("cohort", "assigned_advisor").prefetch_related("members", "members__student", "members__student__user").all()

        cohort_id = self.request.query_params.get("cohort_id")
        if cohort_id:
            qs = qs.filter(cohort_id=cohort_id)

        srs_status = self.request.query_params.get("srs_status")
        if srs_status:
            qs = qs.filter(srs_status__iexact=srs_status)

        if role_upper == User.Role.ADVISOR:
            advisor_teams = qs.filter(assigned_advisor=user)
            if advisor_teams.exists():
                return advisor_teams
            return qs
        elif role_upper == User.Role.STUDENT:
            return qs.filter(members__student__user=user).distinct()
        elif role_upper == User.Role.COMPANY_MENTOR:
            mentor_teams = qs.filter(company_mentor=user)
            if mentor_teams.exists():
                return mentor_teams
            return qs

        return qs


class InHouseCohortListCreateView(generics.ListCreateAPIView):
    """
    GET: List all Track 1 In-House Software House cohorts.
    POST: Create a new In-House cohort (UIL Officer, Dean, or Admin).
    """
    serializer_class = InHouseCohortSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from apps.universities.models import InHouseCohort
        return InHouseCohort.objects.all().order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        role_upper = str(getattr(user, "role", "")).upper()
        if role_upper not in (User.Role.UIL_OFFICER, User.Role.DEPT_DEAN, User.Role.ADMIN) and not user.is_staff and not user.is_superuser:
            raise exceptions.PermissionDenied("Only UIL Officers, Deans, or Administrators can create cohorts.")
        serializer.save()


class ProjectTeamMessageListCreateView(generics.ListCreateAPIView):
    """
    GET: List communication messages for a team in chronological order.
    POST: Send a message to the team's communication channel.
    """
    serializer_class = ProjectTeamMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        team_id = self.kwargs.get("team_id")
        return ProjectTeamMessage.objects.filter(team_id=team_id).select_related("sender").order_by("created_at")

    def perform_create(self, serializer):
        team_id = self.kwargs.get("team_id")
        team = generics.get_object_or_404(ProjectTeam, id=team_id)
        serializer.save(team=team, sender=self.request.user)


class MyTeamChannelView(generics.GenericAPIView):
    """
    GET: Resolves the student's active squad channel or advisor's supervised squads
    and returns the team info and recent messages.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        role_upper = str(getattr(user, "role", "")).upper()

        team = None
        if role_upper == User.Role.STUDENT:
            membership = TeamMember.objects.filter(student__user=user).select_related("team", "team__assigned_advisor").first()
            if membership and membership.team:
                team = membership.team
        elif role_upper == User.Role.ADVISOR:
            team = ProjectTeam.objects.filter(assigned_advisor=user).first()
            if not team:
                team = ProjectTeam.objects.first()
        else:
            team = ProjectTeam.objects.first()

        if not team:
            return Response(
                {"team": None, "messages": []},
                status=status.HTTP_200_OK,
            )

        messages = team.messages.select_related("sender").order_by("created_at")
        return Response(
            {
                "team": ProjectTeamSerializer(team).data,
                "messages": ProjectTeamMessageSerializer(messages, many=True).data,
            },
            status=status.HTTP_200_OK,
        )


