import { useState, useEffect } from 'react';
import { Menu, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import LogoutModal from './components/LogoutModal';
import NotificationBell from '../shared/NotificationBell';
import { SchoolYearBadge } from '../shared/SchoolYearBadge';
import { SchoolYear } from '../../types';
import { SchoolYearService } from '../shared/schoolYearService';

interface RegistrarHeaderProps {
  onMobileMenuToggle: () => void;
}

export default function RegistrarHeader({ onMobileMenuToggle }: RegistrarHeaderProps) {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [activeYear, setActiveYear] = useState<SchoolYear | null>(null);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutModal(false);
    await logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutModal(false);
  };

  useEffect(() => {
    const loadActiveYear = async () => {
      try {
        console.log('RegistrarHeader - Loading active school year...');
        const year = await SchoolYearService.getActiveSchoolYear();
        console.log('RegistrarHeader - Active year loaded:', year);
        setActiveYear(year);
      } catch (error) {
        console.error('RegistrarHeader - Failed to load active school year:', error);
      }
    };

    loadActiveYear();
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-4 lg:px-6 py-4 sticky top-0 z-40">
      <div className="flex items-center justify-between">
        {/* Left side - Mobile menu and title */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-gray-900">Registrar Portal</h1>
              {activeYear && (
                <SchoolYearBadge 
                  yearLabel={activeYear.yearLabel} 
                  isActive={activeYear.isActive} 
                  size="sm"
                />
              )}
            </div>
            <p className="text-sm text-gray-500">Foothills Christian School</p>
          </div>
        </div>

        {/* Right side - Notifications and user menu */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <NotificationBell />

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
            
            <button
              onClick={handleLogoutClick}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center space-x-2"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-600" /> 
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        userName={user?.name}
      />
    </header>
  );
}
