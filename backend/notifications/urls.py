from django.urls import path
from .views import NotificationListView, NotificationMarkReadView, NotificationMarkAllReadView

urlpatterns = [
    path('orgs/<int:org_id>/notifications/', NotificationListView.as_view()),
    path('orgs/<int:org_id>/notifications/mark-all-read/', NotificationMarkAllReadView.as_view()),
    path('notifications/<int:notification_id>/read/', NotificationMarkReadView.as_view()),
]