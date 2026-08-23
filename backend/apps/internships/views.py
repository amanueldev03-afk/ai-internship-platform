from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.generics import GenericAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import UserRateThrottle
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from django.db import IntegrityError
from django.contrib.auth import get_user_model

from .services.recommendations import (
    get_student_recommendations,
)

from .models import (
    Internship,
    InternshipSource,
    InternshipCollectionLog,
    SavedInternship,
    InternshipApplication,
    Skill,

)
from .serializers import (
    InternshipSerializer,
    InternshipSourceSerializer,
    InternshipCollectionLogSerializer,
    SavedInternshipSerializer,
    InternshipApplicationSerializer,
    InternshipVerificationSerializer,
    SkillSerializer,

)
from .filters import InternshipFilter
from .permissions import IsAdminRole
from .services.collector import collect_source
from .tasks import collect_internships_from_source


User = get_user_model()


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
                status=Internship.STATUS_ACTIVE,
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
                status=Internship.STATUS_ACTIVE,
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



class AdminInternshipSourceListCreateView(
    generics.ListCreateAPIView
):
    """
    Admin can list and create internship sources.
    """

    queryset = InternshipSource.objects.all().order_by(
        "-created_at"
    )

    serializer_class = InternshipSourceSerializer

    permission_classes = [
        IsAdminRole,
    ]



class AdminInternshipSourceDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    Admin can retrieve, update, and delete
    an internship source.
    """

    queryset = InternshipSource.objects.all()

    serializer_class = InternshipSourceSerializer

    permission_classes = [
        IsAdminRole,
    ]


class AdminCollectionLogListView(
    generics.ListAPIView
):
    """
    Admin can view internship collection history.
    """

    queryset = (
        InternshipCollectionLog.objects
        .select_related("source")
        .all()
        .order_by("-started_at")
    )

    serializer_class = (
        InternshipCollectionLogSerializer
    )

    permission_classes = [
        IsAdminRole,
    ]



class AdminSourceCollectView(GenericAPIView):
    """
    Queue internship collection as a background task.
    """

    permission_classes = [
        IsAdminRole,
    ]

    @extend_schema(
        responses={200: {'type': 'object', 'properties': {'message': {'type': 'string'}, 'task_id': {'type': 'string'}}}}
    )
    def post(self, request, pk):

        try:
            source = InternshipSource.objects.get(
                pk=pk
            )

        except InternshipSource.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Internship source not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if not source.is_active:
            return Response(
                {
                    "detail": (
                        "This internship source "
                        "is inactive."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        task = collect_internships_from_source.delay(
            source.id
        )

        return Response(
            {
                "message": (
                    "Internship collection "
                    "started."
                ),
                "source": source.name,
                "task_id": task.id,
                "status": "queued",
            },
            status=status.HTTP_202_ACCEPTED,
        )


class StudentSaveInternshipView(
    generics.CreateAPIView
):
    """
    Save an internship for the authenticated student.
    """

    serializer_class = SavedInternshipSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def perform_create(self, serializer):

        if self.request.user.role != "student":
            raise PermissionDenied(
                "Only students can save internships."
            )

        internship = serializer.validated_data[
            "internship"
        ]

        if internship.status != "active":
            raise serializers.ValidationError(
                {
                    "internship": (
                        "This internship is not "
                        "currently available."
                    )
                }
            )

        try:
            serializer.save(
                student=self.request.user
            )

        except IntegrityError:
            raise serializers.ValidationError(
                {
                    "internship": (
                        "You have already saved "
                        "this internship."
                    )
                }
            )


class StudentSavedInternshipListView(
    generics.ListAPIView
):
    """
    Return internships saved by the authenticated
    student.
    """

    serializer_class = SavedInternshipSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):

        if self.request.user.role != "student":
            return SavedInternship.objects.none()

        return (
            SavedInternship.objects
            .filter(
                student=self.request.user
            )
            .select_related("internship")
            .order_by("-created_at")
        )


class StudentUnsaveInternshipView(
    generics.DestroyAPIView
):
    """
    Remove a saved internship.
    """

    serializer_class = SavedInternshipSerializer

    permission_classes = [
        IsAuthenticated,
    ]

    lookup_url_kwarg = "internship_id"

    def get_queryset(self):

        if self.request.user.role != "student":
            return SavedInternship.objects.none()

        return SavedInternship.objects.filter(
            student=self.request.user
        )

    def destroy(self, request, *args, **kwargs):

        instance = self.get_object()

        instance.delete()

        return Response(
            {
                "message": (
                    "Internship removed from "
                    "saved internships."
                )
            },
            status=status.HTTP_200_OK,
        )


class StudentApplicationCreateView(
    generics.CreateAPIView
):
    """
    Record that the authenticated student has
    applied for an internship.
    """

    serializer_class = (
        InternshipApplicationSerializer
    )

    permission_classes = [
        IsAuthenticated,
    ]

    def perform_create(self, serializer):

        if self.request.user.role != "student":
            raise PermissionDenied(
                "Only students can track internship applications."
            )

        internship = serializer.validated_data[
            "internship"
        ]

        try:
            serializer.save(
                student=self.request.user
            )

        except IntegrityError:
            raise serializers.ValidationError(
                {
                    "internship": (
                        "You have already recorded "
                        "an application for this internship."
                    )
                }
            )


class StudentApplicationListView(
    generics.ListAPIView
):
    """
    Return applications belonging only to the
    authenticated student.
    """

    serializer_class = (
        InternshipApplicationSerializer
    )

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):

        if self.request.user.role != "student":
            return InternshipApplication.objects.none()

        return (
            InternshipApplication.objects
            .filter(
                student=self.request.user
            )
            .select_related("internship")
            .order_by("-applied_at")
        )


class StudentApplicationDetailView(
    generics.RetrieveUpdateAPIView
):
    """
    Retrieve or update an application belonging
    to the authenticated student.
    """

    serializer_class = (
        InternshipApplicationSerializer
    )

    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):

        if self.request.user.role != "student":
            return InternshipApplication.objects.none()

        return InternshipApplication.objects.filter(
            student=self.request.user
        )



class AdminInternshipVerificationView(
    GenericAPIView
):
    """
    Verify or reject an internship.
    """

    permission_classes = [
        IsAdminRole,
    ]
    serializer_class = InternshipVerificationSerializer

    @extend_schema(
        examples=[
            OpenApiExample(
                "Verify Internship",
                value={"status": "active"},
            ),
            OpenApiExample(
                "Reject Internship",
                value={"status": "rejected", "rejection_reason": "Not suitable"},
            )
        ]
    )
    def post(self, request, pk):

        try:
            internship = Internship.objects.get(
                pk=pk
            )

        except Internship.DoesNotExist:
            return Response(
                {
                    "detail": (
                        "Internship not found."
                    )
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        action = serializer.validated_data[
            "action"
        ]

        if action == "verify":

            internship.status = (
                Internship.STATUS_ACTIVE
            )

            internship.verified_at = (
                timezone.now()
            )

            internship.verified_by = (
                request.user
            )

            internship.rejection_reason = ""

            internship.save(
                update_fields=[
                    "status",
                    "verified_at",
                    "verified_by",
                    "rejection_reason",
                    "updated_at",
                ]
            )

            return Response(
                {
                    "message": (
                        "Internship verified "
                        "successfully."
                    ),
                    "internship_id": internship.id,
                    "status": internship.status,
                },
                status=status.HTTP_200_OK,
            )

        rejection_reason = (
            serializer.validated_data[
                "rejection_reason"
            ]
        )

        internship.status = (
            Internship.STATUS_REJECTED
        )

        internship.rejection_reason = (
            rejection_reason
        )

        internship.verified_at = None
        internship.verified_by = None

        internship.save(
            update_fields=[
                "status",
                "rejection_reason",
                "verified_at",
                "verified_by",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": (
                    "Internship rejected."
                ),
                "internship_id": internship.id,
                "status": internship.status,
            },
            status=status.HTTP_200_OK,
        )



class StudentDashboardView(GenericAPIView):
    """
    Return internship statistics and recent
    activity for the authenticated student.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    @extend_schema(
        responses={200: {
            'type': 'object',
            'properties': {
                'saved_internships': {'type': 'integer'},
                'total_applications': {'type': 'integer'},
                'applied_applications': {'type': 'integer'},
                'interview_applications': {'type': 'integer'},
                'accepted_applications': {'type': 'integer'},
                'rejected_applications': {'type': 'integer'},
                'withdrawn_applications': {'type': 'integer'},
                'active_saved_internships': {'type': 'integer'},
                'recent_applications': {'type': 'array'},
                'recent_saved': {'type': 'array'},
            }
        }}
    )
    def get(self, request):

        if request.user.role != "student":
            raise PermissionDenied(
                "Only students can access the "
                "student dashboard."
            )

        saved_count = (
            SavedInternship.objects
            .filter(
                student=request.user
            )
            .count()
        )

        applications = (
            InternshipApplication.objects
            .filter(
                student=request.user
            )
        )

        total_applications = applications.count()

        applied_count = applications.filter(
            status=InternshipApplication.STATUS_APPLIED
        ).count()

        interview_count = applications.filter(
            status=InternshipApplication.STATUS_INTERVIEW
        ).count()

        accepted_count = applications.filter(
            status=InternshipApplication.STATUS_ACCEPTED
        ).count()

        rejected_count = applications.filter(
            status=InternshipApplication.STATUS_REJECTED
        ).count()

        withdrawn_count = applications.filter(
            status=InternshipApplication.STATUS_WITHDRAWN
        ).count()

        recent_applications = (
            applications
            .select_related("internship")
            .order_by("-updated_at")[:5]
        )

        recent_saved = (
            SavedInternship.objects
            .filter(
                student=request.user
            )
            .select_related("internship")
            .order_by("-created_at")[:5]
        )

        active_saved_count = (
            SavedInternship.objects
            .filter(
                student=request.user,
                internship__status=(
                    Internship.STATUS_ACTIVE
                ),
            )
            .count()
        )

        return Response(
            {
                "saved_internships": saved_count,

                "total_applications": (
                    total_applications
                ),

                "applied_applications": (
                    applied_count
                ),

                "interview_applications": (
                    interview_count
                ),

                "accepted_applications": (
                    accepted_count
                ),

                "rejected_applications": (
                    rejected_count
                ),

                "withdrawn_applications": (
                    withdrawn_count
                ),

                "active_saved_internships": active_saved_count,

                "recent_applications": (
                    InternshipApplicationSerializer(
                        recent_applications,
                        many=True,
                    ).data
                ),

                "recent_saved_internships": (
                    SavedInternshipSerializer(
                        recent_saved,
                        many=True,
                    ).data
                ),
            },
            status=status.HTTP_200_OK,
        )


class AdminDashboardView(GenericAPIView):
    """
    Platform-wide dashboard for administrators.
    """

    permission_classes = [
        IsAdminRole,
    ]

    @extend_schema(
        responses={200: {
            'type': 'object',
            'properties': {
                'total_students': {'type': 'integer'},
                'total_internships': {'type': 'integer'},
                'draft_internships': {'type': 'integer'},
                'active_internships': {'type': 'integer'},
                'rejected_internships': {'type': 'integer'},
                'expired_internships': {'type': 'integer'},
                'total_applications': {'type': 'integer'},
                'applied_applications': {'type': 'integer'},
                'interview_applications': {'type': 'integer'},
                'accepted_applications': {'type': 'integer'},
                'rejected_applications': {'type': 'integer'},
                'withdrawn_applications': {'type': 'integer'},
                'total_collection_logs': {'type': 'integer'},
                'successful_collections': {'type': 'integer'},
                'failed_collections': {'type': 'integer'},
                'pending_verification': {'type': 'integer'},
                'recent_internships': {'type': 'array'},
                'latest_collection_logs': {'type': 'array'},
            }
        }}
    )
    def get(self, request):

        total_students = User.objects.filter(
            role="student"
        ).count()

        total_internships = Internship.objects.count()

        draft_internships = Internship.objects.filter(
            status=Internship.STATUS_DRAFT
        ).count()

        active_internships = Internship.objects.filter(
            status=Internship.STATUS_ACTIVE
        ).count()

        rejected_internships = Internship.objects.filter(
            status=Internship.STATUS_REJECTED
        ).count()

        expired_internships = Internship.objects.filter(
            status=Internship.STATUS_EXPIRED
        ).count()

        applications = InternshipApplication.objects.all()

        total_applications = applications.count()

        applied_applications = applications.filter(
            status=InternshipApplication.STATUS_APPLIED
        ).count()

        interview_applications = applications.filter(
            status=InternshipApplication.STATUS_INTERVIEW
        ).count()

        accepted_applications = applications.filter(
            status=InternshipApplication.STATUS_ACCEPTED
        ).count()

        rejected_applications = applications.filter(
            status=InternshipApplication.STATUS_REJECTED
        ).count()

        withdrawn_applications = applications.filter(
            status=InternshipApplication.STATUS_WITHDRAWN
        ).count()

        total_collection_logs = (
            InternshipCollectionLog.objects.count()
        )

        successful_collections = (
            InternshipCollectionLog.objects.filter(
                status="success"
            ).count()
        )

        failed_collections = (
            InternshipCollectionLog.objects.filter(
                status="failed"
            ).count()
        )

        pending_verification = Internship.objects.filter(
            status=Internship.STATUS_DRAFT
        ).count()


        recent_internships = (
            Internship.objects
            .order_by("-created_at")[:10]
        )

        latest_collection_logs = (
            InternshipCollectionLog.objects
            .order_by("-started_at")[:5]
        )

        return Response(
            {
                "total_students": total_students,

                "total_internships": total_internships,

                "draft_internships": draft_internships,

                "active_internships": active_internships,

                "rejected_internships": (
                    rejected_internships
                ),

                "expired_internships": (
                    expired_internships
                ),

                "total_applications": (
                    total_applications
                ),

                "applied_applications": (
                    applied_applications
                ),

                "interview_applications": (
                    interview_applications
                ),

                "accepted_applications": (
                    accepted_applications
                ),

                "rejected_applications": (
                    rejected_applications
                ),

                "withdrawn_applications": (
                    withdrawn_applications
                ),

                "total_collection_logs": (
                    total_collection_logs
                ),

                "successful_collections": (
                    successful_collections
                ),

                "failed_collections": (
                    failed_collections
                ),

                "pending_verification": (
                    pending_verification,
                ),
                "recent_internships": (
                    AdminRecentInternshipSerializer(
                        recent_internships,
                        many=True,
                    ).data
                ),
                "latest_collection_logs": (
                    AdminCollectionLogSerializer(
                        latest_collection_logs,
                        many=True,
                    ).data
                ),
            },
            status=status.HTTP_200_OK,
        )


class AdminSkillListCreateView(
    generics.ListCreateAPIView
):
    """
    Admin manages reusable skills.
    """

    serializer_class = SkillSerializer

    permission_classes = [
        IsAdminRole,
    ]

    queryset = Skill.objects.all()



class AdminSkillDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    Admin manages an individual skill.
    """

    serializer_class = SkillSerializer

    permission_classes = [
        IsAdminRole,
    ]

    queryset = Skill.objects.all()




class StudentRecommendationView(APIView):
    """
    Return internships ranked for the
    authenticated student.
    """

    permission_classes = [
        IsAuthenticated,
    ]

    @extend_schema(
        operation_id="student_recommendations",
        description="Get personalized internship recommendations based on student profile preferences including skills, location, compensation, and work type.",
        responses={200: OpenApiTypes.OBJECT},
        tags=["Student Internships"]
    )
    def get(self, request):

        if request.user.role != "student":
            raise PermissionDenied(
                "Only students can receive "
                "recommendations."
            )

        profile = request.user.student_profile

        internships = (
            Internship.objects
            .filter(
                status=Internship.STATUS_ACTIVE
            )
            .prefetch_related(
                "required_skills"
            )
        )

        recommendations = (
            get_student_recommendations(
                profile,
                internships,
            )
        )

        results = []

        for item in recommendations:

            internship = item[
                "internship"
            ]

            results.append(
                {
                    "internship": (
                        InternshipSerializer(
                            internship
                        ).data
                    ),
                    "match_score": (
                        item["score"]
                    ),
                    "score_breakdown": (
                        item["scores"]
                    ),
                }
            )

        return Response(
            results,
            status=status.HTTP_200_OK,
        )