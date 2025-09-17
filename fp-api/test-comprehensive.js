import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const API_BASE_URL = 'http://localhost:5001';
const API_KEY = 'test_esp32_api_key_123';
const DEVICE_ID = 'ESP32_TEST_001';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
  'X-Device-ID': DEVICE_ID
};

// Test data
const testFingerprintTemplate = Buffer.from('test_fingerprint_data_' + Date.now()).toString('base64');
const testStudentId = 1;

class APITester {
  constructor() {
    this.testResults = [];
    this.startTime = performance.now();
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    const testStart = performance.now();
    
    try {
      const result = await testFunction();
      const testEnd = performance.now();
      const duration = Math.round(testEnd - testStart);
      
      this.testResults.push({
        name: testName,
        status: 'PASS',
        duration: duration,
        result: result
      });
      
      console.log(`✅ ${testName} - PASSED (${duration}ms)`);
      return result;
    } catch (error) {
      const testEnd = performance.now();
      const duration = Math.round(testEnd - testStart);
      
      this.testResults.push({
        name: testName,
        status: 'FAIL',
        duration: duration,
        error: error.message
      });
      
      console.log(`❌ ${testName} - FAILED (${duration}ms): ${error.message}`);
      throw error;
    }
  }

  async testHealthCheck() {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error('Health check failed');
    }
    
    return data;
  }

  async testDeviceRegistration() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/device/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deviceName: 'ESP32 Test Device',
        location: 'Test Laboratory'
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Device registration failed: ${data.message}`);
    }
    
    return data;
  }

  async testDeviceStatusUpdate() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/device/status`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        status: 'active'
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Device status update failed: ${data.message}`);
    }
    
    return data;
  }

  async testFingerprintEnrollment() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/enroll`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: testFingerprintTemplate,
        studentId: testStudentId
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fingerprint enrollment failed: ${data.message}`);
    }
    
    return data;
  }

  async testFingerprintVerification() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: testFingerprintTemplate
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fingerprint verification failed: ${data.message}`);
    }
    
    if (!data.student) {
      throw new Error('No student data returned from verification');
    }
    
    return data;
  }

  async testFingerprintLookup() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/lookup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: testFingerprintTemplate
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fingerprint lookup failed: ${data.message}`);
    }
    
    return data;
  }

  async testGetDevices() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/devices`, {
      method: 'GET',
      headers
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Get devices failed: ${data.message}`);
    }
    
    if (!Array.isArray(data.devices)) {
      throw new Error('Devices data is not an array');
    }
    
    return data;
  }

  async testGetLogs() {
    const response = await fetch(`${API_BASE_URL}/api/admin/logs?limit=10`, {
      method: 'GET'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Get logs failed: ${data.message}`);
    }
    
    if (!Array.isArray(data.logs)) {
      throw new Error('Logs data is not an array');
    }
    
    return data;
  }

  async testFingerprintDeletion() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/delete`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        studentId: testStudentId
      })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Fingerprint deletion failed: ${data.message}`);
    }
    
    return data;
  }

  async testInvalidAPIKey() {
    const invalidHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': 'invalid_key',
      'X-Device-ID': DEVICE_ID
    };
    
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/health`, {
      headers: invalidHeaders
    });
    
    const data = await response.json();
    
    if (data.success) {
      throw new Error('Invalid API key should have been rejected');
    }
    
    if (response.status !== 401) {
      throw new Error(`Expected 401 status, got ${response.status}`);
    }
    
    return data;
  }

  async testMissingDeviceID() {
    const missingDeviceHeaders = {
      'Content-Type': 'application/json',
      'X-API-Key': API_KEY
    };
    
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/health`, {
      headers: missingDeviceHeaders
    });
    
    const data = await response.json();
    
    if (data.success) {
      throw new Error('Missing device ID should have been rejected');
    }
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 status, got ${response.status}`);
    }
    
    return data;
  }

  async testInvalidFingerprintTemplate() {
    const response = await fetch(`${API_BASE_URL}/api/fingerprint/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: '' // Empty template
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      throw new Error('Empty fingerprint template should have been rejected');
    }
    
    if (response.status !== 400) {
      throw new Error(`Expected 400 status, got ${response.status}`);
    }
    
    return data;
  }

  async testRateLimiting() {
    console.log('Testing rate limiting (sending 10 rapid requests)...');
    
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch(`${API_BASE_URL}/api/fingerprint/health`, {
          headers
        })
      );
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.some(r => r.status === 429);
    
    if (!rateLimited) {
      console.log('⚠️  Rate limiting not triggered (this might be expected depending on configuration)');
    } else {
      console.log('✅ Rate limiting working correctly');
    }
    
    return { rateLimited };
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Fingerprint API Tests');
    console.log('================================================');
    
    try {
      // Basic functionality tests
      await this.runTest('Health Check', () => this.testHealthCheck());
      await this.runTest('Device Registration', () => this.testDeviceRegistration());
      await this.runTest('Device Status Update', () => this.testDeviceStatusUpdate());
      await this.runTest('Fingerprint Enrollment', () => this.testFingerprintEnrollment());
      await this.runTest('Fingerprint Verification', () => this.testFingerprintVerification());
      await this.runTest('Fingerprint Lookup', () => this.testFingerprintLookup());
      await this.runTest('Get Devices', () => this.testGetDevices());
      await this.runTest('Get Logs', () => this.testGetLogs());
      await this.runTest('Fingerprint Deletion', () => this.testFingerprintDeletion());
      
      // Error handling tests
      await this.runTest('Invalid API Key', () => this.testInvalidAPIKey());
      await this.runTest('Missing Device ID', () => this.testMissingDeviceID());
      await this.runTest('Invalid Fingerprint Template', () => this.testInvalidFingerprintTemplate());
      
      // Performance tests
      await this.runTest('Rate Limiting', () => this.testRateLimiting());
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    }
    
    this.printSummary();
  }

  printSummary() {
    const endTime = performance.now();
    const totalDuration = Math.round(endTime - this.startTime);
    
    console.log('\n📊 Test Summary');
    console.log('================');
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Total Tests: ${this.testResults.length}`);
    
    const passed = this.testResults.filter(t => t.status === 'PASS').length;
    const failed = this.testResults.filter(t => t.status === 'FAIL').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${Math.round((passed / this.testResults.length) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(t => t.status === 'FAIL')
        .forEach(t => console.log(`  - ${t.name}: ${t.error}`));
    }
    
    console.log('\n📋 All Test Results:');
    this.testResults.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${test.name} (${test.duration}ms)`);
    });
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed! The Fingerprint API is working correctly.');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the API configuration and database connection.');
    }
  }
}

// Run tests
const tester = new APITester();
tester.runAllTests().catch(console.error);
