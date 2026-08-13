from rest_framework import serializers
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field, OpenApiTypes

from .models import Internship, InternshipSource


class InternshipSourceSerializer(serializers.ModelSerializer):
    """
    Serializer for internship sources.
    """

    class Meta:
        model = InternshipSource

        fields = [
            "id",
            "name",
            "source_type",
            "website_url",
            "description",
            "is_active",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class InternshipSerializer(serializers.ModelSerializer):
    """
    Serializer for internship opportunities.
    """

    source_name = serializers.CharField(
        source="source.name",
        read_only=True,
        help_text="Name of the internship source"
    )

    is_expired = serializers.SerializerMethodField(
        help_text="Whether the internship application deadline has passed"
    )

    class Meta:
        model = Internship

        fields = [
            "id",

            # Basic information
            "title",
            "organization_name",
            "description",
            "category",

            # Location
            "country",
            "city",
            "location_text",
            "internship_type",

            # Work
            "work_type",

            # Compensation
            "compensation_type",
            "minimum_compensation",
            "maximum_compensation",
            "compensation_currency",
            "compensation_period",

            # Skills
            "required_skills",
            "preferred_skills",

            # Duration
            "duration_min_weeks",
            "duration_max_weeks",

            # Application/source
            "application_url",
            "source",
            "source_name",
            "source_url",
            "external_id",

            # Dates
            "posted_at",
            "application_deadline",

            # Status
            "is_verified",
            "is_expired",
            "status",

            # Timestamps
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "source_name",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        """
        Validate internship data.
        """

        compensation_type = attrs.get(
            "compensation_type",
            getattr(
                self.instance,
                "compensation_type",
                "unknown",
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

        if compensation_type == "paid":

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

        min_duration = attrs.get(
            "duration_min_weeks",
            getattr(
                self.instance,
                "duration_min_weeks",
                None,
            ),
        )

        max_duration = attrs.get(
            "duration_max_weeks",
            getattr(
                self.instance,
                "duration_max_weeks",
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
                    "duration_max_weeks": (
                        "Maximum duration must be greater "
                        "than or equal to minimum duration."
                    )
                }
            )

        return attrs

    def get_is_expired(self, obj):
        """
        Return whether the internship deadline has passed.
        """

        return obj.is_expired()