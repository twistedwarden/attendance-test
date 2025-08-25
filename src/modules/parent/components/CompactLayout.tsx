import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ParentHeader from './ParentHeader';
import { Student } from '../data/enhancedMockData';

interface CompactLayoutProps {
  selectedDaughter: Student;
  onDaughterChange: (daughter: Student) => void;
  daughters: Student[];
}

const CompactLayout = ({ selectedDaughter, onDaughterChange, daughters }: CompactLayoutProps) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleMobileMenuToggle = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleMobileClose = () => {
    setIsMobileOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Single Sidebar Component */}
      <Sidebar
        selectedDaughter={selectedDaughter}
        onDaughterChange={onDaughterChange}
        daughters={daughters}
        isMobileOpen={isMobileOpen}
        onMobileClose={handleMobileClose}
      />
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <ParentHeader onMobileMenuToggle={handleMobileMenuToggle} />
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CompactLayout; 