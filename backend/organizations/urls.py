from django.urls import path
from .views import OrganizationListCreateView, InviteMemberView

urlpatterns = [
    path('', OrganizationListCreateView.as_view()),
    path('<int:org_id>/invite/', InviteMemberView.as_view()),
]