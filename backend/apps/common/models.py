"""
common/models.py — Shared abstract base models.

All domain models that need audit timestamps inherit TimeStampedModel
instead of defining created_at / updated_at individually.

Models that inherit this (per Section 3.8.4 of the design spec):
  - Skill
  - InternshipSource
  - Internship
  - InternshipApplication  (was: applied_at / updated_at)
  - SavedInternship        (was: created_at only — updated_at added via base)
  - StudentProfile
  - StudentCV
  - CV
  - Recommendation

NOT inheriting (intentional exceptions):
  - User  — already extends AbstractUser which has its own date_joined
             field; we add created_at/updated_at as plain fields there
             to avoid MRO conflicts with AbstractUser.
  - InternshipCollectionLog — uses started_at/completed_at semantics,
             not created/updated — intentionally left standalone.
"""

from django.db import models


class TimeStampedModel(models.Model):
    """
    Abstract base model that provides self-managed ``created_at`` and
    ``updated_at`` fields to any model that inherits it.

    - ``created_at`` is set once on INSERT and never changes.
    - ``updated_at`` is refreshed on every UPDATE automatically.

    Usage::

        class MyModel(TimeStampedModel):
            name = models.CharField(max_length=100)
            # created_at and updated_at are inherited automatically

    Both fields use ``auto_now_add`` / ``auto_now`` so they are managed
    entirely by Django — no manual assignment needed or allowed.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="Timestamp when this record was created.",
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when this record was last updated.",
    )

    class Meta:
        abstract = True
        # Subclasses default to newest-first ordering unless overridden.
        ordering = ["-created_at"]
