import { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ModernAttendanceSection from '../components/ModernAttendanceSection';
import DateFilter from '../components/DateFilter';
import { 
  mockAttendanceData, 
  calculateAttendanceStats,
  Student,
  AttendanceRecord
} from '../data/enhancedMockData';

interface CompactDashboardProps {
  selectedDaughter: Student;
}

const CompactDashboard = ({ selectedDaughter }: CompactDashboardProps) => {
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>(
    selectedDaughter ? mockAttendanceData[selectedDaughter.studentId] || [] : []
  );

  // Get data for selected daughter
  const studentAttendance = selectedDaughter ? mockAttendanceData[selectedDaughter.studentId] || [] : [];
  
  // Calculate statistics
  const attendanceStats = calculateAttendanceStats(filteredAttendance);

  // Calculate additional stats
  const totalDays = studentAttendance.length;
  const presentDays = studentAttendance.filter(record => record.status === 'Present').length;
  const lateDays = studentAttendance.filter(record => record.status === 'Late').length;
  const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  const handleDateRangeChange = (dateRange: { from: Date; to: Date } | null) => {
    if (!dateRange || !selectedDaughter) {
      setFilteredAttendance(studentAttendance);
      return;
    }

    const filtered = studentAttendance.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= dateRange.from && recordDate <= dateRange.to;
    });
    
    setFilteredAttendance(filtered);
  };

  // Update filtered attendance when selected daughter changes
  useEffect(() => {
    setFilteredAttendance(studentAttendance);
  }, [selectedDaughter]);

  if (!selectedDaughter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Parent Portal</h2>
          <p className="text-gray-600">Please select a daughter from the sidebar to view her information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Student Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{selectedDaughter.fullName}</h1>
            <p className="text-blue-100 text-sm">Grade {selectedDaughter.gradeLevel} • Section {selectedDaughter.section}</p>
          </div>
          <div className="text-right">
            <p className="text-blue-100 text-sm">{new Date().toLocaleDateString()}</p>
            <p className="text-xs text-blue-200">Welcome back!</p>
          </div>
        </div>
      </div>

      {/* Compact Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <Clock size={14} className="mr-1" />
              Today's Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-base font-bold ${
              attendanceStats.todayStatus === 'Present' ? 'text-green-600' : 
              attendanceStats.todayStatus === 'Late' ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {attendanceStats.todayStatus}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <Calendar size={14} className="mr-1" />
              Weekly Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-blue-600">
              {attendanceStats.weeklyPercentage}%
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <CheckCircle size={14} className="mr-1" />
              Overall Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-purple-600">
              {attendancePercentage}%
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <TrendingUp size={14} className="mr-1" />
              Present Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-base font-bold text-green-600">
              {presentDays}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Quick Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1 text-sm">Attendance Summary</h4>
              <p className="text-sm text-blue-600">
                {presentDays} present days out of {totalDays} total days
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1 text-sm">Performance</h4>
              <p className="text-sm text-green-600">
                {attendancePercentage >= 95 ? "Excellent attendance record!" :
                 attendancePercentage >= 85 ? "Good attendance pattern" :
                 "Needs improvement"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Section with Date Filter */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Clock className="mr-2" size={18} />
            Attendance Records
          </h2>
          <DateFilter onDateRangeChange={handleDateRangeChange} />
        </div>
        <ModernAttendanceSection attendanceRecords={filteredAttendance} />
      </div>
    </div>
  );
};

export default CompactDashboard; 