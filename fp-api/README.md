# Fingerprint API for ESP32

This API provides endpoints for ESP32 devices to interact with the attendance system's fingerprint functionality. It handles fingerprint enrollment, verification, and deletion operations.

## Features

- 🔐 Secure API key authentication for ESP32 devices
- 📱 Device registration and management
- 👆 Fingerprint enrollment, verification, and deletion
- 📊 Comprehensive logging and monitoring
- 🛡️ Rate limiting and security middleware
- 🔍 Admin endpoints for debugging

## Setup

### 1. Install Dependencies

```bash
cd fp-api
npm install
```

### 2. Environment Configuration

Copy `env.example` to `.env` and configure:

```bash
cp env.example .env
```

Edit `.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=attendance

# Server Configuration
PORT=5001
NODE_ENV=development

# ESP32 API Configuration
ESP32_API_KEY=your_secure_api_key_here
FP_TEMPLATE_SIZE_LIMIT=1024
```

### 3. Start the Server

```bash
npm start
# or for development
npm run dev
```

The server will start on port 5001 by default.

## API Endpoints

### Authentication

All endpoints require:

- `X-API-Key` header with your ESP32 API key
- `X-Device-ID` header with unique device identifier

### Device Management

#### Register Device

```http
POST /api/fingerprint/device/register
Content-Type: application/json
X-API-Key: your_api_key
X-Device-ID: ESP32_001

{
  "deviceName": "ESP32 Device 1",
  "location": "Main Entrance"
}
```

#### Update Device Status

```http
POST /api/fingerprint/device/status
Content-Type: application/json
X-API-Key: your_api_key
X-Device-ID: ESP32_001

{
  "status": "active"
}
```

#### Get Devices

```http
GET /api/fingerprint/devices
X-API-Key: your_api_key
X-Device-ID: ESP32_001
```

### Fingerprint Operations

#### Enroll Fingerprint

```http
POST /api/fingerprint/enroll
Content-Type: application/json
X-API-Key: your_api_key
X-Device-ID: ESP32_001

{
  "fingerprintTemplate": "base64_encoded_template",
  "studentId": 123
}
```

#### Verify Fingerprint

```http
POST /api/fingerprint/verify
Content-Type: application/json
X-API-Key: your_api_key
X-Device-ID: ESP32_001

{
  "fingerprintTemplate": "base64_encoded_template"
}
```

Response:

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

#### Delete Fingerprint

```http
DELETE /api/fingerprint/delete
Content-Type: application/json
X-API-Key: your_api_key
X-Device-ID: ESP32_001

{
  "studentId": 123
}
```

#### Lookup Fingerprint

```http
POST /api/fingerprint/lookup
Content-Type: application/json
X-API-Key: your_api_key
X-Device-ID: ESP32_001

{
  "fingerprintTemplate": "base64_encoded_template"
}
```

### Admin Endpoints

#### Get Logs

```http
GET /api/admin/logs?limit=50&offset=0
```

#### Health Check

```http
GET /health
```

## ESP32 Integration Example

### Arduino/ESP32 Code Example

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "your_wifi_ssid";
const char* password = "your_wifi_password";
const char* api_url = "http://your_server_ip:5001";
const char* api_key = "your_esp32_api_key_here";
const char* device_id = "ESP32_001";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }

  Serial.println("Connected to WiFi");
  registerDevice();
}

void registerDevice() {
  HTTPClient http;
  http.begin(String(api_url) + "/api/fingerprint/device/register");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);

  String payload = "{\"deviceName\":\"ESP32 Device 1\",\"location\":\"Main Entrance\"}";

  int httpResponseCode = http.POST(payload);
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Device registered: " + response);
  } else {
    Serial.println("Error registering device: " + String(httpResponseCode));
  }

  http.end();
}

void enrollFingerprint(int studentId, String fingerprintTemplate) {
  HTTPClient http;
  http.begin(String(api_url) + "/api/fingerprint/enroll");
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
    Serial.println("Fingerprint enrolled: " + response);
  } else {
    Serial.println("Error enrolling fingerprint: " + String(httpResponseCode));
  }

  http.end();
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
    Serial.println("Fingerprint verification: " + response);

    // Parse response to get student info
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);

    if (responseDoc["success"]) {
      String studentName = responseDoc["student"]["fullName"];
      Serial.println("Student: " + studentName);
    }
  } else {
    Serial.println("Error verifying fingerprint: " + String(httpResponseCode));
  }

  http.end();
}

void loop() {
  // Your fingerprint sensor logic here
  // When fingerprint is detected, call verifyFingerprint()
  delay(1000);
}
```

## Testing

Run the test suite:

```bash
# Test normal operations
node test-fp-api.js

# Test error handling
node test-fp-api.js --errors
```

## Database Schema

The API creates two additional tables:

### fingerprint_log

- `LogID` - Primary key
- `StudentID` - Foreign key to studentrecord
- `ESP32DeviceID` - Device identifier
- `Action` - enroll, verify, delete
- `Status` - success, failed, error
- `Timestamp` - When the action occurred
- `ErrorMessage` - Error details if failed
- `DeviceIP` - IP address of the device

### esp32_devices

- `DeviceID` - Primary key, device identifier
- `DeviceName` - Human-readable device name
- `Location` - Physical location
- `Status` - active, inactive, maintenance
- `LastSeen` - Last communication timestamp
- `CreatedAt` - When device was registered
- `UpdatedAt` - Last update timestamp

## Security Features

- API key authentication
- Rate limiting (1000 requests per 15 minutes by default)
- Input validation and sanitization
- SQL injection protection
- CORS configuration
- Helmet security headers
- Request logging and monitoring

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

Common HTTP status codes:

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid API key)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

## Monitoring and Logging

- All fingerprint operations are logged with timestamps
- Device status tracking
- Error logging with detailed messages
- Admin endpoint for log retrieval
- Health check endpoint for monitoring

## Troubleshooting

### Common Issues

1. **Database Connection Failed**

   - Check database credentials in `.env`
   - Ensure MySQL server is running
   - Verify database exists

2. **Invalid API Key**

   - Check `ESP32_API_KEY` in `.env`
   - Ensure ESP32 sends correct `X-API-Key` header

3. **Device ID Required**

   - ESP32 must send `X-Device-ID` header
   - Device ID must be 3-50 characters, alphanumeric

4. **Fingerprint Template Too Large**
   - Check `FP_TEMPLATE_SIZE_LIMIT` in `.env`
   - Default limit is 1024 bytes

### Debug Mode

Set `NODE_ENV=development` in `.env` for detailed error messages.

## License

MIT License

