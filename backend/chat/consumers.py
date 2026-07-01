import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.cache import cache
from .models import Message
from organizations.models import Membership


class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.org_id = self.scope['url_route']['kwargs']['org_id']
        self.room_group_name = f'chat_org_{self.org_id}'
        self.user = self.scope['user']

        if not self.user or self.user.is_anonymous:
            await self.close()
            return

        is_member = await self.check_membership()
        if not is_member:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

        await self.add_online_user()
        online_list = await self.get_online_users()

        await self.send(text_data=json.dumps({
            'type': 'presence_list',
            'users': online_list,
        }))

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'presence_update',
                'user_email': self.user.email,
                'user_name': self.user.full_name,
                'status': 'online',
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.remove_online_user()
            still_online = await self.is_still_online()

            if not still_online:
                await self.channel_layer.group_send(
                    self.room_group_name,
                    {
                        'type': 'presence_update',
                        'user_email': self.user.email,
                        'user_name': self.user.full_name,
                        'status': 'offline',
                    }
                )
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type', 'message')

        if message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_email': self.user.email,
                    'user_name': self.user.full_name,
                    'is_typing': data.get('is_typing', False),
                }
            )
            return

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
            'type': 'message',
            'id': event['id'],
            'content': event['content'],
            'sender_email': event['sender_email'],
            'sender_name': event['sender_name'],
            'created_at': event['created_at'],
        }))

    async def typing_indicator(self, event):
        if event['user_email'] == self.user.email:
            return
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_email': event['user_email'],
            'user_name': event['user_name'],
            'is_typing': event['is_typing'],
        }))

    async def presence_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'presence',
            'user_email': event['user_email'],
            'user_name': event['user_name'],
            'status': event['status'],
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

    @database_sync_to_async
    def add_online_user(self):
        key = f'online_org_{self.org_id}'
        count_key = f'online_count_{self.org_id}_{self.user.email}'
        online = cache.get(key, {})
        online[self.user.email] = self.user.full_name
        cache.set(key, online, timeout=None)
        count = cache.get(count_key, 0) + 1
        cache.set(count_key, count, timeout=None)

    @database_sync_to_async
    def remove_online_user(self):
        key = f'online_org_{self.org_id}'
        count_key = f'online_count_{self.org_id}_{self.user.email}'
        count = cache.get(count_key, 1) - 1
        cache.set(count_key, count, timeout=None)
        if count <= 0:
            online = cache.get(key, {})
            online.pop(self.user.email, None)
            cache.set(key, online, timeout=None)
            cache.delete(count_key)

    @database_sync_to_async
    def is_still_online(self):
        key = f'online_org_{self.org_id}'
        online = cache.get(key, {})
        return self.user.email in online

    @database_sync_to_async
    def get_online_users(self):
        key = f'online_org_{self.org_id}'
        online = cache.get(key, {})
        return [{'email': e, 'name': n} for e, n in online.items()]