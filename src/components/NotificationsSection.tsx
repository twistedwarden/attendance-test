import React from 'react';
import { MessageSquare, Send, Clock, CheckCircle, XCircle, Users } from 'lucide-react';

interface Notification {
  id: string;
  studentName: string;
  grade: string;
  parentContact: string;
  message: string;
  status: 'sent' | 'pending' | 'failed';
  timestamp: string;
  type: 'arrival' | 'late' | 'absent';
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    studentName: 'Emma Johnson',
    grade: 'Grade 1',
    parentContact: '+1 (555) 123-4567',
    message: 'Emma has arrived at school at 8:15 AM',
    status: 'sent',
    timestamp: '8:15 AM',
    type: 'arrival'
  },
  {
    id: '2',
    studentName: 'Michael Chen',
    grade: 'Grade 2',
    parentContact: '+1 (555) 234-5678',
    message: 'Michael has arrived at school at 8:12 AM',
    status: 'sent',
    timestamp: '8:12 AM',
    type: 'arrival'
  },
  {
    id: '3',
    studentName: 'Sarah Davis',
    grade: 'Grade 3',
    parentContact: '+1 (555) 345-6789',
    message: 'Sarah arrived late at 8:35 AM',
    status: 'sent',
    timestamp: '8:35 AM',
    type: 'late'
  },
  {
    id: '4',
    studentName: 'Alex Rodriguez',
    grade: 'Grade 4',
    parentContact: '+1 (555) 456-7890',
    message: 'Alex has arrived at school at 8:08 AM',
    status: 'pending',
    timestamp: '8:08 AM',
    type: 'arrival'
  },
  {
    id: '5',
    studentName: 'Olivia Thompson',
    grade: 'Grade 5',
    parentContact: '+1 (555) 567-8901',
    message: 'Failed to send arrival notification',
    status: 'failed',
    timestamp: '8:05 AM',
    type: 'arrival'
  },
  {
    id: '6',
    studentName: 'James Wilson',
    grade: 'Grade 6',
    parentContact: '+1 (555) 678-9012',
    message: 'James has arrived at school at 8:20 AM',
    status: 'sent',
    timestamp: '8:20 AM',
    type: 'arrival'
  },
  {
    id: '7',
    studentName: 'Sophia Brown',
    grade: 'Grade 7',
    parentContact: '+1 (555) 789-0123',
    message: 'Sophia has arrived at school at 8:18 AM',
    status: 'sent',
    timestamp: '8:18 AM',
    type: 'arrival'
  }
];

export default function NotificationsSection() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <MessageSquare className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'arrival':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const sentCount = mockNotifications.filter(n => n.status === 'sent').length;
  const pendingCount = mockNotifications.filter(n => n.status === 'pending').length;
  const failedCount = mockNotifications.filter(n => n.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Parent Notifications</h2>
          <p className="text-gray-600">Manage and monitor parent communication</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Send className="h-4 w-4" />
          <span>Send Bulk Message</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sent</p>
              <p className="text-2xl font-bold text-green-600">{sentCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{failedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">
                {Math.round((sentCount / mockNotifications.length) * 100)}%
              </p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {mockNotifications.map((notification) => (
            <div key={notification.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {getStatusIcon(notification.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{notification.studentName}</h4>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{notification.grade}</span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(notification.type)}`}>
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>To: {notification.parentContact}</span>
                      <span>•</span>
                      <span>{notification.timestamp}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {notification.status === 'failed' && (
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Retry
                    </button>
                  )}
                  {notification.status === 'pending' && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}