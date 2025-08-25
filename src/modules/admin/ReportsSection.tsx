// import React from 'react';
import { Download, Calendar, FileText, BarChart3, Filter } from 'lucide-react';

export default function ReportsSection() {
  const reportTypes = [
    {
      id: 'daily',
      title: 'Daily Attendance Report',
      description: 'Complete attendance log for today',
      icon: Calendar,
      format: 'PDF, CSV, Excel'
    },
    {
      id: 'weekly',
      title: 'Weekly Summary',
      description: 'Attendance trends for the past week',
      icon: BarChart3,
      format: 'PDF, Excel'
    },
    {
      id: 'monthly',
      title: 'Monthly Report',
      description: 'Comprehensive monthly attendance data',
      icon: FileText,
      format: 'PDF, Excel'
    },
    {
      id: 'grade',
      title: 'Grade-wise Analysis',
      description: 'Attendance breakdown by grade level',
      icon: BarChart3,
      format: 'PDF, CSV, Excel'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p className="text-gray-600">Generate and export attendance reports</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">94.2%</p>
              <p className="text-sm text-green-600">↗ +2.1% from last week</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">93.8%</p>
              <p className="text-sm text-green-600">↗ +1.5% from last month</p>
            </div>
            <Calendar className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Late Time</p>
              <p className="text-2xl font-bold text-gray-900">12 min</p>
              <p className="text-sm text-red-600">↗ +3 min from last week</p>
            </div>
            <FileText className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Report Generator */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Generate Custom Report</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade Filter</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>All Grades</option>
              <option>Grade 1-3</option>
              <option>Grade 4-7</option>
              <option>Specific Grade</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>PDF</option>
              <option>CSV</option>
              <option>Excel</option>
            </select>
          </div>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors">
          <Download className="h-5 w-5" />
          <span>Generate Report</span>
        </button>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.title}</h3>
                  <p className="text-gray-600 mb-3">{report.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Available formats: {report.format}</span>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Generate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 