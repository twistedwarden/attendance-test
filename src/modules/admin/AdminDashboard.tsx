import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
// Admin Dashboard Component
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import DashboardOverview from './DashboardOverview';
import AttendanceLog from './AttendanceLog';
import StudentsSection from './StudentsSection';
import EnrollmentsSection from './EnrollmentsSection';
import SchedulesSection from './SchedulesSection';
import NotificationsSection from './NotificationsSection';
import ReportsSection from './ReportsSection';
import DeviceStatus from './DeviceStatus';
import SettingsSection from './SettingsSection';
import UserAccountManagement from './UserAccountManagement';
import AuditTrailSection from './AuditTrailSection';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview onNavigate={setActiveSection} />;
      case 'attendance':
        return <AttendanceLog />;
      case 'students':
        return <StudentsSection />;
      case 'enrollments':
        return <EnrollmentsSection />;
      case 'users':
        return <UserAccountManagement />;
      case 'schedules':
        return <SchedulesSection />;
      case 'notifications':
        return <NotificationsSection />;
      case 'reports':
        return <ReportsSection />;
      case 'audit':
        return <AuditTrailSection />;
      case 'device':
        return <DeviceStatus />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardOverview onNavigate={setActiveSection} />;
    }
  };

  if (!user || user.role !== 'admin') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <AdminHeader onMobileMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 