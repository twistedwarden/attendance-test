import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardOverview from './components/DashboardOverview';
import AttendanceLog from './components/AttendanceLog';
import StudentsSection from './components/StudentsSection';
import GradeOverview from './components/GradeOverview';
import NotificationsSection from './components/NotificationsSection';
import ReportsSection from './components/ReportsSection';
import DeviceStatus from './components/DeviceStatus';
import SettingsSection from './components/SettingsSection';

function App() {
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
        return <DashboardOverview />;
      case 'attendance':
        return <AttendanceLog />;
      case 'students':
        return <StudentsSection />;
      case 'grades':
        return <GradeOverview />;
      case 'notifications':
        return <NotificationsSection />;
      case 'reports':
        return <ReportsSection />;
      case 'device':
        return <DeviceStatus />;
      case 'settings':
        return <SettingsSection />;
      default:
        return <DashboardOverview />;
    }
  };

  return (
    <div className="max-w-screen min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      
      <div className="flex-1 flex flex-col">
        <Header onMobileMenuToggle={toggleMobileSidebar} />
        
        <main className="flex-1 p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;