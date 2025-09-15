import { Home, Users, CalendarClock, Bell, BarChart3, Settings, Smartphone, Calendar, Fingerprint, X, Shield, FileText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

interface AdminSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({ 
  activeSection, 
  onSectionChange, 
  isMobileOpen, 
  onMobileClose 
}: AdminSidebarProps) {
  const { user } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, description: 'Overview & Stats' },
    { id: 'attendance', label: 'Attendance', icon: Calendar, description: 'Manage Records' },
    { id: 'schedules', label: 'Schedules', icon: CalendarClock, description: 'Subject and Teacher Schedules' },
    { id: 'students', label: 'Students', icon: Users, description: 'Student Management' },
    { id: 'enrollments', label: 'Enrollments', icon: FileText, description: 'Review & Approve' },
    { id: 'users', label: 'User Accounts', icon: Shield, description: 'Manage Users' },
    { id: 'notifications', label: 'Notifications', icon: Bell, description: 'System Alerts' },
    { id: 'reports', label: 'Reports', icon: BarChart3, description: 'Analytics & Data' },
    { id: 'audit', label: 'Audit Trail', icon: FileText, description: 'Security Logs' },
    { id: 'device', label: 'Device Status', icon: Smartphone, description: 'Hardware Monitor' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'System Config' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-screen w-64 bg-white shadow-sm border-r border-gray-200 z-50 transform transition-transform duration-200 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 pb-24 flex-1 overflow-y-auto scrollbar-hide">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-8 lg:hidden">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Fingerprint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Admin</h2>
                  <p className="text-sm text-gray-500">Panel</p>
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
            <div className="hidden lg:flex items-center space-x-3 mb-8">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Admin</h2>
                <p className="text-sm text-gray-500">Panel</p>
              </div>
            </div>

            {/* Admin Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user?.name}</p>
                <p className="text-blue-600">System Administrator</p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => onSectionChange(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${
                      isActive ? 'text-blue-600' : 'text-gray-400'
                    }`} />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-xs opacity-75">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* System Stats */}
          <div className="p-4 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System Status</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 