from rest_framework import serializers
from .models import FAQ


class FAQListSerializer(serializers.ModelSerializer):
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)

    class Meta:
        model = FAQ
        fields = ('id', 'question', 'category', 'status', 'created_by_name', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class FAQDetailSerializer(serializers.ModelSerializer):
    created_by_name = serializers.StringRelatedField(source='created_by', read_only=True)

    class Meta:
        model = FAQ
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')


class FAQCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FAQ
        fields = ('question', 'answer', 'category', 'status')