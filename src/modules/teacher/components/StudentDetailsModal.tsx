import { useEffect, useState } from 'react';
import { X, User, Calendar, MapPin, BookOpen, Phone, Mail, FileText } from 'lucide-react';
import TeacherService from '../api/teacherService';

interface Props {
  scheduleId: number;
  studentId: number;
  onClose: () => void;
}

export default function StudentDetailsModal({ scheduleId, studentId, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await TeacherService.getStudentDetails(scheduleId, studentId, { dateFrom, dateTo });
        if (!ignore) setData(res);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load details');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, [scheduleId, studentId, dateFrom, dateTo]);

  const student = data?.student;
  const attendance = data?.attendance || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Student Details</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[75vh] overflow-auto">
          {error && <div className="text-sm text-red-600">{error}</div>}
          {loading && <div className="text-sm text-gray-600">Loading...</div>}

          {student && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-2 rounded-full"><User className="h-5 w-5 text-blue-600" /></div>
                  <div>
                    <div className="font-semibold text-gray-900">{student.fullName}</div>
                    <div className="text-sm text-gray-600">ID: {student.studentId}</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700"><Calendar className="h-4 w-4" />DOB: {student.dateOfBirth ? String(student.dateOfBirth).slice(0,10) : '—'}</div>
                  <div className="flex items-center gap-2 text-gray-700"><MapPin className="h-4 w-4" />Address: {student.address || '—'}</div>
                  <div className="flex items-center gap-2 text-gray-700"><BookOpen className="h-4 w-4" />{student.gradeLevel || ''} {student.sectionName ? `• ${student.sectionName}` : ''}</div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-2 rounded-full"><User className="h-5 w-5 text-green-600" /></div>
                  <div>
                    <div className="font-semibold text-gray-900">Parent / Guardian</div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700"><FileText className="h-4 w-4" />{student.parentName || '—'}</div>
                  <div className="flex items-center gap-2 text-gray-700"><Phone className="h-4 w-4" />{student.parentContact || '—'}</div>
                  <div className="flex items-center gap-2 text-gray-700"><Mail className="h-4 w-4" />{student.parentContact || '—'}</div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-end justify-between">
            <div className="font-semibold text-gray-900">Attendance (this subject)</div>
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-xs text-gray-600">From</label>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-2 py-1 border rounded-md text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-600">To</label>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-2 py-1 border rounded-md text-sm" />
              </div>
            </div>
          </div>
          <div className="border rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 border-b text-sm font-medium text-gray-700">
              <div className="px-4 py-2">Date</div>
              <div className="px-4 py-2">Status</div>
              <div className="px-4 py-2">Validated By</div>
            </div>
            <div className="divide-y">
              {attendance.map((row: any) => (
                <div key={row.id} className="grid grid-cols-3 text-sm">
                  <div className="px-4 py-2">{String(row.date).slice(0,10)}</div>
                  <div className="px-4 py-2">{row.status}</div>
                  <div className="px-4 py-2">{row.validatedBy || '—'}</div>
                </div>
              ))}
              {attendance.length === 0 && (
                <div className="px-4 py-6 text-sm text-gray-500">No attendance found for selected period.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


