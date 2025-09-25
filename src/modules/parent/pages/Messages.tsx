import { useEffect, useState } from 'react';
import { ParentService, ParentMessageItem, ParentMessageRecipient } from '../api/parentService';
import { MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [messages, setMessages] = useState<ParentMessageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<ParentMessageRecipient[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [compose, setCompose] = useState<{ teacherUserId: number | ''; studentId: number | ''; type: 'general'|'attendance'|'behavior'|'academic'; message: string }>({
    teacherUserId: '',
    studentId: '',
    type: 'general',
    message: ''
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ParentService.getMessages(100);
      setMessages(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    ParentService.getMessageRecipients().then(setRecipients).catch(() => {});
  }, []);

  const markRead = async (id: number) => {
    try {
      await ParentService.markMessageAsRead(id);
      setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'read' } : m));
    } catch (e) {
      // ignore
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'attendance':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'behavior':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'academic':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const send = async () => {
    if (!compose.teacherUserId || !compose.message.trim()) return;
    try {
      setLoading(true);
      await ParentService.sendMessage({ teacherUserId: Number(compose.teacherUserId), studentId: compose.studentId ? Number(compose.studentId) : undefined, type: compose.type, message: compose.message.trim() });
      setShowCompose(false);
      setCompose({ teacherUserId: '', studentId: '', type: 'general', message: '' });
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Messages</h2>
          <p className="text-gray-600">Teacher communications</p>
        </div>
        <button onClick={load} className="px-3 py-2 text-sm bg-purple-600 text-white rounded hover:bg-purple-700">Refresh</button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Inbox</h3>
            <button onClick={() => setShowCompose(true)} className="px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700">New Message</button>
          </div>
        </div>

        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No messages</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map(m => (
              <div key={m.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {m.teacherName && <h4 className="font-medium text-gray-900">{m.teacherName}</h4>}
                      {m.studentName && <>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{m.studentName}</span>
                      </>}
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getTypeColor(m.type)}`}>
                        {String(m.type).charAt(0).toUpperCase() + String(m.type).slice(1)}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-2 whitespace-pre-wrap">{m.message}</p>
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      <span>{new Date(m.dateSent).toLocaleString()}</span>
                      <span>•</span>
                      <span className={m.status === 'read' ? 'text-green-600' : 'text-gray-600'}>
                        {m.status === 'read' ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </div>
                  {m.status !== 'read' && (
                    <button onClick={() => markRead(m.id)} className="ml-4 text-sm text-blue-600 hover:text-blue-800">Mark read</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-600">{error}</div>
        )}
      </div>

      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                <select
                  value={compose.teacherUserId}
                  onChange={(e) => setCompose({ ...compose, teacherUserId: e.target.value ? Number(e.target.value) as any : '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a teacher...</option>
                  {recipients.map(r => (
                    <option key={r.teacherUserId} value={r.teacherUserId}>{r.teacherName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Regarding Student (optional)</label>
                <select
                  value={compose.studentId}
                  onChange={(e) => setCompose({ ...compose, studentId: e.target.value ? Number(e.target.value) as any : '' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Select a student...</option>
                  {/* Aggregate unique students across recipients */}
                  {Array.from(new Map(recipients.flatMap(r => r.students).map(s => [s.studentId, s])).values()).map(s => (
                    <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={compose.type}
                  onChange={(e) => setCompose({ ...compose, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="general">General</option>
                  <option value="attendance">Attendance</option>
                  <option value="behavior">Behavior</option>
                  <option value="academic">Academic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  rows={4}
                  value={compose.message}
                  onChange={(e) => setCompose({ ...compose, message: e.target.value })}
                  placeholder="Type your message here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button onClick={send} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">Send</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


