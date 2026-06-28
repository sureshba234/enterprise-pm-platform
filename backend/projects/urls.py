from django.urls import path
from .views import ProjectListCreateView

urlpatterns = [
    path('<int:org_id>/projects/', ProjectListCreateView.as_view()),
]