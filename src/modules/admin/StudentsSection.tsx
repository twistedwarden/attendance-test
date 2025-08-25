// import React from 'react';
import { Search, UserPlus, Edit, Trash2, Fingerprint } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  grade: string;
  fingerprintId: string;
  parentContact: string;
  lastScan: string;
  status: 'enrolled' | 'pending' | 'inactive';
}

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Emma Johnson',
    grade: 'Grade 1',
    fingerprintId: 'FP001',
    parentContact: '+1 (555) 123-4567',
    lastScan: '8:15 AM',
    status: 'enrolled'
  },
  {
    id: '2',
    name: 'Michael Chen',
    grade: 'Grade 2',
    fingerprintId: 'FP002',
    parentContact: '+1 (555) 234-5678',
    lastScan: '8:12 AM',
    status: 'enrolled'
  },
  {
    id: '3',
    name: 'Sarah Davis',
    grade: 'Grade 3',
    fingerprintId: 'FP003',
    parentContact: '+1 (555) 345-6789',
    lastScan: '8:35 AM',
    status: 'enrolled'
  },
  {
    id: '4',
    name: 'Alex Rodriguez',
    grade: 'Grade 4',
    fingerprintId: 'FP004',
    parentContact: '+1 (555) 456-7890',
    lastScan: '8:08 AM',
    status: 'enrolled'
  },
  {
    id: '5',
    name: 'Olivia Thompson',
    grade: 'Grade 5',
    fingerprintId: 'FP005',
    parentContact: '+1 (555) 567-8901',
    lastScan: '8:05 AM',
    status: 'enrolled'
  },
  {
    id: '6',
    name: 'James Wilson',
    grade: 'Grade 6',
    fingerprintId: 'FP006',
    parentContact: '+1 (555) 678-9012',
    lastScan: '8:20 AM',
    status: 'enrolled'
  },
  {
    id: '7',
    name: 'Sophia Brown',
    grade: 'Grade 7',
    fingerprintId: 'FP007',
    parentContact: '+1 (555) 789-0123',
    lastScan: '8:18 AM',
    status: 'enrolled'
  },
  {
    id: '8',
    name: 'New Student',
    grade: 'Grade 1',
    fingerprintId: 'Pending',
    parentContact: '+1 (555) 890-1234',
    lastScan: 'Never',
    status: 'pending'
  }
];

export default function StudentsSection() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm sm:text-base text-gray-600">Manage student enrollment and fingerprint data</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center">
          <UserPlus className="h-4 w-4" />
          <span>Enroll Student</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
          <select className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            <option>All Grades</option>
            <option>Grade 1</option>
            <option>Grade 2</option>
            <option>Grade 3</option>
            <option>Grade 4</option>
            <option>Grade 5</option>
            <option>Grade 6</option>
            <option>Grade 7</option>
          </select>
          <select className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
            <option>All Status</option>
            <option>Enrolled</option>
            <option>Pending</option>
            <option>Inactive</option>
          </select>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">Students ({mockStudents.length})</h3>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fingerprint ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Scan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="bg-blue-100 p-2 rounded-full mr-3">
                        <Fingerprint className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.grade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.fingerprintId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.parentContact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {student.lastScan}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(student.status)}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Cards */}
        <div className="lg:hidden">
          <div className="divide-y divide-gray-200">
            {mockStudents.map((student) => (
              <div key={student.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="bg-blue-100 p-2 rounded-full flex-shrink-0">
                      <Fingerprint className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">{student.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{student.grade}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadge(student.status)}`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                    <div className="flex space-x-1">
                      <button className="text-blue-600 hover:text-blue-900 p-1">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-500">Fingerprint ID:</span>
                    <div className="font-medium text-gray-900">{student.fingerprintId}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Scan:</span>
                    <div className="font-medium text-gray-900">{student.lastScan}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Parent Contact:</span>
                    <div className="font-medium text-gray-900">{student.parentContact}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}