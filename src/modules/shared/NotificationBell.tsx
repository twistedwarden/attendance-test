import { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { AuthService } from '../auth/authService';

interface NotificationItem {
  id: number;
  dateSent: string;
  message: string;
  status: 'Unread' | 'Read' | 'unread' | 'read';
}

interface NotificationBellProps {
  className?: string;
}

export default function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter(n => String(n.status).toLowerCase() !== 'read').length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen]);

  async function load() {
    try {
      setIsLoading(true);
      const data = await AuthService.getNotifications();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      // noop
    } finally {
      setIsLoading(false);
    }
  }

  async function markRead(id: number) {
    try {
      const token = AuthService.getStoredToken();
      if (!token) return;
      await fetch(((import.meta as any).env?.VITE_API_URL || '/api') + `/auth/users/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setItems(prev => prev.map(n => (n.id === id ? { ...n, status: 'Read' } as NotificationItem : n)));
    } catch {}
  }

  async function markAllRead() {
    try {
      const token = AuthService.getStoredToken();
      if (!token) return;
      await fetch(((import.meta as any).env?.VITE_API_URL || '/api') + '/auth/users/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setItems(prev => prev.map(n => ({ ...n, status: 'Read' })));
    } catch {}
  }

  return (
    <div className={`relative ${className || ''}`} ref={ref}>
      <button onClick={() => setIsOpen(v => !v)} className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full relative">
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
          <div className="p-3 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Notifications</div>
              <div className="text-xs text-gray-500">Recent updates</div>
            </div>
            {unreadCount > 0 && (
              <button className="text-xs text-blue-600 hover:text-blue-800" onClick={markAllRead}>Mark all read</button>
            )}
          </div>
          <div className="divide-y">
            {isLoading ? (
              <div className="p-4 text-sm text-gray-500">Loading…</div>
            ) : items.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">No notifications</div>
            ) : (
              items.map((n) => (
                <div key={n.id} className={`p-3 ${String(n.status).toLowerCase() !== 'read' ? 'bg-gray-50' : ''}`}>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{n.message}</div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="text-xs text-gray-500">{n.dateSent ? new Date(n.dateSent).toLocaleString() : ''}</div>
                    {String(n.status).toLowerCase() !== 'read' && (
                      <button className="text-xs text-blue-600 hover:text-blue-800" onClick={() => markRead(n.id)}>Mark read</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}


