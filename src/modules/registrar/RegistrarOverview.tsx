import { useState, useEffect } from 'react';
import { Users, FileText, CheckCircle, XCircle, TrendingUp, Clock } from 'lucide-react';
import { RegistrarService } from './api/registrarService';

interface OverviewStats {
  totalStudents: number;
  pendingEnrollments: number;
  approvedEnrollments: number;
  declinedEnrollments: number;
  attendanceRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'error';
  }>;
}

export default function RegistrarOverview() {
  const [stats, setStats] = useState<OverviewStats>({
    totalStudents: 0,
    pendingEnrollments: 0,
    approvedEnrollments: 0,
    declinedEnrollments: 0,
    attendanceRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverviewData();
  }, []);

  const loadOverviewData = async () => {
    try {
      setLoading(true);
      const data = await RegistrarService.getOverviewStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load overview data:', error);
      // Set mock data for demonstration
      setStats({
        totalStudents: 1247,
        pendingEnrollments: 12,
        approvedEnrollments: 45,
        declinedEnrollments: 3,
        attendanceRate: 94.2,
        recentActivity: [
          {
            id: '1',
            type: 'enrollment',
            description: 'New enrollment application from John Doe',
            timestamp: '2 hours ago',
            status: 'success'
          },
          {
            id: '2',
            type: 'enrollment',
            description: 'Enrollment approved for Jane Smith',
            timestamp: '4 hours ago',
            status: 'success'
          },
          {
            id: '3',
            type: 'enrollment',
            description: 'Enrollment declined for Mike Johnson',
            timestamp: '6 hours ago',
            status: 'warning'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: (stats.totalStudents || 0).toLocaleString(),
      icon: Users,
      color: 'blue',
      change: '+12%',
      changeType: 'positive'
    },
    {
      title: 'Pending Enrollments',
      value: stats.pendingEnrollments || 0,
      icon: Clock,
      color: 'yellow',
      change: '+3',
      changeType: 'neutral'
    },
    {
      title: 'Approved This Month',
      value: stats.approvedEnrollments || 0,
      icon: CheckCircle,
      color: 'green',
      change: '+8',
      changeType: 'positive'
    },
    {
      title: 'Attendance Rate',
      value: `${stats.attendanceRate || 0}%`,
      icon: TrendingUp,
      color: 'purple',
      change: '+2.1%',
      changeType: 'positive'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <Clock className="w-4 h-4" />;
      case 'error': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
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
    <div className="space-y-4 lg:space-y-6">
      <div>
        <h2 className="text-xl lg:text-2xl font-bold text-gray-900">Registrar Dashboard</h2>
        <p className="text-sm lg:text-base text-gray-600">Welcome to the registrar management portal. Here's an overview of your responsibilities.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  stat.color === 'blue' ? 'bg-blue-50' :
                  stat.color === 'yellow' ? 'bg-yellow-50' :
                  stat.color === 'green' ? 'bg-green-50' :
                  'bg-purple-50'
                }`}>
                  <Icon className={`h-6 w-6 ${
                    stat.color === 'blue' ? 'text-blue-600' :
                    stat.color === 'yellow' ? 'text-yellow-600' :
                    stat.color === 'green' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                </div>
              </div>
              <div className="mt-4">
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 
                  stat.changeType === 'negative' ? 'text-red-600' : 
                  'text-gray-600'
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Pending Enrollments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Pending Enrollments</h3>
            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {stats.pendingEnrollments} pending
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            {stats.pendingEnrollments > 0 
              ? `You have ${stats.pendingEnrollments} enrollment applications waiting for review.`
              : 'No pending enrollments at this time.'
            }
          </p>
          <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
            Review Enrollments
          </button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-1 rounded-full ${getStatusColor(activity.status)}`}>
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex-1 min-w-0">
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
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enrollment Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.approvedEnrollments}</div>
            <div className="text-sm text-green-700">Approved</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingEnrollments}</div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.declinedEnrollments}</div>
            <div className="text-sm text-red-700">Declined</div>
          </div>
        </div>
      </div>
    </div>
  );
}
