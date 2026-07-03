from rest_framework import permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from projects.models import Project
from tasks.models import Task
from .services import call_groq, AIServiceError


class SprintReportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, project_id):
        try:
            project = Project.objects.get(id=project_id)
        except Project.DoesNotExist:
            return Response({"detail": "Project not found."}, status=404)

        tasks = Task.objects.filter(project=project)
        today = timezone.now().date()

        status_counts = {
            'TODO': tasks.filter(status='TODO').count(),
            'IN_PROGRESS': tasks.filter(status='IN_PROGRESS').count(),
            'REVIEW': tasks.filter(status='REVIEW').count(),
            'DONE': tasks.filter(status='DONE').count(),
        }
        overdue = tasks.filter(due_date__lt=today).exclude(status='DONE')
        high_priority_open = tasks.filter(priority__in=['HIGH', 'URGENT']).exclude(status='DONE')

        task_lines = "\n".join(
            f"- [{t.status}] {t.title} (priority: {t.priority}, "
            f"assignee: {t.assignee.email if t.assignee else 'unassigned'}, "
            f"due: {t.due_date or 'none'})"
            for t in tasks
        ) or "No tasks yet."

        prompt = f"""You are a project management assistant. Write a concise sprint status report
for the project "{project.name}" based on this raw task data.

Status counts: {status_counts}
Overdue (not done): {overdue.count()}
High/Urgent priority still open: {high_priority_open.count()}

Task list:
{task_lines}

Write 3-5 short paragraphs: overall progress, risks/blockers (especially overdue or
high-priority open items), and a recommended focus for the next few days. Be direct
and specific, referencing actual task titles where relevant. Do not repeat the raw
numbers verbatim; interpret them."""

        try:
            report = call_groq([{"role": "user", "content": prompt}])
        except AIServiceError as e:
            return Response({"detail": str(e)}, status=502)

        return Response({
            "report": report,
            "stats": {
                "status_counts": status_counts,
                "overdue_count": overdue.count(),
                "high_priority_open_count": high_priority_open.count(),
                "total_tasks": tasks.count(),
            },
        })


class TaskSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found."}, status=404)

        prompt = f"""You are a project management assistant. Given this task, write:
1. A one-sentence plain-language summary of what needs to be done.
2. 3-5 concrete sub-steps to complete it.

Task title: {task.title}
Description: {task.description or "No description provided."}
Priority: {task.priority}
Status: {task.status}
Due date: {task.due_date or "None set"}

Keep it short and actionable."""

        try:
            summary = call_groq([{"role": "user", "content": prompt}], max_tokens=300)
        except AIServiceError as e:
            return Response({"detail": str(e)}, status=502)

        return Response({"summary": summary})