from rest_framework import generics, permissions
from .models import Message
from .serializers import MessageSerializer
from organizations.permissions import IsOrgMember


class MessageListView(generics.ListAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsOrgMember]

    def get_queryset(self):
        return Message.objects.filter(organization_id=self.kwargs['org_id'])