# Create your models here.
from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    Custom user model for the AI Internship Recommendation Platform.
    """

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        ADMIN = "admin", "Administrator"

    email = models.EmailField(
        unique=True,
        verbose_name="Email Address",
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    is_email_verified = models.BooleanField(
        default=False,
    )

    USERNAME_FIELD = "email"

    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.email