import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CompactLayout from './components/CompactLayout';
import CompactDashboard from './pages/CompactDashboard';
import CompactProfile from './pages/CompactProfile';
import CompactAttendance from './pages/CompactAttendance';
import { mockParent, mockDaughters } from './data/enhancedMockData';
import './parent.css';

const ParentDashboard = () => {
  const [selectedDaughter, setSelectedDaughter] = useState(mockDaughters[0]);

  const handleDaughterChange = (daughter: typeof mockDaughters[0]) => {
    setSelectedDaughter(daughter);
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Routes>
          <Route 
            path="/*" 
            element={
              <CompactLayout 
                selectedDaughter={selectedDaughter}
                onDaughterChange={handleDaughterChange}
                daughters={mockDaughters}
              />
            }
          >
            <Route 
              index 
              element={
                <div className="flex-1 w-full h-full overflow-auto">
                  <CompactDashboard selectedDaughter={selectedDaughter} />
                </div>
              } 
            />
            <Route 
              path="profile" 
              element={
                <div className="flex-1 w-full h-full overflow-auto">
                  <CompactProfile 
                    parentData={mockParent} 
                    daughters={mockDaughters} 
                  />
                </div>
              } 
            />
            <Route 
              path="attendance" 
              element={
                <div className="flex-1 w-full h-full overflow-auto">
                  <CompactAttendance selectedDaughter={selectedDaughter} />
                </div>
              } 
            />
          </Route>
        </Routes>
      </div>
    </Router>
  );
};

export default ParentDashboard; 