from django.urls import path
from .views import TaskListCreateView, TaskDetailView, TaskMoveView, ProjectStatsView, CommentListCreateView, CommentDeleteView

urlpatterns = [
    path('projects/<int:project_id>/tasks/', TaskListCreateView.as_view()),
    path('tasks/<int:task_id>/', TaskDetailView.as_view()),
    path('tasks/<int:task_id>/move/', TaskMoveView.as_view()),
    path('projects/<int:project_id>/stats/', ProjectStatsView.as_view()),
     path('tasks/<int:task_id>/comments/', CommentListCreateView.as_view()),
    path('comments/<int:comment_id>/', CommentDeleteView.as_view()),
]