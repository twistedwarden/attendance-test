# Quick Start Guide - Fingerprint API for ESP32

This guide will help you quickly set up and test the Fingerprint API for ESP32 integration.

## Prerequisites

- Node.js (v16 or higher)
- MySQL database
- ESP32 development board
- Fingerprint sensor (AS608, R307, etc.)

## 1. Quick Setup

### Option A: Standalone API Server

```bash
# Navigate to fp-api directory
cd fp-api

# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Edit .env with your database credentials
# Set ESP32_API_KEY to a secure value

# Run database migrations
npm run migrate

# Start the server
npm start
```

### Option B: Integrated with Main Backend

The fingerprint API is already integrated into the main backend server. Just ensure your `.env` file in the backend directory includes:

```env
ESP32_API_KEY=your_secure_api_key_here
FP_TEMPLATE_SIZE_LIMIT=1024
```

## 2. Test the API

### Basic Test

```bash
cd fp-api
node test-fp-api.js
```

### Comprehensive Test

```bash
cd fp-api
node test-comprehensive.js
```

## 3. ESP32 Integration

### Update ESP32 Code

1. Update the API configuration in your ESP32 code:

   ```cpp
   const char* api_url = "http://YOUR_SERVER_IP:5000";  // Main backend port
   const char* api_key = "your_esp32_api_key_here";
   const char* device_id = "ESP32_001";
   ```

2. Use the example code from `examples/esp32_example.ino`

### API Endpoints for ESP32

| Endpoint                           | Method | Purpose               |
| ---------------------------------- | ------ | --------------------- |
| `/api/fingerprint/health`          | GET    | Check API status      |
| `/api/fingerprint/device/register` | POST   | Register ESP32 device |
| `/api/fingerprint/device/status`   | POST   | Update device status  |
| `/api/fingerprint/enroll`          | POST   | Enroll fingerprint    |
| `/api/fingerprint/verify`          | POST   | Verify fingerprint    |
| `/api/fingerprint/delete`          | DELETE | Delete fingerprint    |
| `/api/fingerprint/lookup`          | POST   | Lookup fingerprint    |

## 4. Required Headers

All ESP32 requests must include:

```
X-API-Key: your_esp32_api_key_here
X-Device-ID: ESP32_001
Content-Type: application/json
```

## 5. Example ESP32 Request

```cpp
// Register device
HTTPClient http;
http.begin("http://your_server:5000/api/fingerprint/device/register");
http.addHeader("Content-Type", "application/json");
http.addHeader("X-API-Key", "your_api_key");
http.addHeader("X-Device-ID", "ESP32_001");

String payload = "{\"deviceName\":\"ESP32 Device 1\",\"location\":\"Main Entrance\"}";
int responseCode = http.POST(payload);
```

## 6. Database Tables Created

The API automatically creates these tables:

- `fingerprint_log` - Logs all fingerprint operations
- `esp32_devices` - Manages ESP32 devices
- `fingerprint_template_backup` - Backs up fingerprint templates
- `esp32_attendance_events` - Tracks attendance events
- `esp32_device_alerts` - Device health alerts

## 7. Monitoring

### View Logs

```bash
curl http://localhost:5000/api/admin/logs
```

### Check Device Status

```bash
curl -H "X-API-Key: your_key" -H "X-Device-ID: ESP32_001" \
     http://localhost:5000/api/fingerprint/devices
```

## 8. Troubleshooting

### Common Issues

1. **"Invalid API Key"**

   - Check `ESP32_API_KEY` in `.env`
   - Ensure ESP32 sends correct header

2. **"Device ID Required"**

   - ESP32 must send `X-Device-ID` header
   - Device ID must be 3-50 characters

3. **Database Connection Failed**

   - Check database credentials in `.env`
   - Ensure MySQL server is running

4. **Fingerprint Not Found**
   - Ensure fingerprint is enrolled first
   - Check fingerprint template format

### Debug Mode

Set `NODE_ENV=development` in `.env` for detailed error messages.

## 9. Security Notes

- Use a strong, unique API key
- Consider using HTTPS in production
- Regularly monitor device logs
- Set up proper firewall rules

## 10. Production Deployment

1. Set `NODE_ENV=production`
2. Use HTTPS
3. Set up proper database backups
4. Configure monitoring and alerts
5. Use environment-specific API keys

## Support

For issues or questions:

1. Check the logs: `http://localhost:5000/api/admin/logs`
2. Run comprehensive tests: `node test-comprehensive.js`
3. Check database connection and tables
4. Verify ESP32 code and network connectivity
