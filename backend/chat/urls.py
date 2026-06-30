from django.urls import path
from .views import MessageListView

urlpatterns = [
    path('orgs/<int:org_id>/messages/', MessageListView.as_view()),
]