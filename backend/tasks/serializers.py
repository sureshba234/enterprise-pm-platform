from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import Task, Comment
User = get_user_model()



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
class CommentSerializer(serializers.ModelSerializer):
    author_email = serializers.CharField(source='author.email', read_only=True)

    class Meta:
        model = Comment
        fields = ['id', 'task', 'author', 'author_email', 'body', 'created_at', 'updated_at']
        extra_kwargs = {
            'task': {'required': False},
            'author': {'required': False, 'read_only': True},
        }