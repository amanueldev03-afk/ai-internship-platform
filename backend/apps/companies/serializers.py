from rest_framework import serializers

from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """
    Serializer for Company (Section 3.6 / Phase 4 Task 4.1).

    Only an administrator may create/update/delete companies, so the full
    field set is writable through the admin-only endpoints.
    """

    internship_count = serializers.IntegerField(
        read_only=True,
        help_text="Number of internships published by this company.",
    )

    class Meta:
        model = Company
        fields = [
            "id",
            "name",
            "website",
            "country",
            "industry",
            "internship_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "internship_count",
            "created_at",
            "updated_at",
        ]