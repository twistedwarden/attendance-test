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
    <div className="min-h-screen bg-gray-50">
      <RegistrarSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <RegistrarHeader onMobileMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
