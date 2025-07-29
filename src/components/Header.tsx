// import React from 'react';
import { GraduationCap, Settings, User, Bell } from 'lucide-react';
// import { hello } from './Sidebar'; // Import the hello function

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

export default function Header({ onMobileMenuToggle }: HeaderProps) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and School Name */}
          <div className="flex items-center space-x-3">
            <button 
              className="bg-blue-600 p-2 rounded-lg hover:bg-blue-700 transition-colors md:hidden"
              onClick={onMobileMenuToggle}
            >
              <GraduationCap className="h-6 w-6 text-white" />
            </button>
            <div className="bg-blue-600 p-2 rounded-lg hidden md:block">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-sm md:text-xl font-bold text-gray-900">Foothills Christian School</h1>
              <p className="hidden text-sm text-gray-500">Student Attendance System</p>
            </div>
          </div>

          {/* Navigation and User Menu */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
              <User className="h-5 w-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Admin</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}