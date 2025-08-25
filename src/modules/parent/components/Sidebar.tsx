import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  User, 
  Calendar, 
  Menu, 
  X,
  ChevronDown,
  Users,
  Fingerprint
} from 'lucide-react';
import { Button } from './ui/button';
import { Student } from '../data/enhancedMockData';

interface SidebarProps {
  selectedDaughter: Student;
  onDaughterChange: (daughter: Student) => void;
  daughters: Student[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar = ({ selectedDaughter, onDaughterChange, daughters, isMobileOpen = false, onMobileClose }: SidebarProps) => {
  const [isDaughterDropdownOpen, setIsDaughterDropdownOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Overview & Stats'
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      description: 'Manage Information'
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: Calendar,
      description: 'View Records'
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`
        lg:hidden fixed top-0 left-0 h-screen w-64 bg-white shadow-sm border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 pb-24 flex-1 overflow-y-auto scrollbar-hide">
            {/* Mobile Close Button */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Fingerprint className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Parent</h2>
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

            {/* Parent Info */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <div className="text-sm">
                <p className="font-medium text-gray-900">Sarah Johnson</p>
                <p className="text-purple-600">Parent</p>
              </div>
            </div>

            {/* Daughter Selection */}
            <div className="mb-6">
              <div className="relative">
                <button
                  onClick={() => setIsDaughterDropdownOpen(!isDaughterDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Users size={16} className="text-gray-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-800">
                        {selectedDaughter ? selectedDaughter.fullName : 'Select Daughter'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {selectedDaughter ? `Grade ${selectedDaughter.gradeLevel} - Section ${selectedDaughter.section}` : 'Choose student'}
                      </p>
                    </div>
                  </div>
                  <ChevronDown 
                    size={16} 
                    className={`text-gray-600 transition-transform ${isDaughterDropdownOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                {/* Dropdown */}
                {isDaughterDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {daughters.map((daughter) => (
                      <button
                        key={daughter.studentId}
                        onClick={() => {
                          onDaughterChange(daughter);
                          setIsDaughterDropdownOpen(false);
                        }}
                        className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                          selectedDaughter?.studentId === daughter.studentId ? 'bg-purple-50 text-purple-700' : ''
                        }`}
                      >
                        <p className="font-medium">{daughter.fullName}</p>
                        <p className="text-sm text-gray-500">Grade {daughter.gradeLevel} - Section {daughter.section}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-2">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={() => onMobileClose?.()}
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`
                  }
                >
                  <item.icon className={`h-5 w-5 ${
                    navigationItems.find(nav => nav.href === item.href)?.href === item.href ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs opacity-75">{item.description}</p>
                  </div>
                </NavLink>
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-col h-full bg-white shadow-sm border-r border-gray-200">
        <div className="p-6 pb-24 flex-1 overflow-y-auto scrollbar-hide">
          {/* Desktop Logo */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Fingerprint className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Parent</h2>
              <p className="text-sm text-gray-500">Portal</p>
            </div>
          </div>

          {/* Parent Info */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="text-sm">
              <p className="font-medium text-gray-900">Sarah Johnson</p>
              <p className="text-purple-600">Parent</p>
            </div>
          </div>

          {/* Daughter Selection */}
          <div className="mb-6">
            <div className="relative">
              <button
                onClick={() => setIsDaughterDropdownOpen(!isDaughterDropdownOpen)}
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Users size={16} className="text-gray-600" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-800">
                      {selectedDaughter ? selectedDaughter.fullName : 'Select Daughter'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedDaughter ? `Grade ${selectedDaughter.gradeLevel} - Section ${selectedDaughter.section}` : 'Choose student'}
                    </p>
                  </div>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`text-gray-600 transition-transform ${isDaughterDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </button>

              {/* Dropdown */}
              {isDaughterDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                  {daughters.map((daughter) => (
                    <button
                      key={daughter.studentId}
                      onClick={() => {
                        onDaughterChange(daughter);
                        setIsDaughterDropdownOpen(false);
                      }}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                        selectedDaughter?.studentId === daughter.studentId ? 'bg-purple-50 text-purple-700' : ''
                      }`}
                    >
                      <p className="font-medium">{daughter.fullName}</p>
                      <p className="text-sm text-gray-500">Grade {daughter.gradeLevel} - Section {daughter.section}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    isActive
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className={`h-5 w-5 ${
                  navigationItems.find(nav => nav.href === item.href)?.href === item.href ? 'text-purple-600' : 'text-gray-400'
                }`} />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-xs opacity-75">{item.description}</p>
                </div>
              </NavLink>
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
    </>
  );
};

export default Sidebar; 