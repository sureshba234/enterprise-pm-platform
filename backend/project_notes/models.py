from django.db import models
from django.conf import settings
from projects.models import Project


class Note(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notes')
    title = models.CharField(max_length=255, default='Untitled')
    content = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notes')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.title} ({self.project.name})"