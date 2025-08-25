import { useState } from 'react';
import { Download, Calendar, BarChart3, FileText, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function TeacherReportsView() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [reportType, setReportType] = useState('attendance');

  const weeklyStats = {
    totalStudents: 25,
    averageAttendance: 94.2,
    perfectAttendance: 18,
    chronicAbsent: 1,
    trend: 2.1
  };

  const monthlyStats = {
    totalStudents: 25,
    averageAttendance: 93.8,
    perfectAttendance: 15,
    chronicAbsent: 2,
    trend: -1.2
  };

  const currentStats = selectedPeriod === 'week' ? weeklyStats : monthlyStats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Class Reports</h2>
        <p className="text-gray-600">{user?.gradeLevel} - Section {user?.section}</p>
      </div>

      {/* Report Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="attendance">Attendance Summary</option>
              <option value="detailed">Detailed Report</option>
              <option value="parent">Parent Communication</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors">
              <Download className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{currentStats.totalStudents}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Attendance</p>
              <p className="text-2xl font-bold text-green-600">{currentStats.averageAttendance}%</p>
              <div className="flex items-center mt-1">
                {currentStats.trend > 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className={`text-xs ${currentStats.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(currentStats.trend)}% from last {selectedPeriod}
                </span>
              </div>
            </div>
            <div className="text-green-500">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Perfect Attendance</p>
              <p className="text-2xl font-bold text-blue-600">{currentStats.perfectAttendance}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((currentStats.perfectAttendance / currentStats.totalStudents) * 100)}% of class
              </p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Chronic Absent</p>
              <p className="text-2xl font-bold text-red-600">{currentStats.chronicAbsent}</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((currentStats.chronicAbsent / currentStats.totalStudents) * 100)}% of class
              </p>
            </div>
            <div className="text-red-500">
              <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Quick Reports</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Daily Attendance</h4>
                    <p className="text-sm text-gray-600 mb-2">Today's attendance summary</p>
                    <p className="text-xs text-gray-500">Available in: PDF, Excel</p>
                  </div>
                </div>
                <button className="text-green-600 hover:text-green-700 p-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Weekly Summary</h4>
                    <p className="text-sm text-gray-600 mb-2">Attendance trends this week</p>
                    <p className="text-xs text-gray-500">Available in: PDF, Excel</p>
                  </div>
                </div>
                <button className="text-blue-600 hover:text-blue-700 p-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Monthly Report</h4>
                    <p className="text-sm text-gray-600 mb-2">Comprehensive monthly data</p>
                    <p className="text-xs text-gray-500">Available in: PDF, Excel</p>
                  </div>
                </div>
                <button className="text-purple-600 hover:text-purple-700 p-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Student List</h4>
                    <p className="text-sm text-gray-600 mb-2">Class roster with contact info</p>
                    <p className="text-xs text-gray-500">Available in: PDF, Excel</p>
                  </div>
                </div>
                <button className="text-orange-600 hover:text-orange-700 p-2">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
