from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification


def send_notification(*, recipient, organization, notification_type, title, body=''):
    notification = Notification.objects.create(
        recipient=recipient,
        organization=organization,
        notification_type=notification_type,
        title=title,
        body=body,
    )
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f'notifications_user_{recipient.id}',
        {
            'type': 'notification_message',
            'id': notification.id,
            'notification_type': notification.notification_type,
            'title': notification.title,
            'body': notification.body,
            'organization': organization.id,
            'created_at': notification.created_at.isoformat(),
        }
    )
    return notification