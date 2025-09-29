import { useState, useEffect } from 'react';
import { 
  Wifi, 
  Power, 
  RefreshCw, 
  Trash2, 
  Users, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  MapPin,
  Battery,
  Thermometer,
  Fingerprint
} from 'lucide-react';
import { ESP32Service, ESP32Device, DeviceStatus, EnrollmentStatus, EnrolledStudent } from './api/esp32Service';
// Simple Button component for ESP32 control
const Button = ({ children, onClick, disabled, className, size, variant, ...props }: any) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-md font-medium transition-colors ${
      variant === 'destructive' 
        ? 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-50' 
        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
    } ${size === 'sm' ? 'px-3 py-1.5 text-sm' : ''} ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

export default function ESP32Control() {
  const [devices, setDevices] = useState<ESP32Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ESP32Device | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [enrollmentStatus, setEnrollmentStatus] = useState<EnrollmentStatus | null>(null);
  const [enrolledFingerprints, setEnrolledFingerprints] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollStudentId, setEnrollStudentId] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStudentId, setDeleteStudentId] = useState('');
  const [availableFingerprintIds, setAvailableFingerprintIds] = useState<number[]>([]);
  const [enrolledFingerprintIds, setEnrolledFingerprintIds] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  // Settings modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settings, setSettings] = useState({
    ssid: '',
    password: '',
    apiHost: '',
    apiPort: '443',
    deviceId: '',
    apiKey: ''
  });
  // Error review modal
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  // Destructive confirmation modal
  const [confirmModal, setConfirmModal] = useState<{open: boolean; action: 'reset'|'clear_all'|null; text: string}>({open:false, action:null, text:''});

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDevice) {
      loadDeviceStatus(selectedDevice.DeviceID);
      loadEnrollmentStatus(selectedDevice.DeviceID);
      loadFingerprints(selectedDevice.DeviceID);
      loadAvailableFingerprintIds(selectedDevice.DeviceID);
      loadEnrolledFingerprintIds(selectedDevice.DeviceID);
      loadAllStudents(selectedDevice.DeviceID);
    }
  }, [selectedDevice]);

  const loadDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ESP32Service.getDevices();
      setDevices(data);
      if (data.length > 0 && !selectedDevice) {
        setSelectedDevice(data[0]);
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load devices');
    } finally {
      setLoading(false);
    }
  };

  const loadDeviceStatus = async (deviceId: string) => {
    try {
      const data = await ESP32Service.getDeviceStatus(deviceId);
      setDeviceStatus(data);
    } catch (e: any) {
      console.error('Failed to load device status:', e);
    }
  };

  const loadEnrollmentStatus = async (deviceId: string) => {
    try {
      const data = await ESP32Service.getEnrollmentStatus(deviceId);
      setEnrollmentStatus(data);
    } catch (e: any) {
      console.error('Failed to load enrollment status:', e);
    }
  };

  const loadFingerprints = async (deviceId: string) => {
    try {
      const fingerprints = await ESP32Service.getFingerprints(deviceId);
      setEnrolledFingerprints(fingerprints);
    } catch (e: any) {
      console.error('Failed to load fingerprints:', e);
    }
  };

  const loadAvailableFingerprintIds = async (deviceId: string) => {
    try {
      const availableIds = await ESP32Service.getAvailableFingerprintIds(deviceId);
      setAvailableFingerprintIds(availableIds);
    } catch (e: any) {
      console.error('Failed to load available fingerprint IDs:', e);
    }
  };

  const loadEnrolledFingerprintIds = async (deviceId: string) => {
    try {
      const enrolledIds = await ESP32Service.getEnrolledFingerprintIds(deviceId);
      setEnrolledFingerprintIds(enrolledIds);
    } catch (e: any) {
      console.error('Failed to load enrolled fingerprint IDs:', e);
    }
  };

  const loadAllStudents = async (deviceId: string) => {
    try {
      const students = await ESP32Service.getAllStudents(deviceId);
      setAllStudents(students);
    } catch (e: any) {
      console.error('Failed to load students:', e);
    }
  };

  const handleDeleteFingerprint = async (studentId: number, studentName: string) => {
    if (!selectedDevice) return;
    
    if (!window.confirm(`Are you sure you want to delete the fingerprint for ${studentName}?`)) {
      return;
    }

    try {
      setActionLoading(`delete_${studentId}`);
      await ESP32Service.deleteFingerprint(selectedDevice.DeviceID, studentId);
      await loadFingerprints(selectedDevice.DeviceID);
      await loadEnrollmentStatus(selectedDevice.DeviceID);
      console.log(`Fingerprint deleted for ${studentName}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete fingerprint');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeviceAction = async (action: string, deviceId: string) => {
    try {
      setActionLoading(action);
      await ESP32Service.sendCommand(deviceId, action);
      
      // Refresh device status after action
      await loadDeviceStatus(deviceId);
      
      // Show success message (you can add a toast notification here)
      console.log(`Command ${action} sent successfully`);
    } catch (e: any) {
      setError(e?.message || `Failed to execute ${action}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClearFingerprints = async (deviceId: string) => {
    // open modal instead (requires typing deviceId)
    setConfirmModal({ open: true, action: 'clear_all', text: '' });
    return;
    
    try {
      setActionLoading('clear_fingerprints');
      await ESP32Service.clearAllFingerprints(deviceId);
      await loadEnrollmentStatus(deviceId);
      console.log('All fingerprints cleared successfully');
    } catch (e: any) {
      setError(e?.message || 'Failed to clear fingerprints');
    } finally {
      setActionLoading(null);
    }
  };

  const openErrorModal = async () => {
    if (!selectedDevice) return;
    try {
      const logs = await ESP32Service.getDeviceLogs(selectedDevice.DeviceID, 100, 0);
      const items = (logs?.data || logs || []).filter((l: any) => (l.Status || '').toLowerCase() === 'error' || (l.Status || '').toLowerCase() === 'failed');
      setErrorLogs(items);
      setShowErrorModal(true);
    } catch (e: any) {
      setError('Failed to load error logs');
    }
  };

  const confirmDangerAction = async () => {
    if (!selectedDevice) return;
    const required = selectedDevice.DeviceID;
    if (confirmModal.text !== required) return;
    try {
      setActionLoading(confirmModal.action || '');
      if (confirmModal.action === 'reset') {
        await ESP32Service.sendCommand(selectedDevice.DeviceID, 'reset');
      } else if (confirmModal.action === 'clear_all') {
        await ESP32Service.clearAllFingerprints(selectedDevice.DeviceID);
      }
      setConfirmModal({ open:false, action:null, text:'' });
      if (confirmModal.action === 'clear_all') await loadEnrollmentStatus(selectedDevice.DeviceID);
    } catch (e: any) {
      setError(e?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSettings = async () => {
    if (!selectedDevice) return;
    try {
      setActionLoading('update_settings');
      await ESP32Service.sendDeviceCommand(selectedDevice.DeviceID, 'update_settings', {
        ssid: settings.ssid || undefined,
        password: settings.password || undefined,
        apiHost: settings.apiHost || undefined,
        apiPort: settings.apiPort ? parseInt(settings.apiPort) : undefined,
      });
      setShowSettingsModal(false);
    } catch (e: any) {
      setError(e?.message || 'Failed to send settings');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEnrollFingerprint = async () => {
    if (!selectedDevice) return;
    
    // Use selected student or manual student ID
    const studentId = selectedStudent ? selectedStudent.StudentID : parseInt(enrollStudentId);
    if (!studentId || isNaN(studentId)) {
      setError('Please select a student or enter a valid student ID');
      return;
    }

    // Check if student is already enrolled
    if (selectedStudent && selectedStudent.enrollmentStatus === 'enrolled') {
      setError('This student is already enrolled in the fingerprint system');
      return;
    }

    try {
      setActionLoading('enroll');
      
      // Get available fingerprint IDs and use the first one (lowest available)
      if (availableFingerprintIds.length === 0) {
        setError('No available fingerprint IDs. All 127 slots are taken.');
        return;
      }
      
      const fingerprintId = availableFingerprintIds[0]; // Use first available ID (lowest)
      
      // Send enrollment command to ESP32
      await ESP32Service.sendDeviceCommand(selectedDevice.DeviceID, 'enroll', { studentId });
      
      // Also enroll in database
      await ESP32Service.enrollFingerprint(selectedDevice.DeviceID, studentId, fingerprintId);
      
      setShowEnrollModal(false);
      setEnrollStudentId('');
      setSelectedStudent(null);
      await loadFingerprints(selectedDevice.DeviceID);
      await loadEnrollmentStatus(selectedDevice.DeviceID);
      await loadAvailableFingerprintIds(selectedDevice.DeviceID);
      await loadEnrolledFingerprintIds(selectedDevice.DeviceID);
      await loadAllStudents(selectedDevice.DeviceID);
      console.log(`Enrollment initiated for student ${studentId} with fingerprint ID ${fingerprintId}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to enroll fingerprint');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteFingerprintModal = async () => {
    if (!selectedDevice || !deleteStudentId) return;
    
    const studentId = parseInt(deleteStudentId);
    if (isNaN(studentId)) {
      setError('Please enter a valid student ID');
      return;
    }

    try {
      setActionLoading('delete');
      // Send delete command to ESP32
      await ESP32Service.sendDeviceCommand(selectedDevice.DeviceID, 'delete_fingerprint', { studentId });
      
      // Also delete from database
      await ESP32Service.deleteFingerprint(selectedDevice.DeviceID, studentId);
      
      setShowDeleteModal(false);
      setDeleteStudentId('');
      await loadFingerprints(selectedDevice.DeviceID);
      await loadEnrollmentStatus(selectedDevice.DeviceID);
      await loadAvailableFingerprintIds(selectedDevice.DeviceID);
      await loadEnrolledFingerprintIds(selectedDevice.DeviceID);
      console.log(`Delete initiated for student ${studentId}`);
    } catch (e: any) {
      setError(e?.message || 'Failed to delete fingerprint');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'maintenance':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <XCircle className="h-5 w-5 text-red-500 mr-2" />
          <p className="text-red-700">{error}</p>
        </div>
        <button 
          onClick={loadDevices}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">ESP32 Device Control</h2>
        <p className="text-gray-600">Monitor and control your fingerprint scanner devices</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Devices</h3>
            <div className="space-y-3">
              {devices.map((device) => (
                <div
                  key={device.DeviceID}
                  onClick={() => setSelectedDevice(device)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedDevice?.DeviceID === device.DeviceID
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Smartphone className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{device.DeviceName}</p>
                        <p className="text-sm text-gray-500">{device.DeviceID}</p>
                      </div>
                    </div>
                    {getStatusIcon(device.Status)}
                  </div>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{device.Location || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4" />
                      <span>{device.totalOperations} ops</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Device Details and Controls */}
        <div className="lg:col-span-2">
          {selectedDevice ? (
            <div className="space-y-6">
              {/* Device Status */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Device Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedDevice.Status)}`}>
                    {selectedDevice.Status}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Wifi className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-sm text-gray-500">WiFi</p>
                    <p className="font-semibold">{(deviceStatus && (deviceStatus as any).device?.WiFiSSID) || selectedDevice.WiFiSSID || 'Unknown'}</p>
                  </div>
                  
                  {selectedDevice.BatteryLevel && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Battery className="h-6 w-6 text-green-500" />
                      </div>
                      <p className="text-sm text-gray-500">Battery</p>
                      <p className="font-semibold">{selectedDevice.BatteryLevel}%</p>
                    </div>
                  )}
                  
                  {selectedDevice.Temperature && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Thermometer className="h-6 w-6 text-orange-500" />
                      </div>
                      <p className="text-sm text-gray-500">Temperature</p>
                      <p className="font-semibold">{selectedDevice.Temperature}°C</p>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Clock className="h-6 w-6 text-purple-500" />
                    </div>
                    <p className="text-sm text-gray-500">Last Seen</p>
                    <p className="font-semibold text-xs">
                      {new Date(selectedDevice.LastSeen).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Device Controls */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Controls</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to restart this device now?')) {
                        handleDeviceAction('restart', selectedDevice.DeviceID);
                      }
                    }}
                    disabled={actionLoading === 'restart'}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Power className="h-4 w-4" />
                    <span>Restart</span>
                  </button>
                  
                  <button
                    onClick={() => handleDeviceAction('test_connection', selectedDevice.DeviceID)}
                    disabled={actionLoading === 'test_connection'}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Wifi className="h-4 w-4" />
                    <span>Test</span>
                  </button>
                  
                  <button
                    onClick={() => setConfirmModal({ open:true, action:'reset', text:'' })}
                    disabled={actionLoading === 'reset'}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Reset</span>
                  </button>
                  
                  <button
                    onClick={() => handleClearFingerprints(selectedDevice.DeviceID)}
                    disabled={actionLoading === 'clear_fingerprints'}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Clear All</span>
                  </button>

                  <button
                    onClick={() => {
                      // Prefill sensible defaults
                      setSettings(s => ({
                        ssid: s.ssid,
                        password: '',
                        apiHost: window.location.hostname || 'attendance-test-production.up.railway.app',
                        apiPort: '443',
                        deviceId: selectedDevice.DeviceID,
                        apiKey: ''
                      }));
                      setShowSettingsModal(true);
                    }}
                    disabled={actionLoading === 'update_settings'}
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    <Wifi className="h-4 w-4" />
                    <span>Update Settings</span>
                  </button>
                </div>
                
                {/* Fingerprint Management */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-md font-semibold text-gray-900 mb-3">Fingerprint Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => setShowEnrollModal(true)}
                      disabled={actionLoading === 'enroll'}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      <Fingerprint className="h-4 w-4" />
                      <span>Enroll Fingerprint</span>
                    </button>
                    
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      disabled={actionLoading === 'delete'}
                      className="flex items-center justify-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Delete Fingerprint</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Enrollment Status */}
              {enrollmentStatus && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Fingerprint Enrollment</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-600">{enrollmentStatus.statistics.totalStudents}</p>
                      <p className="text-sm text-gray-600">Total Students</p>
                    </div>
                    
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-green-600">{enrollmentStatus.statistics.enrolledStudents}</p>
                      <p className="text-sm text-gray-600">Enrolled</p>
                    </div>
                    
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-yellow-600">{enrollmentStatus.statistics.notEnrolledStudents}</p>
                      <p className="text-sm text-gray-600">Not Enrolled</p>
                    </div>
                  </div>

                  <div className="max-h-64 overflow-y-auto">
                    <h4 className="font-medium text-gray-900 mb-3">Enrolled Students</h4>
                    <div className="space-y-2">
                      {enrollmentStatus.enrolledStudents.map((student, index) => (
                        <div key={`enrolled-student-${student.StudentID}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900">{student.FullName}</p>
                            <p className="text-sm text-gray-500">Grade {student.GradeLevel}</p>
                          </div>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            Enrolled
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}


              {/* Device Statistics */}
              {deviceStatus && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Device Statistics (24h)</h3>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{deviceStatus.statistics.totalOperations}</p>
                      <p className="text-sm text-gray-600">Total Operations</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{deviceStatus.statistics.successfulOperations}</p>
                      <p className="text-sm text-gray-600">Successful</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{deviceStatus.statistics.errorOperations}</p>
                      <p className="text-sm text-gray-600">Errors</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">
                        {deviceStatus.statistics.avgResponseTime ? 
                          `${Math.round(deviceStatus.statistics.avgResponseTime)}ms` : 
                          'N/A'
                        }
                      </p>
                      <p className="text-sm text-gray-600">Avg Response</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={openErrorModal}
                      className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                    >
                      View Errors
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Select a device to view details and controls</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enrollment Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-w-[90vw] mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Enroll Fingerprint</h3>
            
            {/* Student Selection */}
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Select Student</h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                {allStudents.length > 0 ? (
                  <div className="space-y-2">
                    {allStudents.map((student, index) => (
                      <div
                        key={`student-${student.StudentID}-${index}`}
                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedStudent?.StudentID === student.StudentID
                            ? 'bg-blue-100 border-blue-300'
                            : student.enrollmentStatus === 'enrolled'
                            ? 'bg-gray-100 border-gray-300 opacity-60'
                            : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          if (student.enrollmentStatus !== 'enrolled') {
                            setSelectedStudent(student);
                            setEnrollStudentId(student.StudentID.toString());
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium">{student.FullName}</span>
                            <span className="text-xs text-gray-500">ID: {student.StudentID}</span>
                            <span className="text-xs text-gray-500">Grade {student.GradeLevel}</span>
                          </div>
                          {student.enrollmentStatus === 'enrolled' && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              Already Enrolled (ID: {student.fingerprintId})
                            </span>
                          )}
                        </div>
                        {selectedStudent?.StudentID === student.StudentID && (
                          <span className="text-blue-600 text-sm font-medium">Selected</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No students found</span>
                )}
              </div>
            </div>

            {/* Manual Student ID Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Enter Student ID Manually
              </label>
              <input
                type="number"
                value={enrollStudentId}
                onChange={(e) => {
                  setEnrollStudentId(e.target.value);
                  setSelectedStudent(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter student ID"
              />
            </div>

            {/* Available Fingerprint IDs */}
            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">
                Available Fingerprint IDs
                {availableFingerprintIds.length > 0 && (
                  <span className="text-sm text-gray-600 ml-2">
                    (Next: {availableFingerprintIds[0]})
                  </span>
                )}
              </h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1">
                  {availableFingerprintIds.length > 0 ? (
                    availableFingerprintIds.slice(0, 20).map((id) => (
                      <span
                        key={id}
                        className={`inline-block px-2 py-1 text-xs rounded-full ${
                          id === availableFingerprintIds[0]
                            ? 'bg-blue-100 text-blue-800 font-semibold'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {id}
                      </span>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">No available IDs</span>
                  )}
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Total available: {availableFingerprintIds.length} / 127
                  {availableFingerprintIds.length > 20 && (
                    <span className="ml-2">(showing first 20)</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowEnrollModal(false);
                  setEnrollStudentId('');
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleEnrollFingerprint}
                disabled={actionLoading === 'enroll' || (!enrollStudentId && !selectedStudent)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === 'enroll' ? 'Enrolling...' : 'Enroll'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Fingerprint</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student ID
              </label>
              <input
                type="number"
                value={deleteStudentId}
                onChange={(e) => setDeleteStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Enter student ID"
              />
            </div>

            <div className="mb-4">
              <h4 className="text-md font-medium text-gray-900 mb-2">Enrolled Fingerprint IDs</h4>
              <div className="bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto">
                {enrolledFingerprintIds.length > 0 ? (
                  <div className="space-y-2">
                    {enrolledFingerprintIds.map((enrollment, index) => (
                      <div key={`enrolled-${enrollment.StudentID}-${enrollment.fingerprintId}-${index}`} className="flex items-center justify-between p-2 bg-white rounded border">
                        <div className="flex items-center space-x-3">
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-mono">
                            ID: {enrollment.fingerprintId}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{enrollment.FullName}</p>
                            <p className="text-xs text-gray-500">Student ID: {enrollment.StudentID} • Grade {enrollment.GradeLevel}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setDeleteStudentId(enrollment.StudentID.toString());
                          }}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Select
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 text-sm">No enrolled fingerprints</span>
                )}
                <p className="text-xs text-gray-600 mt-2">
                  Total enrolled: {enrolledFingerprintIds.length}
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteStudentId('');
                }}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFingerprintModal}
                disabled={actionLoading === 'delete' || !deleteStudentId}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === 'delete' ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Details Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-w-[95vw] max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Error Logs</h3>
            {errorLogs.length === 0 ? (
              <p className="text-sm text-gray-600">No error logs in the last 100 entries.</p>
            ) : (
              <div className="space-y-2">
                {errorLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-3 border rounded bg-red-50">
                    <div className="text-sm text-gray-700"><span className="font-semibold">Time:</span> {new Date(log.Timestamp).toLocaleString()}</div>
                    <div className="text-sm text-gray-700"><span className="font-semibold">Action:</span> {log.Action}</div>
                    <div className="text-sm text-gray-700"><span className="font-semibold">Status:</span> {log.Status}</div>
                    {log.ErrorMessage && (
                      <div className="text-sm text-gray-700"><span className="font-semibold">Message:</span> {log.ErrorMessage}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between mt-4">
              <button
                onClick={async () => {
                  if (!selectedDevice) return;
                  if (!confirm('Clear all error/history logs for this device?')) return;
                  try {
                    await ESP32Service.clearDeviceLogs(selectedDevice.DeviceID);
                    setErrorLogs([]);
                  } catch (e) {
                    // no-op; UI will remain
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear History
              </button>
              <button onClick={() => setShowErrorModal(false)} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Destructive Confirmation Modal */}
      {confirmModal.open && selectedDevice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[520px] max-w-[95vw]">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmModal.action === 'reset' ? 'Confirm Factory Reset' : 'Confirm Clear All Fingerprints'}
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {confirmModal.action === 'reset'
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
              <button onClick={() => setConfirmModal({ open:false, action:null, text:'' })} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
              <button
                onClick={confirmDangerAction}
                disabled={confirmModal.text !== selectedDevice.DeviceID || !!actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? 'Working...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-w-[90vw] mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Device Settings</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wi‑Fi SSID</label>
                <input
                  type="text"
                  value={settings.ssid}
                  onChange={(e) => setSettings({ ...settings, ssid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Wi‑Fi name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Wi‑Fi Password</label>
                <input
                  type="password"
                  value={settings.password}
                  onChange={(e) => setSettings({ ...settings, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Your Wi‑Fi password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Hostname</label>
                <input
                  type="text"
                  value={settings.apiHost}
                  onChange={(e) => setSettings({ ...settings, apiHost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="attendance-test-production.up.railway.app"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Port</label>
                <input
                  type="number"
                  value={settings.apiPort}
                  onChange={(e) => setSettings({ ...settings, apiPort: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="443"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSettings}
                disabled={actionLoading === 'update_settings'}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {actionLoading === 'update_settings' ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
