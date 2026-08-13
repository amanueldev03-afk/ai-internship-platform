from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StudentProfile
from .serializers import StudentProfileSerializer

from rest_framework.parsers import MultiPartParser, FormParser

class StudentProfileView(APIView):
    """
    Get or update the authenticated student's profile.
    """

    permission_classes = [IsAuthenticated]

    def get_profile(self, user):
        profile, created = StudentProfile.objects.get_or_create(
            user=user
        )

        return profile

    def get(self, request):
        """
        Return the authenticated student's profile.
        """

        profile = self.get_profile(request.user)

        serializer = StudentProfileSerializer(profile)

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):
        """
        Partially update the authenticated student's profile.
        """

        profile = self.get_profile(request.user)

        serializer = StudentProfileSerializer(
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


class StudentCVView(APIView):
    """
    Upload, replace, or remove the authenticated student's CV.
    """

    permission_classes = [IsAuthenticated]

    parser_classes = [
        MultiPartParser,
        FormParser,
    ]

    def get_profile(self, user):
        profile, created = StudentProfile.objects.get_or_create(
            user=user
        )

        return profile

    def post(self, request):
        """
        Upload or replace the student's CV.
        """

        profile = self.get_profile(request.user)

        cv_file = request.FILES.get("cv")

        if not cv_file:
            return Response(
                {
                    "detail": "CV file is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Maximum file size: 5 MB
        max_size = 5 * 1024 * 1024

        if cv_file.size > max_size:
            return Response(
                {
                    "detail": "CV file must not exceed 5 MB."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        allowed_extensions = [
            ".pdf",
            ".doc",
            ".docx",
        ]

        file_name = cv_file.name.lower()

        if not any(
            file_name.endswith(extension)
            for extension in allowed_extensions
        ):
            return Response(
                {
                    "detail": (
                        "Only PDF, DOC, and DOCX files are allowed."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Delete old CV file from storage
        if profile.cv:
            profile.cv.delete(save=False)

        profile.cv = cv_file
        profile.save(update_fields=["cv", "updated_at"])

        serializer = StudentProfileSerializer(profile)

        return Response(
            {
                "message": "CV uploaded successfully.",
                "profile": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def delete(self, request):
        """
        Remove the student's CV.
        """

        profile = self.get_profile(request.user)

        if not profile.cv:
            return Response(
                {
                    "detail": "No CV found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        profile.cv.delete(save=False)
        profile.cv = None
        profile.save(update_fields=["cv", "updated_at"])

        return Response(
            {
                "message": "CV deleted successfully."
            },
            status=status.HTTP_200_OK,
        )