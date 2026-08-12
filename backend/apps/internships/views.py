from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAdminUser
from django.utils import timezone
from rest_framework.pagination import PageNumberPagination
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from .models import Internship
from .serializers import InternshipSerializer
from .filters import InternshipFilter
from .permissions import IsAdminRole


class InternshipPagination(PageNumberPagination):
    """
    Custom pagination for internship listings.
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class BurstRateThrottle(UserRateThrottle):
    """
    Rate limit for burst requests (short-term).
    """
    scope = 'burst'
    rate = '100/min'


class SustainedRateThrottle(UserRateThrottle):
    """
    Rate limit for sustained requests (long-term).
    """
    scope = 'sustained'
    rate = '1000/hour'


class InternshipListView(generics.ListAPIView):
    """
    List active and verified internships.
    """

    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = InternshipPagination
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @extend_schema(
        summary="List internships",
        description="Retrieve a paginated list of active and verified internships with filtering, search, and ordering capabilities.",
        parameters=[
            OpenApiParameter(
                name="page",
                type=OpenApiTypes.INT,
                description="Page number",
                required=False,
            ),
            OpenApiParameter(
                name="page_size",
                type=OpenApiTypes.INT,
                description="Number of results per page (max 100)",
                required=False,
            ),
            OpenApiParameter(
                name="search",
                type=OpenApiTypes.STR,
                description="Search in title, organization, description, category, country, city",
                required=False,
            ),
            OpenApiParameter(
                name="ordering",
                type=OpenApiTypes.STR,
                description="Order by field (e.g., created_at, -created_at)",
                required=False,
            ),
        ],
        tags=["Internships"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = InternshipFilter

    search_fields = [
        "title",
        "organization_name",
        "description",
        "category",
        "country",
        "city",
    ]

    ordering_fields = [
        "created_at",
        "posted_at",
        "application_deadline",
        "minimum_compensation",
        "maximum_compensation",
    ]

    ordering = [
        "-created_at",
    ]



    def get_queryset(self):

        now = timezone.now()

        return (
            Internship.objects
            .filter(
                status="active",
                is_verified=True,
            )
            .filter(
                Q(application_deadline__isnull=True)
                | Q(application_deadline__gt=now)
            )
            .select_related("source")
            .order_by("-created_at")
        )




class InternshipDetailView(generics.RetrieveAPIView):
    """
    Return a single active and verified internship.
    """

    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @extend_schema(
        summary="Retrieve internship details",
        description="Get detailed information about a specific active and verified internship by ID.",
        tags=["Internships"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):

        now = timezone.now()

        return (
            Internship.objects
            .filter(
                status="active",
                is_verified=True,
            )
            .filter(
                Q(application_deadline__isnull=True)
                | Q(application_deadline__gt=now)
            )
            .select_related("source")
            .order_by("-created_at")
        )



class AdminInternshipListCreateView(generics.ListCreateAPIView):
    """
    Admin endpoint for listing and creating internships.
    """

    serializer_class = InternshipSerializer
    permission_classes = [IsAdminRole]
    pagination_class = InternshipPagination
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @extend_schema(
        summary="Admin: List all internships",
        description="Retrieve a paginated list of all internships (including draft, expired, and unverified) with full filtering capabilities. Admin only.",
        tags=["Admin Internships"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Create internship",
        description="Create a new internship. Admin only.",
        tags=["Admin Internships"],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    filter_backends = [
        DjangoFilterBackend,
        SearchFilter,
        OrderingFilter,
    ]

    filterset_class = InternshipFilter

    search_fields = [
        "title",
        "organization_name",
        "description",
        "category",
        "country",
        "city",
    ]

    ordering_fields = [
        "created_at",
        "posted_at",
        "application_deadline",
        "status",
        "is_verified",
    ]

    ordering = [
        "-created_at",
    ]

    def get_queryset(self):
        return (
            Internship.objects
            .select_related("source")
            .order_by("-created_at")
        )


class AdminInternshipDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin endpoint for viewing, updating, and deleting internships.
    """

    serializer_class = InternshipSerializer
    permission_classes = [IsAdminRole]
    queryset = Internship.objects.select_related("source")
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @extend_schema(
        summary="Admin: Retrieve internship",
        description="Get detailed information about any internship by ID. Admin only.",
        tags=["Admin Internships"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Update internship",
        description="Update an existing internship by ID. Admin only.",
        tags=["Admin Internships"],
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Partial update internship",
        description="Partially update an existing internship by ID. Admin only.",
        tags=["Admin Internships"],
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Delete internship",
        description="Delete an internship by ID. Admin only.",
        tags=["Admin Internships"],
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)



class LatestInternshipListView(generics.ListAPIView):
    """
    Return the latest active and verified internships.
    """

    serializer_class = InternshipSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = InternshipPagination
    throttle_classes = [BurstRateThrottle, SustainedRateThrottle]

    @extend_schema(
        summary="Latest internships",
        description="Retrieve the latest 20 active and verified internships ordered by posting date.",
        tags=["Internships"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    def get_queryset(self):
        now = timezone.now()

        return (
            Internship.objects
            .filter(
                status="active",
                is_verified=True,
            )
            .filter(
                Q(application_deadline__isnull=True)
                | Q(application_deadline__gt=now)
            )
            .select_related("source")
            .order_by("-posted_at", "-created_at")[:20]
        )