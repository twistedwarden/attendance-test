// import React from 'react';
import { Clock, CheckCircle, XCircle, User, MessageSquare } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminService } from './api/adminService';

interface AttendanceRow {
  AttendanceID: number;
  StudentID: number;
  Date: string;
  TimeIn?: string | null;
  TimeOut?: string | null;
  Status: 'Present' | 'Absent' | 'Late' | 'Excused' | string;
  FullName?: string;
  GradeLevel?: string | null;
  Section?: string | null;
}

export default function AttendanceLog() {
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await AdminService.listAttendanceLog(50, 0);
      setItems(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load attendance log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const formatted = useMemo(() => {
    return (items || []).map((r) => {
      const timeRaw = r.TimeIn || r.TimeOut || '';
      const time = timeRaw ? timeRaw.toString().slice(0,5) : '';
      const statusLower = (r.Status || '').toLowerCase();
      let status: 'present' | 'failed' | 'late' = 'present';
      if (statusLower.includes('late')) status = 'late';
      else if (statusLower.includes('absent') || statusLower.includes('fail')) status = 'failed';
      return {
        id: String(r.AttendanceID),
        studentName: r.FullName || `Student #${r.StudentID}`,
        grade: [r.GradeLevel, r.Section].filter(Boolean).join(' ').trim() || 'N/A',
        time: time,
        status,
        parentNotified: false
      };
    });
  }, [items]);

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
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">{loading ? 'Loading…' : 'Last updated: just now'}</span>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {formatted.map((record) => (
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
        {!loading && formatted.length === 0 && !error && (
          <div className="text-sm text-gray-500">No attendance logs found.</div>
        )}
      </div>
    </div>
  );
}