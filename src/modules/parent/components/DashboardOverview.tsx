import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  BookOpen,
  User,
  Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Student, AttendanceStats, SubjectAttendanceData } from '../api/parentService';

interface DashboardOverviewProps {
  selectedStudent: Student | null;
  attendanceStats: AttendanceStats;
  subjectAttendanceData: SubjectAttendanceData[];
}

const DashboardOverview = ({ 
  selectedStudent, 
  attendanceStats, 
  subjectAttendanceData 
}: DashboardOverviewProps) => {
  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Parent Portal</h2>
          <p className="text-gray-600">Please select a student from the sidebar to view their information.</p>
        </div>
      </div>
    );
  }

  // Calculate overall statistics
  const totalSubjects = subjectAttendanceData.length;
  const totalAttendanceRecords = subjectAttendanceData.reduce((sum, subject) => sum + subject.stats.totalDays, 0);
  const totalPresentDays = subjectAttendanceData.reduce((sum, subject) => sum + subject.stats.presentDays, 0);
  const totalLateDays = subjectAttendanceData.reduce((sum, subject) => sum + subject.stats.lateDays, 0);
  const totalAbsentDays = subjectAttendanceData.reduce((sum, subject) => sum + subject.stats.absentDays, 0);
  
  const overallAttendanceRate = totalAttendanceRecords > 0 
    ? Math.round(((totalPresentDays + totalLateDays) / totalAttendanceRecords) * 100) 
    : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Present':
        return 'text-green-600';
      case 'Late':
        return 'text-yellow-600';
      case 'Excused':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  };

  const getPerformanceMessage = (rate: number) => {
    if (rate >= 95) return "Excellent attendance record!";
    if (rate >= 85) return "Good attendance pattern";
    if (rate >= 70) return "Needs improvement";
    return "Requires attention";
  };

  const getPerformanceColor = (rate: number) => {
    if (rate >= 95) return "text-green-600 bg-green-50";
    if (rate >= 85) return "text-yellow-600 bg-yellow-50";
    if (rate >= 70) return "text-orange-600 bg-orange-50";
    return "text-red-600 bg-red-50";
  };

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white p-6 rounded-xl shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <User size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center space-x-3">
                <span>{selectedStudent.fullName}</span>
                {selectedStudent.enrollmentStatus === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Pending</span>
                )}
              </h1>
              <p className="text-blue-100 text-lg">
                {selectedStudent.enrollmentStatus === 'pending' 
                  ? 'Enrollment Pending'
                  : `Grade ${selectedStudent.gradeLevel} • Section ${selectedStudent.section}`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-lg">{new Date().toLocaleDateString()}</p>
            <p className="text-sm text-blue-200">Welcome back!</p>
          </div>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock size={16} className="mr-2" />
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${getStatusColor(attendanceStats.todayStatus)}`}>
              {attendanceStats.todayStatus}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calendar size={16} className="mr-2" />
              Weekly Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {attendanceStats.weeklyPercentage}%
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp size={16} className="mr-2" />
              Overall Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              {overallAttendanceRate}%
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BookOpen size={16} className="mr-2" />
              Subjects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {totalSubjects}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <CheckCircle size={20} className="mr-2 text-green-600" />
              Attendance Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalPresentDays}</div>
                  <div className="text-sm text-green-700">Present Days</div>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{totalLateDays}</div>
                  <div className="text-sm text-yellow-700">Late Days</div>
                </div>
                <div className="p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{totalAbsentDays}</div>
                  <div className="text-sm text-red-700">Absent Days</div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">{totalAttendanceRecords}</div>
                  <div className="text-sm text-gray-700">Total Records</div>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Overall Performance</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(overallAttendanceRate)}`}>
                    {getPerformanceMessage(overallAttendanceRate)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subject Performance */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center">
              <Target size={20} className="mr-2 text-blue-600" />
              Subject Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {subjectAttendanceData.length > 0 ? (
                subjectAttendanceData.map((subject) => (
                  <div key={subject.subjectId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BookOpen size={16} className="text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-800 text-sm">{subject.subjectName}</div>
                        <div className="text-xs text-gray-500">{subject.teacherName}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getPerformanceColor(subject.stats.attendanceRate).split(' ')[0]}`}>
                        {subject.stats.attendanceRate}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {subject.stats.presentDays + subject.stats.lateDays}/{subject.stats.totalDays}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No subject data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardOverview;
