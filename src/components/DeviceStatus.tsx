// import React from 'react';
import { Wifi, WifiOff, Battery, Thermometer, Fingerprint } from 'lucide-react';

const deviceData = {
  name: 'Attendance Scanner',
  location: 'Main Entrance',
  status: 'online' as const,
  battery: 92,
  temperature: 23,
  lastSeen: 'Just now',
  todayScans: 156,
  successRate: 98.7
};

export default function DeviceStatus() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-600 bg-green-100';
      case 'offline':
        return 'text-red-600 bg-red-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-600';
    if (battery > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Scanner Status</h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-600 font-medium">Online</span>
        </div>
      </div>
      
      <div className="space-y-6">
        {/* Device Info */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Fingerprint className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{deviceData.name}</h4>
                <p className="text-sm text-gray-600">{deviceData.location}</p>
              </div>
            </div>
            <Wifi className="h-5 w-5 text-green-600" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Battery className={`h-4 w-4 ${getBatteryColor(deviceData.battery)}`} />
              <span className={getBatteryColor(deviceData.battery)}>Battery: {deviceData.battery}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Thermometer className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Temp: {deviceData.temperature}°C</span>
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-600">{deviceData.todayScans}</p>
            <p className="text-sm text-gray-600">Scans Today</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-2xl font-bold text-blue-600">{deviceData.successRate}%</p>
            <p className="text-sm text-gray-600">Success Rate</p>
          </div>
        </div>

        {/* System Info */}
        <div className="text-sm text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Last Activity:</span>
            <span className="font-medium">{deviceData.lastSeen}</span>
          </div>
          <div className="flex justify-between">
            <span>Arduino Model:</span>
            <span className="font-medium">Uno R3 + AS608</span>
          </div>
          <div className="flex justify-between">
            <span>Firmware:</span>
            <span className="font-medium">v1.2.3</span>
          </div>
        </div>
      </div>
    </div>
  );
}