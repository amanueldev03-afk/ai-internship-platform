from django.db import transaction
from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from apps.internships.models import Skill
from .models import StudentProfile, CV
from .serializers import (
    StudentProfileSerializer,
    AddStudentSkillsSerializer,
    StudentPreferencesSerializer,
)
from rest_framework.parsers import MultiPartParser, FormParser
from .tasks import process_cv, generate_student_embedding_task


class StudentProfileView(GenericAPIView):
    """
    Get or update the authenticated student's profile.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = StudentProfileSerializer

    def get_profile(self, user):
        profile, created = StudentProfile.objects.get_or_create(
            user=user
        )

        return profile

    @extend_schema(
        tags=["Student Profiles"],
        summary="Get Student Profile",
        description="Retrieve the authenticated student's profile information",
        responses={200: StudentProfileSerializer}
    )
    def get(self, request):
        """
        Return the authenticated student's profile.
        """

        profile = self.get_profile(request.user)

        serializer = self.get_serializer(profile)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    @extend_schema(
        tags=["Student Profiles"],
        summary="Create or Update Student Profile",
        description="Create or update the authenticated student's profile information",
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer},
        examples=[
            OpenApiExample(
                "Create Profile",
                value={
                    "full_name": "John Doe",
                    "country": "United States",
                    "city": "New York",
                    "phone": "+1234567890",
                    "education_level": "bachelor",
                    "field_of_study": "Computer Science",
                    "graduation_year": 2025,
                    "gpa": 3.5
                }
            )
        ]
    )
    def post(self, request):
        """
        Create/update student profile (for API Execution Guide compatibility).
        """
        return self.patch(request)

    @extend_schema(
        tags=["Student Profiles"],
        summary="Update Student Profile",
        description="Update the authenticated student's profile information",
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer},
    )
    def put(self, request):
        """
        Full update student profile.
        """
        return self.patch(request)

    @extend_schema(
        tags=["Student Profiles"],
        summary="Update Student Profile",
        description="Update the authenticated student's profile information",
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer},
        examples=[
            OpenApiExample(
                "Update Profile",
                value={
                    "full_name": "John Doe",
                    "country": "United States",
                    "city": "New York",
                    "phone": "+1234567890",
                    "education_level": "bachelor",
                    "field_of_study": "Computer Science",
                    "graduation_year": 2025,
                    "gpa": 3.5
                }
            )
        ]
    )
    def patch(self, request):
        """
        Partially update the authenticated student's profile.
        Queue embedding regeneration in background after commit.
        """

        profile = self.get_profile(request.user)

        serializer = self.get_serializer(
            profile,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        # Queue embedding regeneration after transaction commits
        try:
            transaction.on_commit(
                lambda: generate_student_embedding_task.delay(profile.id)
            )
        except Exception as e:
            # Log error but don't fail the update
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to queue student embedding regeneration: {e}")

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )


class StudentSkillsAddView(GenericAPIView):
    """
    Add skills to the authenticated student's profile.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AddStudentSkillsSerializer

    @extend_schema(
        tags=["Student Profiles"],
        summary="Add Skills to Profile",
        description="Add skills to the student profile by providing a list of skill IDs",
        request=AddStudentSkillsSerializer,
        responses={200: StudentProfileSerializer},
        examples=[
            OpenApiExample(
                "Add Skills",
                value={"skill_ids": [1, 2, 3]}
            )
        ]
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        skill_ids = serializer.validated_data["skill_ids"]
        profile, _ = StudentProfile.objects.get_or_create(user=request.user)

        skills = Skill.objects.filter(id__in=skill_ids)
        profile.skills.add(*skills)

        try:
            transaction.on_commit(
                lambda: generate_student_embedding_task.delay(profile.id)
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to queue student embedding regeneration: {e}")

        return Response(
            StudentProfileSerializer(profile).data,
            status=status.HTTP_200_OK,
        )


class StudentPreferencesView(GenericAPIView):
    """
    Set internship preferences for the authenticated student.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StudentPreferencesSerializer

    @extend_schema(
        tags=["Student Profiles"],
        summary="Set Internship Preferences",
        description="Set or update internship search and matching preferences for the student profile",
        request=StudentPreferencesSerializer,
        responses={200: StudentProfileSerializer},
        examples=[
            OpenApiExample(
                "Set Preferences",
                value={
                    "work_mode": "remote",
                    "internship_type": "full_time",
                    "paid_only": True,
                    "min_paid": 2000,
                    "max_paid": 5000,
                    "preferred_countries": ["United States"],
                    "preferred_categories": ["Software Development"]
                }
            )
        ]
    )
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        profile, _ = StudentProfile.objects.get_or_create(user=request.user)

        if "work_mode" in data:
            profile.internship_type = data["work_mode"]
        if "internship_type" in data:
            profile.work_type = data["internship_type"]
        if "paid_only" in data:
            if data["paid_only"]:
                profile.compensation_preference = "paid"
        if "min_paid" in data:
            profile.minimum_compensation = data["min_paid"]
        if "max_paid" in data:
            profile.maximum_compensation = data["max_paid"]
        if "preferred_countries" in data:
            profile.preferred_locations = data["preferred_countries"]
        if "preferred_categories" in data:
            profile.preferred_industries = data["preferred_categories"]

        profile.save()

        try:
            transaction.on_commit(
                lambda: generate_student_embedding_task.delay(profile.id)
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to queue student embedding regeneration: {e}")

        return Response(
            StudentProfileSerializer(profile).data,
            status=status.HTTP_200_OK,
        )


class StudentCVUploadView(
    APIView
):
    """
    Upload and process student's CV in the background.
    """

    permission_classes = [
        IsAuthenticated
    ]

    parser_classes = [
        MultiPartParser
    ]

    @extend_schema(
        tags=["Student Profiles"],
        summary="Upload CV",
        description="Upload CV file (PDF/DOCX) with automatic background processing for skill extraction and semantic matching",
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'file': {
                        'type': 'string',
                        'format': 'binary',
                        'description': 'CV file (PDF or DOCX, max 5MB)'
                    }
                },
                'required': ['file']
            }
        },
        responses={201: {'type': 'object', 'properties': {'message': {'type': 'string'}, 'cv_id': {'type': 'integer'}, 'processing_status': {'type': 'string'}}}},
        examples=[
            OpenApiExample(
                "CV Upload",
                value={"file": "cv_document.pdf"},
                media_type="multipart/form-data"
            )
        ]
    )
    def post(
        self,
        request,
    ):
        file = request.FILES.get(
            "file"
        )

        if not file:
            return Response(
                {
                    "detail": (
                        "CV file is required."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate file extension
        try:
            from pathlib import Path
            from .services.cv_extraction import validate_cv_extension
            validate_cv_extension(file.name)
        except ValueError as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create CV record with PENDING status
        cv = CV.objects.create(
            student=request.user,
            file=file,
            processing_status=CV.STATUS_PENDING,
        )

        # Queue CV processing after transaction commits
        try:
            transaction.on_commit(
                lambda: process_cv.delay(cv.id)
            )
        except Exception as e:
            # Log error but don't fail the upload
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to queue CV processing: {e}")

        return Response(
            {
                "message": "CV uploaded successfully. Processing in background.",
                "cv_id": cv.id,
                "processing_status": cv.processing_status,
            },
            status=status.HTTP_201_CREATED,
        )


class CVStatusView(GenericAPIView):
    """
    Get the processing status of a CV by ID.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = None

    @extend_schema(
        tags=["Student Profiles"],
        summary="Check CV Processing Status by ID",
        operation_id="cv_status_by_id",
        description="Check the processing status of an uploaded CV by ID.",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'cv_id': {'type': 'integer'},
                    'processing_status': {'type': 'string'},
                    'processing_error': {'type': 'string', 'nullable': True},
                    'processed_at': {'type': 'string', 'format': 'date-time', 'nullable': True}
                }
            },
            404: {
                'type': 'object',
                'properties': {'detail': {'type': 'string'}}
            }
        }
    )
    def get(self, request, cv_id=None):
        """
        Get CV processing status.
        """
        try:
            if cv_id is not None:
                cv = CV.objects.get(id=cv_id, student=request.user)
            else:
                cv = CV.objects.filter(student=request.user).order_by("-created_at").first()
                if not cv:
                    raise CV.DoesNotExist()
        except CV.DoesNotExist:
            return Response(
                {"detail": "CV not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            {
                "cv_id": cv.id,
                "processing_status": cv.processing_status,
                "processing_error": cv.processing_error,
                "processed_at": cv.processed_at,
            },
            status=status.HTTP_200_OK,
        )


class CVStatusLatestView(CVStatusView):
    """
    Get the processing status of the latest uploaded CV.
    """

    @extend_schema(
        tags=["Student Profiles"],
        summary="Check Latest CV Processing Status",
        operation_id="cv_status_latest",
        description="Check the background processing status of the latest uploaded CV.",
        responses={
            200: {
                'type': 'object',
                'properties': {
                    'cv_id': {'type': 'integer'},
                    'processing_status': {'type': 'string'},
                    'processing_error': {'type': 'string', 'nullable': True},
                    'processed_at': {'type': 'string', 'format': 'date-time', 'nullable': True}
                }
            },
            404: {
                'type': 'object',
                'properties': {'detail': {'type': 'string'}}
            }
        }
    )
    def get(self, request, cv_id=None):
        return super().get(request, cv_id=None)