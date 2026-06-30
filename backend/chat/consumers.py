import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import Message
from organizations.models import Membership


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.org_id = self.scope['url_route']['kwargs']['org_id']
        self.room_group_name = f'chat_org_{self.org_id}'
        self.user = self.scope['user']

        # Reject the connection entirely if this user isn't authenticated,
        # or isn't actually a member of this organization
        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        is_member = await self.check_membership()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = data.get('message', '').strip()
        if not content:
            return

        message = await self.save_message(content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'content': message.content,
                'sender_email': self.user.email,
                'sender_name': self.user.full_name,
                'created_at': message.created_at.isoformat(),
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'content': event['content'],
            'sender_email': event['sender_email'],
            'sender_name': event['sender_name'],
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def check_membership(self):
        return Membership.objects.filter(user=self.user, organization_id=self.org_id).exists()

    @database_sync_to_async
    def save_message(self, content):
        return Message.objects.create(
            organization_id=self.org_id,
            sender=self.user,
            content=content,
        )