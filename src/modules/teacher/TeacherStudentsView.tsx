import { useEffect, useState } from 'react';
import { Search, User, Phone, Mail, Filter } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { TeacherService, TeacherSchedule } from './api/teacherService';
import StudentDetailsModal from './components/StudentDetailsModal';

type Student = { id: number; studentId: number; studentName: string; gradeLevel?: string | null; sectionName?: string | null };

export default function TeacherStudentsView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [schedules, setSchedules] = useState<TeacherSchedule[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailStudentId, setDetailStudentId] = useState<number | null>(null);

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
    if (!selectedScheduleId) return;
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await TeacherService.getStudents(selectedScheduleId);
        if (ignore) return;
        setStudents(rows as any);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load students');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [selectedScheduleId]);

  const filteredStudents = students
    .filter(student => {
      const matchesSearch = (student.studentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           String(student.studentId).includes(searchTerm);
      const matchesSection = true;
      
      return matchesSearch && matchesSection;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.studentName || '').localeCompare(b.studentName || '');
        case 'attendance':
          return 0;
        case 'studentId':
          return String(a.studentId).localeCompare(String(b.studentId));
        default:
          return 0;
      }
    });

  const getAttendanceColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceBg = (rate: number) => {
    if (rate >= 95) return 'bg-green-50 border-green-200';
    if (rate >= 90) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Students</h2>
          <p className="text-gray-600">{filteredStudents.length} students</p>
        </div>
        <div>
          <select
            value={selectedScheduleId ?? ''}
            onChange={(e) => setSelectedScheduleId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {schedules.length === 0 && <option value="">No schedules</option>}
            {schedules.map(s => (
              <option key={s.id} value={s.id}>{s.dayOfWeek} • {s.subjectName}{s.sectionName ? ` • ${s.sectionName}` : ''} • {s.startTime}-{s.endTime}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students, ID, or parent name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="name">Sort by Name</option>
              <option value="studentId">Sort by Student ID</option>
              <option value="attendance">Sort by Attendance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredStudents.map((student) => (
          <div
            key={student.studentId}
            className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.studentName}</h3>
                  <p className="text-sm text-gray-600">ID: {student.studentId} {student.gradeLevel ? `• ${student.gradeLevel}` : ''} {student.sectionName ? `• ${student.sectionName}` : ''}</p>
                </div>
              </div>
              <div className="text-right"></div>
            </div>

            <div className="space-y-3">
              <div className="pt-1"></div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                Send Message
              </button>
              <button
                onClick={() => setDetailStudentId(student.studentId)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No students found matching your search criteria</p>
        </div>
      )}

      {/* Details Modal */}
      {selectedScheduleId !== null && detailStudentId !== null && (
        <StudentDetailsModal
          scheduleId={selectedScheduleId}
          studentId={detailStudentId}
          onClose={() => setDetailStudentId(null)}
        />)
      }
    </div>
  );
}

