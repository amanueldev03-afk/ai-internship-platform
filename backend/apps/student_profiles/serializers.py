from rest_framework import serializers

from .models import (
    StudentProfile,
    StudentCV,
)

from apps.internships.services.embedding_service import (
    regenerate_student_embedding,
)


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for the authenticated student's profile.
    """

    user = serializers.PrimaryKeyRelatedField(
        read_only=True,
    )

    def perform_create(self, serializer):

        Profile = serializer.save()

        regenerate_student_embedding(
            Profile
        )

    class Meta:
        model = StudentProfile

        fields = [
            "id",
            "user",

            # Personal information
            "phone",
            "country",
            "city",
            "date_of_birth",
            "bio",

            # Education
            "education_level",
            "field_of_study",
            "university",

            # Skills and experience
            "skills",
            "interests",
            "experience",

            # Internship preferences
            "internship_type",
            "work_type",
            "compensation_preference",

            # Compensation
            "minimum_compensation",
            "maximum_compensation",
            "compensation_currency",

            # Location
            "preferred_locations",
            "willing_to_relocate",

            # Career preferences
            "preferred_industries",
            "preferred_roles",

            # Duration
            "internship_duration_min_weeks",
            "internship_duration_max_weeks",
            "available_from",

            # CV
            "cv",

            # Timestamps
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        """
        Validate student internship preferences.
        """

        compensation_preference = attrs.get(
            "compensation_preference",
            getattr(
                self.instance,
                "compensation_preference",
                "either",
            ),
        )

        minimum_compensation = attrs.get(
            "minimum_compensation",
            getattr(
                self.instance,
                "minimum_compensation",
                None,
            ),
        )

        maximum_compensation = attrs.get(
            "maximum_compensation",
            getattr(
                self.instance,
                "maximum_compensation",
                None,
            ),
        )

        # Paid internship requires compensation range
        if compensation_preference == "paid":

            if minimum_compensation is None:
                raise serializers.ValidationError(
                    {
                        "minimum_compensation": (
                            "Minimum compensation is required "
                            "for paid internships."
                        )
                    }
                )

            if maximum_compensation is None:
                raise serializers.ValidationError(
                    {
                        "maximum_compensation": (
                            "Maximum compensation is required "
                            "for paid internships."
                        )
                    }
                )

            if minimum_compensation > maximum_compensation:
                raise serializers.ValidationError(
                    {
                        "maximum_compensation": (
                            "Maximum compensation must be greater "
                            "than or equal to minimum compensation."
                        )
                    }
                )

        # Duration validation
        min_duration = attrs.get(
            "internship_duration_min_weeks",
            getattr(
                self.instance,
                "internship_duration_min_weeks",
                None,
            ),
        )

        max_duration = attrs.get(
            "internship_duration_max_weeks",
            getattr(
                self.instance,
                "internship_duration_max_weeks",
                None,
            ),
        )

        if (
            min_duration is not None
            and max_duration is not None
            and min_duration > max_duration
        ):
            raise serializers.ValidationError(
                {
                    "internship_duration_max_weeks": (
                        "Maximum duration must be greater "
                        "than or equal to minimum duration."
                    )
                }
            )

        return attrs



class StudentCVSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = StudentCV

        fields = (
            "id",
            "file",
            "extracted_skills",
            "extracted_education",
            "extracted_experience",
            "extracted_projects",
            "extracted_certifications",
            "uploaded_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "extracted_skills",
            "extracted_education",
            "extracted_experience",
            "extracted_projects",
            "extracted_certifications",
            "uploaded_at",
            "updated_at",
        )