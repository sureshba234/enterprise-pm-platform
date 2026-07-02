from django.urls import path
from .views import OrganizationListCreateView, InviteMemberView, MembershipListView

urlpatterns = [
    path('', OrganizationListCreateView.as_view()),
    path('<int:org_id>/invite/', InviteMemberView.as_view()),
    path('<int:org_id>/members/', MembershipListView.as_view()),
]