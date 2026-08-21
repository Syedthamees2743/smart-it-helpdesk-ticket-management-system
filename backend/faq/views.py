from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework.pagination import PageNumberPagination
from .models import FAQ
from .serializers import (
    FAQListSerializer,
    FAQDetailSerializer,
    FAQCreateUpdateSerializer,
)
from accounts.permissions import IsAdminOrReadOnly


class FAQPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class FAQViewSet(viewsets.ModelViewSet):

    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    pagination_class = FAQPagination

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
            return FAQDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return FAQ.objects.all()
        return FAQ.objects.filter(status="active")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
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