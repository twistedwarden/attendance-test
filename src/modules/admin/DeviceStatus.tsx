import { useEffect, useMemo, useState } from 'react';
import { Wifi, WifiOff, Battery, Thermometer, Fingerprint, Power, RefreshCw } from 'lucide-react';
import { ESP32Service, type ESP32Device, type DeviceStatus as ESP32DeviceStatus } from '../registrar/api/esp32Service';

export default function DeviceStatus() {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ESP32Device | null>(null);
  const [status, setStatus] = useState<ESP32DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const list = await ESP32Service.getDevices();
        if (!mounted) return;
        setDevices(list);
        if (list.length > 0) setSelectedDevice(list[0]);
      } catch (e: any) {
        if (!mounted) return;
        setError(e?.message || 'Failed to load devices');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedDevice) return;
    (async () => {
      try {
        const s = await ESP32Service.getDeviceStatus(selectedDevice.DeviceID);
        setStatus(s);
      } catch (e) {
        // ignore single load error
      }
    })();
  }, [selectedDevice?.DeviceID]);

  const online = useMemo(() => !!status && status.health?.connection === 'online', [status]);

  const getBatteryColor = (battery?: number) => {
    if (battery === undefined || battery === null) return 'text-gray-500';
    if (battery > 50) return 'text-green-600';
    if (battery > 20) return 'text-yellow-600';
    return 'text-red-600';
  };

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
                <Battery className={`h-4 w-4 ${getBatteryColor(status?.device?.BatteryLevel)}`} />
                <span className={getBatteryColor(status?.device?.BatteryLevel)}>Battery: {status?.device?.BatteryLevel ?? '—'}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <Thermometer className="h-4 w-4 text-blue-600" />
                <span className="text-gray-600">Temp: {status?.device?.Temperature ?? '—'}°C</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-2xl font-bold text-green-600">{status?.stats?.today?.scans ?? 0}</p>
              <p className="text-sm text-gray-600">Scans Today</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-2xl font-bold text-blue-600">{status?.stats?.successRate ?? 0}%</p>
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

          <div className="text-sm text-gray-500 space-y-1">
            <div className="flex justify-between">
              <span>Last Activity:</span>
              <span className="font-medium">{selectedDevice?.LastSeen || status?.device?.LastSeen || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Hardware:</span>
              <span className="font-medium">{status?.device?.HardwareVersion || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span>Firmware:</span>
              <span className="font-medium">{status?.device?.FirmwareVersion || '—'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}