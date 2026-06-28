from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = [
            'id', 'project', 'title', 'description', 'status', 'priority',
            'assignee', 'due_date', 'order', 'created_by', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'project': {'required': False},
            'created_by': {'required': False},
        }