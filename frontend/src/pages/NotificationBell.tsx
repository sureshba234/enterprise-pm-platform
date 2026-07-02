import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '../app/api';
import type { RootState } from '../app/store';

interface NotificationItem {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const selectedOrgId = useSelector((state: RootState) => state.org.selectedOrgId);
  const { data: initial } = useGetNotificationsQuery(selectedOrgId!, { skip: !selectedOrgId });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (initial) setNotifications(initial);
  }, [initial]);

  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) return;
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/notifications/?token=${token}`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'notification' && data.organization === selectedOrgId) {
        setNotifications((prev) => [
          {
            id: data.id,
            notification_type: data.notification_type,
            title: data.title,
            body: data.body,
            is_read: false,
            created_at: data.created_at,
          },
          ...prev,
        ]);
      }
    };

    return () => ws.close();
  }, [selectedOrgId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    await markRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!selectedOrgId) return;
    await markAllRead(selectedOrgId);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative text-sm text-blue-400 hover:underline">
        🔔
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-3 bg-red-600 text-white text-[10px] rounded-full px-1.5">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-slate-800 border border-slate-600 rounded-lg shadow-lg z-50">
          <div className="flex justify-between items-center p-3 border-b border-slate-700">
            <span className="font-semibold text-sm">Notifications</span>
            <button onClick={handleMarkAllRead} className="text-xs text-blue-400 hover:underline">
              Mark all read
            </button>
          </div>
          {notifications.length === 0 && (
            <p className="text-slate-500 text-sm p-3">No notifications yet.</p>
          )}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
              className={`p-3 border-b border-slate-700 cursor-pointer ${n.is_read ? 'opacity-50' : 'bg-slate-700/40'}`}
            >
              <p className="text-sm font-medium">{n.title}</p>
              {n.body && <p className="text-xs text-slate-400">{n.body}</p>}
              <p className="text-[10px] text-slate-500 mt-1">{new Date(n.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}