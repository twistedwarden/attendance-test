#include <WiFi.h>
#include <WiFiMulti.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Adafruit_Fingerprint.h>
#include <Wire.h>
#include <U8g2lib.h>

const char* ssid = "ZTE_2.4G_fuPrrr";
const char* password = "DREAMERS";
// Optional additional networks (leave empty if unused)
const char* ssid2 = "ASHBORN_2.4G";      const char* pass2 = "Ww2TWKy2";
const char* ssid3 = "TestWifi";      const char* pass3 = "12345678";
const char* ssid4 = "FOOTHILLS";      const char* pass4 = "FCSQC123";
const char* ssid5 = "RANDOM";      const char* pass5 = "RANDOM123";

// Fingerprint API (Node) endpoint base (Railway public URL over HTTPS)
String apiUrl = "https://attendance-test-production.up.railway.app/api/fingerprint/verify-id"; // Fingerprint verification endpoint
String healthUrl = "https://attendance-test-production.up.railway.app/api/fingerprint/health"; // Health check endpoint
String controlApiUrl = "https://attendance-test-production.up.railway.app/api/esp32/devices/ESP32-01"; // ESP32 control API
// API auth headers (match ATM backend .env)
const char* apiKey = "765a6c3504ca79e2cdbd9197fbe9f99d"; // set your real key
const char* deviceId = "ESP32-01"; // unique device identifier

// HTTPS client (quick-start: no certificate pinning)
WiFiClientSecure secureClient;

// ESP32 Control variables
bool controlMode = false;
unsigned long lastControlCheck = 0;
const unsigned long controlCheckInterval = 5000; // Check for commands every 5 seconds
String lastCommand = "";

// Enrollment variables
bool enrollmentMode = false;
int enrollmentStudentId = 0;
unsigned long enrollmentStartTime = 0;
const unsigned long enrollmentTimeout = 30000; // 30 seconds timeout for enrollment

#define RXD2 16  // ESP32 RX
#define TXD2 17  // ESP32 TX

HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
WiFiMulti wifiMulti;

// OLED 128x64 (I2C, address 0x3C)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_SDA 21
#define OLED_SCL 22
// NFP1315-61AY is typically SSD1306 compatible
U8G2_SSD1306_128X64_NONAME_F_HW_I2C u8g2_ssd(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* scl=*/ OLED_SCL, /* sda=*/ OLED_SDA);
U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2_sh(U8G2_R0, /* reset=*/ U8X8_PIN_NONE, /* scl=*/ OLED_SCL, /* sda=*/ OLED_SDA);
bool displayReady = false;
uint8_t displayDriver = 0; // 1=SSD1306, 2=SH1106
unsigned long lastOledActivityMs = 0;
bool idleScreenShown = false; // legacy flag (kept for compatibility)
unsigned long lastIdleAnimMs = 0; // last time the idle animation ran
uint8_t idlePhase = 0; // 0 = INDEX typing, 1 = fingerprint icon

// Buttons for actions (use GPIOs that are safe at boot)
#define BTN_ENROLL 32
#define BTN_SCAN   33
unsigned long lastBtnMillis = 0;
const unsigned long debounceMs = 200;

// Buzzer (active buzzer recommended). Wire BUZZER_PIN to buzzer +, buzzer - to GND
#define BUZZER_PIN 25
void buzzTone(int frequencyHz, int durationMs) {
tone(BUZZER_PIN, frequencyHz, durationMs);
delay(durationMs);
noTone(BUZZER_PIN);
}

void beep_short() { buzzTone(2600, 80); }
void beep_long()  { buzzTone(1500, 500); }
void beep_once()  { buzzTone(2200, 180); }
void beep_double() { buzzTone(2200, 150); delay(100); buzzTone(2200, 150); }

void oledPrint(const String &line1, const String &line2 = "", const String &line3 = "") {
if (!displayReady) return; // Guard against calls before begin()
lastOledActivityMs = millis();
idleScreenShown = false;
lastIdleAnimMs = lastOledActivityMs; // push out the next idle animation
idlePhase = 0; // reset cycle when UI updates
if (displayDriver == 1) {
u8g2_ssd.clearBuffer();
// Use larger font for better visibility
if (line1.length() <= 10) {
  u8g2_ssd.setFont(u8g2_font_10x20_tf); // Larger font for short text
  u8g2_ssd.drawStr(0, 20, line1.c_str());
  if (line2.length()) {
    u8g2_ssd.setFont(u8g2_font_8x13_tf); // Medium font for second line
    u8g2_ssd.drawStr(0, 40, line2.c_str());
  }
  if (line3.length()) {
    u8g2_ssd.setFont(u8g2_font_6x10_tf); // Smaller font for third line
    u8g2_ssd.drawStr(0, 55, line3.c_str());
  }
} else {
  u8g2_ssd.setFont(u8g2_font_8x13_tf); // Medium font for longer text
  u8g2_ssd.drawStr(0, 15, line1.c_str());
  if (line2.length()) u8g2_ssd.drawStr(0, 30, line2.c_str());
  if (line3.length()) u8g2_ssd.drawStr(0, 45, line3.c_str());
}

u8g2_ssd.sendBuffer();
} else if (displayDriver == 2) {
u8g2_sh.clearBuffer();
// Use larger font for better visibility
if (line1.length() <= 10) {
  u8g2_sh.setFont(u8g2_font_10x20_tf); // Larger font for short text
  u8g2_sh.drawStr(0, 20, line1.c_str());
  if (line2.length()) {
    u8g2_sh.setFont(u8g2_font_8x13_tf); // Medium font for second line
    u8g2_sh.drawStr(0, 40, line2.c_str());
  }
  if (line3.length()) {
    u8g2_sh.setFont(u8g2_font_6x10_tf); // Smaller font for third line
    u8g2_sh.drawStr(0, 55, line3.c_str());
  }
} else {
  u8g2_sh.setFont(u8g2_font_8x13_tf); // Medium font for longer text
  u8g2_sh.drawStr(0, 15, line1.c_str());
  if (line2.length()) u8g2_sh.drawStr(0, 30, line2.c_str());
  if (line3.length()) u8g2_sh.drawStr(0, 45, line3.c_str());
}
u8g2_sh.sendBuffer();
}
}

// Simple loading animation: shows baseText with 1..3 dots repeatedly
void oledLoading(const String &title, const String &baseText, int cycles = 6, int stepMs = 250) {
if (!displayReady) return;
for (int i = 0; i < cycles; i++) {
    int dots = 1 + (i % 3);
    String line2 = baseText;
    for (int d = 0; d < dots; d++) line2 += ".";
    oledPrint(title, line2, "");
    delay(stepMs);
}
}

// Draw centered "INDEX" with typewriter animation
void drawIdleFingerprint() {
  if (!displayReady) return;
  const char* text = "INDEX";
  const int steps = 5; // number of letters
  const int frameMs = 120; // typing speed
  if (displayDriver == 1) {
    u8g2_ssd.setFont(u8g2_font_logisoso32_tf);
    int fullW = u8g2_ssd.getStrWidth(text);
    int x = (SCREEN_WIDTH - fullW) / 2;
    int y = 46; // moved slightly down for 32px font
    for (int i = 1; i <= steps; i++) {
      u8g2_ssd.clearBuffer();
      String part = String(text).substring(0, i);
      u8g2_ssd.drawStr(x, y, part.c_str());
      u8g2_ssd.sendBuffer();
      delay(frameMs);
    }
  } else if (displayDriver == 2) {
    u8g2_sh.setFont(u8g2_font_logisoso32_tf);
    int fullW = u8g2_sh.getStrWidth(text);
    int x = (SCREEN_WIDTH - fullW) / 2;
    int y = 46;
    for (int i = 1; i <= steps; i++) {
      u8g2_sh.clearBuffer();
      String part = String(text).substring(0, i);
      u8g2_sh.drawStr(x, y, part.c_str());
      u8g2_sh.sendBuffer();
      delay(frameMs);
    }
  }
}

// Draw a centered stylized fingerprint using concentric ellipses and masked gaps
static void drawFancyFingerprint(u8g2_uint_t cx, u8g2_uint_t cy, bool isSSD) {
  const uint8_t outerRx = 24;   // horizontal radius
  const uint8_t outerRy = 30;   // vertical radius
  const uint8_t step = 4;       // ridge spacing

  // Helper lambdas to draw with the correct device
  auto drawEllipse = [&](int rx, int ry) {
    if (isSSD) {
      u8g2_ssd.drawEllipse(cx, cy, rx, ry, U8G2_DRAW_ALL);
    } else {
      u8g2_sh.drawEllipse(cx, cy, rx, ry, U8G2_DRAW_ALL);
    }
  };
  auto drawHLine = [&](int x, int y, int w, uint8_t color) {
    if (isSSD) {
      u8g2_ssd.setDrawColor(color);
      u8g2_ssd.drawHLine(x, y, w);
      u8g2_ssd.setDrawColor(1);
    } else {
      u8g2_sh.setDrawColor(color);
      u8g2_sh.drawHLine(x, y, w);
      u8g2_sh.setDrawColor(1);
    }
  };
  auto drawBox = [&](int x, int y, int w, int h, uint8_t color) {
    if (isSSD) {
      u8g2_ssd.setDrawColor(color);
      u8g2_ssd.drawBox(x, y, w, h);
      u8g2_ssd.setDrawColor(1);
    } else {
      u8g2_sh.setDrawColor(color);
      u8g2_sh.drawBox(x, y, w, h);
      u8g2_sh.setDrawColor(1);
    }
  };

  // Concentric ellipses (ridges)
  for (int r = 0; r <= 6; r++) {
    drawEllipse(outerRx - r * step, outerRy - r * step);
  }

  // Mask bottom to shape an oval fingertip (flat-ish bottom)
  drawBox(cx - outerRx - 2, cy + 18, (outerRx + 2) * 2, 14, 0);

  // Core loop (triangle-like void) using masks to create swirl effect
  // Left gap
  drawBox(cx - 20, cy - 4, 10, 8, 0);
  // Right gap
  drawBox(cx + 10, cy - 2, 10, 8, 0);
  // Central slit
  drawHLine(cx - 8, cy, 16, 0);

  // Accent partial arcs (upper-left and lower-right) for realism
  if (isSSD) {
    u8g2_ssd.drawEllipse(cx, cy, 16, 22, U8G2_DRAW_UPPER_LEFT);
    u8g2_ssd.drawEllipse(cx, cy, 20, 26, U8G2_DRAW_LOWER_RIGHT);
  } else {
    u8g2_sh.drawEllipse(cx, cy, 16, 22, U8G2_DRAW_UPPER_LEFT);
    u8g2_sh.drawEllipse(cx, cy, 20, 26, U8G2_DRAW_LOWER_RIGHT);
  }
}

// Draw a centered fingerprint icon (no text)
void drawIdleIconOnly() {
  if (!displayReady) return;
  const int cx = SCREEN_WIDTH / 2;
  const int cy = SCREEN_HEIGHT / 2 + 2; // slight visual center adjustment
  if (displayDriver == 1) {
    const int outerRy = 30;
    const int topY = cy - outerRy;
    const int bottomY = cy + outerRy;
    const uint8_t frameMs = 25; // ~1.5s sweep
    for (int y = topY; y <= bottomY; y += 2) {
      u8g2_ssd.clearBuffer();
      drawFancyFingerprint(cx, cy, true);
      // scanning line
      u8g2_ssd.drawHLine(cx - 26, y, 52);
      u8g2_ssd.sendBuffer();
      delay(frameMs);
    }
  } else if (displayDriver == 2) {
    const int outerRy = 30;
    const int topY = cy - outerRy;
    const int bottomY = cy + outerRy;
    const uint8_t frameMs = 25;
    for (int y = topY; y <= bottomY; y += 2) {
      u8g2_sh.clearBuffer();
      drawFancyFingerprint(cx, cy, false);
      // scanning line
      u8g2_sh.drawHLine(cx - 26, y, 52);
      u8g2_sh.sendBuffer();
      delay(frameMs);
    }
  }
}

// ESP32 Control Functions
void checkForCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping command check");
    return;
  }
  
  Serial.println("=== CHECKING FOR COMMANDS ===");
  Serial.println("Command URL: " + controlApiUrl + "/command");
  Serial.println("API Key: " + String(apiKey));
  Serial.println("Device ID: " + String(deviceId));
  Serial.println("WiFi Status: " + String(WiFi.status()));
  Serial.println("Local IP: " + WiFi.localIP().toString());
  
  HTTPClient http;
  http.begin(secureClient, controlApiUrl + "/command");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  int httpCode = http.GET();
  Serial.println("HTTP Response Code: " + String(httpCode));
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("Command check response: " + response);
    
    // Parse JSON response
    if (response.indexOf("\"hasCommand\":true") > 0) {
      Serial.println("Command received!");
      // Extract command from JSON
      if (response.indexOf("\"command\"😕"restart\"") > 0) {
        Serial.println("Executing RESTART command");
        executeRestart();
      } else if (response.indexOf("\"command\"😕"reset\"") > 0) {
        Serial.println("Executing RESET command");
        executeReset();
      } else if (response.indexOf("\"command\"😕"test_connection\"") > 0) {
        Serial.println("Executing TEST_CONNECTION command");
        executeTestConnection();
      } else if (response.indexOf("\"command\"😕"clear_all\"") > 0) {
        Serial.println("Executing CLEAR_ALL command");
        executeClearAll();
      } else if (response.indexOf("\"command\"😕"enroll\"") > 0) {
        // Extract student ID from parameters
        int studentIdStart = response.indexOf("\"studentId\":") + 12;
        int studentIdEnd = response.indexOf(",", studentIdStart);
        if (studentIdEnd == -1) studentIdEnd = response.indexOf("}", studentIdStart);
        if (studentIdStart > 11 && studentIdEnd > studentIdStart) {
          String studentIdStr = response.substring(studentIdStart, studentIdEnd);
          int studentId = studentIdStr.toInt();
          Serial.println("Executing ENROLL command for student: " + String(studentId));
          executeEnroll(studentId);
        }
      } else if (response.indexOf("\"command\"😕"delete_fingerprint\"") > 0) {
        // Extract student ID from parameters
        int studentIdStart = response.indexOf("\"studentId\":") + 12;
        int studentIdEnd = response.indexOf(",", studentIdStart);
        if (studentIdEnd == -1) studentIdEnd = response.indexOf("}", studentIdStart);
        if (studentIdStart > 11 && studentIdEnd > studentIdStart) {
          String studentIdStr = response.substring(studentIdStart, studentIdEnd);
          int studentId = studentIdStr.toInt();
          Serial.println("Executing DELETE_FINGERPRINT command for student: " + String(studentId));
          executeDeleteFingerprint(studentId);
        }
      }
    } else {
      Serial.println("No commands pending");
    }
  } else if (httpCode == 404) {
    Serial.println("404 Error - Command endpoint not found");
    Serial.println("URL: " + controlApiUrl + "/command");
    Serial.println("Check if ESP32 routes are properly loaded in backend");
  } else if (httpCode == 401) {
    Serial.println("401 Error - Authentication failed");
    Serial.println("Check API key and device ID");
  } else if (httpCode == 500) {
    Serial.println("500 Error - Server internal error");
  } else {
    Serial.println("Failed to connect to backend server");
    Serial.println("Response: " + http.getString());
    Serial.println("Error details: " + http.errorToString(httpCode));
  }
  http.end();
}

void executeRestart() {
  Serial.println("Executing restart command...");
  oledPrint("Restarting", "Device...", "");
  beep_long();
  delay(2000);
  ESP.restart();
}

void executeReset() {
  Serial.println("Executing reset command...");
  oledPrint("Factory Reset", "Clearing all...", "");
  beep_long();
  
  // Clear all fingerprints from sensor
  finger.emptyDatabase();
  
  // Clear all fingerprints from database via API
  clearAllFingerprintsFromDatabase();
  
  oledPrint("Reset Complete", "All cleared", "");
  beep_once();
  delay(3000);
  oledPrint("INDEX", "Scan for Attendance");
}

void executeTestConnection() {
  Serial.println("Executing test connection...");
  oledPrint("Testing", "Connection...", "");
  
  if (testConnection()) {
    oledPrint("Connection", "OK", "");
    beep_once();
  } else {
    oledPrint("Connection", "Failed", "");
    beep_long();
  }
  delay(2000);
  oledPrint("INDEX", "Ready for", "Scanning");
}

void testAllEndpoints() {
  Serial.println("=== TESTING ALL ENDPOINTS ===");
  
  // Test health endpoint
  Serial.println("1. Testing health endpoint...");
  HTTPClient http;
  http.begin(secureClient, healthUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  int healthCode = http.GET();
  Serial.println("Health endpoint: " + String(healthCode));
  http.end();
  
  // Test verify-id endpoint
  Serial.println("2. Testing verify-id endpoint...");
  http.begin(secureClient, apiUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  String testPayload = "{\"studentId\":1}";
  int verifyCode = http.POST(testPayload);
  Serial.println("Verify-id endpoint: " + String(verifyCode));
  http.end();
  
  // Test command endpoint
  Serial.println("3. Testing command endpoint...");
  http.begin(secureClient, controlApiUrl + "/command");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  int commandCode = http.GET();
  Serial.println("Command endpoint: " + String(commandCode));
  http.end();
  
  Serial.println("=== ENDPOINT TEST COMPLETE ===");
}

void executeClearAll() {
  Serial.println("Executing clear all fingerprints...");
  oledPrint("Clearing All", "Fingerprints...", "");
  beep_long();
  
  // Clear all fingerprints from sensor
  finger.emptyDatabase();
  
  // Clear all fingerprints from database via API
  clearAllFingerprintsFromDatabase();
  
  oledPrint("All Cleared", "Complete", "");
  beep_once();
  delay(3000);
  oledPrint("INDEX", "Ready for", "Scanning");
}

void executeEnroll(int studentId) {
  Serial.println("Executing enrollment for student ID: " + String(studentId));
  oledPrint("Enrolling", "Student ID: " + String(studentId), "Place finger...");
  beep_double();
  
  enrollmentMode = true;
  enrollmentStudentId = studentId;
  enrollmentStartTime = millis();
  
  // Find next available ID automatically
  int targetId = findNextFreeId();
  if (targetId == 0) {
    Serial.println("No free slots available");
    oledPrint("Enroll Failed", "No Free Slots", "");
    beep_long();
    enrollmentMode = false;
    return;
  }
  
  Serial.println("Auto-enrolling to ID #" + String(targetId));
  oledPrint("Enroll ID: " + String(targetId), "Place finger", "");
  
  bool ok = getFingerprintEnroll(targetId);
  if (ok) {
    Serial.println("Enroll OK, ID: " + String(targetId));
    oledPrint("Enroll Success", "ID: " + String(targetId), "");
    beep_once();
    // Prompt user to lift finger while we finalize (animated)
    oledLoading("Remove finger", "Loading", 8, 200);
    
    // Send enrollment data to backend
    sendEnrollmentToBackend(studentId, targetId);
  } else {
    Serial.println("Enroll failed");
    oledPrint("Enroll Failed", "Try again", "");
    beep_long();
  }
  
  enrollmentMode = false;
  delay(2000);
  oledPrint("INDEX", "Ready for", "Scanning");
}

void executeDeleteFingerprint(int studentId) {
  Serial.println("Executing delete fingerprint for student ID: " + String(studentId));
  oledPrint("Deleting", "Student ID: " + String(studentId), "");
  beep_long();
  
  // Delete from sensor (we need to find the fingerprint ID first)
  int fingerprintId = findFingerprintIdByStudentId(studentId);
  if (fingerprintId > 0) {
    if (finger.deleteModel(fingerprintId) == FINGERPRINT_OK) {
      Serial.println("Deleted from sensor, ID: " + String(fingerprintId));
      oledPrint("Deleted from", "Sensor ID: " + String(fingerprintId), "");
    } else {
      Serial.println("Failed to delete from sensor");
      oledPrint("Sensor Delete", "Failed", "");
    }
  }
  
  // Delete from database via API
  deleteFingerprintFromDatabase(studentId);
  
  oledPrint("Delete Complete", "Student ID: " + String(studentId), "");
  beep_once();
  delay(2000);
  oledPrint("INDEX", "Ready for", "Scanning");
}

bool testConnection() {
  Serial.println("Testing connection to: " + healthUrl);
  Serial.println("API Key: " + String(apiKey));
  Serial.println("Device ID: " + String(deviceId));
  
  HTTPClient http;
  http.begin(secureClient, healthUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  int httpCode = http.GET();
  Serial.println("Connection test HTTP code: " + String(httpCode));
  
  if (httpCode == 200) {
    Serial.println("✅ Health check successful");
    String response = http.getString();
    Serial.println("Response: " + response);
  } else if (httpCode == 404) {
    Serial.println("⚠️ 404 Error - Health endpoint not found");
    Serial.println("Check if backend server is running and routes are loaded");
  } else if (httpCode == 401) {
    Serial.println("❌ 401 Error - Authentication failed");
    Serial.println("Check API key and device ID configuration");
  } else {
    Serial.println("❌ Connection test failed: " + http.errorToString(httpCode));
    Serial.println("Response: " + http.getString());
  }
  
  http.end();
  
  return (httpCode == 200 || httpCode == 404); // 404 is OK for health check
}

void clearAllFingerprintsFromDatabase() {
  HTTPClient http;
  http.begin(secureClient, controlApiUrl + "/clear-fingerprints");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  int httpCode = http.sendRequest("DELETE");
  Serial.println("Clear all response: " + String(httpCode));
  http.end();
}

void sendDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, skipping status update");
    return;
  }
  
  Serial.println("Sending device status to: " + controlApiUrl + "/status");
  
  HTTPClient http;
  http.begin(secureClient, controlApiUrl + "/status");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  String statusJson = "{";
  statusJson += "\"status\"😕"active\",";
  statusJson += "\"lastSeen\"😕"" + String(millis()) + "\",";
  statusJson += "\"uptime\":" + String(millis() / 1000) + ",";
  statusJson += "\"wifiSSID\"😕"" + WiFi.SSID() + "\",";
  statusJson += "\"fingerprintCount\":" + String(getFingerprintCount());
  statusJson += "}";
  
  Serial.println("Status JSON: " + statusJson);
  
  int httpCode = http.POST(statusJson);
  Serial.println("Status update response: " + String(httpCode));
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Status response: " + response);
  }
  
  http.end();
}

int getFingerprintCount() {
  // Get fingerprint count from sensor
  uint8_t p = finger.getTemplateCount();
  if (p == FINGERPRINT_OK) {
    return finger.templateCount;
  }
  return 0;
}

void sendEnrollmentToBackend(int studentId, int fingerprintId) {
  Serial.println("Sending enrollment to backend...");
  
  HTTPClient http;
  http.begin(secureClient, controlApiUrl + "/enroll");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  String enrollmentJson = "{";
  enrollmentJson += "\"studentId\":" + String(studentId) + ",";
  enrollmentJson += "\"fingerprintId\":" + String(fingerprintId) + ",";
  enrollmentJson += "\"deviceId\"😕"" + String(deviceId) + "\"";
  enrollmentJson += "}";
  
  Serial.println("Enrollment JSON: " + enrollmentJson);
  
  int httpCode = http.POST(enrollmentJson);
  Serial.println("Enrollment response: " + String(httpCode));
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Enrollment response: " + response);
  }
  
  http.end();
}

void deleteFingerprintFromDatabase(int studentId) {
  Serial.println("Deleting fingerprint from database for student: " + String(studentId));
  
  HTTPClient http;
  http.begin(secureClient, controlApiUrl + "/fingerprints/" + String(studentId));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  int httpCode = http.sendRequest("DELETE");
  Serial.println("Delete response: " + String(httpCode));
  
  if (httpCode > 0) {
    String response = http.getString();
    Serial.println("Delete response: " + response);
  }
  
  http.end();
}

int findFingerprintIdByStudentId(int studentId) {
  // This is a simplified implementation
  // In a real system, you'd maintain a mapping between student IDs and fingerprint IDs
  // For now, we'll try to find an available slot and assume it matches
  return studentId; // Simplified mapping
}

void setup() {
Serial.begin(115200);
mySerial.begin(57600, SERIAL_8N1, RXD2, TXD2);

// Init I2C and OLED FIRST so oledPrint can be used safely
Wire.begin(OLED_SDA, OLED_SCL); // adjust if your board uses different pins
Wire.setClock(100000); // standard 100kHz for stability
delay(50);

// Try initializing SSD1306 first (NFP1315-61AY is typically SSD1306 compatible)
if (u8g2_ssd.begin()) {
  displayReady = true;
  displayDriver = 1;
  u8g2_ssd.clearBuffer();
  u8g2_ssd.setFont(u8g2_font_8x13_tf);
  u8g2_ssd.drawStr(0, 15, "System OK");
  u8g2_ssd.drawStr(0, 30, "WiFi...");
  u8g2_ssd.sendBuffer();
} else if (u8g2_sh.begin()) {
  displayReady = true;
  displayDriver = 2;
  u8g2_sh.clearBuffer();
  u8g2_sh.setFont(u8g2_font_8x13_tf);
  u8g2_sh.drawStr(0, 15, "System OK");
  u8g2_sh.drawStr(0, 30, "WiFi...");
  u8g2_sh.sendBuffer();
} else {
  Serial.println("NFP1315-61AY OLED not detected");
  displayReady = false;
}

// Configure buttons (active LOW)
pinMode(BTN_ENROLL, INPUT_PULLUP);
pinMode(BTN_SCAN, INPUT_PULLUP);

// Buzzer setup
pinMode(BUZZER_PIN, OUTPUT);

// Register up to 5 networks (strongest/available will be used)
wifiMulti.addAP(ssid, password);
if (ssid2 && *ssid2) wifiMulti.addAP(ssid2, pass2);
if (ssid3 && *ssid3) wifiMulti.addAP(ssid3, pass3);
if (ssid4 && *ssid4) wifiMulti.addAP(ssid4, pass4);
if (ssid5 && *ssid5) wifiMulti.addAP(ssid5, pass5);

int timeout = 0;
while (wifiMulti.run() != WL_CONNECTED && timeout < 40) {
    delay(500);
    Serial.println("Connecting to WiFi (multi)...");
    timeout++;
}

if (WiFi.status() == WL_CONNECTED) {
    Serial.println("Connected to WiFi!");
    Serial.print("ESP32 IP: ");
    Serial.println(WiFi.localIP());
    oledPrint("WiFi OK", WiFi.localIP().toString());
    // Allow HTTPS without certificate pinning (quick start for Railway)
    secureClient.setInsecure();
    
    // Test all endpoints to diagnose 404 errors
    delay(2000);
    testAllEndpoints();
} else {
    Serial.println("Failed to connect. Check SSID/Password or try hotspot.");
    oledPrint("WiFi Failed", "Check Config");
}

finger.begin(57600);
if (finger.verifyPassword()) {
    Serial.println("Fingerprint sensor ready!");
    oledPrint("Sensor", "Ready");
} else {
    Serial.println("Fingerprint sensor not found 🙁");
    oledPrint("Sensor", "Not Found");
    while (1) { delay(1); }
}
oledPrint("INDEX", "System is Ready!");
}

void loop() {
// Check for remote commands every 5 seconds
if (millis() - lastControlCheck > controlCheckInterval) {
  lastControlCheck = millis();
  checkForCommands();
  sendDeviceStatus(); // Send status update to backend
}

// Check buttons (active LOW) with debounce
int btnEnroll = digitalRead(BTN_ENROLL);
int btnScan   = digitalRead(BTN_SCAN);
unsigned long nowMs = millis();
if (nowMs - lastBtnMillis > debounceMs) {
    if (btnEnroll == LOW) {
    lastBtnMillis = nowMs;
  oledPrint("Enroll", "Auto ID...");
  beep_double(); // entering enroll state
  enrollPromptForStudentId();
    } else if (btnScan == LOW) {
    lastBtnMillis = nowMs;
    oledPrint("Scan", "Place finger");
    beep_short(); // entering scan state
    scanFingerprint();
    }
}

// Check for serial commands
if (Serial.available()) {
    char command = Serial.read();
    switch (command) {
    case 'e':
        enrollPromptForStudentId();
        break;
    case 'd':
        deleteFingerprint();
        break;
    case 's':
        scanFingerprint();
        break;
    case 'h':
        printMenu();
        break;
    }
}

// Continuously check for fingerprint
int id = getFingerprintID();
if (id > 0) {
    Serial.println("User ID matched: " + String(id));
    oledPrint("Found", String("ID: ") + id, "Sending...");
    sendAttendance(id);   
    beep_double(); // correct finger
    delay(2000);          
} else if (id == -1) {
    // Don't print anything for no finger detected
    delay(100);  // Small delay to prevent too rapid scanning
    // Idle animation policy:
    // - After 5s of no UI updates, run the typewriter once
    // - Then repeat the animation every 5s until UI updates again
    if (displayReady) {
      unsigned long nowMs = millis();
      if (lastOledActivityMs == 0) {
        lastOledActivityMs = nowMs;
        lastIdleAnimMs = nowMs;
      }
      bool initialDelayElapsed = (nowMs - lastOledActivityMs) > 5000UL;
      bool repeatDelayElapsed = (nowMs - lastIdleAnimMs) > 5000UL;
      if (initialDelayElapsed && repeatDelayElapsed) {
        if (idlePhase == 0) {
          // Show INDEX typing first
          drawIdleFingerprint();
          idlePhase = 1;
        } else {
          // Then show icon only, then cycle back
          drawIdleIconOnly();
          idlePhase = 0;
        }
        lastIdleAnimMs = nowMs;
      }
    }
} else {
    switch (id) {
    case -2:
        Serial.println("Failed to get image");
        oledPrint("Error", "Get Image");
        break;
    case -3:
        Serial.println("Failed to convert image");
        oledPrint("Error", "Convert");
        break;
    case -4:
        Serial.println("No match found");
        oledPrint("No Match", "Try Again");
        beep_long(); // wrong finger
        break;
    default:
        Serial.println("Unknown error");
        oledPrint("Error", "Unknown");
        beep_long();
    }
    delay(1000);  // Delay after errors to prevent spam
}
}

void printMenu() {
Serial.println("\n=== Fingerprint Sensor Menu ===");
Serial.println("e - Enroll new fingerprint");
Serial.println("d - Delete fingerprint");
Serial.println("s - Scan fingerprint");
Serial.println("h - Show this menu");
Serial.println("==========================");
}

// Dynamic fingerprint mapping - gets student ID from backend
int getStudentIdFromFingerprintId(int fingerprintId) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi not connected, cannot fetch mapping");
    return 0;
  }
  
  Serial.println("Fetching student ID for fingerprint ID: " + String(fingerprintId));
  
  HTTPClient http;
  http.begin(secureClient, controlApiUrl + "/fingerprint-mapping/" + String(fingerprintId));
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", apiKey);
  http.addHeader("X-Device-ID", deviceId);
  
  int httpCode = http.GET();
  Serial.println("Mapping fetch HTTP code: " + String(httpCode));
  
  if (httpCode == 200) {
    String response = http.getString();
    Serial.println("Mapping response: " + response);
    
    // Parse JSON response to get student ID
    if (response.indexOf("\"success\":true") > 0) {
      int studentIdStart = response.indexOf("\"studentId\":") + 12;
      int studentIdEnd = response.indexOf(",", studentIdStart);
      if (studentIdEnd == -1) studentIdEnd = response.indexOf("}", studentIdStart);
      
      if (studentIdStart > 11 && studentIdEnd > studentIdStart) {
        String studentIdStr = response.substring(studentIdStart, studentIdEnd);
        int studentId = studentIdStr.toInt();
        Serial.println("Mapped fingerprint ID " + String(fingerprintId) + " to student ID " + String(studentId));
        http.end();
        return studentId;
      }
    }
  } else {
    Serial.println("Failed to fetch mapping: " + http.errorToString(httpCode));
  }
  
  http.end();
  Serial.println("No mapping found for fingerprint ID: " + String(fingerprintId));
  return 0; // Unknown fingerprint
}

void sendAttendance(int fingerId) {
if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi Disconnected");
    oledPrint("WiFi", "Disconnected");
    return;
}

// Map fingerprint ID to student ID
int studentId = getStudentIdFromFingerprintId(fingerId);
if (studentId == 0) {
  Serial.println("❌ Unknown fingerprint ID: " + String(fingerId));
  oledPrint("Unknown", "Fingerprint");
  beep_long();
  return;
}

Serial.println("=== SENDING ATTENDANCE ===");
Serial.println("Fingerprint ID: " + String(fingerId));
Serial.println("Mapped Student ID: " + String(studentId));
Serial.println("API URL: " + apiUrl);
Serial.println("WiFi Status: " + String(WiFi.status()));
Serial.println("Local IP: " + WiFi.localIP().toString());
Serial.println("RSSI: " + String(WiFi.RSSI()));

// Option A: simple verify by studentId (sensor slot == StudentID)
WiFiClient client;
HTTPClient http;
String url = apiUrl;
Serial.print("Posting to API: ");
Serial.println(url);
http.setConnectTimeout(5000);
http.setTimeout(7000);
http.setReuse(false);
if (!http.begin(secureClient, url)) {
Serial.println("http.begin failed (invalid URL or client)");
oledPrint("Network Error", "Begin Failed");
return;
}
http.addHeader("Content-Type", "application/json");
http.addHeader("X-API-Key", apiKey);
http.addHeader("X-Device-ID", deviceId);

// Send POST request with mapped student ID payload
String jsonPayload = "{\"studentId\":" + String(studentId) + "}";
Serial.println("Payload: " + jsonPayload);
int httpResponseCode = http.POST(jsonPayload);

Serial.print("HTTP ");
Serial.println(httpResponseCode);
if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Response: " + response);
    if (httpResponseCode == 200) {
      // Parse response to show student name
      if (response.indexOf("\"success\":true") > 0) {
        if (response.indexOf("\"action\"😕"timein\"") > 0) {
          oledPrint("Time In", "Recorded");
        } else if (response.indexOf("\"action\"😕"timeout\"") > 0) {
          oledPrint("Time Out", "Recorded");
        } else {
          oledPrint("Attendance", "Recorded");
        }
        beep_once();
      } else {
        oledPrint("Error", "Check Log");
        beep_long();
      }
    } else if (httpResponseCode == 404) {
      Serial.println("404 Error - Endpoint not found");
      Serial.println("URL: " + url);
      Serial.println("Check if backend server is running and accessible");
      oledPrint("404 Error", "Check Server");
      beep_long();
    } else if (httpResponseCode == 401) {
      Serial.println("401 Error - Authentication failed");
      Serial.println("Check API key and device ID");
      oledPrint("Auth Error", "Check Config");
      beep_long();
    } else if (httpResponseCode == 500) {
      Serial.println("500 Error - Server internal error");
      oledPrint("Server Error", "Try Again");
      beep_long();
    } else {
      Serial.println("HTTP Error: " + String(httpResponseCode));
      oledPrint("Error", String("Code: ") + httpResponseCode);
      beep_long();
    }
} else {
Serial.print("Error sending POST: ");
Serial.println(http.errorToString(httpResponseCode));
Serial.print("WiFi RSSI: "); Serial.println(WiFi.RSSI());
Serial.print("Local IP: "); Serial.println(WiFi.localIP());
// Quick connectivity probe to /health
HTTPClient probe;
if (probe.begin(secureClient, healthUrl)) {
  probe.addHeader("Content-Type", "application/json");
  probe.addHeader("X-API-Key", apiKey);
  probe.addHeader("X-Device-ID", deviceId);
  int hc = probe.GET();
  Serial.print("Health GET: "); Serial.println(hc);
  if (hc > 0) Serial.println(probe.getString());
  probe.end();
}
    oledPrint("Network Error", "POST Failed");
}
http.end();
}

void scanFingerprint() {
Serial.println("\nPlace finger on sensor...");
int id = getFingerprintID();
if (id > 0) {
    Serial.println("User ID matched: " + String(id));
    oledPrint("Found", String("ID: ") + id, "Sending...");
    sendAttendance(id);   
    delay(2000);          
} else {
    switch (id) {
    case -1:
        Serial.println("No finger detected");
        oledPrint("No Finger", "Place finger");
        break;
    case -2:
        Serial.println("Failed to get image");
        oledPrint("Error", "Get Image");
        break;
    case -3:
        Serial.println("Failed to convert image");
        oledPrint("Error", "Convert");
        break;
    case -4:
        Serial.println("No match found");
        oledPrint("No Match", "Try Again");
        break;
    default:
        Serial.println("Unknown error");
        oledPrint("Error", "Unknown");
    }
}
}

int getFingerprintID() {
uint8_t p = finger.getImage();
if (p != FINGERPRINT_OK) return -1;

p = finger.image2Tz();
if (p != FINGERPRINT_OK) return -2;

p = finger.fingerSearch();
if (p != FINGERPRINT_OK) return -3;

// Increase confidence threshold to reduce false matches
if (finger.confidence < 70) return -4;

return finger.fingerID;
}

void enrollFingerprint() {
Serial.println("\nReady to enroll a fingerprint!");
Serial.println("Please type in the ID # (1-127) you want to save this finger as...");

int id = 0;
while (id == 0) {
    while (!Serial.available());
    id = Serial.parseInt();
    if (id < 1 || id > 127) {
    Serial.println("ID must be between 1 and 127");
    id = 0;
    }
}

Serial.println("Enrolling ID #" + String(id));

while (!getFingerprintEnroll(id));
}

// Find next free template slot (1..127). Returns 0 if none available.
int findNextFreeId() {
for (int i = 1; i <= 127; i++) {
    uint8_t p = finger.loadModel(i);
    if (p != FINGERPRINT_OK) {
    return i;
    }
}
return 0;
}

// Automatic enrollment - finds next available ID and enrolls
void enrollPromptForStudentId() {
// Find next available ID automatically
int targetId = findNextFreeId();
if (targetId == 0) {
  Serial.println("No free slots available (all 127 slots used)");
  oledPrint("Enroll", "No Free Slots");
  beep_long();
  return;
}

Serial.println(String("Auto-enrolling to ID #") + targetId);
oledPrint("Enroll", String("ID: ") + targetId, "Place finger");

bool ok = getFingerprintEnroll(targetId);
if (ok) {
  Serial.println("Enroll OK, ID: " + String(targetId));
  oledPrint("Success", String("ID: ") + targetId);
  beep_once();
} else {
  Serial.println("Enroll failed");
  oledPrint("Enroll", "Failed");
  beep_long();
}
}

uint8_t getFingerprintEnroll(int id) {
int p = -1;
Serial.println("Waiting for valid finger to enroll as #" + String(id));
oledPrint("Enroll #" + String(id), "Center finger", "Clean & press");

// Get first image
while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
    case FINGERPRINT_OK:
    Serial.println("Image taken");
    break;
    case FINGERPRINT_NOFINGER:
    Serial.println(".");
    break;
    case FINGERPRINT_PACKETRECIEVEERR:
    Serial.println("Communication error");
    break;
    case FINGERPRINT_IMAGEFAIL:
    Serial.println("Imaging error");
    break;
    default:
    Serial.println("Unknown error");
    break;
    }
}

// Convert image to template
p = finger.image2Tz(1);
switch (p) {
    case FINGERPRINT_OK:
    Serial.println("Image converted");
    break;
    case FINGERPRINT_IMAGEMESS:
    Serial.println("Image too messy");
    return p;
    case FINGERPRINT_PACKETRECIEVEERR:
    Serial.println("Communication error");
    return p;
    case FINGERPRINT_FEATUREFAIL:
    Serial.println("Could not find fingerprint features");
    return p;
    case FINGERPRINT_INVALIDIMAGE:
    Serial.println("Could not find fingerprint features");
    return p;
    default:
    Serial.println("Unknown error");
    return p;
}

Serial.println("Remove finger");
oledPrint("Lift finger", "Preparing...", "");
delay(2000);
p = 0;
while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
}

// Get second image
Serial.println("Place same finger again");
oledPrint("Enroll #" + String(id), "Tilt slightly", "Left/Right");
p = -1;
while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    switch (p) {
    case FINGERPRINT_OK:
    Serial.println("Image taken");
    break;
    case FINGERPRINT_NOFINGER:
    Serial.print(".");
    break;
    case FINGERPRINT_PACKETRECIEVEERR:
    Serial.println("Communication error");
    break;
    case FINGERPRINT_IMAGEFAIL:
    Serial.println("Imaging error");
    break;
    default:
    Serial.println("Unknown error");
    break;
    }
}

// Convert second image to template
p = finger.image2Tz(2);
switch (p) {
    case FINGERPRINT_OK:
    Serial.println("Image converted");
    break;
    case FINGERPRINT_IMAGEMESS:
    Serial.println("Image too messy");
    return p;
    case FINGERPRINT_PACKETRECIEVEERR:
    Serial.println("Communication error");
    return p;
    case FINGERPRINT_FEATUREFAIL:
    Serial.println("Could not find fingerprint features");
    return p;
    case FINGERPRINT_INVALIDIMAGE:
    Serial.println("Could not find fingerprint features");
    return p;
    default:
    Serial.println("Unknown error");
    return p;
}

// Create model
Serial.println("Creating model...");
p = finger.createModel();
if (p == FINGERPRINT_OK) {
    Serial.println("Prints matched!");
} else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("Communication error");
    return p;
} else if (p == FINGERPRINT_ENROLLMISMATCH) {
    Serial.println("Fingerprints did not match");
    return p;
} else {
    Serial.println("Unknown error");
    return p;
}   

// Store model
p = finger.storeModel(id);
if (p == FINGERPRINT_OK) {
    Serial.println("Stored!");
    return true;
} else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("Communication error");
    return p;
} else if (p == FINGERPRINT_BADLOCATION) {
    Serial.println("Could not store in that location");
    return p;
} else if (p == FINGERPRINT_FLASHERR) {
    Serial.println("Error writing to flash");
    return p;
} else {
    Serial.println("Unknown error");
    return p;
}   
}

void deleteFingerprint() {
Serial.println("\nEnter ID to delete (1-127):");

while (!Serial.available());
int id = Serial.parseInt();

if (id < 1 || id > 127) {
    Serial.println("ID must be between 1 and 127");
    return;
}

Serial.print("Deleting ID #");
Serial.println(id);

uint8_t p = finger.deleteModel(id);
if (p == FINGERPRINT_OK) {
    Serial.println("Deleted!");
} else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("Communication error");
} else if (p == FINGERPRINT_BADLOCATION) {
    Serial.println("Could not delete from that location");
} else if (p == FINGERPRINT_FLASHERR) {
    Serial.println("Error writing to flash");
} else {
    Serial.print("Unknown error: 0x"); 
    Serial.println(p, HEX);
}
}