import { Clock, Users, FileText, MessageSquare, Fingerprint, X } from 'lucide-react';
import { User } from '../../types';

interface TeacherSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  user: User;
}

const menuItems = [
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Clock,
    description: 'View Class Attendance'
  },
  {
    id: 'students',
    label: 'My Students',
    icon: Users,
    description: 'Manage Class List'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: FileText,
    description: 'Class Reports'
  },
  {
    id: 'notifications',
    label: 'Messages',
    icon: MessageSquare,
    description: 'Parent Communication'
  }
];

export default function TeacherSidebar({ activeSection, onSectionChange, isMobileOpen = false, onMobileClose, user }: TeacherSidebarProps) {
  const handleSectionChange = (section: string) => {
    onSectionChange(section);
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
        fixed top-0 left-0 h-screen w-64 bg-white shadow-sm border-r border-gray-200 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 pb-24 flex-1 overflow-y-auto scrollbar-hide">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-8 md:hidden">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Fingerprint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Teacher</h2>
                  <p className="text-sm text-gray-500">Portal</p>
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
              <div className="bg-green-600 p-2 rounded-lg">
                <Fingerprint className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Teacher</h2>
                <p className="text-sm text-gray-500">Portal</p>
              </div>
            </div>

            {/* Teacher Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-green-600">{user.gradeLevel} - Section {user.section}</p>
              </div>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSectionChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeSection === item.id
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className={`h-5 w-5 ${
                    activeSection === item.id ? 'text-green-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                </button>
              ))}
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