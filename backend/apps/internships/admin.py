from django.contrib import admin

from .models import (
    Internship,
    InternshipSource,
    InternshipCollectionLog,
    SavedInternship,
    InternshipApplication,
    Skill,
    Recommendation,
)

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




@admin.register(InternshipCollectionLog)
class InternshipCollectionLogAdmin(admin.ModelAdmin):
    list_display = [
        "source",
        "status",
        "records_found",
        "records_created",
        "records_updated",
        "records_failed",
        "started_at",
        "completed_at",
    ]

    list_filter = [
        "status",
        "source",
    ]

    search_fields = [
        "source__name",
        "error_message",
    ]

    readonly_fields = [
        "source",
        "status",
        "started_at",
        "completed_at",
        "records_found",
        "records_created",
        "records_updated",
        "records_failed",
        "error_message",
    ]

    ordering = [
        "-started_at",
    ]



@admin.register(SavedInternship)
class SavedInternshipAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "internship",
        "created_at",
    ]

    search_fields = [
        "student__email",
        "internship__title",
        "internship__organization_name",
    ]

    list_filter = [
        "created_at",
    ]

    readonly_fields = [
        "created_at",
    ]

    ordering = [
        "-created_at",
    ]




@admin.register(InternshipApplication)
class InternshipApplicationAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "internship",
        "status",
        "applied_at",
        "updated_at",
    ]

    list_filter = [
        "status",
        "applied_at",
        "updated_at",
    ]

    search_fields = [
        "student__email",
        "internship__title",
        "internship__organization_name",
    ]

    readonly_fields = [
        "student",
        "internship",
        "applied_at",
        "updated_at",
    ]

    ordering = [
        "-applied_at",
    ]


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = [
        "name",
        "is_active",
        "created_at",
        "updated_at",
    ]

    list_filter = [
        "is_active",
    ]

    search_fields = [
        "name",
        "description",
    ]

    ordering = [
        "name",
    ]


@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = [
        "student",
        "internship",
        "overall_score",
        "status",
        "recommendation_date",
    ]

    list_filter = [
        "status",
        "recommendation_date",
    ]

    search_fields = [
        "student__email",
        "internship__title",
        "internship__organization_name",
    ]

    readonly_fields = [
        "student",
        "internship",
        "overall_score",
        "skill_score",
        "education_score",
        "interest_score",
        "experience_score",
        "location_score",
        "recommendation_date",
        "viewed_at",
        "saved_at",
        "applied_at",
        "ignored_at",
        "created_at",
        "updated_at",
    ]

    ordering = [
        "-recommendation_date",
    ]

    fieldsets = [
        (
            "Core Information",
            {
                "fields": [
                    "student",
                    "internship",
                    "status",
                ]
            },
        ),
        (
            "Score Breakdown",
            {
                "fields": [
                    "overall_score",
                    "skill_score",
                    "education_score",
                    "interest_score",
                    "experience_score",
                    "location_score",
                ]
            },
        ),
        (
            "Feedback Timeline",
            {
                "fields": [
                    "recommendation_date",
                    "viewed_at",
                    "saved_at",
                    "applied_at",
                    "ignored_at",
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