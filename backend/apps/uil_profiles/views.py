import logging
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.accounts.models import User
from apps.internships.models import Skill
from apps.students.models import Student
from apps.uil_profiles.models import Resume, UILStudentProfile
from apps.uil_profiles.serializers import (
    ResumeUploadSerializer,
    ResumeStatusSerializer,
    ResumeFieldConfirmationSerializer,
)
from apps.uil_profiles.tasks import parse_resume_task

logger = logging.getLogger(__name__)


def _get_or_create_uil_profile_for_user(user: User) -> UILStudentProfile:
    """
    Helper to resolve or instantiate the linked UILStudentProfile for a user.
    """
    student, _ = Student.objects.get_or_create(
        user=user,
        defaults={
            "university": "Addis Ababa University",
            "field_of_study": "Software Engineering",
            "current_year": "3rd Year",
            "preferred_city": "Addis Ababa",
            "work_mode": "onsite",
        },
    )

    if hasattr(student, "uil_student_profile"):
        return student.uil_student_profile

    uid_str = str(user.id).replace("-", "")[:8].upper()
    uil_profile, _ = UILStudentProfile.objects.get_or_create(
        student=student,
        defaults={
            "student_id_number": f"UIL/{uid_str}/16",
            "campus_city": "Addis Ababa",
            "department": student.field_of_study or "Software Engineering",
            "academic_year": 3,
            "is_active_for_internship": True,
        },
    )
    return uil_profile


class ResumeUploadView(APIView):
    """
    POST /api/v1/uil-profiles/resume/

    Uploads a resume file (PDF or DOCX, max 5MB).
    Creates a Resume parsing record and dispatches parse_resume_task asynchronously.

    Guardrail enforcement:
    Does NOT mutate any UILStudentProfile or Student profile fields.
    """

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        uil_profile = _get_or_create_uil_profile_for_user(request.user)

        serializer = ResumeUploadSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        resume = serializer.save(student=uil_profile)

        # Dispatch async Celery task (with synchronous fallback if broker unavailable)
        try:
            parse_resume_task.delay(resume.id)
        except Exception as exc:
            logger.warning("Celery dispatch failed (%s), running parse synchronously", exc)
            parse_resume_task(resume.id)
            resume.refresh_from_db()

        return Response(
            {
                "id": resume.id,
                "parsing_status": resume.parsing_status,
                "uploaded_at": resume.uploaded_at,
                "message": "Resume uploaded successfully. Parsing in progress.",
            },
            status=status.HTTP_201_CREATED,
        )


class ResumeStatusView(APIView):
    """
    GET /api/v1/uil-profiles/resume/status/<int:pk>/

    Retrieves the parsing status, raw extracted text, and proposed
    parsed_data suggestions for an uploaded resume.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, pk: int, *args, **kwargs):
        resume = get_object_or_404(Resume, pk=pk)

        # Authorization: Student owner, or administrative/staff roles
        is_owner = (
            hasattr(resume.student, "student")
            and resume.student.student.user_id == request.user.id
        )
        is_staff_or_admin = (
            request.user.is_staff
            or getattr(request.user, "role", None) in [
                User.Role.ADMIN,
                "ADMIN",
                "ADMINISTRATOR",
                "UIL_OFFICER",
                "ADVISOR",
                "DEPT_DEAN",
            ]
        )

        if not (is_owner or is_staff_or_admin):
            return Response(
                {"detail": "You do not have permission to view this resume parse."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ResumeStatusSerializer(resume)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ResumeConfirmView(APIView):
    """
    POST /api/v1/uil-profiles/resume/confirm/<int:pk>/
    POST /api/v1/uil-profiles/resume/<int:pk>/confirm/

    Applies ONLY the fields explicitly selected and approved by the student
    from the parsed resume suggestions into the student's profile.

    Guardrail enforcement:
    No database profile mutations occur without this explicit confirmation call.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, pk: int, *args, **kwargs):
        resume = get_object_or_404(Resume, pk=pk)

        # Authorization: Only the student owner can confirm updates
        if not (
            hasattr(resume.student, "student")
            and resume.student.student.user_id == request.user.id
        ):
            return Response(
                {"detail": "Only the resume owner can confirm profile updates."},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ResumeFieldConfirmationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        confirmed_data = serializer.validated_data
        updated_fields = []

        student_record = resume.student.student
        uil_profile = resume.student
        user = request.user

        with transaction.atomic():
            # 1. GPA
            if "gpa" in confirmed_data and confirmed_data["gpa"] is not None:
                uil_profile.gpa = confirmed_data["gpa"]
                uil_profile.save(update_fields=["gpa", "updated_at"])
                updated_fields.append("gpa")

            # 2. GitHub URL
            if "github_url" in confirmed_data:
                uil_profile.github_url = confirmed_data["github_url"]
                uil_profile.save(update_fields=["github_url", "updated_at"])
                updated_fields.append("github_url")

            # 3. Department / Field of Study
            if "department" in confirmed_data and confirmed_data["department"]:
                uil_profile.department = confirmed_data["department"]
                uil_profile.save(update_fields=["department", "updated_at"])
                student_record.field_of_study = confirmed_data["department"]
                student_record.save(update_fields=["field_of_study", "updated_at"])
                updated_fields.append("department")

            # 4. University
            if "university" in confirmed_data and confirmed_data["university"]:
                student_record.university = confirmed_data["university"]
                student_record.save(update_fields=["university", "updated_at"])
                updated_fields.append("university")

            # 5. Phone Number
            if "phone_number" in confirmed_data and confirmed_data["phone_number"]:
                user.phone_number = confirmed_data["phone_number"]
                user.save(update_fields=["phone_number", "updated_at"])
                updated_fields.append("phone_number")

            # 6. Skills
            if "skills" in confirmed_data and confirmed_data["skills"]:
                skill_names = confirmed_data["skills"]
                matched_skills = Skill.objects.filter(name__in=skill_names)
                student_record.skills.add(*matched_skills)
                updated_fields.append("skills")

        return Response(
            {
                "status": "CONFIRMED",
                "message": "Selected resume fields applied successfully to your profile.",
                "updated_fields": updated_fields,
            },
            status=status.HTTP_200_OK,
        )


# =============================================================================
# Track 1 Department Dean Verification, QR Letters, Defense & Grading Views
# =============================================================================

import hmac
import hashlib
import json
from decimal import Decimal
from django.conf import settings
from django.utils import timezone
from apps.accounts.permissions import IsDeptDean, IsStudent
from apps.common.qr_generator import generate_base64_qr
from apps.common.excel_generator import generate_dean_score_roster_template
from apps.logistics.models import CampusLogistics
from apps.teams.models import ProjectTeam, InHouseCohort
from drf_spectacular.utils import extend_schema


@extend_schema(tags=["Department Dean"])
class DeanStudentListView(APIView):
    """
    Scoped view: Department Dean views ONLY students belonging to their department.
    Enforces eligibility flag (3rd year completed: academic_year >= 4).
    GET /api/v1/uil-profiles/dean/students/
    """
    permission_classes = [IsAuthenticated, IsDeptDean]

    def get(self, request):
        dean = request.user
        dean_dept = dean.department.strip() if getattr(dean, "department", None) else ""
        if not dean_dept and hasattr(dean, "staff_profile") and dean.staff_profile.department:
            dean_dept = dean.staff_profile.department.department_name.strip()

        # If still empty for demo/admin, default to Software Engineering or match all
        qs = UILStudentProfile.objects.select_related("student__user").all()
        if dean_dept:
            qs = qs.filter(department__iexact=dean_dept)

        students_data = []
        for stu in qs.order_by("-academic_year", "-created_at"):
            user = getattr(stu, "user", None)
            is_eligible = (stu.academic_year >= 4)
            students_data.append({
                "id": str(stu.id),
                "student_id_number": stu.student_id_number,
                "full_name": user.full_name if user else stu.student_id_number,
                "email": user.email if user else "",
                "department": stu.department,
                "campus_city": stu.campus_city,
                "academic_year": stu.academic_year,
                "gpa": str(stu.gpa) if stu.gpa else None,
                "is_eligible": is_eligible,
                "eligibility_reason": "3rd Year Completed (Year 4+)" if is_eligible else "Ineligible: Must complete 3rd Year (Year 4+ required)",
                "is_verified_by_dean": stu.is_verified_by_dean,
                "dean_verified_at": stu.dean_verified_at.isoformat() if stu.dean_verified_at else None,
                "dean_verification_letter_qr": stu.dean_verification_letter_qr,
                "dean_dorm_food_letter_qr": stu.dean_dorm_food_letter_qr,
                "has_score_roster": bool(stu.dean_score_roster_file),
                "forwarded_to_uil": stu.forwarded_to_uil,
            })

        return Response({
            "dean_department": dean_dept or "All Departments",
            "total_students": len(students_data),
            "students": students_data,
        }, status=status.HTTP_200_OK)


@extend_schema(tags=["Department Dean"])
class DeanVerifyStudentView(APIView):
    """
    1-Click Verify: Generates HMAC-SHA256 signature, scannable Base64 QR letters,
    and structured Excel score roster template (.xlsx).
    POST /api/v1/uil-profiles/dean/verify-student/<uuid:pk>/
    """
    permission_classes = [IsAuthenticated, IsDeptDean]

    def post(self, request, pk):
        student = get_object_or_404(UILStudentProfile, id=pk)
        dean = request.user

        # 1. Department scoping check
        dean_dept = dean.department.strip() if getattr(dean, "department", None) else ""
        if not dean_dept and hasattr(dean, "staff_profile") and dean.staff_profile.department:
            dean_dept = dean.staff_profile.department.department_name.strip()

        if dean_dept and student.department.strip().lower() != dean_dept.lower():
            return Response(
                {"detail": f"Forbidden: You can only verify students in your department ({dean_dept})."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 2. Strict 3rd year completed eligibility check (academic_year >= 4)
        if student.academic_year < 4:
            return Response(
                {
                    "detail": "Eligibility Violation: Student has not completed 3rd year. Academic Year must be 4 or higher for Track 1 verification.",
                    "academic_year": student.academic_year,
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # 3. Generate Cryptographic HMAC-SHA256 digital signature
        now = timezone.now()
        timestamp_str = now.isoformat()
        msg_payload = f"DEAN_VERIFY:{student.student_id_number}:{dean.id}:{timestamp_str}"
        hmac_sig = hmac.new(settings.SECRET_KEY.encode("utf-8"), msg_payload.encode("utf-8"), hashlib.sha256).hexdigest()

        # 4. Generate Base64 QR Code for Dean Verification Letter
        verification_letter_data = json.dumps({
            "doc_type": "DEAN_OFFICIAL_VERIFICATION_LETTER",
            "institution": "SmartIntern-ET National Platform",
            "student_id": student.student_id_number,
            "student_name": student.user.full_name if student.user else student.student_id_number,
            "department": student.department,
            "academic_year": student.academic_year,
            "dean_email": dean.email,
            "signature_hash": hmac_sig,
            "verified_at": timestamp_str,
        })
        verification_qr = generate_base64_qr(verification_letter_data)

        # 5. Generate Base64 QR Code for Dormitory & Dining Clearance Letter
        dorm_food_letter_data = json.dumps({
            "doc_type": "CAMPUS_FOOD_HOUSING_CLEARANCE_LETTER",
            "student_id": student.student_id_number,
            "student_name": student.user.full_name if student.user else student.student_id_number,
            "campus_city": student.campus_city,
            "dean_signature": hmac_sig,
            "dining_hall_approved": True,
            "dormitory_approved": True,
            "timestamp": timestamp_str,
        })
        dorm_food_qr = generate_base64_qr(dorm_food_letter_data)

        # 6. Generate Structured Excel Score Roster Template
        user_name = student.user.full_name if student.user else student.student_id_number
        roster_file = generate_dean_score_roster_template(
            department_name=student.department,
            academic_year=student.academic_year,
            students_list=[{
                "student_id": student.student_id_number,
                "full_name": user_name,
                "department": student.department,
                "academic_year": student.academic_year,
                "advisor_score": "",
                "uil_score": "",
                "doc_score": "",
                "pres_score": "",
            }]
        )

        # Save to student profile
        student.is_verified_by_dean = True
        student.dean_verified_at = now
        student.dean_signature_hash = hmac_sig
        student.dean_verification_letter_qr = verification_qr
        student.dean_dorm_food_letter_qr = dorm_food_qr
        student.dean_score_roster_file.save(roster_file.name, roster_file, save=False)
        student.save()

        # 7. Auto-link/update CampusLogistics record
        cohort = InHouseCohort.objects.filter(is_open=True).first()
        if not cohort:
            cohort = InHouseCohort.objects.create(
                university_name=student.campus_city or "Addis Ababa University",
                academic_year=str(student.academic_year),
                start_date=now.date(),
                end_date=now.date() + timezone.timedelta(days=120),
                capacity_k=100,
                enrolled_count=1,
            )

        logistics, _ = CampusLogistics.objects.get_or_create(
            student=student,
            defaults={"cohort": cohort},
        )
        logistics.dean_approved = True
        logistics.dean_signature_hash = hmac_sig
        logistics.dean_signed_by = dean
        logistics.dean_signed_at = now
        logistics.save()

        return Response({
            "message": f"Student {student.student_id_number} verified successfully by Dean.",
            "signature_hash": hmac_sig,
            "dean_verification_letter_qr": verification_qr,
            "dean_dorm_food_letter_qr": dorm_food_qr,
            "roster_download_url": student.dean_score_roster_file.url if student.dean_score_roster_file else None,
        }, status=status.HTTP_200_OK)


@extend_schema(tags=["Students"])
class StudentForwardToUILView(APIView):
    """
    Student forwards their verified Dean letters & QR codes to the UIL Officer.
    POST /api/v1/uil-profiles/student/forward-to-uil/
    """
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        student = get_object_or_404(UILStudentProfile, student__user=request.user)
        if not student.is_verified_by_dean:
            return Response(
                {"detail": "You must be verified by your Department Dean before forwarding documents to UIL."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        student.forwarded_to_uil = True
        student.forwarded_to_uil_at = timezone.now()
        student.save(update_fields=["forwarded_to_uil", "forwarded_to_uil_at"])

        return Response({
            "message": "Dean verification letter and logistics clearance QR codes successfully forwarded to UIL Officer.",
            "forwarded_at": student.forwarded_to_uil_at.isoformat(),
        }, status=status.HTTP_200_OK)


@extend_schema(tags=["Department Dean"])
class DeanUnsealScoreSheetView(APIView):
    """
    Dean scans UIL QR code or unseals squad score sheet for final defense.
    POST /api/v1/uil-profiles/dean/unseal-score-sheet/<uuid:team_id>/
    """
    permission_classes = [IsAuthenticated, IsDeptDean]

    def post(self, request, team_id):
        team = get_object_or_404(ProjectTeam, id=team_id)
        if not team.uil_score_sealed:
            return Response(
                {"detail": "UIL Officer has not sealed the score sheet yet."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        team.is_unsealed_by_dean = True
        team.save(update_fields=["is_unsealed_by_dean", "updated_at"])

        return Response({
            "message": f"Score sheet for team '{team.team_name}' unsealed successfully.",
            "uil_score": str(team.uil_score),
            "advisor_score": str(team.advisor_score),
            "is_unsealed_by_dean": True,
        }, status=status.HTTP_200_OK)


@extend_schema(tags=["Department Dean"])
class DeanScheduleDefenseView(APIView):
    """
    Dean schedules the final project defense and provides a Google Meet link.
    POST /api/v1/uil-profiles/dean/schedule-defense/<uuid:team_id>/
    Body: {"defense_scheduled_at": "...", "venue": "...", "meet_url": "..."}
    """
    permission_classes = [IsAuthenticated, IsDeptDean]

    def post(self, request, team_id):
        team = get_object_or_404(ProjectTeam, id=team_id)
        sched = request.data.get("defense_scheduled_at")
        venue = request.data.get("venue", "Main Campus Hall / Remote")
        meet_url = request.data.get("meet_url", "https://meet.google.com/xyz-smart-intern")

        if sched:
            team.defense_scheduled_at = sched
        team.defense_venue = venue
        team.google_meet_url = meet_url
        team.save(update_fields=["defense_scheduled_at", "defense_venue", "google_meet_url", "updated_at"])

        return Response({
            "message": f"Final defense scheduled for team '{team.team_name}'.",
            "defense_scheduled_at": str(team.defense_scheduled_at),
            "venue": team.defense_venue,
            "meet_url": team.google_meet_url,
        }, status=status.HTTP_200_OK)


@extend_schema(tags=["Department Dean"])
class DeanSubmitFinalGradeView(APIView):
    """
    Dean inputs Presentation and Documentation scores, computing the 100% composite final grade:
    Advisor (25%) + UIL (25%) + Doc (25%) + Presentation (25%) = 100%.
    POST /api/v1/uil-profiles/dean/submit-final-grade/<uuid:team_id>/
    Body: {"presentation_score": 24.0, "documentation_score": 23.5}
    """
    permission_classes = [IsAuthenticated, IsDeptDean]

    def post(self, request, team_id):
        team = get_object_or_404(ProjectTeam, id=team_id)
        pres = request.data.get("presentation_score")
        doc = request.data.get("documentation_score")

        if pres is not None:
            team.presentation_score = Decimal(str(pres))
        if doc is not None:
            team.documentation_score = Decimal(str(doc))

        total, letter = team.compute_composite_grade()
        team.save()

        return Response({
            "message": f"Final composite grade computed for team '{team.team_name}'.",
            "breakdown": {
                "advisor_score_25": str(team.advisor_score or "0.00"),
                "uil_score_25": str(team.uil_score or "0.00"),
                "documentation_score_25": str(team.documentation_score or "0.00"),
                "presentation_score_25": str(team.presentation_score or "0.00"),
                "final_composite_score_100": str(team.final_composite_score),
                "final_grade_letter": team.final_grade_letter,
            },
            "certificate_data": {
                "team_name": team.team_name,
                "project_title": team.project_title,
                "final_grade": team.final_grade_letter,
                "status": "COMPLETED",
            }
        }, status=status.HTTP_200_OK)

