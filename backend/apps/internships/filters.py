import django_filters

from .models import Internship


class InternshipFilter(django_filters.FilterSet):
    """
    Filters for active and verified internships.
    """

    country = django_filters.CharFilter(
        field_name="country",
        lookup_expr="iexact",
    )

    city = django_filters.CharFilter(
        field_name="city",
        lookup_expr="iexact",
    )

    category = django_filters.CharFilter(
        field_name="category",
        lookup_expr="iexact",
    )

    internship_type = django_filters.ChoiceFilter(
        choices=Internship.INTERNSHIP_TYPE_CHOICES,
    )

    work_type = django_filters.ChoiceFilter(
        choices=Internship.WORK_TYPE_CHOICES,
    )

    compensation_type = django_filters.ChoiceFilter(
        choices=Internship.COMPENSATION_TYPE_CHOICES,
    )

    minimum_compensation = django_filters.NumberFilter(
        field_name="minimum_compensation",
        lookup_expr="gte",
    )

    maximum_compensation = django_filters.NumberFilter(
        field_name="maximum_compensation",
        lookup_expr="lte",
    )

    duration_min_weeks = django_filters.NumberFilter(
        field_name="duration_min_weeks",
        lookup_expr="gte",
    )

    duration_max_weeks = django_filters.NumberFilter(
        field_name="duration_max_weeks",
        lookup_expr="lte",
    )

    skill = django_filters.CharFilter(
        method="filter_skill",
    )

    def filter_skill(self, queryset, name, value):
        """
        Filter internships whose required_skills contain
        the requested skill.
        """

        return queryset.filter(
            required_skills__icontains=value
        )
        

    class Meta:
        model = Internship

        fields = [
            "country",
            "city",
            "category",
            "internship_type",
            "work_type",
            "compensation_type",
            "minimum_compensation",
            "maximum_compensation",
            "duration_min_weeks",
            "duration_max_weeks",
        ]