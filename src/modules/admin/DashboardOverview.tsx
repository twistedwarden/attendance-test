import { Users, Calendar, BookOpen, TrendingUp } from 'lucide-react';

export default function DashboardOverview() {
  const stats = [
    { label: 'Total Students', value: '1,247', icon: Users, change: '+12%', changeType: 'positive' },
    { label: 'Attendance Rate', value: '94.2%', icon: Calendar, change: '+2.1%', changeType: 'positive' },
    { label: 'Active Classes', value: '42', icon: BookOpen, change: '+3', changeType: 'positive' },
    { label: 'Performance', value: '87.5%', icon: TrendingUp, change: '+5.2%', changeType: 'positive' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <p className="text-gray-600">Welcome to the admin dashboard. Here's what's happening today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-full">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-sm text-gray-600 ml-1">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h4 className="font-medium text-gray-900">Add New Student</h4>
            <p className="text-sm text-gray-600">Register a new student</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h4 className="font-medium text-gray-900">Generate Report</h4>
            <p className="text-sm text-gray-600">Create attendance report</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
            <h4 className="font-medium text-gray-900">Manage Classes</h4>
            <p className="text-sm text-gray-600">Update class information</p>
          </button>
        </div>
      </div>
    </div>
  );
} 