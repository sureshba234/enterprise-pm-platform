from django.urls import path
from .views import SprintReportView, TaskSummaryView

urlpatterns = [
    path('projects/<int:project_id>/ai/sprint-report/', SprintReportView.as_view()),
    path('tasks/<int:task_id>/ai/summary/', TaskSummaryView.as_view()),
]