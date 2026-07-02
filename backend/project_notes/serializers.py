from rest_framework import serializers
from .models import Note


class NoteSerializer(serializers.ModelSerializer):
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    class Meta:
        model = Note
        fields = ['id', 'project', 'title', 'content', 'created_by', 'created_by_email', 'created_at', 'updated_at']
        extra_kwargs = {
            'project': {'required': False},
            'created_by': {'required': False},
        }