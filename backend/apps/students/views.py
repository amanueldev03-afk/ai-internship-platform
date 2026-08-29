import logging

from django.db import transaction
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from drf_spectacular.utils import extend_schema

from apps.internships.models import Skill
from apps.internships.permissions import IsStudent
from .models import StudentProfile, CV
from .serializers import (
    StudentProfileSerializer,
    StudentMeSerializer,
    AddStudentSkillsSerializer,
)
from .tasks import process_cv, generate_student_embedding_task
from apps.recommendations.views import bust_recommendation_cache

logger = logging.getLogger(__name__)


def _get_or_create_profile(user):
    """Return the student's profile, creating it if it doesn't exist."""
    profile, _ = StudentProfile.objects.get_or_create(user=user)
    return profile


def _queue_embedding(profile):
    """Queue embedding regeneration after the current transaction commits."""
    try:
        transaction.on_commit(
            lambda: generate_student_embedding_task.delay(profile.id)
        )
    except Exception as exc:
        logger.warning(f"Could not queue embedding regeneration for profile {profile.id}: {exc}")


def _handle_cv_file(cv_file, user):
    """
    Replace the student's existing CV with `cv_file`, create a new CV record,
    and queue background processing.
    Returns a cv_info dict on success, raises ValueError on bad extension.
    """
    from .services.cv_extraction import validate_cv_extension
    validate_cv_extension(cv_file.name)   # raises ValueError on bad extension

    # Delete old CV records + their storage files
    old_cvs = CV.objects.filter(student=user)
    for old_cv in old_cvs:
        try:
            if old_cv.file:
                old_cv.file.delete(save=False)
        except Exception as del_err:
            logger.warning(f"Could not delete old CV file: {del_err}")
    old_cvs.delete()

    # Create new CV record
    cv = CV.objects.create(
        student=user,
        file=cv_file,
        processing_status=CV.STATUS_PENDING,
    )
    logger.info(f"CV record created: id={cv.id} for user={user.id}")

    cv_id = cv.id
    try:
        transaction.on_commit(lambda: process_cv.delay(cv_id))
    except Exception as exc:
        logger.warning(f"Could not queue CV processing: {exc}")

    return {
        "cv_id": cv.id,
        "processing_status": cv.processing_status,
        "message": "CV uploaded. Processing in background.",
    }


class StudentProfileView(GenericAPIView):
    """
    GET  /api/profile/   — return the student's full profile including cv_data.
    PUT  /api/profile/   — update profile fields.  Optionally include a `cv`
                           file (multipart/form-data) to replace the stored CV.
    PATCH /api/profile/  — partial update (same behaviour as PUT).

    All preference fields (internship_type, work_type, compensation_preference,
    minimum_compensation, maximum_compensation, preferred_locations,
    preferred_industries, preferred_roles, willing_to_relocate) are part of
    the profile serializer — send them in the same request as any other field.
    """

    permission_classes = [IsAuthenticated]
    serializer_class   = StudentProfileSerializer
    # Accept JSON, form-data (for CV file upload), and multipart
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        tags=["Student Profiles"],
        summary="Get Student Profile",
        description=(
            "Retrieve the full student profile, including the computed `cv_data` "
            "block that shows CV processing status and all extracted fields "
            "(skills, education, experience, projects, certifications)."
        ),
        responses={200: StudentProfileSerializer},
    )
    def get(self, request):
        profile = _get_or_create_profile(request.user)
        return Response(
            StudentProfileSerializer(profile).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Student Profiles"],
        summary="Update Student Profile",
        description=(
            "Update any combination of profile fields in a single request.\n\n"
            "**Preference fields** (internship_type, work_type, compensation_preference, "
            "minimum_compensation, maximum_compensation, preferred_locations, "
            "preferred_industries, willing_to_relocate) are part of this serializer — "
            "no separate preferences endpoint is needed.\n\n"
            "**CV upload** — include a `cv` file field (PDF/DOCX, max 5 MB) using "
            "`multipart/form-data` to replace the stored CV.  The response will contain "
            "a `cv_upload` key with the new CV id and initial processing status.\n\n"
            "A `PUT` and a `PATCH` behave identically — all fields are optional."
        ),
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer},
    )
    def put(self, request):
        return self._update(request)

    @extend_schema(
        tags=["Student Profiles"],
        summary="Partial Update Student Profile",
        description="Partial update — identical to PUT, all fields are optional.",
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer},
    )
    def patch(self, request):
        return self._update(request)

    # ------------------------------------------------------------------
    def _update(self, request):
        profile = _get_or_create_profile(request.user)

        # --- Handle CV file if present -----------------------------------
        cv_info = None
        if request.FILES.get("cv"):
            try:
                cv_info = _handle_cv_file(request.FILES["cv"], request.user)
                bust_recommendation_cache(request.user.id)
            except ValueError as exc:
                return Response({"cv": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        # --- Update profile fields ----------------------------------------
        # request.data may be a QueryDict (multipart) — copy to plain dict
        data = request.data.dict() if hasattr(request.data, "dict") else dict(request.data)
        # Remove the file key so the serializer doesn't try to validate it
        data.pop("cv", None)

        # Handle JSON-encoded list fields that arrive as strings in multipart
        import json
        list_fields = [
            "interests", "preferred_locations",
            "preferred_industries", "preferred_roles",
        ]
        for field in list_fields:
            if field in data and isinstance(data[field], str):
                try:
                    data[field] = json.loads(data[field])
                except (json.JSONDecodeError, TypeError):
                    pass  # leave as-is; serializer validation will catch invalid types

        serializer = StudentProfileSerializer(
            profile,
            data=data,
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # --- Queue embedding regeneration --------------------------------
        _queue_embedding(profile)
        bust_recommendation_cache(request.user.id)

        # --- Build response ----------------------------------------------
        response_data = StudentProfileSerializer(profile).data
        if cv_info:
            response_data["cv_upload"] = cv_info

        return Response(response_data, status=status.HTTP_200_OK)


class StudentMeView(GenericAPIView):
    """
    Phase 3 Task 3.1 — Student Profile Module (Section 5.3).

    GET   /api/students/me/   — personal info + education (Sections 5.3.1–5.3.2).
    PATCH /api/students/me/   — partial update of personal/education fields.

    ``education_level``, ``current_year`` and ``field_of_study`` are validated
    against fixed choice lists so the AI matching engine (Section 3.11.1) never
    receives free-text noise it cannot match.
    """

    permission_classes = [IsStudent]
    serializer_class = StudentMeSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def _get_profile(self, request):
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)
        return profile

    @extend_schema(
        tags=["Student Profile (Phase 3)"],
        summary="Get My Profile (personal info + education)",
        description=(
            "Return the authenticated student's personal information and "
            "education (Sections 5.3.1-5.3.2)."
        ),
        responses={200: StudentMeSerializer},
    )
    def get(self, request):
        profile = self._get_profile(request)
        return Response(
            StudentMeSerializer(profile).data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Student Profile (Phase 3)"],
        summary="Update My Profile (personal info + education)",
        description=(
            "Partially update the authenticated student's personal information "
            "and education. `education_level`, `current_year` and "
            "`field_of_study` must be values from their fixed choice lists; an "
            "invalid value returns 400 so the AI engine only sees canonical data."
        ),
        request=StudentMeSerializer,
        responses={200: StudentMeSerializer},
    )
    def patch(self, request):
        return self._update(request)

    @extend_schema(
        tags=["Student Profile (Phase 3)"],
        summary="Update My Profile (full)",
        description="Full update — behaves like PATCH (all fields optional).",
        request=StudentMeSerializer,
        responses={200: StudentMeSerializer},
    )
    def put(self, request):
        return self._update(request)

    def _update(self, request):
        profile = self._get_profile(request)
        serializer = StudentMeSerializer(
            profile,
            data=request.data if isinstance(request.data, dict) else dict(request.data),
            partial=True,
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Keep the AI matching inputs (Section 3.11.1) in sync.
        _queue_embedding(profile)
        bust_recommendation_cache(request.user.id)

        return Response(
            StudentMeSerializer(profile).data,
            status=status.HTTP_200_OK,
        )


class StudentSkillsAddView(GenericAPIView):
    """
    POST /api/profile/skills/add/
    Add skills to the student profile by skill IDs.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = AddStudentSkillsSerializer

    @extend_schema(
        tags=["Student Profiles"],
        summary="Add Skills to Profile",
        description="Add one or more skills to the student profile by providing a list of skill IDs.",
        request=AddStudentSkillsSerializer,
        responses={200: StudentProfileSerializer},
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        skill_ids = serializer.validated_data["skill_ids"]
        profile   = _get_or_create_profile(request.user)
        skills    = Skill.objects.filter(id__in=skill_ids)
        profile.skills.add(*skills)

        _queue_embedding(profile)
        bust_recommendation_cache(request.user.id)

        return Response(
            StudentProfileSerializer(profile).data,
            status=status.HTTP_200_OK,
        )


class StudentCVUploadView(GenericAPIView):
    """
    POST /api/profile/cv/upload/
    Dedicated CV-only upload endpoint (no profile fields).
    Useful when you only want to replace the CV without touching profile data.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = None
    parser_classes     = [MultiPartParser]

    @extend_schema(
        tags=["Student Profiles"],
        summary="Upload CV (dedicated endpoint)",
        description=(
            "Replace the student's CV without changing any other profile field.\n\n"
            "For combined profile + CV upload, use `PUT /api/profile/` instead."
        ),
        request={
            "multipart/form-data": {
                "type": "object",
                "properties": {
                    "file": {
                        "type": "string",
                        "format": "binary",
                        "description": "PDF or DOCX file, max 5 MB",
                    }
                },
                "required": ["file"],
            }
        },
        responses={
            201: {
                "type": "object",
                "properties": {
                    "message":           {"type": "string"},
                    "cv_id":             {"type": "integer"},
                    "processing_status": {"type": "string"},
                },
            }
        },
    )
    def post(self, request):
        cv_file = request.FILES.get("file")
        if not cv_file:
            return Response(
                {"detail": "A CV file is required. Send it as form-data with key 'file'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cv_info = _handle_cv_file(cv_file, request.user)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        bust_recommendation_cache(request.user.id)

        return Response(
            {
                "message":           cv_info["message"],
                "cv_id":             cv_info["cv_id"],
                "processing_status": cv_info["processing_status"],
            },
            status=status.HTTP_201_CREATED,
        )


class CVStatusView(GenericAPIView):
    """
    GET /api/profile/cv/<cv_id>/status/
    Check processing status and extracted data for a specific CV by ID.
    """
    permission_classes = [IsAuthenticated]
    serializer_class   = None

    @extend_schema(
        tags=["Student Profiles"],
        summary="CV Processing Status (by ID)",
        operation_id="cv_status_by_id",
        description=(
            "Returns the current processing status plus all extracted data once "
            "the CV reaches COMPLETED status."
        ),
        responses={
            200: {
                "type": "object",
                "properties": {
                    "cv_id":              {"type": "integer"},
                    "processing_status":  {"type": "string",
                                          "enum": ["PENDING","PROCESSING","COMPLETED","FAILED"]},
                    "processing_error":   {"type": "string",  "nullable": True},
                    "processed_at":       {"type": "string",  "format": "date-time", "nullable": True},
                    "message":            {"type": "string"},
                    "extracted_skills":        {"type": "array", "items": {"type": "string"}},
                    "extracted_education":     {"type": "array", "items": {"type": "object"}},
                    "extracted_experience":    {"type": "array", "items": {"type": "object"}},
                    "extracted_projects":      {"type": "array", "items": {"type": "object"}},
                    "extracted_certifications":{"type": "array", "items": {"type": "string"}},
                },
            },
            404: {"type": "object", "properties": {"detail": {"type": "string"}}},
        },
    )
    def get(self, request, cv_id=None):
        try:
            if cv_id is not None:
                cv = CV.objects.get(id=cv_id, student=request.user)
            else:
                cv = (
                    CV.objects
                    .filter(student=request.user)
                    .order_by("-created_at")
                    .first()
                )
                if not cv:
                    raise CV.DoesNotExist()
        except CV.DoesNotExist:
            return Response({"detail": "CV not found."}, status=status.HTTP_404_NOT_FOUND)

        data = {
            "cv_id":             cv.id,
            "processing_status": cv.processing_status,
            "processing_error":  cv.processing_error,
            "processed_at":      cv.processed_at,
            "extracted_skills":         cv.extracted_skills        or [],
            "extracted_education":      cv.extracted_education     or [],
            "extracted_experience":     cv.extracted_experience    or [],
            "extracted_projects":       cv.extracted_projects      or [],
            "extracted_certifications": cv.extracted_certifications or [],
        }

        if cv.processing_status == CV.STATUS_PENDING:
            data["message"] = "CV is queued for processing. Check back in a few seconds."
        elif cv.processing_status == CV.STATUS_PROCESSING:
            data["message"] = "CV is currently being processed. Check back shortly."
        elif cv.processing_status == CV.STATUS_COMPLETED:
            data["message"] = (
                f"CV processed successfully. "
                f"{len(data['extracted_skills'])} skills extracted."
            )
        elif cv.processing_status == CV.STATUS_FAILED:
            data["message"] = "CV processing failed. Please re-upload your CV."

        return Response(data, status=status.HTTP_200_OK)


class CVStatusLatestView(CVStatusView):
    """
    GET /api/profile/cv/status/
    Check processing status of the most recently uploaded CV.
    """

    @extend_schema(
        tags=["Student Profiles"],
        summary="CV Processing Status (latest)",
        operation_id="cv_status_latest",
        description="Same as the by-ID endpoint but always returns the most recent CV.",
        responses={
            200: {
                "type": "object",
                "properties": {
                    "cv_id":              {"type": "integer"},
                    "processing_status":  {"type": "string",
                                          "enum": ["PENDING","PROCESSING","COMPLETED","FAILED"]},
                    "processing_error":   {"type": "string",  "nullable": True},
                    "processed_at":       {"type": "string",  "format": "date-time", "nullable": True},
                    "message":            {"type": "string"},
                    "extracted_skills":        {"type": "array", "items": {"type": "string"}},
                    "extracted_education":     {"type": "array", "items": {"type": "object"}},
                    "extracted_experience":    {"type": "array", "items": {"type": "object"}},
                    "extracted_projects":      {"type": "array", "items": {"type": "object"}},
                    "extracted_certifications":{"type": "array", "items": {"type": "string"}},
                },
            },
            404: {"type": "object", "properties": {"detail": {"type": "string"}}},
        },
    )
    def get(self, request, cv_id=None):
        return super().get(request, cv_id=None)
