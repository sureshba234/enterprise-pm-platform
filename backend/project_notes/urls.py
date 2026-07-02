from django.urls import path
from .views import NoteListCreateView, NoteDetailView

urlpatterns = [
    path('projects/<int:project_id>/notes/', NoteListCreateView.as_view()),
    path('notes/<int:note_id>/', NoteDetailView.as_view()),
]