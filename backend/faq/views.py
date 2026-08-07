from rest_framework import viewsets
from .models import FAQ
from .serializers import FAQSerializer
from accounts.permissions import IsAdminOrReadOnly

class FAQViewSet(viewsets.ModelViewSet):
    queryset = FAQ.objects.all()
    serializer_class = FAQSerializer
    permission_classes = [IsAdminOrReadOnly]
    
    # Search by question text
    search_fields = ('question', 'answer')
    ordering_fields = ('question',)
    ordering = ('question',)