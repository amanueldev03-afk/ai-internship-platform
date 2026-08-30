from django.db.models import Count
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from drf_spectacular.utils import extend_schema, OpenApiExample

from .models import Company
from .serializers import CompanySerializer
from apps.internships.permissions import IsAdminRole


class CompanyPagination(PageNumberPagination):
    """
    Pagination for the admin company listing.
    """

    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class AdminCompanyListCreateView(generics.ListCreateAPIView):
    """
    Admin can list and create companies (Phase 4 Task 4.1).

    For both GET and POST the endpoint is gated by ``IsAdminRole`` (Task 2.6):
    a student JWT receives 403.
    """

    serializer_class = CompanySerializer
    permission_classes = [IsAdminRole]
    pagination_class = CompanyPagination

    @extend_schema(
        summary="Admin: List companies",
        description="Retrieve a paginated list of all companies, including a live internship count per company. Admin only.",
        tags=["Companies"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Create company",
        description="Create a new company. Company names must be unique. Admin only.",
        request=CompanySerializer,
        responses={201: CompanySerializer},
        examples=[
            OpenApiExample(
                "Create Company",
                value={
                    "name": "Google LLC",
                    "website": "https://careers.google.com",
                    "country": "United States",
                    "industry": "Technology",
                },
            )
        ],
        tags=["Companies"],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        return Company.objects.annotate(
            internship_count=Count("internships")
        ).order_by("name")


class AdminCompanyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin can retrieve, update, and delete a single company (Phase 4 Task 4.1).

    Deleting a company nulls out its internships' ``company`` link
    (``on_delete=SET_NULL``, migration ``0018``) — listings survive but are
    no longer attributed.
    """

    serializer_class = CompanySerializer
    permission_classes = [IsAdminRole]
    queryset = Company.objects.annotate(
        internship_count=Count("internships")
    )

    @extend_schema(
        summary="Admin: Retrieve company",
        description="Get detailed information about a company by ID. Admin only.",
        tags=["Companies"],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Update company",
        description="Update a company by ID. Admin only.",
        request=CompanySerializer,
        responses={200: CompanySerializer},
        tags=["Companies"],
    )
    def put(self, request, *args, **kwargs):
        return super().put(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Partial update company",
        description="Partially update a company by ID. Admin only.",
        request=CompanySerializer,
        responses={200: CompanySerializer},
        tags=["Companies"],
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Admin: Delete company",
        description="Delete a company by ID. Its internships' links are nulled. Admin only.",
        tags=["Companies"],
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)