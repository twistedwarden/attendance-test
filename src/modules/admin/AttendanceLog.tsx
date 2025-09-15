// import React from 'react';
import { Clock, CheckCircle, XCircle, User, MessageSquare, BookOpen, Calendar, Search, Filter, Eye, BarChart3, TrendingUp, Users, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { AdminService } from './api/adminService';
import StudentSearchInput from './components/StudentSearchInput';
import Modal from './components/Modal';

interface AttendanceRow {
  AttendanceID: number;
  StudentID: number;
  Date: string;
  TimeIn?: string | null;
  TimeOut?: string | null;
  Status: 'Present' | 'Late' | 'Excused' | string;
  FullName?: string;
  GradeLevel?: string | null;
  Section?: string | null;
}

interface SubjectAttendanceRow {
  SubjectAttendanceID: number;
  StudentID: number;
  SubjectID: number;
  Date: string;
  Status: 'Present' | 'Late' | 'Excused' | string;
  ValidatedBy?: number | null;
  CreatedAt: string;
  FullName?: string;
  GradeLevel?: string | null;
  Section?: string | null;
  SubjectName?: string;
}

interface Subject {
  id: number;
  name: string;
}

export default function AttendanceLog() {
  const [items, setItems] = useState<AttendanceRow[]>([]);
  const [subjectItems, setSubjectItems] = useState<SubjectAttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openManual, setOpenManual] = useState(false);
  const [form, setForm] = useState<{ studentId: string; date: string; timeIn: string; status: 'Present'|'Excused'; }>({
    studentId: '',
    date: new Date().toISOString().slice(0,10),
    timeIn: new Date().toTimeString().slice(0,5),
    status: 'Present'
  });
  const [submitting, setSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: number; name: string; gradeLevel: string | null; section: string | null } | null>(null);
  const [studentSearchValue, setStudentSearchValue] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'general' | 'subject' | 'student'>('general');
  
  // Attendance Viewer Modal States
  const [attendanceViewerOpen, setAttendanceViewerOpen] = useState(false);
  const [viewerStudent, setViewerStudent] = useState<any>(null);
  const [viewerDate, setViewerDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewerRecords, setViewerRecords] = useState<SubjectAttendanceRow[]>([]);
  const [viewerLoading, setViewerLoading] = useState(false);
  const [viewerSearchValue, setViewerSearchValue] = useState('');
  const [attendanceStats, setAttendanceStats] = useState({
    total: 0,
    present: 0,
    late: 0,
    absent: 0,
    attendanceRate: 0
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      if (viewMode === 'general') {
        const data = await AdminService.listAttendanceLog(50, 0);
        setItems(data);
      } else if (viewMode === 'subject') {
        const data = await AdminService.listSubjectAttendance(50, 0, selectedSubject || undefined);
        setSubjectItems(data);
      } else if (viewMode === 'student') {
        const data = await AdminService.listSubjectAttendance(50, 0, undefined, undefined, selectedStudent?.id);
        setSubjectItems(data);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load attendance log');
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const data = await AdminService.getAllSubjects();
      setSubjects(data);
    } catch (e: any) {
      console.error('Failed to load subjects:', e);
    }
  };

  // Attendance Viewer Functions
  const openAttendanceViewer = async (student: any) => {
    setViewerStudent(student);
    setViewerSearchValue(`${student.name} (${student.gradeLevel} ${student.section})`);
    setAttendanceViewerOpen(true);
    await loadViewerRecords(student.id, viewerDate);
  };

  const loadViewerRecords = async (studentId: number, date: string) => {
    try {
      setViewerLoading(true);
      const data = await AdminService.listSubjectAttendance(50, 0, undefined, date, studentId);
      setViewerRecords(data);
      
      // Calculate attendance statistics
      const total = data.length;
      const present = data.filter(r => {
        const statusLower = (r.Status || '').toLowerCase();
        return !statusLower.includes('late') && !statusLower.includes('absent') && !statusLower.includes('fail');
      }).length;
      const late = data.filter(r => {
        const statusLower = (r.Status || '').toLowerCase();
        return statusLower.includes('late');
      }).length;
      const absent = data.filter(r => {
        const statusLower = (r.Status || '').toLowerCase();
        return statusLower.includes('absent') || statusLower.includes('fail');
      }).length;
      
      setAttendanceStats({
        total,
        present,
        late,
        absent,
        attendanceRate: total > 0 ? Math.round((present / total) * 100) : 0
      });
    } catch (error) {
      console.error('Failed to load viewer records:', error);
    } finally {
      setViewerLoading(false);
    }
  };

  const handleViewerDateChange = async (newDate: string) => {
    setViewerDate(newDate);
    if (viewerStudent) {
      await loadViewerRecords(viewerStudent.id, newDate);
    }
  };

  const handleStudentSelect = (student: { id: number; name: string; gradeLevel: string | null; section: string | null }) => {
    setSelectedStudent(student);
    setStudentSearchValue(`${student.name} (${student.gradeLevel} ${student.section})`);
    setForm({ ...form, studentId: student.id.toString() });
  };

  const resetForm = () => {
    setForm({
      studentId: '',
      date: new Date().toISOString().slice(0,10),
      timeIn: new Date().toTimeString().slice(0,5),
      status: 'Present'
    });
    setSelectedStudent(null);
  };

  useEffect(() => {
    load();
    loadSubjects();
  }, [viewMode, selectedSubject, selectedStudent]);

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
      
      // Format date for display
      const date = r.Date ? new Date(r.Date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'N/A';
      
      return {
        id: String(r.AttendanceID),
        studentId: r.StudentID, // Include original student ID
        studentName: r.FullName || `Student #${r.StudentID}`,
        grade: [r.GradeLevel, r.Section].filter(Boolean).join(' ').trim() || 'N/A',
        time: time,
        date: date,
        status,
        parentNotified: false
      };
    });
  }, [items]);

  const formattedSubject = useMemo(() => {
    return (subjectItems || []).map((r) => {
      const statusLower = (r.Status || '').toLowerCase();
      let status: 'present' | 'failed' | 'late' = 'present';
      if (statusLower.includes('late')) status = 'late';
      else if (statusLower.includes('absent') || statusLower.includes('fail')) status = 'failed';
      
      // Format date for display
      const date = r.Date ? new Date(r.Date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }) : 'N/A';
      
      return {
        id: String(r.SubjectAttendanceID),
        studentId: r.StudentID, // Include original student ID
        studentName: r.FullName || `Student #${r.StudentID}`,
        grade: [r.GradeLevel, r.Section].filter(Boolean).join(' ').trim() || 'N/A',
        subject: r.SubjectName || 'Unknown Subject',
        time: new Date(r.CreatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: date,
        status,
        parentNotified: false
      };
    });
  }, [subjectItems]);

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
        return 'Absent';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {viewMode === 'general' ? "Today's Attendance Log" : "Subject Attendance Log"}
        </h3>
        <div className="flex items-center space-x-2">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium" onClick={load} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-500">{loading ? 'Loading…' : 'Last updated: just now'}</span>
          <button
            className="ml-3 rounded-md bg-blue-600 text-white text-sm px-3 py-1.5 hover:bg-blue-700"
            onClick={() => setOpenManual(true)}
          >
            Add Manual Entry
          </button>
        </div>
      </div>

      {/* View Mode Toggle and Subject Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                viewMode === 'general'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('general')}
            >
              General Attendance
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                viewMode === 'subject'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('subject')}
            >
              <BookOpen className="h-4 w-4 inline mr-1" />
              By Subject
            </button>
            <button
              className={`px-3 py-1.5 text-sm rounded-md font-medium transition-colors ${
                viewMode === 'student'
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
              }`}
              onClick={() => setViewMode('student')}
            >
              <User className="h-4 w-4 inline mr-1" />
              By Student
            </button>
          </div>
        </div>

        {viewMode === 'subject' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter by Subject:</label>
            <select
              className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {viewMode === 'student' && (
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Filter by Student:</label>
            <div className="w-64">
              <StudentSearchInput
                value={studentSearchValue}
                onChange={(value) => {
                  setStudentSearchValue(value);
                  // Clear selection if search is empty
                  if (!value.trim()) {
                    setSelectedStudent(null);
                  }
                }}
                onSelect={handleStudentSelect}
                placeholder="Search by student name or ID..."
                className="w-full"
              />
            </div>
            {selectedStudent && (
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentSearchValue('');
                }}
                className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded"
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
      )}

      <div className="space-y-3">
        {(viewMode === 'general' ? formatted : formattedSubject).map((record) => (
          <div
            key={record.id}
            className={`p-4 rounded-lg border ${getStatusBg(record.status)} transition-colors hover:shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-gray-900">{record.studentName}</p>
                  <p className="text-sm text-gray-600">
                    {record.grade} • {getStatusText(record.status)}
                    {viewMode === 'subject' && 'subject' in record && (
                      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {record.subject}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{record.time}</p>
                  <p className="text-xs text-gray-500">{record.date}</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <MessageSquare className={`h-3 w-3 ${record.parentNotified ? 'text-green-500' : 'text-gray-400'}`} />
                    <span className={`text-xs ${record.parentNotified ? 'text-green-600' : 'text-gray-500'}`}>
                      {record.parentNotified ? 'Parent Notified' : 'Notification Pending'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    openAttendanceViewer({
                      id: (record as any).studentId || Math.random(),
                      name: record.studentName,
                      gradeLevel: record.grade.split(' ')[0] || null,
                      section: record.grade.split(' ').slice(1).join(' ') || null
                    });
                  }}
                  className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                  title="View Detailed Attendance"
                >
                  <Eye className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && (viewMode === 'general' ? formatted : formattedSubject).length === 0 && !error && (
          <div className="text-sm text-gray-500">
            {viewMode === 'general' ? 'No attendance logs found.' : 'No subject attendance records found.'}
          </div>
        )}
      </div>

      {openManual && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-5">
            <h4 className="text-md font-semibold mb-4">Add Manual Attendance</h4>
            {error && (
              <div className="mb-3 p-2 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
            )}
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-700 mb-1">Student</label>
                <StudentSearchInput
                  value={form.studentId}
                  onChange={(value) => setForm({ ...form, studentId: value })}
                  onSelect={handleStudentSelect}
                  placeholder="Search by ID or name..."
                />
                {selectedStudent && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="font-medium text-blue-900">{selectedStudent.name}</div>
                    <div className="text-blue-700">
                      ID: {selectedStudent.id}
                      {(selectedStudent.gradeLevel || selectedStudent.section) && (
                        <span className="ml-2">
                          • {[selectedStudent.gradeLevel, selectedStudent.section].filter(Boolean).join(' ')}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-700 mb-1">Time In</label>
                  <input
                    type="time"
                    className="w-full border rounded px-3 py-2 text-sm"
                    value={form.timeIn}
                    onChange={(e) => setForm({ ...form, timeIn: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">Status</label>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                >
                  <option value="Present">Present</option>
                  <option value="Excused">Excused</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end space-x-2">
              <button className="px-3 py-1.5 text-sm rounded border" onClick={() => { setOpenManual(false); resetForm(); }} disabled={submitting}>Cancel</button>
              <button
                className="px-3 py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                disabled={submitting || !form.studentId}
                onClick={async () => {
                  try {
                    setSubmitting(true);
                    setError(null);
                    await AdminService.createManualAttendance({
                      studentId: Number(form.studentId),
                      date: form.date,
                      timeIn: form.timeIn + ':00',
                      status: form.status
                    });
                    setOpenManual(false);
                    resetForm();
                    await load();
                  } catch (e: any) {
                    setError(e?.message || 'Failed to add attendance');
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {submitting ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Attendance Viewer Modal */}
      <Modal
        open={attendanceViewerOpen}
        title="Student Attendance Details"
        onClose={() => setAttendanceViewerOpen(false)}
        footer={(
          <div className="flex justify-between items-center w-full">
            <div className="text-sm text-gray-500">
              {viewerStudent && `Viewing: ${viewerStudent.name}`}
            </div>
            <button 
              onClick={() => setAttendanceViewerOpen(false)} 
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
          </div>
        )}
      >
        <div className="space-y-6">
          {/* Header with Student Info and Date Picker */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {viewerStudent?.name || 'Unknown Student'}
                </h3>
                <p className="text-sm text-gray-600">
                  {viewerStudent?.gradeLevel || 'N/A'} • {viewerStudent?.section || 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={viewerDate}
                onChange={(e) => handleViewerDateChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Student Search in Modal */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Search className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Search Different Student:</span>
            </div>
            <StudentSearchInput
              value={viewerSearchValue}
              onChange={(value) => setViewerSearchValue(value)}
              onSelect={(student) => {
                setViewerStudent(student);
                setViewerSearchValue(`${student.name} (${student.gradeLevel} ${student.section})`);
                loadViewerRecords(student.id, viewerDate);
              }}
              placeholder="Search for another student..."
              className="w-full"
            />
          </div>

          {/* Attendance Statistics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">Total Classes</span>
              </div>
              <p className="text-2xl font-bold text-blue-900 mt-1">{attendanceStats.total}</p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Present</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{attendanceStats.present}</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Late</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{attendanceStats.late}</p>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Absent</span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-1">{attendanceStats.absent}</p>
            </div>
          </div>

          {/* Attendance Rate Progress Bar */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Attendance Rate</span>
              <span className="text-sm font-bold text-gray-900">{attendanceStats.attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  attendanceStats.attendanceRate >= 90 ? 'bg-green-500' :
                  attendanceStats.attendanceRate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${attendanceStats.attendanceRate}%` }}
              ></div>
            </div>
          </div>

          {/* Subject Attendance Checklist */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h4 className="text-lg font-semibold text-gray-900">Subject Attendance Checklist</h4>
            </div>

            {viewerLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">Loading attendance records...</span>
              </div>
            ) : viewerRecords.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 border border-gray-200 rounded-lg">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No attendance records found for this date.</p>
                <p className="text-sm text-gray-400 mt-1">Try selecting a different date.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {viewerRecords.map((record) => {
                  const statusLower = (record.Status || '').toLowerCase();
                  let status: 'present' | 'failed' | 'late' = 'present';
                  if (statusLower.includes('late')) status = 'late';
                  else if (statusLower.includes('absent') || statusLower.includes('fail')) status = 'failed';

                  return (
                    <div
                      key={record.SubjectAttendanceID}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-sm ${
                        status === 'present' 
                          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
                          : status === 'late' 
                          ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' 
                          : 'bg-red-50 border-red-200 hover:bg-red-100'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'present' ? 'bg-green-500' :
                          status === 'late' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <h5 className="font-medium text-gray-900">{record.SubjectName || 'Unknown Subject'}</h5>
                          <p className="text-sm text-gray-600">
                            {new Date(record.CreatedAt).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          status === 'present' 
                            ? 'bg-green-100 text-green-800' 
                            : status === 'late' 
                            ? 'bg-yellow-100 text-yellow-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {status === 'present' ? 'Present' : status === 'late' ? 'Late Arrival' : 'Absent'}
                        </div>
                        {status === 'present' && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {status === 'late' && <Clock className="h-5 w-5 text-yellow-500" />}
                        {status === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}