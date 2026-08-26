from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone
from django.conf import settings
from pgvector.django import VectorField


class Skill(models.Model):
    """
    Reusable skill used by students and internships.
    """

    name = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
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

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


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

    STATUS_DRAFT = "draft"
    STATUS_ACTIVE = "active"
    STATUS_REJECTED = "rejected"
    STATUS_EXPIRED = "expired"

    STATUS_CHOICES = [
        (STATUS_DRAFT, "Draft"),
        (STATUS_ACTIVE, "Active"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_EXPIRED, "Expired"),
    ]

    # ==========================================================
    # EMBEDDING STATUS
    # ==========================================================

    EMBEDDING_STATUS_PENDING = "PENDING"
    EMBEDDING_STATUS_PROCESSING = "PROCESSING"
    EMBEDDING_STATUS_COMPLETED = "COMPLETED"
    EMBEDDING_STATUS_FAILED = "FAILED"

    EMBEDDING_STATUS_CHOICES = [
        (EMBEDDING_STATUS_PENDING, "Pending"),
        (EMBEDDING_STATUS_PROCESSING, "Processing"),
        (EMBEDDING_STATUS_COMPLETED, "Completed"),
        (EMBEDDING_STATUS_FAILED, "Failed"),
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
    #   EMBEDDING
    # ==========================================================

    embedding = VectorField(
        dimensions=384,
        null=True,
        blank=True,
    )

    embedding_status = models.CharField(
        max_length=20,
        choices=EMBEDDING_STATUS_CHOICES,
        default=EMBEDDING_STATUS_PENDING,
    )

    embedding_error = models.TextField(
        blank=True,
        null=True,
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

    required_skills = models.ManyToManyField(
        Skill,
        blank=True,
        related_name="internships",
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
        default=STATUS_DRAFT,
    )

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_internships",
    )

    rejection_reason = models.TextField(
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




class InternshipCollectionLog(models.Model):
    """
    Records the result of an internship collection run.
    """

    STATUS_CHOICES = [
        ("running", "Running"),
        ("success", "Success"),
        ("partial", "Partial"),
        ("failed", "Failed"),
    ]

    source = models.ForeignKey(
        InternshipSource,
        on_delete=models.CASCADE,
        related_name="collection_logs",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="running",
    )

    started_at = models.DateTimeField(
        auto_now_add=True,
    )

    completed_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    records_found = models.PositiveIntegerField(
        default=0,
    )

    records_created = models.PositiveIntegerField(
        default=0,
    )

    records_updated = models.PositiveIntegerField(
        default=0,
    )

    records_failed = models.PositiveIntegerField(
        default=0,
    )

    error_message = models.TextField(
        blank=True,
    )

    def __str__(self):
        return (
            f"{self.source.name} - "
            f"{self.status} - "
            f"{self.started_at}"
        )

    class Meta:
        ordering = ["-started_at"]




class SavedInternship(models.Model):
    """
    An internship saved by a student.
    """

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="saved_internships",
    )

    internship = models.ForeignKey(
        Internship,
        on_delete=models.CASCADE,
        related_name="saved_by_students",
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-created_at"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "internship",
                ],
                name="unique_student_saved_internship",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student.email} - "
            f"{self.internship.title}"
        )



class InternshipApplication(models.Model):
    """
    Tracks a student's application to an internship.

    The actual application is submitted on the
    official organization's website.
    """

    STATUS_APPLIED = "applied"
    STATUS_INTERVIEW = "interview"
    STATUS_ACCEPTED = "accepted"
    STATUS_REJECTED = "rejected"
    STATUS_WITHDRAWN = "withdrawn"

    STATUS_CHOICES = [
        (STATUS_APPLIED, "Applied"),
        (STATUS_INTERVIEW, "Interview"),
        (STATUS_ACCEPTED, "Accepted"),
        (STATUS_REJECTED, "Rejected"),
        (STATUS_WITHDRAWN, "Withdrawn"),
    ]

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="internship_applications",
    )

    internship = models.ForeignKey(
        Internship,
        on_delete=models.CASCADE,
        related_name="student_applications",
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_APPLIED,
    )

    applied_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    notes = models.TextField(
        blank=True,
    )

    class Meta:
        ordering = ["-applied_at"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "internship",
                ],
                name="unique_student_internship_application",
            ),
        ]

    def __str__(self):
        return (
            f"{self.student.email} - "
            f"{self.internship.title} - "
            f"{self.status}"
        )


class Recommendation(models.Model):
    """
    Stores recommendation history with detailed scoring and feedback tracking.
    This enables persistent recommendation behavior for future ML personalization.
    """

    # ==========================================================
    # FEEDBACK STATUS CHOICES
    # ==========================================================

    STATUS_RECOMMENDED = "recommended"
    STATUS_VIEWED = "viewed"
    STATUS_SAVED = "saved"
    STATUS_APPLIED = "applied"
    STATUS_IGNORED = "ignored"

    STATUS_CHOICES = [
        (STATUS_RECOMMENDED, "Recommended"),
        (STATUS_VIEWED, "Viewed"),
        (STATUS_SAVED, "Saved"),
        (STATUS_APPLIED, "Applied"),
        (STATUS_IGNORED, "Ignored"),
    ]

    # ==========================================================
    # CORE RELATIONSHIPS
    # ==========================================================

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )

    internship = models.ForeignKey(
        Internship,
        on_delete=models.CASCADE,
        related_name="recommendations",
    )

    # ==========================================================
    # SCORE BREAKDOWN (0-100)
    # ==========================================================

    overall_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        help_text="Final weighted score (0-100)",
    )

    skill_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Skill matching score (0-100)",
    )

    education_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Education relevance score (0-100)",
    )

    interest_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Interest/career preference score (0-100)",
    )

    experience_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Experience relevance score (0-100)",
    )

    location_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Location match score (0-100)",
    )

    # ==========================================================
    # FEEDBACK TRACKING
    # ==========================================================

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=STATUS_RECOMMENDED,
    )

    recommendation_date = models.DateTimeField(
        auto_now_add=True,
        help_text="When this recommendation was generated",
    )

    viewed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the student viewed this recommendation",
    )

    saved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the student saved this internship",
    )

    applied_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the student applied to this internship",
    )

    ignored_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the student ignored this recommendation",
    )

    # ==========================================================
    # METADATA
    # ==========================================================

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-recommendation_date"]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "student",
                    "internship",
                ],
                name="unique_student_internship_recommendation",
            ),
        ]

        indexes = [
            models.Index(
                fields=["student", "status"],
            ),
            models.Index(
                fields=["internship", "status"],
            ),
            models.Index(
                fields=["overall_score"],
            ),
            models.Index(
                fields=["recommendation_date"],
            ),
        ]

    def __str__(self):
        return (
            f"{self.student.email} - "
            f"{self.internship.title} - "
            f"{self.overall_score:.2f}% - "
            f"{self.status}"
        )

    def mark_viewed(self):
        """Mark recommendation as viewed."""
        self.status = self.STATUS_VIEWED
        self.viewed_at = timezone.now()
        self.save(update_fields=["status", "viewed_at", "updated_at"])

    def mark_saved(self):
        """Mark recommendation as saved."""
        self.status = self.STATUS_SAVED
        self.saved_at = timezone.now()
        self.save(update_fields=["status", "saved_at", "updated_at"])

    def mark_applied(self):
        """Mark recommendation as applied."""
        self.status = self.STATUS_APPLIED
        self.applied_at = timezone.now()
        self.save(update_fields=["status", "applied_at", "updated_at"])

    def mark_ignored(self):
        """Mark recommendation as ignored."""
        self.status = self.STATUS_IGNORED
        self.ignored_at = timezone.now()
        self.save(update_fields=["status", "ignored_at", "updated_at"])