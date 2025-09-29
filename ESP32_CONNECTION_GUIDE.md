# ESP32 Fingerprint System Connection Guide

## Overview
This guide explains how to connect your ESP32 fingerprint scanner to the new ATM (Attendance Management System) backend. The ESP32 will communicate with the Node.js API to record attendance when students scan their fingerprints.

## System Architecture
```
ESP32 (Hardware) → WiFi → Node.js API (Port 3000) → MySQL Database (Port 3307)
```

## Prerequisites
1. **ESP32 Hardware Setup:**
   - ESP32 Dev Module
   - Adafruit Fingerprint Sensor (connected to GPIO 16/17)
   - OLED Display NFP1315-61AY (connected to GPIO 21/22)
   - Active Buzzer (connected to GPIO 25)
   - Two buttons (connected to GPIO 32/33)

2. **Software Requirements:**
   - Arduino IDE with ESP32 core installed
   - Required libraries:
     - `WiFi` (built-in)
     - `HTTPClient` (built-in)
     - `Adafruit Fingerprint Sensor Library`
     - `U8g2` (for OLED display)
     - `Wire` (built-in)

3. **Network Setup:**
   - ESP32 and PC must be on the same WiFi network
   - PC IPv4 address: `192.168.100.83` (update in code if different)
   - WiFi credentials: `ASHBORN_2.4G` / `Ww2TWKy2`

## Step-by-Step Connection Process

### 1. Database Setup
The ATM system uses the same database as your current system:
- **Host:** 127.0.0.1
- **Port:** 3307
- **Database:** attendance
- **User:** root
- **Password:** (empty)

**Required Tables:**
- `studentrecord` - Contains student information and fingerprint templates
- `attendancelog` - Records attendance entries
- `fingerprint_log` - Tracks ESP32 interactions
- `esp32_devices` - Manages ESP32 device registration

### 2. Backend API Setup
The ATM backend runs on **port 3000** (not 5000 like the old system).

**API Endpoints:**
- `POST /api/fingerprint/verify-id` - Record attendance by StudentID
- `POST /api/fingerprint/enroll` - Enroll new fingerprint
- `DELETE /api/fingerprint/delete/:studentId` - Delete fingerprint
- `GET /api/fingerprint/health` - Health check

**Authentication:**
- API Key: `765a6c3504ca79e2cdbd9197fbe9f99d`
- Device ID: `ESP32-01` (unique identifier for your ESP32)

### 3. ESP32 Code Configuration

**Critical Settings to Update:**

```cpp
// WiFi Configuration
const char* ssid = "ASHBORN_2.4G";
const char* password = "Ww2TWKy2";

// API Configuration - UPDATE THESE VALUES
String apiUrl = "http://192.168.100.83:3000/api/fingerprint/verify-id"; // Port 3000, not 5001
const char* apiKey = "765a6c3504ca79e2cdbd9197fbe9f99d";
const char* deviceId = "ESP32-01";
```

**Hardware Pin Configuration:**
```cpp
// Fingerprint Sensor (UART2)
#define RXD2 16  // ESP32 RX
#define TXD2 17  // ESP32 TX

// OLED Display (I2C)
#define OLED_SDA 21
#define OLED_SCL 22

// Buttons
#define BTN_ENROLL 32
#define BTN_SCAN   33

// Buzzer
#define BUZZER_PIN 25
```

### 4. How the System Works

**Enrollment Process:**
1. Press Button 1 (GPIO 32) to enter enrollment mode
2. ESP32 displays "Enroll Mode" on OLED
3. Place finger on sensor
4. ESP32 prompts for StudentID via Serial Monitor
5. Enter StudentID (must exist in `studentrecord` table)
6. System stores fingerprint template in database
7. Buzzer confirms success (1 beep)

**Attendance Recording:**
1. Press Button 2 (GPIO 33) to enter scan mode
2. ESP32 displays "Scan Mode" on OLED
3. Place finger on sensor
4. ESP32 sends StudentID to API endpoint
5. API automatically creates/updates attendance record
6. Buzzer confirms success (2 beeps) or failure (1 long beep)

**Database Integration:**
- Fingerprint templates stored in `studentrecord.FingerprintTemplate` (BLOB)
- Attendance records created in `attendancelog` table
- All interactions logged in `fingerprint_log` table
- Device status tracked in `esp32_devices` table

### 5. Testing the Connection

**Step 1: Start the ATM Backend**
```bash
cd C:\ATM\backend
npm start
```
Backend should start on port 3000.

**Step 2: Test API Health**
```bash
curl -X GET "http://localhost:3000/api/fingerprint/health" \
  -H "X-API-Key: 765a6c3504ca79e2cdbd9197fbe9f99d" \
  -H "X-Device-ID: ESP32-01"
```

**Step 3: Upload ESP32 Code**
1. Open Arduino IDE
2. Select "ESP32 Dev Module" board
3. Install required libraries
4. Update WiFi credentials and API URL in code
5. Upload to ESP32

**Step 4: Verify Connection**
1. Open Serial Monitor (115200 baud)
2. ESP32 should connect to WiFi
3. Test health check endpoint
4. Try enrolling a fingerprint
5. Test attendance scanning

### 6. Troubleshooting

**Common Issues:**

1. **"Connection Refused" Error:**
   - Verify backend is running on port 3000
   - Check Windows Firewall settings
   - Ensure correct IP address in ESP32 code

2. **"HTTP -1" Error:**
   - Check WiFi connection
   - Verify API URL is correct
   - Ensure backend is accessible from ESP32's network

3. **OLED Not Displaying:**
   - Check I2C connections (SDA=21, SCL=22)
   - Verify OLED address (0x3C or 0x3D)
   - Install U8g2 library

4. **Fingerprint Sensor Not Working:**
   - Check UART connections (RX=16, TX=17)
   - Install Adafruit Fingerprint library
   - Verify sensor power supply

5. **Database Errors:**
   - Ensure MySQL is running on port 3307
   - Check database credentials
   - Verify required tables exist

### 7. Migration from Old System

**Key Differences:**
- **Port Change:** Old system used port 5001, new system uses port 3000
- **API Structure:** Same endpoints but integrated into ATM backend
- **Database:** Same database, additional tables for device management
- **Authentication:** Same API key system

**Migration Steps:**
1. Stop old fp-api server (port 5001)
2. Start new ATM backend (port 3000)
3. Update ESP32 code with new port
4. Test all functionality
5. Remove old fp-api folder if everything works

### 8. Security Considerations

- API key is hardcoded in ESP32 (consider device-specific keys)
- All communication is HTTP (consider HTTPS for production)
- Device ID should be unique per ESP32
- Regular backup of fingerprint templates recommended

## Success Indicators

✅ **ESP32 connects to WiFi**
✅ **Health check returns success**
✅ **OLED displays status messages**
✅ **Buzzer provides audio feedback**
✅ **Fingerprint enrollment works**
✅ **Attendance recording creates database entries**
✅ **Admin panel shows attendance records**

## Support

If you encounter issues:
1. Check Serial Monitor for ESP32 debug messages
2. Verify backend logs for API errors
3. Test database connectivity
4. Ensure all hardware connections are secure
5. Verify network connectivity between ESP32 and PC

The system is designed to be robust and provide clear feedback at each step. The OLED display and buzzer will guide you through the enrollment and scanning process.
