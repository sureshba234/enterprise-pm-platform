from rest_framework import serializers
from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_email = serializers.CharField(source='sender.email', read_only=True)
    sender_name = serializers.CharField(source='sender.full_name', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'organization', 'sender', 'sender_email', 'sender_name', 'content', 'created_at']
        extra_kwargs = {
            'organization': {'required': False},
            'sender': {'required': False},
        }