from django.contrib import admin

from .models import Internship, InternshipSource


@admin.register(InternshipSource)
class InternshipSourceAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "source_type",
        "is_active",
        "created_at",
    ]

    list_filter = [
        "source_type",
        "is_active",
    ]

    search_fields = [
        "name",
        "website_url",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "organization_name",
        "internship_type",
        "compensation_type",
        "country",
        "status",
        "is_verified",
        "application_deadline",
    ]

    list_filter = [
        "status",
        "is_verified",
        "internship_type",
        "work_type",
        "compensation_type",
        "country",
    ]

    search_fields = [
        "title",
        "organization_name",
        "description",
        "category",
        "country",
        "city",
        "required_skills",
    ]

    ordering = [
        "-created_at",
    ]

    readonly_fields = [
        "created_at",
        "updated_at",
    ]

    fieldsets = [
        (
            "Basic Information",
            {
                "fields": [
                    "title",
                    "organization_name",
                    "description",
                    "category",
                ]
            },
        ),
        (
            "Location",
            {
                "fields": [
                    "country",
                    "city",
                    "location_text",
                    "internship_type",
                ]
            },
        ),
        (
            "Work",
            {
                "fields": [
                    "work_type",
                ]
            },
        ),
        (
            "Compensation",
            {
                "fields": [
                    "compensation_type",
                    "minimum_compensation",
                    "maximum_compensation",
                    "compensation_currency",
                    "compensation_period",
                ]
            },
        ),
        (
            "Skills",
            {
                "fields": [
                    "required_skills",
                    "preferred_skills",
                ]
            },
        ),
        (
            "Duration",
            {
                "fields": [
                    "duration_min_weeks",
                    "duration_max_weeks",
                ]
            },
        ),
        (
            "Application",
            {
                "fields": [
                    "application_url",
                    "source",
                    "source_url",
                    "external_id",
                ]
            },
        ),
        (
            "Dates",
            {
                "fields": [
                    "posted_at",
                    "application_deadline",
                ]
            },
        ),
        (
            "Verification",
            {
                "fields": [
                    "is_verified",
                    "status",
                ]
            },
        ),
        (
            "System",
            {
                "fields": [
                    "created_at",
                    "updated_at",
                ]
            },
        ),
    ]