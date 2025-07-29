// import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  BarChart3, 
  Settings, 
  MessageSquare,
  FileText,
  Fingerprint,
  X
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & Stats'
  },
  {
    id: 'attendance',
    label: 'Attendance Log',
    icon: Clock,
    description: 'Real-time Activity'
  },
  {
    id: 'students',
    label: 'Students',
    icon: Users,
    description: 'Manage Enrollment'
  },
  {
    id: 'grades',
    label: 'Grade Reports',
    icon: BarChart3,
    description: 'Class Analytics'
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: MessageSquare,
    description: 'Parent Messages'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    description: 'Export Data'
  },
  {
    id: 'device',
    label: 'Device Status',
    icon: Fingerprint,
    description: 'Scanner Health'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'System Config'
  }
];

export default function Sidebar({ activeSection, onSectionChange, isMobileOpen = false, onMobileClose }: SidebarProps) {
  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    // Close mobile sidebar when a section is selected
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden transition-opacity duration-300"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-50 bg-white shadow-sm border-r border-gray-200 w-64 min-h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between mb-8 md:hidden">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Attendance</h2>
                <p className="text-sm text-gray-500">System</p>
              </div>
            </div>
            <button
              onClick={onMobileClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Desktop Logo */}
          <div className="hidden md:flex items-center space-x-3 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Attendance</h2>
              <p className="text-sm text-gray-500">System</p>
            </div>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className={`h-5 w-5 ${
                  activeSection === item.id ? 'text-blue-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="font-medium">{item.label}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* System Status */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="flex items-center space-x-2 text-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600">System Online</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">v1.2.3 • Last scan: 30s ago</p>
        </div>
      </div>
    </>
  );
}