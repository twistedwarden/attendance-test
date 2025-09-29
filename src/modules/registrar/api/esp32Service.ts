export interface ESP32Device {
  DeviceID: string;
  DeviceName: string;
  Location: string;
  Status: 'active' | 'inactive' | 'maintenance';
  LastSeen: string;
  CreatedAt: string;
  UpdatedAt: string;
  FirmwareVersion?: string;
  HardwareVersion?: string;
  MACAddress?: string;
  WiFiSSID?: string;
  BatteryLevel?: number;
  Temperature?: number;
  Uptime?: number;
  totalOperations: number;
  successfulOperations: number;
  errorOperations: number;
  lastOperation?: string;
}

export interface DeviceStatus {
  device: ESP32Device;
  recentOperations: any[];
  statistics: {
    totalOperations: number;
    successfulOperations: number;
    errorOperations: number;
    failedOperations: number;
    avgResponseTime: number;
  };
}

export interface EnrolledStudent {
  StudentID: number;
  FullName: string;
  GradeLevel: string;
  FingerprintTemplate: string;
  enrollmentStatus: 'enrolled' | 'not_enrolled';
}

export interface EnrollmentStatus {
  enrolledStudents: EnrolledStudent[];
  statistics: {
    totalStudents: number;
    enrolledStudents: number;
    notEnrolledStudents: number;
  };
}

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const ESP32Service = {
  // Get all ESP32 devices
  async getDevices(): Promise<ESP32Device[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch ESP32 devices');
    
    return data.data || [];
  },

  // Get device status and health
  async getDeviceStatus(deviceId: string): Promise<DeviceStatus> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch device status');
    
    return data.data;
  },

  // Update device status
  async updateDeviceStatus(deviceId: string, updates: {
    status?: 'active' | 'inactive' | 'maintenance';
    location?: string;
    deviceName?: string;
  }): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/status`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update device status');
  },

  // Send command to ESP32 device
  async sendCommand(deviceId: string, command: string, parameters?: any): Promise<{ commandId: number }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/command`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ command, parameters })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to send command');
    
    return { commandId: data.commandId };
  },

  // Get device logs
  async getDeviceLogs(deviceId: string, limit = 50, offset = 0): Promise<{
    data: any[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
    };
  }> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/logs?limit=${limit}&offset=${offset}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch device logs');
    
    return data;
  },

  // Clear device logs
  async clearDeviceLogs(deviceId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/logs`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to clear logs');
  },

  // Get enrollment status
  async getEnrollmentStatus(deviceId: string): Promise<EnrollmentStatus> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/enrollment-status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch enrollment status');
    
    return data.data;
  },

  // Get enrolled fingerprints
  async getFingerprints(deviceId: string): Promise<EnrolledStudent[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/fingerprints`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch fingerprints');
    
    return data.data || [];
  },

  // Delete specific fingerprint
  async deleteFingerprint(deviceId: string, studentId: number): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/fingerprints/${studentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to delete fingerprint');
  },

  // Clear all fingerprints
  async clearAllFingerprints(deviceId: string): Promise<void> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/clear-fingerprints`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to clear fingerprints');
  },

  async enrollFingerprint(deviceId: string, studentId: number, fingerprintId: number): Promise<any> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/enroll`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ studentId, fingerprintId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to enroll fingerprint');
    return data;
  },


  async sendDeviceCommand(deviceId: string, command: string, parameters: any = {}): Promise<any> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/command`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ command, parameters })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `Failed to send command ${command}`);
    return data;
  },

  async getAvailableFingerprintIds(deviceId: string): Promise<number[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/available-ids`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch available fingerprint IDs');
    return data.data || [];
  },

  async getEnrolledFingerprintIds(deviceId: string): Promise<number[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/enrolled-ids`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch enrolled fingerprint IDs');
    return data.data || [];
  },

  async getAllStudents(deviceId: string): Promise<any[]> {
    const token = getToken();
    if (!token) throw new Error('Not authenticated');
    
    const res = await fetch(`${API_BASE_URL}/esp32/devices/${deviceId}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch students');
    return data.data || [];
  }
};
