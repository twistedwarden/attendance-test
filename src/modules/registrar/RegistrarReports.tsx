import { useState, useEffect } from 'react';
import { Download, Calendar, Users, TrendingUp, FileText, BarChart3, Filter } from 'lucide-react';
import { RegistrarService } from './api/registrarService';

interface ReportData {
  attendanceRate: number;
  totalStudents: number;
  enrolledStudents: number;
  pendingEnrollments: number;
  monthlyStats: Array<{
    month: string;
    enrollments: number;
    attendance: number;
  }>;
  gradeLevelStats: Array<{
    grade: string;
    students: number;
    attendance: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

interface ReportFilters {
  dateRange: string;
  gradeLevel: string;
  reportType: string;
}

export default function RegistrarReports() {
  const [reportData, setReportData] = useState<ReportData>({
    attendanceRate: 0,
    totalStudents: 0,
    enrolledStudents: 0,
    pendingEnrollments: 0,
    monthlyStats: [],
    gradeLevelStats: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: '30',
    gradeLevel: 'all',
    reportType: 'overview'
  });

  useEffect(() => {
    loadReportData();
  }, [filters]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await RegistrarService.getReports(filters);
      setReportData(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type: string) => {
    try {
      await RegistrarService.exportReport(type, filters);
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const getDateRangeLabel = (days: string) => {
    switch (days) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      case '365': return 'Last year';
      default: return 'All time';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Generate comprehensive reports on enrollment and attendance data.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
              <option value="all">All time</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <select
              value={filters.gradeLevel}
              onChange={(e) => setFilters({...filters, gradeLevel: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Grades</option>
              <option value="1">Grade 1</option>
              <option value="2">Grade 2</option>
              <option value="3">Grade 3</option>
              <option value="4">Grade 4</option>
              <option value="5">Grade 5</option>
              <option value="6">Grade 6</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={filters.reportType}
              onChange={(e) => setFilters({...filters, reportType: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="enrollment">Enrollment</option>
              <option value="attendance">Attendance</option>
              <option value="detailed">Detailed Analysis</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadReportData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Filter className="w-4 h-4 mr-2" />
              Apply
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.attendanceRate}%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-50 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Enrolled</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.enrolledStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Calendar className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.pendingEnrollments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Stats Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
            <button
              onClick={() => handleExport('monthly')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          
          <div className="space-y-3">
            {reportData.monthlyStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{stat.month}</p>
                  <p className="text-sm text-gray-600">Enrollments: {stat.enrollments}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{stat.attendance}%</p>
                  <p className="text-xs text-gray-600">Attendance</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grade Level Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Grade Level Distribution</h3>
            <button
              onClick={() => handleExport('grade')}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </button>
          </div>
          
          <div className="space-y-3">
            {reportData.gradeLevelStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Grade {stat.grade}</p>
                  <p className="text-sm text-gray-600">{stat.students} students</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{stat.attendance}%</p>
                  <p className="text-xs text-gray-600">Attendance</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            onClick={() => handleExport('activity')}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Download className="w-4 h-4 mr-1" />
            Export
          </button>
        </div>
        
        <div className="space-y-3">
          {reportData.recentActivity.length > 0 ? (
            reportData.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.timestamp}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => handleExport('enrollment')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <FileText className="w-8 h-8 text-blue-600 mb-2" />
            <h4 className="font-medium text-gray-900">Enrollment Report</h4>
            <p className="text-sm text-gray-600">Complete enrollment data</p>
          </button>
          
          <button
            onClick={() => handleExport('attendance')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
            <h4 className="font-medium text-gray-900">Attendance Report</h4>
            <p className="text-sm text-gray-600">Attendance analytics</p>
          </button>
          
          <button
            onClick={() => handleExport('students')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <Users className="w-8 h-8 text-purple-600 mb-2" />
            <h4 className="font-medium text-gray-900">Student Directory</h4>
            <p className="text-sm text-gray-600">Student information</p>
          </button>
          
          <button
            onClick={() => handleExport('summary')}
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <TrendingUp className="w-8 h-8 text-yellow-600 mb-2" />
            <h4 className="font-medium text-gray-900">Summary Report</h4>
            <p className="text-sm text-gray-600">Executive summary</p>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}
