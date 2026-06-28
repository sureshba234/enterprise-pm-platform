from rest_framework import serializers
from .models import Project


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ['id', 'organization', 'name', 'description', 'status', 'created_by', 'created_at']
        extra_kwargs = {
            'organization': {'required': False},
            'created_by': {'required': False},
        }