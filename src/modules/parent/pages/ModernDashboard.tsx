import { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  BookOpen,
  Filter,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import DashboardOverview from '../components/DashboardOverview';
import SubjectAttendanceCard from '../components/SubjectAttendanceCard';
import DateFilter from '../components/DateFilter';
import { 
  ParentService,
  Student,
  AttendanceRecord,
  AttendanceStats,
  SubjectAttendanceData
} from '../api/parentService';

interface ModernDashboardProps {
  selectedStudent: Student | null;
}

const ModernDashboard = ({ selectedStudent }: ModernDashboardProps) => {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({ 
    todayStatus: 'No Record', 
    weeklyPercentage: 0 
  });
  const [subjectAttendanceData, setSubjectAttendanceData] = useState<SubjectAttendanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'subjects'>('overview');
  const [dateFilter, setDateFilter] = useState<{ from: Date; to: Date } | null>(null);

  useEffect(() => {
    if (selectedStudent) {
      loadStudentData();
    }
  }, [selectedStudent]);

  const loadStudentData = async () => {
    if (!selectedStudent) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const [records, stats, subjectData] = await Promise.all([
        ParentService.getStudentAttendance(selectedStudent.studentId),
        ParentService.getStudentAttendanceStats(selectedStudent.studentId),
        ParentService.getStudentSubjectAttendance(selectedStudent.studentId)
      ]);
      
      setAttendanceRecords(records);
      setAttendanceStats(stats);
      setSubjectAttendanceData(subjectData);
    } catch (error) {
      console.error('Error loading student data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateRangeChange = (dateRange: { from: Date; to: Date } | null) => {
    setDateFilter(dateRange);
    // Here you could filter the data based on the date range
    // For now, we'll just store the filter state
  };

  const handleRefresh = () => {
    loadStudentData();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg max-w-md">
            <p className="font-medium">Error loading data</p>
            <p className="text-sm mt-1">{error}</p>
            <button 
              onClick={handleRefresh}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  return (
    <div className="space-y-6">
      {/* Header with Tabs and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <RefreshCw size={20} />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <DateFilter onDateRangeChange={handleDateRangeChange} />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <TrendingUp size={18} />
          <span className="font-medium">Overview</span>
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
            activeTab === 'subjects'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <BookOpen size={18} />
          <span className="font-medium">By Subject</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <DashboardOverview 
          selectedStudent={selectedStudent}
          attendanceStats={attendanceStats}
          subjectAttendanceData={subjectAttendanceData}
        />
      )}

      {activeTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <BookOpen size={20} className="mr-2" />
              Attendance by Subject
            </h2>
            <div className="text-sm text-gray-600">
              {subjectAttendanceData.length} subject{subjectAttendanceData.length !== 1 ? 's' : ''}
            </div>
          </div>

          {subjectAttendanceData.length > 0 ? (
            <div className="space-y-4">
              {subjectAttendanceData.map((subjectData) => (
                <SubjectAttendanceCard 
                  key={subjectData.subjectId} 
                  subjectData={subjectData} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">No Subject Data Available</h3>
                <p className="text-gray-600">
                  Subject attendance records will appear here once they are available.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center">
            <Clock size={20} className="mr-2 text-gray-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.slice(0, 5).map((record, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-3">
                  <CheckCircle 
                    size={16} 
                    className={record.status === 'Present' ? 'text-green-600' : 
                              record.status === 'Late' ? 'text-yellow-600' : 'text-red-600'} 
                  />
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {new Date(record.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <p className="text-xs text-gray-500">In</p>
                    <p className="font-medium text-gray-800 text-sm">
                      {record.timeIn ? new Date(`2000-01-01T${record.timeIn}`).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : '--:--'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">Out</p>
                    <p className="font-medium text-gray-800 text-sm">
                      {record.timeOut ? new Date(`2000-01-01T${record.timeOut}`).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      }) : '--:--'}
                    </p>
                  </div>
                  
                  <div className={`px-2 py-1 rounded-full text-xs font-medium border ${
                    record.status === 'Present' ? 'bg-green-50 text-green-700 border-green-200' :
                    record.status === 'Late' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }`}>
                    {record.status}
                  </div>
                </div>
              </div>
            ))}
            
            {attendanceRecords.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Clock size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No recent activity found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ModernDashboard;
