from django.urls import path
from .views import TaskListCreateView, TaskDetailView, TaskMoveView

urlpatterns = [
    path('projects/<int:project_id>/tasks/', TaskListCreateView.as_view()),
    path('tasks/<int:task_id>/', TaskDetailView.as_view()),
    path('tasks/<int:task_id>/move/', TaskMoveView.as_view()),
]