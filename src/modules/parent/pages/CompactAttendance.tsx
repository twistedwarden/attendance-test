import { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import ModernAttendanceSection from '../components/ModernAttendanceSection';
import DateFilter from '../components/DateFilter';
import { 
  ParentService,
  Student,
  AttendanceRecord,
  AttendanceStats
} from '../api/parentService';

interface CompactAttendanceProps {
  selectedDaughter: Student;
}

const CompactAttendance = ({ selectedDaughter }: CompactAttendanceProps) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredAttendance, setFilteredAttendance] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ todayStatus: 'No Record', weeklyPercentage: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedDaughter) {
      loadStudentData();
    }
  }, [selectedDaughter]);

  const loadStudentData = async () => {
    if (!selectedDaughter) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [records, stats] = await Promise.all([
        ParentService.getStudentAttendance(selectedDaughter.studentId),
        ParentService.getStudentAttendanceStats(selectedDaughter.studentId)
      ]);
      
      setAttendanceRecords(records);
      setFilteredAttendance(records);
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error loading student data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedDaughter) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Student Selected</h2>
          <p className="text-gray-600">Please select a daughter from the sidebar to view her attendance.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Clock size={48} className="mx-auto mb-4 text-gray-300 animate-spin" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading...</h2>
          <p className="text-gray-600">Fetching attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle size={48} className="mx-auto mb-4 text-red-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error Loading Data</h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={loadStudentData}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate detailed statistics
  const totalDays = filteredAttendance.length;
  const presentDays = filteredAttendance.filter(record => record.status === 'Present').length;
  const lateDays = filteredAttendance.filter(record => record.status === 'Late').length;
  const excusedDays = filteredAttendance.filter(record => record.status === 'Excused').length;

  const attendancePercentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

  const handleDateRangeChange = (dateRange: { from: Date; to: Date } | null) => {
    if (!dateRange) {
      setFilteredAttendance(attendanceRecords);
      return;
    }

    const filtered = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= dateRange.from && recordDate <= dateRange.to;
    });
    
    setFilteredAttendance(filtered);
  };


  return (
    <div className="space-y-6">
      {/* Compact Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center">
            <Clock className="mr-2" size={24} />
            Attendance Records
          </h1>
          <p className="text-gray-600 text-sm">
            {selectedDaughter.fullName}'s attendance and punctuality
          </p>
        </div>
        <DateFilter onDateRangeChange={handleDateRangeChange} />
      </div>

      {/* Compact Attendance Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <Calendar size={14} className="mr-1" />
              Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{attendancePercentage}%</div>
            <p className="text-xs text-gray-500">Overall</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <CheckCircle size={14} className="mr-1" />
              Time in
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">{presentDays}</div>
            <p className="text-xs text-gray-500">Days</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <AlertCircle size={14} className="mr-1" />
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-yellow-600">{lateDays}</div>
            <p className="text-xs text-gray-500">Days</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <XCircle size={14} className="mr-1" />
              Late
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">{lateDays}</div>
            <p className="text-xs text-gray-500">Days</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-gray-600 flex items-center">
              <Calendar size={14} className="mr-1" />
              Excused
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{excusedDays}</div>
            <p className="text-xs text-gray-500">Days</p>
          </CardContent>
        </Card>
      </div>

      {/* Compact Attendance Pattern Analysis */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2 text-sm">Weekly Summary</h4>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">This Week:</span>
                  <span className="font-medium">{attendanceStats.weeklyPercentage}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Today:</span>
                  <span className={`font-medium ${
                    attendanceStats.todayStatus === 'Present' ? 'text-green-600' :
                    attendanceStats.todayStatus === 'Late' ? 'text-yellow-600' :
                    attendanceStats.todayStatus === 'Absent' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {attendanceStats.todayStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-2 text-sm">Performance Insights</h4>
              <p className="text-sm text-gray-600">
                {attendancePercentage >= 95 && "Excellent attendance record! Keep up the great work."}
                {attendancePercentage >= 85 && attendancePercentage < 95 && "Good attendance. Consider improving punctuality."}
                {attendancePercentage >= 75 && attendancePercentage < 85 && "Attendance needs improvement."}
                {attendancePercentage < 75 && "Poor attendance record. Please contact school."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Attendance Records */}
      <ModernAttendanceSection attendanceRecords={filteredAttendance} />
    </div>
  );
};

export default CompactAttendance; 