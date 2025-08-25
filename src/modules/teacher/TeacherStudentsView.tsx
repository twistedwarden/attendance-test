import { useState } from 'react';
import { Search, User, Phone, Mail, Filter } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface Student {
  id: string;
  name: string;
  studentId: string;
  section: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  attendanceRate: number;
  lastAttendance: string;
  status: 'active' | 'inactive';
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emma Johnson',
    studentId: 'ST001',
    section: 'A',
    parentName: 'Robert Johnson',
    parentPhone: '+1 (555) 123-4567',
    parentEmail: 'robert.johnson@email.com',
    attendanceRate: 96,
    lastAttendance: '2024-01-15',
    status: 'active'
  },
  {
    id: '2',
    name: 'Michael Chen',
    studentId: 'ST002',
    section: 'A',
    parentName: 'Lisa Chen',
    parentPhone: '+1 (555) 234-5678',
    parentEmail: 'lisa.chen@email.com',
    attendanceRate: 98,
    lastAttendance: '2024-01-15',
    status: 'active'
  },
  {
    id: '3',
    name: 'Sarah Davis',
    studentId: 'ST003',
    section: 'A',
    parentName: 'Mark Davis',
    parentPhone: '+1 (555) 345-6789',
    parentEmail: 'mark.davis@email.com',
    attendanceRate: 92,
    lastAttendance: '2024-01-15',
    status: 'active'
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    studentId: 'ST004',
    section: 'A',
    parentName: 'Maria Rodriguez',
    parentPhone: '+1 (555) 456-7890',
    parentEmail: 'maria.rodriguez@email.com',
    attendanceRate: 89,
    lastAttendance: '2024-01-14',
    status: 'active'
  },
  {
    id: '5',
    name: 'Olivia Thompson',
    studentId: 'ST005',
    section: 'A',
    parentName: 'David Thompson',
    parentPhone: '+1 (555) 567-8901',
    parentEmail: 'david.thompson@email.com',
    attendanceRate: 100,
    lastAttendance: '2024-01-15',
    status: 'active'
  }
];

export default function TeacherStudentsView() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');

  const filteredStudents = mockStudents
    .filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.parentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSection = user && student.section === user.section;
      
      return matchesSearch && matchesSection;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'attendance':
          return b.attendanceRate - a.attendanceRate;
        case 'studentId':
          return a.studentId.localeCompare(b.studentId);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">My Students</h2>
        <p className="text-gray-600">{user?.gradeLevel} - Section {user?.section} ({filteredStudents.length} students)</p>
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
            key={student.id}
            className={`bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow ${getAttendanceBg(student.attendanceRate)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.name}</h3>
                  <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${getAttendanceColor(student.attendanceRate)}`}>
                  {student.attendanceRate}%
                </p>
                <p className="text-xs text-gray-500">Attendance</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Parent:</span>
                <span className="font-medium text-gray-900">{student.parentName}</span>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Phone:</span>
                <a href={`tel:${student.parentPhone}`} className="font-medium text-blue-600 hover:text-blue-700">
                  {student.parentPhone}
                </a>
              </div>
              
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Email:</span>
                <a href={`mailto:${student.parentEmail}`} className="font-medium text-blue-600 hover:text-blue-700 truncate">
                  {student.parentEmail}
                </a>
              </div>
              
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Last Attendance:</span>
                  <span className="font-medium text-gray-900">{student.lastAttendance}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                Send Message
              </button>
              <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">
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
    </div>
  );
}
