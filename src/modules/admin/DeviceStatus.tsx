import { useEffect, useMemo, useState } from 'react';
import { Wifi, WifiOff, Clock, Fingerprint, Power, RefreshCw } from 'lucide-react';
import { ESP32Service, type ESP32Device, type DeviceStatus as ESP32DeviceStatus } from '../registrar/api/esp32Service';

export default function DeviceStatus() {
  const [selectedDevice, setSelectedDevice] = useState<ESP32Device | null>(null);
  const [status, setStatus] = useState<ESP32DeviceStatus | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{open: boolean; action: 'restart'|'test_connection'|'reset'|'clear_all'|null; text: string}>({open:false, action:null, text:''});

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
    
    // Use health information from API as primary source
    if (status.health?.connection) {
      return status.health.connection === 'online';
    }
    
    // Fallback: check if device was seen recently (within last 5 minutes)
    if (status.device) {
      const lastSeen = new Date(status.device.LastSeen);
      const now = new Date();
      const timeDiff = now.getTime() - lastSeen.getTime();
      const isRecent = timeDiff < 5 * 60 * 1000; // 5 minutes in milliseconds
      
      return status.device.Status === 'active' && isRecent;
    }
    
    return false;
  }, [status]);


  const confirmAction = async () => {
    if (!selectedDevice || !confirmModal.action) return;
    const required = selectedDevice.DeviceID;
    if (confirmModal.text !== required) return;
    
    try {
      setActionLoading(confirmModal.action);
      await ESP32Service.sendDeviceCommand(selectedDevice.DeviceID, confirmModal.action);
      // refresh status after actions
      const s = await ESP32Service.getDeviceStatus(selectedDevice.DeviceID);
      setStatus(s);
      setConfirmModal({ open: false, action: null, text: '' });
    } catch (e: any) {
      setError(e?.message || `Failed to ${confirmModal.action}`);
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
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200" title="Total attendance scans (time in/out) recorded in the last 24 hours">
              <p className="text-2xl font-bold text-green-600">{status?.statistics?.totalOperations ?? 0}</p>
              <p className="text-sm text-gray-600">Scans Today</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200" title="Percentage of successful attendance scans out of total attendance scans in the last 24 hours">
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
              onClick={() => setConfirmModal({ open: true, action: 'restart', text: '' })}
              disabled={!selectedDevice || !online || actionLoading === 'restart'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              title={!online ? 'Device must be online to control' : ''}
            >
              <Power className="h-4 w-4" />
              <span>Restart</span>
            </button>
            <button
              onClick={() => setConfirmModal({ open: true, action: 'test_connection', text: '' })}
              disabled={!selectedDevice || !online || actionLoading === 'test_connection'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              title={!online ? 'Device must be online to control' : ''}
            >
              <Wifi className="h-4 w-4" />
              <span>Test</span>
            </button>
            <button
              onClick={() => setConfirmModal({ open: true, action: 'reset', text: '' })}
              disabled={!selectedDevice || !online || actionLoading === 'reset'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
              title={!online ? 'Device must be online to control' : ''}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Reset</span>
            </button>
            <button
              onClick={() => setConfirmModal({ open: true, action: 'clear_all', text: '' })}
              disabled={!selectedDevice || !online || actionLoading === 'clear_all'}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              title={!online ? 'Device must be online to control' : ''}
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

      {/* Confirmation Modal */}
      {confirmModal.open && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[520px] max-w-[95vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmModal.action === 'restart' ? 'Confirm Device Restart' :
               confirmModal.action === 'test_connection' ? 'Confirm Connection Test' :
               confirmModal.action === 'reset' ? 'Confirm Factory Reset' : 'Confirm Clear All Fingerprints'}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {confirmModal.action === 'restart'
                ? 'This will restart the device. The device will temporarily disconnect and may take a few minutes to come back online.'
                : confirmModal.action === 'test_connection'
                ? 'This will send a test command to the device to verify connectivity and functionality.'
                : confirmModal.action === 'reset'
                ? 'This will clear all templates from the sensor and database mappings, and restart the device.'
                : 'This will clear all fingerprint templates from the database and instruct the sensor to clear as well.'}
            </p>
            <p className="text-sm text-gray-700 mb-2">Type the device ID to confirm: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{selectedDevice.DeviceID}</span></p>
            <input
              type="text"
              value={confirmModal.text}
              onChange={(e) => setConfirmModal({ ...confirmModal, text: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder={selectedDevice.DeviceID}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button 
                onClick={() => setConfirmModal({ open: false, action: null, text: '' })} 
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={confirmModal.text !== selectedDevice.DeviceID || !!actionLoading}
                className={`px-4 py-2 text-white rounded hover:opacity-90 disabled:opacity-50 ${
                  confirmModal.action === 'restart' ? 'bg-blue-600 hover:bg-blue-700' :
                  confirmModal.action === 'test_connection' ? 'bg-green-600 hover:bg-green-700' :
                  confirmModal.action === 'reset' ? 'bg-yellow-600 hover:bg-yellow-700' :
                  'bg-red-600 hover:bg-red-700'
                }`}
              >
                {actionLoading ? 'Working...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}