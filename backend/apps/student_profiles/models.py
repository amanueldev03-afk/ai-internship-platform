from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models


class StudentProfile(models.Model):
    """
    Stores academic, personal, professional, and internship
    preferences for a student.
    """

    EDUCATION_LEVEL_CHOICES = [
        ("high_school", "High School"),
        ("diploma", "Diploma"),
        ("bachelor", "Bachelor"),
        ("master", "Master"),
        ("phd", "PhD"),
        ("other", "Other"),
    ]

    INTERNSHIP_TYPE_CHOICES = [
        ("remote", "Remote"),
        ("onsite", "On-site"),
        ("hybrid", "Hybrid"),
        ("any", "Any"),
    ]

    COMPENSATION_CHOICES = [
        ("paid", "Paid"),
        ("unpaid", "Unpaid"),
        ("either", "Either"),
    ]

    WORK_TYPE_CHOICES = [
        ("full_time", "Full-time"),
        ("part_time", "Part-time"),
        ("either", "Either"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student_profile",
    )

    # ==========================================================
    # PERSONAL INFORMATION
    # ==========================================================

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    country = models.CharField(
        max_length=100,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    bio = models.TextField(
        blank=True,
    )

    # ==========================================================
    # EDUCATION
    # ==========================================================

    education_level = models.CharField(
        max_length=20,
        choices=EDUCATION_LEVEL_CHOICES,
        blank=True,
    )

    field_of_study = models.CharField(
        max_length=150,
        blank=True,
    )

    university = models.CharField(
        max_length=200,
        blank=True,
    )

    # ==========================================================
    # SKILLS & EXPERIENCE
    # ==========================================================

    skills = models.JSONField(
        default=list,
        blank=True,
    )

    interests = models.JSONField(
        default=list,
        blank=True,
    )

    experience = models.TextField(
        blank=True,
    )

    # ==========================================================
    # INTERNSHIP PREFERENCES
    # ==========================================================

    internship_type = models.CharField(
        max_length=20,
        choices=INTERNSHIP_TYPE_CHOICES,
        default="any",
    )

    work_type = models.CharField(
        max_length=20,
        choices=WORK_TYPE_CHOICES,
        default="either",
    )

    compensation_preference = models.CharField(
        max_length=20,
        choices=COMPENSATION_CHOICES,
        default="either",
    )

    # ==========================================================
    # COMPENSATION RANGE
    # ==========================================================

    minimum_compensation = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    maximum_compensation = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    compensation_currency = models.CharField(
        max_length=10,
        default="USD",
    )

    # ==========================================================
    # LOCATION PREFERENCES
    # ==========================================================

    preferred_locations = models.JSONField(
        default=list,
        blank=True,
    )

    willing_to_relocate = models.BooleanField(
        default=False,
    )

    # ==========================================================
    # CAREER PREFERENCES
    # ==========================================================

    preferred_industries = models.JSONField(
        default=list,
        blank=True,
    )

    preferred_roles = models.JSONField(
        default=list,
        blank=True,
    )

    # ==========================================================
    # INTERNSHIP DURATION
    # ==========================================================

    internship_duration_min_weeks = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    internship_duration_max_weeks = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    available_from = models.DateField(
        null=True,
        blank=True,
    )

    # ==========================================================
    # CV
    # ==========================================================

    cv = models.FileField(
        upload_to="student_cvs/",
        null=True,
        blank=True,
    )

    # ==========================================================
    # TIMESTAMPS
    # ==========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    # ==========================================================
    # VALIDATION
    # ==========================================================

    def clean(self):
        errors = {}

        # Paid internship compensation validation
        if self.compensation_preference == "paid":

            if self.minimum_compensation is None:
                errors["minimum_compensation"] = (
                    "Minimum compensation is required "
                    "when paid internships are selected."
                )

            if self.maximum_compensation is None:
                errors["maximum_compensation"] = (
                    "Maximum compensation is required "
                    "when paid internships are selected."
                )

            if (
                self.minimum_compensation is not None
                and self.maximum_compensation is not None
                and self.minimum_compensation
                > self.maximum_compensation
            ):
                errors["maximum_compensation"] = (
                    "Maximum compensation must be greater "
                    "than or equal to minimum compensation."
                )

        # Internship duration validation
        if (
            self.internship_duration_min_weeks is not None
            and self.internship_duration_max_weeks is not None
            and self.internship_duration_min_weeks
            > self.internship_duration_max_weeks
        ):
            errors["internship_duration_max_weeks"] = (
                "Maximum duration must be greater "
                "than or equal to minimum duration."
            )

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.user.email} - Student Profile"

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Student Profile"
        verbose_name_plural = "Student Profiles"