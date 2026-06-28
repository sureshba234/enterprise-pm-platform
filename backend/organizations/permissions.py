from rest_framework.permissions import BasePermission
from .models import Membership


class IsOrgMember(BasePermission):
    """Allows access if the user belongs to the organization at all, regardless of role."""

    def has_permission(self, request, view):
        org_id = view.kwargs.get('org_id')
        return Membership.objects.filter(user=request.user, organization_id=org_id).exists()


def HasOrgRole(*allowed_roles):
    """
    Allows access only if the user's role in this organization is one of allowed_roles.
    Usage: HasOrgRole(Membership.ADMIN, Membership.MANAGER)
    """

    class _Permission(BasePermission):
        def has_permission(self, request, view):
            org_id = view.kwargs.get('org_id')
            membership = Membership.objects.filter(
                user=request.user, organization_id=org_id
            ).first()
            return membership is not None and membership.role in allowed_roles

    return _Permission