from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone


class InternshipSource(models.Model):
    """
    Represents the authorized source from which internships are collected.
    """

    SOURCE_TYPE_CHOICES = [
        ("api", "API"),
        ("website", "Website"),
        ("organization", "Organization"),
        ("other", "Other"),
    ]

    name = models.CharField(
        max_length=200,
        unique=True,
    )

    source_type = models.CharField(
        max_length=20,
        choices=SOURCE_TYPE_CHOICES,
    )

    website_url = models.URLField(
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    def __str__(self):
        return self.name

    class Meta:
        ordering = ["name"]


class Internship(models.Model):
    """
    Represents a real internship opportunity.
    """

    # ==========================================================
    # CHOICES
    # ==========================================================

    INTERNSHIP_TYPE_CHOICES = [
        ("remote", "Remote"),
        ("onsite", "On-site"),
        ("hybrid", "Hybrid"),
    ]

    COMPENSATION_TYPE_CHOICES = [
        ("paid", "Paid"),
        ("unpaid", "Unpaid"),
        ("unknown", "Unknown"),
    ]

    WORK_TYPE_CHOICES = [
        ("full_time", "Full-time"),
        ("part_time", "Part-time"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("expired", "Expired"),
        ("closed", "Closed"),
    ]

    # ==========================================================
    # BASIC INFORMATION
    # ==========================================================

    title = models.CharField(
        max_length=300,
    )

    organization_name = models.CharField(
        max_length=300,
    )

    description = models.TextField()

    category = models.CharField(
        max_length=150,
        blank=True,
    )

    # ==========================================================
    # LOCATION
    # ==========================================================

    country = models.CharField(
        max_length=100,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    location_text = models.CharField(
        max_length=300,
        blank=True,
    )

    internship_type = models.CharField(
        max_length=20,
        choices=INTERNSHIP_TYPE_CHOICES,
    )

    # ==========================================================
    # WORK TYPE
    # ==========================================================

    work_type = models.CharField(
        max_length=20,
        choices=WORK_TYPE_CHOICES,
    )

    # ==========================================================
    # COMPENSATION
    # ==========================================================

    compensation_type = models.CharField(
        max_length=20,
        choices=COMPENSATION_TYPE_CHOICES,
        default="unknown",
    )

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
        blank=True,
    )

    compensation_period = models.CharField(
        max_length=30,
        blank=True,
        help_text="Example: monthly, hourly, total",
    )

    # ==========================================================
    # SKILLS
    # ==========================================================

    required_skills = models.JSONField(
        default=list,
        blank=True,
    )

    preferred_skills = models.JSONField(
        default=list,
        blank=True,
    )

    # ==========================================================
    # INTERNSHIP DETAILS
    # ==========================================================

    duration_min_weeks = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    duration_max_weeks = models.PositiveIntegerField(
        null=True,
        blank=True,
    )

    # ==========================================================
    # APPLICATION
    # ==========================================================

    application_url = models.URLField()

    source = models.ForeignKey(
        InternshipSource,
        on_delete=models.PROTECT,
        related_name="internships",
    )

    source_url = models.URLField(
        blank=True,
    )

    external_id = models.CharField(
        max_length=300,
        blank=True,
    )

    # ==========================================================
    # DATES
    # ==========================================================

    posted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    application_deadline = models.DateTimeField(
        null=True,
        blank=True,
    )

    # ==========================================================
    # VERIFICATION / STATUS
    # ==========================================================

    is_verified = models.BooleanField(
        default=False,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="draft",
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


    def is_expired(self):
        """
        Return True when the application deadline has passed.
        """

        if self.application_deadline is None:
            return False

        return self.application_deadline <= timezone.now()


    def expire_if_needed(self):
        """
        Automatically mark the internship as expired
        when its deadline has passed.
        """

        if self.is_expired() and self.status == "active":
            self.status = "expired"

            self.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )

            return True

        return False

        
    # ==========================================================
    # VALIDATION
    # ==========================================================

    def clean(self):
        errors = {}

        # Paid internship compensation validation
        if self.compensation_type == "paid":

            if self.minimum_compensation is None:
                errors["minimum_compensation"] = (
                    "Minimum compensation is required "
                    "for paid internships."
                )

            if self.maximum_compensation is None:
                errors["maximum_compensation"] = (
                    "Maximum compensation is required "
                    "for paid internships."
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

        # Duration validation
        if (
            self.duration_min_weeks is not None
            and self.duration_max_weeks is not None
            and self.duration_min_weeks
            > self.duration_max_weeks
        ):
            errors["duration_max_weeks"] = (
                "Maximum duration must be greater "
                "than or equal to minimum duration."
            )

        if errors:
            raise ValidationError(errors)

    def __str__(self):
        return f"{self.title} - {self.organization_name}"

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["status"],
            ),
            models.Index(
                fields=["country", "city"],
            ),
            models.Index(
                fields=["internship_type"],
            ),
            models.Index(
                fields=["compensation_type"],
            ),
            models.Index(
                fields=["application_deadline"],
            ),
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "source",
                    "external_id",
                ],
                name="unique_internship_source_external_id",
            ),
        ]