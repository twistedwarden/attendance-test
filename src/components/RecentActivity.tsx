// import React from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  status: 'success' | 'failed' | 'pending';
  location: string;
}

const mockActivities: ActivityItem[] = [
  {
    id: '1',
    user: 'Emma Johnson (Grade 1)',
    action: 'Fingerprint Scan - Entry',
    time: '2 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '2',
    user: 'Michael Chen (Grade 2)',
    action: 'Fingerprint Scan - Entry',
    time: '5 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '3',
    user: 'Unknown User',
    action: 'Fingerprint Scan Failed',
    time: '8 minutes ago',
    status: 'failed',
    location: 'Main Entrance'
  },
  {
    id: '4',
    user: 'Sarah Davis (Grade 3)',
    action: 'Fingerprint Scan - Late Entry',
    time: '12 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '5',
    user: 'Alex Rodriguez (Grade 4)',
    action: 'Fingerprint Scan - Entry',
    time: '15 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '6',
    user: 'Olivia Thompson (Grade 5)',
    action: 'Fingerprint Scan - Entry',
    time: '18 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '7',
    user: 'James Wilson (Grade 6)',
    action: 'Fingerprint Scan - Entry',
    time: '20 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  },
  {
    id: '8',
    user: 'Sophia Brown (Grade 7)',
    action: 'Fingerprint Scan - Entry',
    time: '22 minutes ago',
    status: 'success',
    location: 'Main Entrance'
  }
];

export default function RecentActivity() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'pending':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {mockActivities.map((activity) => (
          <div
            key={activity.id}
            className={`p-4 rounded-lg border ${getStatusBg(activity.status)} transition-colors hover:shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(activity.status)}
                <div>
                  <p className="font-medium text-gray-900">{activity.user}</p>
                  <p className="text-sm text-gray-600">{activity.action} • {activity.location}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}