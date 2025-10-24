import { Menu, Bell, User, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import NotificationBell from '../shared/NotificationBell';
import { SchoolYearBadge } from '../shared/SchoolYearBadge';
import { SchoolYear } from '../../types';

interface TeacherHeaderProps {
  onMobileMenuToggle: () => void;
  activeYear?: SchoolYear | null;
}

export default function TeacherHeader({ onMobileMenuToggle, activeYear }: TeacherHeaderProps) {
  const { user, logout } = useAuth();
  
  console.log('TeacherHeader - Received activeYear:', activeYear);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Mobile menu button */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          <Menu className="h-6 w-6" />
        </button>

        {/* Title */}
        <div className="hidden lg:block">
          <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-600">
              {user?.gradeLevel} - Section {user?.section}
            </p>
            {activeYear ? (
              <SchoolYearBadge 
                yearLabel={activeYear.yearLabel} 
                isActive={activeYear.isActive} 
                size="sm"
              />
            ) : (
              <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                Loading...
              </div>
            )}
          </div>
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-600">Teacher</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 