import React, { useState, useEffect } from 'react';
import { Save, Shield } from 'lucide-react';
import { toast } from 'sonner';
import AccountSettings from './components/AccountSettings';
import { useAuth } from '../auth/AuthContext';

export default function SettingsSection() {
  const { user } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState('30 minutes');

  // Load saved session timeout on component mount
  useEffect(() => {
    const savedTimeout = localStorage.getItem('sessionTimeout');
    if (savedTimeout) {
      const timeoutMinutes = parseInt(savedTimeout);
      switch (timeoutMinutes) {
        case 15:
          setSessionTimeout('15 minutes');
          break;
        case 30:
          setSessionTimeout('30 minutes');
          break;
        case 60:
          setSessionTimeout('1 hour');
          break;
        case 240:
          setSessionTimeout('4 hours');
          break;
        case 0:
          setSessionTimeout('Never');
          break;
        default:
          setSessionTimeout('30 minutes');
      }
    }
  }, []);

  const handleSaveSettings = () => {
    // Convert session timeout to minutes for storage
    let timeoutMinutes = 0;
    switch (sessionTimeout) {
      case '15 minutes':
        timeoutMinutes = 15;
        break;
      case '30 minutes':
        timeoutMinutes = 30;
        break;
      case '1 hour':
        timeoutMinutes = 60;
        break;
      case '4 hours':
        timeoutMinutes = 240;
        break;
      case 'Never':
        timeoutMinutes = 0; // 0 means no timeout
        break;
      default:
        timeoutMinutes = 30;
    }

    // Store in localStorage for now (could be sent to backend later)
    localStorage.setItem('sessionTimeout', timeoutMinutes.toString());
    
    // You could also send this to your backend API here
    // await adminService.updateSessionTimeout(timeoutMinutes);
    
    toast.success('Settings saved successfully!');
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-600">Configure attendance system preferences</p>
      </div>

      {/* Account Settings */}
      <AccountSettings showNameField={user?.role === 'admin'} />

      {/* Settings Sections */}
      <div className="space-y-6">

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Session Timeout</h4>
                <p className="text-sm text-gray-600">Auto-logout after inactivity</p>
              </div>
              <select 
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="15 minutes">15 minutes</option>
                <option value="30 minutes">30 minutes</option>
                <option value="1 hour">1 hour</option>
                <option value="4 hours">4 hours</option>
                <option value="Never">Never</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button 
            onClick={handleSaveSettings}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
} 