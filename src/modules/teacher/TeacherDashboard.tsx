import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import TeacherSidebar from './TeacherSidebar';
import TeacherHeader from './TeacherHeader';
import TeacherAttendanceView from './TeacherAttendanceView';
import TeacherStudentsView from './TeacherStudentsView';
import TeacherReportsView from './TeacherReportsView';
import TeacherNotificationsView from './TeacherNotificationsView';
import AccountSettings from '../admin/components/AccountSettings';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('attendance');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'attendance':
        return <TeacherAttendanceView />;
      case 'students':
        return <TeacherStudentsView />;
      case 'reports':
        return <TeacherReportsView />;
      case 'notifications':
        return <TeacherNotificationsView />;
      case 'settings':
        return <AccountSettings showNameField={false} />;
      default:
        return <TeacherAttendanceView />;
    }
  };

  if (!user || user.role !== 'teacher') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
        user={user}
      />
      
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TeacherHeader onMobileMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
} 