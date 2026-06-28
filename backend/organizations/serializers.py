from rest_framework import serializers
from .models import Organization, Membership


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ['id', 'name', 'slug', 'created_at']
        extra_kwargs = {'slug': {'required': False}}


class MembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)

    class Meta:
        model = Membership
        fields = ['id', 'user', 'user_email', 'organization', 'role']
        extra_kwargs = {'organization': {'required': False}}
        validators = []
