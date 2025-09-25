import { Users, Calendar, BookOpen, TrendingUp, RefreshCw, Eye, CheckCircle, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { AdminService } from './api/adminService';

interface Props {
  onNavigate?: (section: string) => void;
}

interface AttendancePreviewItem {
  id: string;
  studentName: string;
  timeLabel: string;
  status: 'present' | 'late' | 'failed';
}

interface EnrollmentPreviewItem {
  id: number;
  name: string;
  gradeLevel?: string;
  submittedAt?: string;
}

export default function DashboardOverview({ onNavigate }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState([
    { label: 'Total Students', value: '—', icon: Users, change: '', changeType: 'positive' },
    { label: 'Attendance Rate', value: '—', icon: Calendar, change: '', changeType: 'positive' },
    { label: 'Active Classes', value: '—', icon: BookOpen, change: '', changeType: 'positive' },
    { label: 'Pending Enrollments', value: '—', icon: TrendingUp, change: '', changeType: 'positive' },
  ]);

  const [attendancePreview, setAttendancePreview] = useState<AttendancePreviewItem[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<EnrollmentPreviewItem[]>([]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);

      const [students, schedules, subjectToday, enrollmentsRes, teachers, enrollmentStats] = await Promise.all([
        AdminService.listStudents().catch(() => []),
        AdminService.listSchedules().catch(() => []),
        AdminService.listSubjectAttendance(200, 0).catch(() => []),
        AdminService.getEnrollments({ status: 'pending', page: 1, limit: 5 }).catch(() => ({ data: [] })),
        AdminService.getAllTeachers().catch(() => []),
        AdminService.getEnrollmentStats().catch(() => ({ total: 0, pending: 0, approved: 0, declined: 0 }))
      ]);

      const totalStudents = Array.isArray(students) ? students.length : 0;
      const activeClasses = Array.isArray(schedules) ? schedules.length : 0;

      const total = Array.isArray(subjectToday) ? subjectToday.length : 0;
      const present = total > 0 ? subjectToday.filter((r: any) => {
        const s = (r.Status || '').toLowerCase();
        return !s.includes('absent') && !s.includes('fail');
      }).length : 0;
      const attendanceRate = total > 0 ? Math.round((present / total) * 100) + '%' : '—';

      const pendingCount = (enrollmentStats as any)?.pending ?? (((enrollmentsRes as any).data || []).length);

      setStats([
        { label: 'Total Students', value: String(totalStudents), icon: Users, change: '', changeType: 'positive' },
        { label: 'Attendance Rate', value: String(attendanceRate), icon: Calendar, change: '', changeType: 'positive' },
        { label: 'Active Classes', value: String(activeClasses), icon: BookOpen, change: '', changeType: 'positive' },
        { label: 'Pending Enrollments', value: String(pendingCount), icon: TrendingUp, change: '', changeType: 'positive' },
      ]);

      const preview = (subjectToday as any[]).slice(0, 6).map((r) => {
        const statusLower = (r.Status || '').toLowerCase();
        let status: 'present' | 'late' | 'failed' = 'present';
        if (statusLower.includes('late')) status = 'late';
        else if (statusLower.includes('absent') || statusLower.includes('fail')) status = 'failed';
        return {
          id: String(r.SubjectAttendanceID || r.AttendanceID || Math.random()),
          studentName: r.FullName || `Student #${r.StudentID}`,
          timeLabel: r.CreatedAt ? new Date(r.CreatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : (r.TimeIn || r.TimeOut || '').toString().slice(0, 5),
          status,
        } as AttendancePreviewItem;
      });
      setAttendancePreview(preview);

      const enrollPreview = ((enrollmentsRes as any).data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        gradeLevel: e.gradeLevel,
        submittedAt: e.enrollmentDate,
      })) as EnrollmentPreviewItem[];
      setPendingEnrollments(enrollPreview);
    } catch (e: any) {
      setError(e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-gray-600">Key insights and recent activity</p>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-sm text-red-600">{error}</span>}
          <button
            onClick={loadDashboard}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Attendance</h3>
            <button
              onClick={() => onNavigate && onNavigate('attendance')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View all
            </button>
          </div>
          {attendancePreview.length === 0 ? (
            <div className="text-sm text-gray-500">No recent attendance records.</div>
          ) : (
            <div className="divide-y">
              {attendancePreview.map((a) => (
                <div key={a.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {a.status === 'present' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {a.status === 'late' && <Calendar className="h-4 w-4 text-yellow-500" />}
                    {a.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{a.studentName}</div>
                      <div className="text-xs text-gray-500 capitalize">{a.status}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700">{a.timeLabel || '--:--'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Enrollments</h3>
            <button
              onClick={() => onNavigate && onNavigate('enrollments')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Review
            </button>
          </div>
          {pendingEnrollments.length === 0 ? (
            <div className="text-sm text-gray-500">No pending applications.</div>
          ) : (
            <div className="space-y-3">
              {pendingEnrollments.map((e) => (
                <div key={e.id} className="p-3 border rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{e.name}</div>
                    <div className="text-xs text-gray-500">{e.gradeLevel ? `Grade ${e.gradeLevel}` : '—'}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.submittedAt && (
                      <span className="text-xs text-gray-500">{new Date(e.submittedAt).toLocaleDateString()}</span>
                    )}
                    <button
                      onClick={() => onNavigate && onNavigate('enrollments')}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="h-3 w-3" /> View
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={() => onNavigate && onNavigate('students')} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h4 className="font-medium text-gray-900">Add New Student</h4>
            <p className="text-sm text-gray-600">Register a new student</p>
          </button>
          <button onClick={() => onNavigate && onNavigate('reports')} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h4 className="font-medium text-gray-900">Generate Report</h4>
            <p className="text-sm text-gray-600">Create attendance report</p>
          </button>
          <button onClick={() => onNavigate && onNavigate('schedules')} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h4 className="font-medium text-gray-900">Manage Classes</h4>
            <p className="text-sm text-gray-600">Update class information</p>
          </button>
        </div>
      </div>
    </div>
  );
} 