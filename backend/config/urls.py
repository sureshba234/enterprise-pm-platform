from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/orgs/', include('organizations.urls')),
    path('api/orgs/', include('projects.urls')),
    path('api/', include('tasks.urls')),
    path('api/', include('chat.urls')),
    path('api/', include('notifications.urls')),
]