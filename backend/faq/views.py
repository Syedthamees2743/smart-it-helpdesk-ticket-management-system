from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import FAQ
from .serializers import (
    FAQListSerializer,
    FAQDetailSerializer,
    FAQCreateUpdateSerializer,
)
from accounts.permissions import IsAdminOrReadOnly


class FAQViewSet(viewsets.ModelViewSet):
    """
    Admin: Full CRUD on all FAQs.
    Employee/Technician: Read-only, active FAQs only.
    """

    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    pagination_class = None

    search_fields = ("question", "answer")
    filterset_fields = ("category", "status")
    ordering_fields = ("question", "category", "created_at")
    ordering = ("category", "question")

    def get_serializer_class(self):
        user = self.request.user
        if user.role == "admin":
            if self.action == "list":
                return FAQListSerializer
            if self.action in ("create", "update", "partial_update"):
                return FAQCreateUpdateSerializer
            return FAQDetailSerializer
        else:
            # Employee/Technician: always return full details including answer
            return FAQDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return FAQ.objects.all()
        # Employee and Technician see ONLY active FAQs
        return FAQ.objects.filter(status="active")

    def perform_create(self, serializer):
        # Auto-attach the admin who created it
        serializer.save(created_by=self.request.user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        # Extra safety: block employees/technicians from modify/delete even if URL is guessed
        if (
            request.method in ("PUT", "PATCH", "DELETE")
            and request.user.role != "admin"
        ):
            raise PermissionDenied("Only admins can modify FAQs.")

    def destroy(self, request, *args, **kwargs):
        faq = self.get_object()
        faq.delete()
        return Response(
            {"success": True, "message": "FAQ deleted successfully."},
            status=status.HTTP_200_OK,
        )
