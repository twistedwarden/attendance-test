// import React from 'react';
import { Users, Clock, CheckCircle } from 'lucide-react';

interface GradeData {
  grade: string;
  totalStudents: number;
  present: number;
  late: number;
  absent: number;
  attendanceRate: number;
}

const gradeData: GradeData[] = [
  { grade: 'Grade 1', totalStudents: 28, present: 26, late: 1, absent: 1, attendanceRate: 96.4 },
  { grade: 'Grade 2', totalStudents: 32, present: 30, late: 2, absent: 0, attendanceRate: 100 },
  { grade: 'Grade 3', totalStudents: 29, present: 27, late: 1, absent: 1, attendanceRate: 96.6 },
  { grade: 'Grade 4', totalStudents: 35, present: 33, late: 1, absent: 1, attendanceRate: 97.1 },
  { grade: 'Grade 5', totalStudents: 31, present: 29, late: 2, absent: 0, attendanceRate: 100 },
  { grade: 'Grade 6', totalStudents: 33, present: 31, late: 1, absent: 1, attendanceRate: 97.0 },
  { grade: 'Grade 7', totalStudents: 36, present: 34, late: 2, absent: 0, attendanceRate: 100 },
  { grade: 'Grade 8', totalStudents: 38, present: 35, late: 2, absent: 1, attendanceRate: 97.4 },
  { grade: 'Grade 9', totalStudents: 34, present: 32, late: 1, absent: 1, attendanceRate: 97.1 },
  { grade: 'Grade 10', totalStudents: 30, present: 28, late: 1, absent: 1, attendanceRate: 96.7 }
];

export default function GradeOverview() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Attendance by Grade</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View Details
        </button>
      </div>
      
      <div className="space-y-3">
        {gradeData.map((grade) => (
          <div
            key={grade.grade}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{grade.grade}</h4>
                  <p className="text-sm text-gray-600">{grade.totalStudents} students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">{grade.attendanceRate}%</p>
                <p className="text-xs text-gray-500">attendance</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-600">{grade.present} present</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3 text-yellow-500" />
                <span className="text-yellow-600">{grade.late} late</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="h-3 w-3 bg-red-500 rounded-full"></div>
                <span className="text-red-600">{grade.absent} absent</span>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${grade.attendanceRate}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}