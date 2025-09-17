import { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle, XCircle, User, Search, Calendar } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { TeacherService, TeacherSchedule } from './api/teacherService';

type AttendanceStatus = 'Present' | 'Late' | 'Excused' | 'Absent' | null;

export default function TeacherAttendanceView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [attendanceRows, setAttendanceRows] = useState<Array<{ studentId: number; studentName: string; sectionName: string | null; subjectAttendanceId: number | null; status: AttendanceStatus }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setError(null);
        const data = await TeacherService.getSchedules();
        if (ignore) return;
        setSchedules(data);
        if (data.length > 0) setSelectedScheduleId(prev => prev ?? data[0].id);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load schedules');
      }
    })();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!selectedScheduleId || !selectedDate) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await TeacherService.getSubjectAttendance(selectedScheduleId, selectedDate);
        if (ignore) return;
        setAttendanceRows(rows.map(r => ({
          studentId: r.studentId,
          studentName: r.studentName,
          sectionName: r.sectionName,
          subjectAttendanceId: r.subjectAttendanceId,
          status: (r.status as AttendanceStatus)
        })));
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load attendance');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [selectedScheduleId, selectedDate]);

  const filteredAttendance = useMemo(() => {
    return attendanceRows.filter(r => {
      const matchesSearch = r.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.studentId).includes(searchTerm);
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendanceRows, searchTerm, statusFilter]);

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'Late':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'Absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'Excused':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBg = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return 'bg-green-50 border-green-200';
      case 'Late':
        return 'bg-yellow-50 border-yellow-200';
      case 'Absent':
        return 'bg-red-50 border-red-200';
      case 'Excused':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const presentCount = filteredAttendance.filter(r => r.status === 'Present').length;
  const lateCount = filteredAttendance.filter(r => r.status === 'Late').length;
  const absentCount = filteredAttendance.filter(r => r.status === 'Absent').length;
  const totalStudents = filteredAttendance.length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const selectedSchedule = useMemo(() => schedules.find(s => s.id === selectedScheduleId) || null, [schedules, selectedScheduleId]);

  const setStatus = async (studentId: number, status: Exclude<AttendanceStatus, null>) => {
    if (!selectedScheduleId) return;
    try {
      setError(null);
      await TeacherService.setSubjectAttendance({ scheduleId: selectedScheduleId, studentId, date: selectedDate, status });
      setAttendanceRows(prev => prev.map(r => r.studentId === studentId ? { ...r, status } : r));
    } catch (e: any) {
      setError(e?.message || 'Failed to update attendance');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Attendance</h2>
          <p className="text-gray-600">
            {selectedSchedule ? `${selectedSchedule.subjectName}${selectedSchedule.sectionName ? ' • ' + selectedSchedule.sectionName : ''}` : '—'} • {selectedDate}
          </p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
          <Calendar className="h-4 w-4" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <User className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Time in</p>
              <p className="text-2xl font-bold text-green-600">{presentCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Late</p>
              <p className="text-2xl font-bold text-yellow-600">{lateCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-blue-600">{attendanceRate}%</p>
            </div>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">{attendanceRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Schedule</label>
            <select
              value={selectedScheduleId ?? ''}
              onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {schedules.length === 0 && <option value="">No schedules</option>}
              {schedules.map(s => (
                <option key={s.id} value={s.id}>{s.dayOfWeek} • {s.subjectName}{s.sectionName ? ` • ${s.sectionName}` : ''} • {s.startTime}-{s.endTime}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter || 'all'}
              onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : e.target.value as AttendanceStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="Present">Time in</option>
              <option value="Late">Late</option>
              <option value="Absent">Absent</option>
              <option value="Excused">Excused</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Student Attendance</h3>
        </div>
        {error && <div className="px-6 py-4 text-sm text-red-600">{error}</div>}
        {loading && <div className="px-6 py-4 text-sm text-gray-600">Loading...</div>}
        <div className="divide-y divide-gray-200">
          {filteredAttendance.map((record) => (
            <div key={record.studentId} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(record.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-gray-900">{record.studentName}</h4>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{record.studentId}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{record.sectionName || '—'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBg(record.status)}`}>
                        {record.status || '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <select
                    value={record.status || ''}
                    onChange={(e) => setStatus(record.studentId, (e.target.value || 'Absent') as Exclude<AttendanceStatus, null>)}
                    className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">—</option>
                    <option value="Present">Time in</option>
                    <option value="Late">Late</option>
                    <option value="Excused">Excused</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 