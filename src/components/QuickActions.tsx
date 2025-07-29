// import React from 'react';
import { UserPlus, Download, MessageSquare, Settings } from 'lucide-react';

const actions = [
  {
    id: 'add-user',
    title: 'Enroll Student',
    description: 'Register new fingerprint',
    icon: UserPlus,
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    id: 'export-logs',
    title: 'Export Report',
    description: 'Download attendance data',
    icon: Download,
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    id: 'notify-parents',
    title: 'Send Notifications',
    description: 'Bulk parent messages',
    icon: MessageSquare,
    color: 'bg-purple-600 hover:bg-purple-700'
  },
  {
    id: 'settings',
    title: 'System Settings',
    description: 'Configure attendance rules',
    icon: Settings,
    color: 'bg-orange-600 hover:bg-orange-700'
  }
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.id}
            className={`${action.color} text-white p-4 rounded-lg transition-colors group`}
          >
            <div className="flex flex-col items-center text-center space-y-2">
              <action.icon className="h-6 w-6 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs opacity-90">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}