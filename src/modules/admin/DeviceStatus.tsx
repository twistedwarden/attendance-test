import { useEffect, useMemo, useState } from 'react';
import { Wifi, WifiOff, Clock, Fingerprint, Power, RefreshCw } from 'lucide-react';
import { ESP32Service, type ESP32Device, type DeviceStatus as ESP32DeviceStatus } from '../registrar/api/esp32Service';

export default function DeviceStatus() {
  const [selectedDevice, setSelectedDevice] = useState<ESP32Device | null>(null);
  const [status, setStatus] = useState<ESP32DeviceStatus | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const list = await ESP32Service.getDevices();
        if (!mounted) return;
        if (list.length > 0) setSelectedDevice(list[0]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load devices');
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedDevice) return;
    
    const fetchStatus = async () => {
      try {
        const s = await ESP32Service.getDeviceStatus(selectedDevice.DeviceID);
        setStatus(s);
      } catch (e) {
        // ignore single load error
      }
    };
    
    // Initial fetch
    fetchStatus();
    
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    
    return () => clearInterval(interval);
  }, [selectedDevice?.DeviceID]);

  const online = useMemo(() => {
    if (!status) return false;
    
    // Primary check: if device status is active, consider it online
    if (status.device && status.device.Status === 'active') {
      return true;
    }
    
    // Use health information from API if available
    if (status.health?.connection) {
      return status.health.connection === 'online';
    }
    
    // Fallback: check if device was seen recently (within last 10 minutes)
    if (status.device) {
      const lastSeen = new Date(status.device.LastSeen);
      const now = new Date();
      const timeDiff = now.getTime() - lastSeen.getTime();
      const isRecent = timeDiff < 10 * 60 * 1000; // 10 minutes in milliseconds
      
      return status.device.Status === 'active' && isRecent;
    }
    
    return false;
  }, [status]);


  const handleAction = async (command: 'restart' | 'test_connection' | 'reset' | 'clear_all') => {
    if (!selectedDevice) return;
    try {
      setActionLoading(command);
      await ESP32Service.sendDeviceCommand(selectedDevice.DeviceID, command);
      // refresh status after actions
      const s = await ESP32Service.getDeviceStatus(selectedDevice.DeviceID);
      setStatus(s);
    } catch (e: any) {
      setError(e?.message || `Failed to ${command}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Device Status</h2>
        <p className="text-gray-600">Monitor and manage attendance devices</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Scanner Status</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${online ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className={`text-sm font-medium ${online ? 'text-green-600' : 'text-gray-600'}`}>{online ? 'Online' : 'Offline'}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        <div className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Fingerprint className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{selectedDevice?.DeviceName || 'Attendance Scanner'}</h4>
                  <p className="text-sm text-gray-600">{selectedDevice?.Location || '—'}</p>
                </div>
              </div>
              {online ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-500" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">
                  WiFi: {status?.device?.WiFiSSID || selectedDevice?.WiFiSSID || 'Unknown'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <span className="text-gray-600">
                  Last Seen: {status?.device?.LastSeen ? new Date(status.device.LastSeen).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">{status?.statistics?.totalOperations ?? 0}</p>
              <p className="text-sm text-gray-600">Scans Today</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">
                {status?.statistics && status.statistics.totalOperations > 0 
                  ? Math.round((status.statistics.successfulOperations / status.statistics.totalOperations) * 100)
                  : 0}%
              </p>
              <p className="text-sm text-gray-600">Success Rate</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleAction('restart')}
              disabled={!selectedDevice || actionLoading === 'restart'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Power className="h-4 w-4" />
              <span>Restart</span>
            </button>
            <button
              onClick={() => handleAction('test_connection')}
              disabled={!selectedDevice || actionLoading === 'test_connection'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Wifi className="h-4 w-4" />
              <span>Test</span>
            </button>
            <button
              onClick={() => handleAction('reset')}
              disabled={!selectedDevice || actionLoading === 'reset'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => handleAction('clear_all')}
              disabled={!selectedDevice || actionLoading === 'clear_all'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Clear Fingerprints</span>
            </button>
          </div>

          <div className="text-sm text-gray-500">
            <div className="flex justify-between">
              <span>Last Activity:</span>
              <span className="font-medium">
                {(() => {
                  const lastSeen = selectedDevice?.LastSeen || status?.device?.LastSeen;
                  if (!lastSeen) return 'Never';
                  
                  const date = new Date(lastSeen);
                  const now = new Date();
                  const diffMs = now.getTime() - date.getTime();
                  const diffMins = Math.floor(diffMs / (1000 * 60));
                  const diffHours = Math.floor(diffMins / 60);
                  const diffDays = Math.floor(diffHours / 24);
                  
                  if (diffMins < 1) return 'Just now';
                  if (diffMins < 60) return `${diffMins}m ago`;
                  if (diffHours < 24) return `${diffHours}h ago`;
                  if (diffDays < 7) return `${diffDays}d ago`;
                  
                  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}