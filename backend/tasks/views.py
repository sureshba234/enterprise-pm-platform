from django.db.models import Count
from rest_framework import generics, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer
from notifications.services import send_notification


class TaskListCreateView(generics.ListCreateAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(project_id=self.kwargs['project_id'])

    def perform_create(self, serializer):
        task = serializer.save(project_id=self.kwargs['project_id'], created_by=self.request.user)
        if task.assignee and task.assignee_id != self.request.user.id:
            send_notification(
                recipient=task.assignee,
                organization=task.project.organization,
                notification_type='task_assigned',
                title=f'You were assigned: {task.title}',
                body=task.description[:200],
            )


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = Task.objects.all()
    lookup_url_kwarg = 'task_id'

    def perform_update(self, serializer):
        old_assignee_id = serializer.instance.assignee_id
        task = serializer.save()
        if task.assignee and task.assignee_id != old_assignee_id and task.assignee_id != self.request.user.id:
            send_notification(
                recipient=task.assignee,
                organization=task.project.organization,
                notification_type='task_assigned',
                title=f'You were assigned: {task.title}',
                body=task.description[:200],
            )


class TaskMoveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, task_id):
        try:
            task = Task.objects.get(id=task_id)
        except Task.DoesNotExist:
            return Response({"detail": "Task not found."}, status=404)

        if 'status' in request.data:
            task.status = request.data['status']
        if 'order' in request.data:
            task.order = request.data['order']
        task.save()
        return Response(TaskSerializer(task).data)
class ProjectStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, project_id):
        tasks = Task.objects.filter(project_id=project_id)

        status_counts = dict(
            tasks.values_list('status').annotate(count=Count('id'))
        )

        priority_counts = dict(
            tasks.values_list('priority').annotate(count=Count('id'))
        )

        from django.utils import timezone
        today = timezone.now().date()
        overdue = tasks.filter(due_date__lt=today).exclude(status='DONE').count()
        completion_rate = 0
        total = tasks.count()
        if total > 0:
            completion_rate = round((status_counts.get('DONE', 0) / total) * 100)

        return Response({
            'total': total,
            'completion_rate': completion_rate,
            'overdue': overdue,
            'status_counts': {
                'TODO': status_counts.get('TODO', 0),
                'IN_PROGRESS': status_counts.get('IN_PROGRESS', 0),
                'REVIEW': status_counts.get('REVIEW', 0),
                'DONE': status_counts.get('DONE', 0),
            },
            'priority_counts': {
                'LOW': priority_counts.get('LOW', 0),
                'MEDIUM': priority_counts.get('MEDIUM', 0),
                'HIGH': priority_counts.get('HIGH', 0),
                'URGENT': priority_counts.get('URGENT', 0),
            },
        })