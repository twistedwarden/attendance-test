import fetch from 'node-fetch';

const API_BASE_URL = 'http://localhost:5001';
const API_KEY = 'your_esp32_api_key_here'; // Replace with actual API key
const DEVICE_ID = 'ESP32_001';

const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': API_KEY,
  'X-Device-ID': DEVICE_ID
};

// Test data
const testFingerprintTemplate = Buffer.from('test_fingerprint_data_12345').toString('base64');
const testStudentId = 1;

async function testAPI() {
  console.log('🧪 Testing Fingerprint API...\n');

  try {
    // Test 1: Health Check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.message);
    console.log('');

    // Test 2: Device Registration
    console.log('2. Testing device registration...');
    const registerResponse = await fetch(`${API_BASE_URL}/api/fingerprint/device/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        deviceName: 'ESP32 Test Device',
        location: 'Test Lab'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅ Device registration:', registerData.message);
    console.log('');

    // Test 3: Fingerprint Enrollment
    console.log('3. Testing fingerprint enrollment...');
    const enrollResponse = await fetch(`${API_BASE_URL}/api/fingerprint/enroll`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: testFingerprintTemplate,
        studentId: testStudentId
      })
    });
    const enrollData = await enrollResponse.json();
    console.log('✅ Fingerprint enrollment:', enrollData.message);
    console.log('');

    // Test 4: Fingerprint Verification
    console.log('4. Testing fingerprint verification...');
    const verifyResponse = await fetch(`${API_BASE_URL}/api/fingerprint/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: testFingerprintTemplate
      })
    });
    const verifyData = await verifyResponse.json();
    console.log('✅ Fingerprint verification:', verifyData.message);
    if (verifyData.student) {
      console.log('   Student found:', verifyData.student.fullName);
    }
    console.log('');

    // Test 5: Fingerprint Lookup
    console.log('5. Testing fingerprint lookup...');
    const lookupResponse = await fetch(`${API_BASE_URL}/api/fingerprint/lookup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: testFingerprintTemplate
      })
    });
    const lookupData = await lookupResponse.json();
    console.log('✅ Fingerprint lookup:', lookupData.success ? 'Found' : 'Not found');
    if (lookupData.student) {
      console.log('   Student:', lookupData.student.fullName);
    }
    console.log('');

    // Test 6: Get Devices
    console.log('6. Testing get devices...');
    const devicesResponse = await fetch(`${API_BASE_URL}/api/fingerprint/devices`, {
      method: 'GET',
      headers
    });
    const devicesData = await devicesResponse.json();
    console.log('✅ Devices retrieved:', devicesData.devices.length, 'devices found');
    console.log('');

    // Test 7: Get Logs
    console.log('7. Testing get logs...');
    const logsResponse = await fetch(`${API_BASE_URL}/api/admin/logs`, {
      method: 'GET'
    });
    const logsData = await logsResponse.json();
    console.log('✅ Logs retrieved:', logsData.logs.length, 'log entries found');
    console.log('');

    // Test 8: Fingerprint Deletion
    console.log('8. Testing fingerprint deletion...');
    const deleteResponse = await fetch(`${API_BASE_URL}/api/fingerprint/delete`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        studentId: testStudentId
      })
    });
    const deleteData = await deleteResponse.json();
    console.log('✅ Fingerprint deletion:', deleteData.message);
    console.log('');

    console.log('🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test error cases
async function testErrorCases() {
  console.log('\n🧪 Testing error cases...\n');

  try {
    // Test 1: Invalid API Key
    console.log('1. Testing invalid API key...');
    const invalidKeyResponse = await fetch(`${API_BASE_URL}/api/fingerprint/health`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid_key',
        'X-Device-ID': DEVICE_ID
      }
    });
    const invalidKeyData = await invalidKeyResponse.json();
    console.log('✅ Invalid API key handled:', invalidKeyData.message);
    console.log('');

    // Test 2: Missing Device ID
    console.log('2. Testing missing device ID...');
    const missingDeviceResponse = await fetch(`${API_BASE_URL}/api/fingerprint/health`, {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY
      }
    });
    const missingDeviceData = await missingDeviceResponse.json();
    console.log('✅ Missing device ID handled:', missingDeviceData.message);
    console.log('');

    // Test 3: Invalid fingerprint template
    console.log('3. Testing invalid fingerprint template...');
    const invalidTemplateResponse = await fetch(`${API_BASE_URL}/api/fingerprint/verify`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fingerprintTemplate: '' // Empty template
      })
    });
    const invalidTemplateData = await invalidTemplateResponse.json();
    console.log('✅ Invalid template handled:', invalidTemplateData.message);
    console.log('');

    console.log('🎉 All error tests completed successfully!');

  } catch (error) {
    console.error('❌ Error test failed:', error.message);
  }
}

// Run tests
if (process.argv[2] === '--errors') {
  testErrorCases();
} else {
  testAPI();
}

