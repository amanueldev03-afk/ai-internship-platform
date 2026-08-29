from rest_framework import serializers

from .models import (
    StudentProfile,
    StudentCV,
    CV as CVModel,
)

from apps.internships.services.embedding_service import (
    regenerate_student_embedding,
)


def _get_cv_data(profile) -> dict:
    """
    Build a merged CV data block for a StudentProfile instance.

    Priority:
      1. Newest completed CV model (async Celery pipeline)
      2. Any CV model record (still processing / failed)
      3. Legacy StudentCV record

    Returned dict is always present; `has_cv` tells the caller whether
    any CV has been uploaded.
    """
    user = getattr(profile, "user", None)
    if not user:
        return {"has_cv": False}

    try:
        # 1 — newest completed async CV
        cv = (
            CVModel.objects
            .filter(student=user, processing_status=CVModel.STATUS_COMPLETED)
            .order_by("-created_at")
            .first()
        )

        # 2 — any async CV (still processing or failed)
        if not cv:
            cv = (
                CVModel.objects
                .filter(student=user)
                .order_by("-created_at")
                .first()
            )

        # 3 — legacy StudentCV
        if not cv:
            cv = StudentCV.objects.filter(student=user).first()

        if not cv:
            return {"has_cv": False, "message": "No CV uploaded yet."}

        proc_status = getattr(cv, "processing_status", "COMPLETED")

        # Merge: manual profile skills + CV extracted skills (deduplicated)
        profile_skill_names = list(
            profile.skills.values_list("name", flat=True)
        )
        cv_extracted_skills = getattr(cv, "extracted_skills", []) or []

        seen = set()
        merged_skills = []
        for s in profile_skill_names + cv_extracted_skills:
            key = str(s).lower().strip()
            if key and key not in seen:
                seen.add(key)
                merged_skills.append(s)

        uploaded_at = (
            getattr(cv, "uploaded_at", None)
            or getattr(cv, "created_at", None)
        )

        return {
            "has_cv":            True,
            "processing_status": proc_status,
            # merged: profile manual + CV extracted (deduplicated)
            "merged_skills":     merged_skills,
            # raw CV extracted fields
            "extracted_skills":        cv_extracted_skills,
            "extracted_education":     getattr(cv, "extracted_education",     []) or [],
            "extracted_experience":    getattr(cv, "extracted_experience",    []) or [],
            "extracted_projects":      getattr(cv, "extracted_projects",      []) or [],
            "extracted_certifications": getattr(cv, "extracted_certifications", []) or [],
            "uploaded_at": (
                uploaded_at.isoformat() if uploaded_at else None
            ),
        }

    except Exception:
        return {"has_cv": False, "message": "CV data temporarily unavailable."}


class StudentProfileSerializer(serializers.ModelSerializer):
    """
    Full profile serializer.

    `cv_data` is a read-only computed field that exposes:
      - whether a CV has been uploaded and its processing status
      - raw extracted fields (skills, education, experience, projects, certs)
      - merged_skills: manual profile skills + CV-extracted skills, deduplicated
    """

    user = serializers.PrimaryKeyRelatedField(read_only=True)

    # Read-only computed field — not stored on the model
    cv_data = serializers.SerializerMethodField(
        help_text=(
            "CV processing status and extracted data merged with manual profile skills."
        )
    )

    def get_cv_data(self, obj) -> dict:
        return _get_cv_data(obj)

    def perform_create(self, serializer):
        profile = serializer.save()
        regenerate_student_embedding(profile)

    class Meta:
        model = StudentProfile

        fields = [
            "id",
            "user",

            # Personal
            "phone",
            "country",
            "city",
            "date_of_birth",
            "bio",

            # Education
            "education_level",
            "field_of_study",
            "university",

            # Skills & experience (read-only — use POST /api/profile/skills/add/ to change)
            "skills",
            "interests",
            "experience",

            # Preferences
            "internship_type",
            "work_type",
            "compensation_preference",
            "minimum_compensation",
            "maximum_compensation",
            "compensation_currency",

            # Location
            "preferred_locations",
            "willing_to_relocate",

            # Career
            "preferred_industries",
            "preferred_roles",

            # Duration
            "internship_duration_min_weeks",
            "internship_duration_max_weeks",
            "available_from",

            # CV file (raw upload path)
            "cv",

            # Computed CV data block
            "cv_data",

            # Timestamps
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "user",
            "skills",        # managed via POST /api/profile/skills/add/ only
            "cv_data",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        compensation_preference = attrs.get(
            "compensation_preference",
            getattr(self.instance, "compensation_preference", "either"),
        )
        minimum_compensation = attrs.get(
            "minimum_compensation",
            getattr(self.instance, "minimum_compensation", None),
        )
        maximum_compensation = attrs.get(
            "maximum_compensation",
            getattr(self.instance, "maximum_compensation", None),
        )

        if compensation_preference == "paid":
            if minimum_compensation is None:
                raise serializers.ValidationError({
                    "minimum_compensation": (
                        "Minimum compensation is required for paid internships."
                    )
                })
            if maximum_compensation is None:
                raise serializers.ValidationError({
                    "maximum_compensation": (
                        "Maximum compensation is required for paid internships."
                    )
                })
            if minimum_compensation > maximum_compensation:
                raise serializers.ValidationError({
                    "maximum_compensation": (
                        "Maximum compensation must be greater than or equal "
                        "to minimum compensation."
                    )
                })

        min_duration = attrs.get(
            "internship_duration_min_weeks",
            getattr(self.instance, "internship_duration_min_weeks", None),
        )
        max_duration = attrs.get(
            "internship_duration_max_weeks",
            getattr(self.instance, "internship_duration_max_weeks", None),
        )

        if (
            min_duration is not None
            and max_duration is not None
            and min_duration > max_duration
        ):
            raise serializers.ValidationError({
                "internship_duration_max_weeks": (
                    "Maximum duration must be greater than or equal "
                    "to minimum duration."
                )
            })

        return attrs


class StudentCVSerializer(serializers.ModelSerializer):

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
            "created_at",
            "updated_at",
        )
        read_only_fields = (
            "id",
            "extracted_skills",
            "extracted_education",
            "extracted_experience",
            "extracted_projects",
            "extracted_certifications",
            "created_at",
            "updated_at",
        )


class AddStudentSkillsSerializer(serializers.Serializer):
    """Add skills to a student profile by skill IDs."""

    skill_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of skill IDs to add to the profile.",
    )


class StudentPreferencesSerializer(serializers.Serializer):
    """Update student internship preferences."""

    work_mode = serializers.ChoiceField(
        choices=["remote", "onsite", "hybrid", "any"],
        required=False,
        help_text="Preferred work mode (remote, onsite, hybrid, any).",
    )
    internship_type = serializers.ChoiceField(
        choices=["full_time", "part_time", "either"],
        required=False,
        help_text="Preferred work commitment (full_time, part_time, either).",
    )
    paid_only = serializers.BooleanField(
        required=False,
        help_text="True = paid internships only.",
    )
    min_paid = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        required=False, allow_null=True,
        help_text="Minimum desired compensation.",
    )
    max_paid = serializers.DecimalField(
        max_digits=12, decimal_places=2,
        required=False, allow_null=True,
        help_text="Maximum desired compensation.",
    )
    preferred_countries = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        help_text="Preferred countries / locations.",
    )
    preferred_categories = serializers.ListField(
        child=serializers.CharField(max_length=100),
        required=False,
        help_text="Preferred categories or industries.",
    )
