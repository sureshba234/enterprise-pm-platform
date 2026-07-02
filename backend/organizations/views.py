from rest_framework import generics, permissions, serializers
from django.utils.text import slugify
from .models import Organization, Membership
from .serializers import OrganizationSerializer, MembershipSerializer
from .permissions import HasOrgRole
from .models import Organization, Membership



class OrganizationListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Organization.objects.filter(memberships__user=self.request.user)

    def perform_create(self, serializer):
        org = serializer.save(
            created_by=self.request.user,
            slug=slugify(serializer.validated_data['name'])
        )
        Membership.objects.create(user=self.request.user, organization=org, role=Membership.ADMIN)


class InviteMemberView(generics.CreateAPIView):
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated, HasOrgRole(Membership.ADMIN, Membership.MANAGER)]

    def perform_create(self, serializer):
        org_id = self.kwargs['org_id']
        user = serializer.validated_data['user']
        if Membership.objects.filter(user=user, organization_id=org_id).exists():
            raise serializers.ValidationError("This user is already a member of this organization.")
        serializer.save(organization_id=org_id)
class MembershipListView(generics.ListAPIView):
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Membership.objects.filter(organization_id=self.kwargs['org_id'])