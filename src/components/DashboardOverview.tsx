// import React from 'react';
import StatsCard from './StatsCard';
import { Users, Clock, CheckCircle, MessageSquare } from 'lucide-react';

export default function DashboardOverview() {
  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value="346"
          icon={Users}
          trend={{ value: "Grades 1-7", isPositive: true }}
          color="blue"
        />
        <StatsCard
          title="Present Today"
          value="325"
          icon={CheckCircle}
          trend={{ value: "93.9% attendance", isPositive: true }}
          color="green"
        />
        <StatsCard
          title="Late Arrivals"
          value="12"
          icon={Clock}
          trend={{ value: "3.5% of students", isPositive: false }}
          color="yellow"
        />
        <StatsCard
          title="Parent Notifications"
          value="337"
          icon={MessageSquare}
          trend={{ value: "100% sent", isPositive: true }}
          color="purple"
        />
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">School Start Time</span>
              <span className="font-medium">8:00 AM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">First Scan</span>
              <span className="font-medium">7:45 AM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Scan</span>
              <span className="font-medium">8:35 AM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Peak Time</span>
              <span className="font-medium">8:10-8:20 AM</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Scanner Status</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="font-medium text-green-600">Online</span>
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">98.7%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Scans Today</span>
              <span className="font-medium">337</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Failed Scans</span>
              <span className="font-medium text-red-600">4</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}