from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import StudentProfile
from .serializers import StudentProfileSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from .models import StudentCV
from .serializers import StudentCVSerializer
from .services.cv_extraction import (
    extract_cv_text,
)
from .services.cv_analysis import (
    analyze_cv,
)
from .services.ai_cv_analysis import (
    analyze_cv_intelligently,
)
from .services.skill_sync import (
    sync_cv_skills_to_profile,
)

from apps.internships.services.embedding_service import (
    regenerate_student_embedding,
)


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
        request=StudentProfileSerializer,
        responses={200: StudentProfileSerializer}
    )
    def patch(self, request):
        """
        Partially update the authenticated student's profile.
        """

        profile = self.get_profile(request.user)

        serializer = self.get_serializer(
            profile,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        serializer.save()

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )





class StudentCVUploadView(
    APIView
):
    """
    Upload and process student's CV.
    """

    permission_classes = [
        IsAuthenticated
    ]

    parser_classes = [
        MultiPartParser
    ]

    @extend_schema(
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
        responses={201: StudentCVSerializer, 200: StudentCVSerializer},
        description="Upload CV file (PDF/DOCX) with automatic text extraction"
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

        try:
            extracted_text = extract_cv_text(
                file
            )

            basic_analysis = analyze_cv(
                extracted_text
            )

            analysis = analyze_cv_intelligently(
                extracted_text,
                basic_analysis,
            )

        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        cv, created = (
            StudentCV.objects.update_or_create(
                student=request.user,
                defaults={
                    "file": file,
                    "extracted_text": extracted_text,
                    "extracted_skills": (
                        analysis["skills"]
                        if isinstance(analysis["skills"], list)
                        else []
                    ),
                    "extracted_education": (
                        analysis["education"]
                        if isinstance(analysis["education"], list)
                        else []
                    ),
                    "extracted_experience": (
                        analysis["experience"]
                        if isinstance(analysis["experience"], list)
                        else []
                    ),
                    "extracted_projects": (
                        analysis["projects"]
                        if isinstance(analysis["projects"], list)
                        else []
                    ),
                    "extracted_certifications": (
                        analysis["certifications"]
                        if isinstance(analysis["certifications"], list)
                        else []
                    ),
                },
            )
        )

        profile = (
            request.user.student_profile
        )

        regenerate_student_embedding(
            profile
        )

        sync_cv_skills_to_profile(
            profile,
            analysis["skills"],
        )

        serializer = (
            StudentCVSerializer(cv)
        )

        return Response(
            serializer.data,
                status=(
                    status.HTTP_201_CREATED
                    if created
                    else status.HTTP_200_OK
                ),
            )