from rest_framework import generics, permissions
from .models import Project
from .serializers import ProjectSerializer
from organizations.permissions import IsOrgMember, HasOrgRole
from organizations.models import Membership


class ProjectListCreateView(generics.ListCreateAPIView):
    serializer_class = ProjectSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated(), HasOrgRole(Membership.ADMIN, Membership.MANAGER)()]
        return [permissions.IsAuthenticated(), IsOrgMember()]

    def get_queryset(self):
        return Project.objects.filter(organization_id=self.kwargs['org_id'])

    def perform_create(self, serializer):
        serializer.save(organization_id=self.kwargs['org_id'], created_by=self.request.user)