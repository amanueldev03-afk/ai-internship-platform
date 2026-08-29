from django.db import models

from apps.common.models import TimeStampedModel


class Company(TimeStampedModel):
    """
    Organisation that publishes internships (Section 3.6).

    Listings belong to a company; collection from career pages still
    goes through DataSource. One Company has many Internships.
    """

    name = models.CharField(
        max_length=300,
        unique=True,
        db_index=True,
    )

    website = models.URLField(
        blank=True,
    )

    country = models.CharField(
        max_length=100,
        blank=True,
    )

    industry = models.CharField(
        max_length=150,
        blank=True,
    )

    class Meta:
        ordering = ["name"]
        verbose_name = "Company"
        verbose_name_plural = "Companies"

    def __str__(self):
        return self.name
