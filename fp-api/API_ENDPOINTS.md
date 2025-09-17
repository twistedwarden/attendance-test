# Fingerprint API Endpoints Documentation

This document provides comprehensive documentation for all fingerprint API endpoints, including request/response examples, error handling, and integration guides.

## Table of Contents

- [Authentication](#authentication)
- [Device Management](#device-management)
- [Fingerprint Operations](#fingerprint-operations)
- [Admin Endpoints](#admin-endpoints)
- [Error Handling](#error-handling)
- [ESP32 Integration Examples](#esp32-integration-examples)
- [Testing](#testing)

## Authentication

All API endpoints require authentication using the following headers:

### Required Headers

```http
X-API-Key: your_esp32_api_key_here
X-Device-ID: ESP32_001
Content-Type: application/json
```

### API Key Configuration

Set your API key in the environment file:

```env
ESP32_API_KEY=your_secure_api_key_here
```

## Device Management

### 1. Health Check

Check if the fingerprint API is running and accessible.

**Endpoint:** `GET /api/fingerprint/health`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
```

**Response:**

```json
{
  "success": true,
  "message": "Fingerprint API is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "deviceId": "ESP32_001"
}
```

**ESP32 Example:**

```cpp
void checkAPIHealth() {
  HTTPClient http;
  http.begin(api_url + "/api/fingerprint/health");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  int httpResponseCode = http.GET();

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("API Health: " + response);
  }

  http.end();
}
```

### 2. Register Device

Register a new ESP32 device with the fingerprint API.

**Endpoint:** `POST /api/fingerprint/device/register`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
Content-Type: application/json
```

**Request Body:**

```json
{
  "deviceName": "ESP32 Device 1",
  "location": "Main Entrance"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Device registered successfully",
  "deviceId": "ESP32_001"
}
```

**ESP32 Example:**

```cpp
void registerDevice() {
  HTTPClient http;
  http.begin(api_url + "/api/fingerprint/device/register");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["deviceName"] = "ESP32 Device 1";
  doc["location"] = "Main Entrance";

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Registration response: " + response);
  }

  http.end();
}
```

### 3. Update Device Status

Update the status of a registered ESP32 device.

**Endpoint:** `POST /api/fingerprint/device/status`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
Content-Type: application/json
```

**Request Body:**

```json
{
  "status": "active"
}
```

**Valid Status Values:**

- `active` - Device is operational
- `inactive` - Device is offline
- `maintenance` - Device is in maintenance mode

**Response:**

```json
{
  "success": true,
  "message": "Device status updated successfully"
}
```

**ESP32 Example:**

```cpp
void sendHeartbeat() {
  HTTPClient http;
  http.begin(api_url + "/api/fingerprint/device/status");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["status"] = "active";

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Heartbeat sent: " + response);
  }

  http.end();
}
```

### 4. Get Devices

Retrieve a list of all registered ESP32 devices.

**Endpoint:** `GET /api/fingerprint/devices`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
```

**Response:**

```json
{
  "success": true,
  "devices": [
    {
      "deviceId": "ESP32_001",
      "deviceName": "ESP32 Device 1",
      "location": "Main Entrance",
      "status": "active",
      "lastSeen": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-15T09:00:00.000Z"
    }
  ]
}
```

## Fingerprint Operations

### 1. Enroll Fingerprint

Enroll a new fingerprint template for a student.

**Endpoint:** `POST /api/fingerprint/enroll`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
Content-Type: application/json
```

**Request Body:**

```json
{
  "fingerprintTemplate": "base64_encoded_template_data",
  "studentId": 123
}
```

**Response:**

```json
{
  "success": true,
  "message": "Fingerprint enrolled successfully",
  "studentId": 123
}
```

**ESP32 Example:**

```cpp
void enrollFingerprint(int studentId, String fingerprintTemplate) {
  HTTPClient http;
  http.begin(api_url + "/api/fingerprint/enroll");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["studentId"] = studentId;
  doc["fingerprintTemplate"] = fingerprintTemplate;

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Enrollment response: " + response);

    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);

    if (responseDoc["success"]) {
      Serial.println("✅ Fingerprint enrolled successfully!");
    } else {
      Serial.println("❌ Enrollment failed: " + String(responseDoc["message"]));
    }
  }

  http.end();
}
```

### 2. Verify Fingerprint

Verify a fingerprint template against enrolled fingerprints.

**Endpoint:** `POST /api/fingerprint/verify`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
Content-Type: application/json
```

**Request Body:**

```json
{
  "fingerprintTemplate": "base64_encoded_template_data"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Fingerprint verified successfully",
  "student": {
    "studentId": 123,
    "fullName": "John Doe",
    "gradeLevel": "Grade 10"
  }
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "Fingerprint not found",
  "student": null
}
```

**ESP32 Example:**

```cpp
void verifyFingerprint(String fingerprintTemplate) {
  HTTPClient http;
  http.begin(api_url + "/api/fingerprint/verify");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["fingerprintTemplate"] = fingerprintTemplate;

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Verification response: " + response);

    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);

    if (responseDoc["success"]) {
      String studentName = responseDoc["student"]["fullName"];
      int studentId = responseDoc["student"]["studentId"];

      Serial.println("✅ Access granted!");
      Serial.println("Student: " + studentName);
      Serial.println("ID: " + String(studentId));

      // Log attendance
      logAttendance(studentId, studentName);
    } else {
      Serial.println("❌ Access denied - Fingerprint not recognized");
    }
  }

  http.end();
}
```

### 3. Delete Fingerprint

Delete a fingerprint template for a specific student.

**Endpoint:** `DELETE /api/fingerprint/delete`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
Content-Type: application/json
```

**Request Body:**

```json
{
  "studentId": 123
}
```

**Response:**

```json
{
  "success": true,
  "message": "Fingerprint deleted successfully",
  "studentId": 123
}
```

**ESP32 Example:**

```cpp
void deleteFingerprint(int studentId) {
  HTTPClient http;
  http.begin(api_url + "/api/fingerprint/delete");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["studentId"] = studentId;

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.sendRequest("DELETE", payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Deletion response: " + response);

    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);

    if (responseDoc["success"]) {
      Serial.println("✅ Fingerprint deleted successfully!");
    } else {
      Serial.println("❌ Deletion failed: " + String(responseDoc["message"]));
    }
  }

  http.end();
}
```

### 4. Lookup Fingerprint

Look up student information by fingerprint template (for debugging).

**Endpoint:** `POST /api/fingerprint/lookup`

**Headers:**

```http
X-API-Key: your_api_key
X-Device-ID: ESP32_001
Content-Type: application/json
```

**Request Body:**

```json
{
  "fingerprintTemplate": "base64_encoded_template_data"
}
```

**Response (Found):**

```json
{
  "success": true,
  "student": {
    "studentId": 123,
    "fullName": "John Doe",
    "gradeLevel": "Grade 10"
  }
}
```

**Response (Not Found):**

```json
{
  "success": false,
  "message": "No student found with this fingerprint",
  "student": null
}
```

## Admin Endpoints

### 1. Get Logs

Retrieve system logs for monitoring and debugging.

**Endpoint:** `GET /api/admin/logs`

**Query Parameters:**

- `limit` (optional): Number of logs to return (default: 50)
- `offset` (optional): Number of logs to skip (default: 0)

**Example:**

```http
GET /api/admin/logs?limit=100&offset=0
```

**Response:**

```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "deviceId": "ESP32_001",
      "action": "enroll",
      "studentId": 123,
      "timestamp": "2024-01-15T10:30:00.000Z",
      "ipAddress": "192.168.1.100",
      "success": true
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0
}
```

## Error Handling

### Common Error Responses

#### 400 Bad Request

```json
{
  "success": false,
  "message": "Invalid request parameters",
  "error": "Device name is required"
}
```

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Invalid API key"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Fingerprint not found",
  "student": null
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to enroll fingerprint",
  "error": "Database connection failed"
}
```

### Error Handling in ESP32

```cpp
void handleAPIError(int httpCode, String response) {
  switch (httpCode) {
    case 400:
      Serial.println("❌ Bad Request: " + response);
      break;
    case 401:
      Serial.println("❌ Unauthorized: Check API key");
      break;
    case 404:
      Serial.println("❌ Not Found: " + response);
      break;
    case 500:
      Serial.println("❌ Server Error: " + response);
      break;
    default:
      Serial.println("❌ HTTP Error " + String(httpCode) + ": " + response);
  }
}
```

## ESP32 Integration Examples

### Complete ESP32 Setup

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
const char* api_url = "http://YOUR_SERVER_IP:5001";
const char* api_key = "your_esp32_api_key_here";
const char* device_id = "ESP32_001";

// AS608 Sensor
SoftwareSerial mySerial(16, 17);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  connectToWiFi();

  // Initialize fingerprint sensor
  initializeFingerprintSensor();

  // Register device
  registerDevice();

  Serial.println("Setup complete. Ready for operations.");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
    return;
  }

  // Send heartbeat every 5 minutes
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 300000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }

  // Check for fingerprint
  checkFingerprint();

  delay(100);
}

void connectToWiFi() {
  WiFi.begin(ssid, password);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());
}

void initializeFingerprintSensor() {
  finger.begin(57600);

  if (finger.verifyPassword()) {
    Serial.println("✅ Found AS608 fingerprint sensor!");
  } else {
    Serial.println("❌ Did not find AS608 fingerprint sensor");
    while (1) { delay(1); }
  }
}

void registerDevice() {
  HTTPClient http;
  http.begin(String(api_url) + "/api/fingerprint/device/register");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["deviceName"] = "ESP32 Device 1";
  doc["location"] = "Main Entrance";

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Device registration: " + response);
  }

  http.end();
}

void sendHeartbeat() {
  HTTPClient http;
  http.begin(String(api_url) + "/api/fingerprint/device/status");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["status"] = "active";

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    Serial.println("💓 Heartbeat sent");
  }

  http.end();
}

void checkFingerprint() {
  // Get fingerprint image
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return;

  // Convert image to template
  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return;

  // Search for fingerprint
  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    Serial.println("Found fingerprint ID: " + String(finger.fingerID));

    // Get template and verify with API
    String template = getFingerprintTemplate(finger.fingerID);
    verifyFingerprint(template);
  }
}

String getFingerprintTemplate(int fingerId) {
  if (finger.loadModel(fingerId) != FINGERPRINT_OK) return "";
  if (finger.getModel() != FINGERPRINT_OK) return "";

  String template = "";
  for (int i = 0; i < 256; i++) {
    template += String(finger.templateBuffer[i], HEX);
  }

  return template;
}

void verifyFingerprint(String fingerprintTemplate) {
  HTTPClient http;
  http.begin(String(api_url) + "/api/fingerprint/verify");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  DynamicJsonDocument doc(1024);
  doc["fingerprintTemplate"] = fingerprintTemplate;

  String payload;
  serializeJson(doc, payload);

  int httpResponseCode = http.POST(payload);

  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Verification: " + response);

    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);

    if (responseDoc["success"]) {
      String studentName = responseDoc["student"]["fullName"];
      int studentId = responseDoc["student"]["studentId"];

      Serial.println("✅ Access granted for: " + studentName);
      // Add your attendance logging logic here
    } else {
      Serial.println("❌ Access denied");
    }
  }

  http.end();
}
```

## Testing

### Manual Testing with cURL

#### Test Health Check

```bash
curl -H "X-API-Key: your_api_key" \
     -H "X-Device-ID: ESP32_001" \
     http://localhost:5001/api/fingerprint/health
```

#### Test Device Registration

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your_api_key" \
     -H "X-Device-ID: ESP32_001" \
     -d '{"deviceName":"Test Device","location":"Test Lab"}' \
     http://localhost:5001/api/fingerprint/device/register
```

#### Test Fingerprint Verification

```bash
curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-API-Key: your_api_key" \
     -H "X-Device-ID: ESP32_001" \
     -d '{"fingerprintTemplate":"dGVzdF90ZW1wbGF0ZQ=="}' \
     http://localhost:5001/api/fingerprint/verify
```

### Automated Testing

Run the comprehensive test suite:

```bash
cd fp-api
node test-comprehensive.js
```

### ESP32 Testing

Use the provided test script:

```bash
cd fp-api
node test-fp-api.js
```

## Security Considerations

1. **API Key Security**: Use a strong, unique API key and store it securely
2. **HTTPS**: Use HTTPS in production environments
3. **Rate Limiting**: The API includes built-in rate limiting
4. **Input Validation**: All inputs are validated and sanitized
5. **Logging**: All operations are logged for audit purposes

## Troubleshooting

### Common Issues

1. **"Invalid API Key"**

   - Check `ESP32_API_KEY` in `.env` file
   - Ensure ESP32 sends correct `X-API-Key` header

2. **"Device ID Required"**

   - ESP32 must send `X-Device-ID` header
   - Device ID must be 3-50 characters

3. **"Fingerprint Not Found"**

   - Ensure fingerprint is enrolled first
   - Check fingerprint template format

4. **Database Connection Failed**
   - Check database credentials in `.env`
   - Ensure MySQL server is running

### Debug Mode

Set `NODE_ENV=development` in `.env` for detailed error messages.

### Monitoring

Monitor device status and logs:

```bash
# Check device status
curl -H "X-API-Key: your_key" -H "X-Device-ID: ESP32_001" \
     http://localhost:5001/api/fingerprint/devices

# View logs
curl http://localhost:5001/api/admin/logs
```

## Support

For additional support or questions:

1. Check the logs for detailed error messages
2. Verify all configuration parameters
3. Test with the provided test scripts
4. Review the ESP32 example code for implementation details
