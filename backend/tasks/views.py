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