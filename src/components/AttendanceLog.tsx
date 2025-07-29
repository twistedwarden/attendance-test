// import React from 'react';
import { Clock, CheckCircle, XCircle, User, MessageSquare } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  studentName: string;
  grade: string;
  time: string;
  status: 'present' | 'failed' | 'late';
  parentNotified: boolean;
}

const mockAttendance: AttendanceRecord[] = [
  {
    id: '1',
    studentName: 'Emma Johnson',
    grade: 'Grade 8',
    time: '8:15 AM',
    status: 'present',
    parentNotified: true
  },
  {
    id: '2',
    studentName: 'Michael Chen',
    grade: 'Grade 5',
    time: '8:12 AM',
    status: 'present',
    parentNotified: true
  },
  {
    id: '3',
    studentName: 'Unknown Student',
    grade: 'N/A',
    time: '8:10 AM',
    status: 'failed',
    parentNotified: false
  },
  {
    id: '4',
    studentName: 'Sarah Davis',
    grade: 'Grade 10',
    time: '8:35 AM',
    status: 'late',
    parentNotified: true
  },
  {
    id: '5',
    studentName: 'Alex Rodriguez',
    grade: 'Grade 3',
    time: '8:08 AM',
    status: 'present',
    parentNotified: true
  },
  {
    id: '6',
    studentName: 'Olivia Thompson',
    grade: 'Grade 7',
    time: '8:05 AM',
    status: 'present',
    parentNotified: true
  }
];

export default function AttendanceLog() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-50 border-green-200';
      case 'late':
        return 'bg-yellow-50 border-yellow-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present':
        return 'Present';
      case 'late':
        return 'Late Arrival';
      case 'failed':
        return 'Scan Failed';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Today's Attendance Log</h3>
        <div className="flex items-center space-x-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Export Report
          </button>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">Last updated: just now</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {mockAttendance.map((record) => (
          <div
            key={record.id}
            className={`p-4 rounded-lg border ${getStatusBg(record.status)} transition-colors hover:shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-gray-900">{record.studentName}</p>
                  <p className="text-sm text-gray-600">{record.grade} • {getStatusText(record.status)}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{record.time}</p>
                  <div className="flex items-center space-x-1">
                    <MessageSquare className={`h-3 w-3 ${record.parentNotified ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${record.parentNotified ? 'text-green-600' : 'text-gray-500'}`}>
                      {record.parentNotified ? 'Parent Notified' : 'Notification Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}