import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import RegistrarSidebar from './RegistrarSidebar';
import RegistrarHeader from './RegistrarHeader';
import EnrollmentReview from './EnrollmentReview';
import StudentManagement from './StudentManagement';
import RegistrarReports from './RegistrarReports';
import AccountSettings from '../admin/components/AccountSettings';
import RegistrarOverview from './RegistrarOverview';
import ESP32Control from './ESP32Control';

export default function RegistrarDashboard() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <RegistrarOverview />;
      case 'enrollments':
        return <EnrollmentReview />;
      case 'students':
        return <StudentManagement />;
      case 'esp32':
        return <ESP32Control />;
      case 'reports':
        return <RegistrarReports />;
      case 'settings':
        return <AccountSettings showNameField={false} />;
      default:
        return <RegistrarOverview />;
    }
  };

  if (!user || user.role !== 'registrar') {
    return <div>Access Denied</div>;
  }

  return (
    <div className="h-screen bg-gray-50 flex">
      <RegistrarSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      
      <div className="flex-1 flex flex-col h-screen lg:ml-0">
        <RegistrarHeader onMobileMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 p-8 overflow-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
