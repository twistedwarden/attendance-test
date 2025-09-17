/*
 * ESP32 Dev Kit + AS608 Fingerprint API Integration Example
 * 
 * This example demonstrates how to integrate ESP32 Dev Kit with AS608 fingerprint
 * sensor and the Fingerprint API for attendance system. It includes device 
 * registration, fingerprint enrollment, and verification.
 * 
 * Required Libraries:
 * - WiFi (built-in)
 * - HTTPClient (built-in)
 * - ArduinoJson (install from Library Manager)
 * - Adafruit Fingerprint Sensor Library (install from Library Manager)
 * 
 * Hardware:
 * - ESP32 Dev Kit
 * - AS608 Fingerprint sensor
 * - Optional: OLED display for status
 * 
 * Wiring:
 * AS608 VCC -> ESP32 3.3V
 * AS608 GND -> ESP32 GND
 * AS608 TX -> ESP32 GPIO 16 (RX)
 * AS608 RX -> ESP32 GPIO 17 (TX)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_Fingerprint.h>
#include <SoftwareSerial.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// API Configuration
const char* api_url = "http://YOUR_SERVER_IP:5001";
const char* api_key = "765a6c3504ca79e2cdbd9197fbe9f99d";
const char* device_id = "ESP32_001";
const char* device_name = "ESP32 Device 1";
const char* device_location = "Main Entrance";

// Pin definitions for AS608 fingerprint sensor
#define FINGERPRINT_RX_PIN 16
#define FINGERPRINT_TX_PIN 17

// Status LED pins (ESP32 Dev Kit built-in LED is on GPIO 2)
#define LED_SUCCESS_PIN 2
#define LED_ERROR_PIN 4
#define BUZZER_PIN 5

// AS608 Fingerprint sensor object
SoftwareSerial mySerial(FINGERPRINT_RX_PIN, FINGERPRINT_TX_PIN);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Global variables
bool deviceRegistered = false;
unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 300000; // 5 minutes
bool enrollmentMode = false;
int enrollmentStep = 0;
int enrollmentId = 0;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LED_SUCCESS_PIN, OUTPUT);
  pinMode(LED_ERROR_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  // Turn off LEDs initially
  digitalWrite(LED_SUCCESS_PIN, LOW);
  digitalWrite(LED_ERROR_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);
  
  Serial.println("ESP32 Fingerprint API Integration");
  Serial.println("=================================");
  
  // Connect to WiFi
  connectToWiFi();
  
  // Register device with API
  registerDevice();
  
  // Initialize fingerprint sensor
  initializeFingerprintSensor();
  
  Serial.println("Setup complete. Ready for fingerprint operations.");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi disconnected. Reconnecting...");
    connectToWiFi();
    return;
  }
  
  // Send heartbeat
  if (millis() - lastHeartbeat > HEARTBEAT_INTERVAL) {
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

void registerDevice() {
  if (deviceRegistered) return;
  
  HTTPClient http;
  http.begin(String(api_url) + "/api/fingerprint/device/register");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", api_key);
  http.addHeader("X-Device-ID", device_id);
  
  DynamicJsonDocument doc(1024);
  doc["deviceName"] = device_name;
  doc["location"] = device_location;
  
  String payload;
  serializeJson(doc, payload);
  
  Serial.println("Registering device...");
  int httpResponseCode = http.POST(payload);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("Device registration response: " + response);
    
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      deviceRegistered = true;
      Serial.println("✅ Device registered successfully!");
      blinkLED(LED_SUCCESS_PIN, 3);
    } else {
      Serial.println("❌ Device registration failed: " + String(responseDoc["message"]));
      blinkLED(LED_ERROR_PIN, 3);
    }
  } else {
    Serial.println("❌ HTTP Error: " + String(httpResponseCode));
    blinkLED(LED_ERROR_PIN, 3);
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
    String response = http.getString();
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      Serial.println("💓 Heartbeat sent successfully");
    }
  } else {
    Serial.println("❌ Heartbeat failed: " + String(httpResponseCode));
  }
  
  http.end();
}

void initializeFingerprintSensor() {
  Serial.println("Initializing AS608 fingerprint sensor...");
  
  // Set the data rate for the sensor serial port
  finger.begin(57600);
  
  if (finger.verifyPassword()) {
    Serial.println("✅ Found AS608 fingerprint sensor!");
  } else {
    Serial.println("❌ Did not find AS608 fingerprint sensor :(");
    Serial.println("Check wiring and power supply");
    while (1) { delay(1); }
  }
  
  // Get sensor parameters
  finger.getParameters();
  Serial.print("Status: 0x"); Serial.println(finger.status_reg, HEX);
  Serial.print("Sys ID: 0x"); Serial.println(finger.system_id, HEX);
  Serial.print("Capacity: "); Serial.println(finger.capacity);
  Serial.print("Security level: "); Serial.println(finger.security_level);
  Serial.print("Device address: "); Serial.println(finger.device_addr, HEX);
  Serial.print("Packet len: "); Serial.println(finger.packet_len);
  Serial.print("Baud rate: "); Serial.println(finger.baud_rate);
  
  Serial.println("AS608 fingerprint sensor initialized successfully!");
}

void checkFingerprint() {
  if (enrollmentMode) {
    handleEnrollment();
    return;
  }
  
  // Get fingerprint image
  uint8_t p = finger.getImage();
  switch (p) {
    case FINGERPRINT_OK:
      Serial.println("Image taken");
      break;
    case FINGERPRINT_NOFINGER:
      return; // No finger detected, continue checking
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("Communication error");
      return;
    case FINGERPRINT_IMAGEFAIL:
      Serial.println("Imaging error");
      return;
    default:
      Serial.println("Unknown error");
      return;
  }

  // Convert image to template
  p = finger.image2Tz();
  switch (p) {
    case FINGERPRINT_OK:
      Serial.println("Image converted");
      break;
    case FINGERPRINT_IMAGEMESS:
      Serial.println("Image too messy");
      return;
    case FINGERPRINT_PACKETRECIEVEERR:
      Serial.println("Communication error");
      return;
    case FINGERPRINT_FEATUREFAIL:
      Serial.println("Could not find fingerprint features");
      return;
    case FINGERPRINT_INVALIDIMAGE:
      Serial.println("Could not find fingerprint features");
      return;
    default:
      Serial.println("Unknown error");
      return;
  }

  // Search for fingerprint in database
  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    Serial.println("Found a print match!");
    Serial.print("Found ID #"); Serial.print(finger.fingerID);
    Serial.print(" with confidence of "); Serial.println(finger.confidence);
    
    // Get fingerprint template and send to API
    String fingerprintTemplate = getFingerprintTemplate(finger.fingerID);
    verifyFingerprint(fingerprintTemplate);
  } else if (p == FINGERPRINT_PACKETRECIEVEERR) {
    Serial.println("Communication error");
  } else if (p == FINGERPRINT_NOTFOUND) {
    Serial.println("Did not find a match");
    blinkLED(LED_ERROR_PIN, 2);
  } else {
    Serial.println("Unknown error");
  }
}

String getFingerprintTemplate(int fingerId) {
  // Get fingerprint template from AS608 sensor
  uint8_t p = finger.loadModel(fingerId);
  if (p != FINGERPRINT_OK) {
    Serial.println("Failed to load fingerprint template");
    return "";
  }
  
  // Get template data
  p = finger.getModel();
  if (p != FINGERPRINT_OK) {
    Serial.println("Failed to get fingerprint template");
    return "";
  }
  
  // Convert template to base64 string
  String template = "";
  for (int i = 0; i < 256; i++) {
    template += String(finger.templateBuffer[i], HEX);
  }
  
  return template;
}

void verifyFingerprint(String fingerprintTemplate) {
  Serial.println("🔍 Verifying fingerprint...");
  
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
    Serial.println("Verification response: " + response);
    
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      String studentName = responseDoc["student"]["fullName"];
      int studentId = responseDoc["student"]["studentId"];
      
      Serial.println("✅ Access granted!");
      Serial.println("Student: " + studentName);
      Serial.println("ID: " + String(studentId));
      
      // Visual and audio feedback
      blinkLED(LED_SUCCESS_PIN, 5);
      beep(BUZZER_PIN, 200);
      
      // You can add attendance logging here
      logAttendance(studentId, studentName);
      
    } else {
      Serial.println("❌ Access denied - Fingerprint not recognized");
      blinkLED(LED_ERROR_PIN, 3);
      beep(BUZZER_PIN, 1000); // Longer beep for error
    }
  } else {
    Serial.println("❌ Verification failed: " + String(httpResponseCode));
    blinkLED(LED_ERROR_PIN, 3);
  }
  
  http.end();
}

void enrollFingerprint(int studentId) {
  Serial.println("📝 Enrolling fingerprint for student ID: " + String(studentId));
  
  // Step 1: Get first fingerprint image
  Serial.println("Place finger on sensor for first scan...");
  while (finger.getImage() != FINGERPRINT_OK) {
    delay(100);
  }
  Serial.println("First image taken");
  
  // Convert first image to template
  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    Serial.println("Failed to convert first image");
    return;
  }
  Serial.println("First image converted");
  
  // Step 2: Get second fingerprint image
  Serial.println("Remove finger and place it again for second scan...");
  delay(2000);
  while (finger.getImage() != FINGERPRINT_OK) {
    delay(100);
  }
  Serial.println("Second image taken");
  
  // Convert second image to template
  if (finger.image2Tz(2) != FINGERPRINT_OK) {
    Serial.println("Failed to convert second image");
    return;
  }
  Serial.println("Second image converted");
  
  // Create model from both templates
  if (finger.createModel() != FINGERPRINT_OK) {
    Serial.println("Failed to create model from templates");
    return;
  }
  Serial.println("Model created");
  
  // Store model in sensor
  if (finger.storeModel(studentId) != FINGERPRINT_OK) {
    Serial.println("Failed to store model in sensor");
    return;
  }
  Serial.println("Model stored in sensor");
  
  // Get template and send to API
  String fingerprintTemplate = getFingerprintTemplate(studentId);
  if (fingerprintTemplate.length() > 0) {
    sendFingerprintToAPI(studentId, fingerprintTemplate);
  }
}

void sendFingerprintToAPI(int studentId, String fingerprintTemplate) {
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
    Serial.println("Enrollment response: " + response);
    
    DynamicJsonDocument responseDoc(1024);
    deserializeJson(responseDoc, response);
    
    if (responseDoc["success"]) {
      Serial.println("✅ Fingerprint enrolled successfully!");
      blinkLED(LED_SUCCESS_PIN, 3);
    } else {
      Serial.println("❌ Enrollment failed: " + String(responseDoc["message"]));
      blinkLED(LED_ERROR_PIN, 3);
    }
  } else {
    Serial.println("❌ Enrollment failed: " + String(httpResponseCode));
    blinkLED(LED_ERROR_PIN, 3);
  }
  
  http.end();
}

void logAttendance(int studentId, String studentName) {
  // This function can be extended to log attendance
  // You might want to send this data to the main attendance system
  
  Serial.println("📊 Logging attendance for: " + studentName);
  Serial.println("Student ID: " + String(studentId));
  Serial.println("Time: " + String(millis()));
  
  // Add your attendance logging logic here
  // This could involve sending data to another API endpoint
  // or storing it locally for later sync
}

void blinkLED(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(100);
    digitalWrite(pin, LOW);
    delay(100);
  }
}

void beep(int pin, int duration) {
  digitalWrite(pin, HIGH);
  delay(duration);
  digitalWrite(pin, LOW);
}

// Utility function to convert string to base64 (simplified)
String stringToBase64(String input) {
  // This is a simplified base64 conversion
  // For production use, implement proper base64 encoding
  return input; // Placeholder
}

// Function to handle enrollment mode
void enterEnrollmentMode() {
  Serial.println("📝 Entering enrollment mode...");
  Serial.println("Enter student ID (1-127):");
  
  enrollmentMode = true;
  enrollmentStep = 0;
  
  // Wait for student ID input via Serial
  while (Serial.available() == 0) {
    delay(100);
  }
  
  enrollmentId = Serial.parseInt();
  Serial.println("Student ID: " + String(enrollmentId));
  
  if (enrollmentId < 1 || enrollmentId > 127) {
    Serial.println("Invalid student ID. Must be between 1-127");
    enrollmentMode = false;
    return;
  }
  
  // Check if ID already exists
  if (finger.loadModel(enrollmentId) == FINGERPRINT_OK) {
    Serial.println("Student ID already exists. Delete first or use different ID.");
    enrollmentMode = false;
    return;
  }
  
  Serial.println("Starting enrollment process...");
  enrollFingerprint(enrollmentId);
  enrollmentMode = false;
}

// Function to handle admin functions
void enterAdminMode() {
  Serial.println("⚙️ Entering admin mode...");
  Serial.println("Available commands:");
  Serial.println("1. Delete fingerprint");
  Serial.println("2. List enrolled fingerprints");
  Serial.println("3. Device status");
  Serial.println("4. Test connectivity");
  Serial.println("5. Clear all fingerprints");
  
  while (Serial.available() == 0) {
    delay(100);
  }
  
  int command = Serial.parseInt();
  
  switch (command) {
    case 1:
      deleteFingerprint();
      break;
    case 2:
      listFingerprints();
      break;
    case 3:
      showDeviceStatus();
      break;
    case 4:
      testConnectivity();
      break;
    case 5:
      clearAllFingerprints();
      break;
    default:
      Serial.println("Invalid command");
  }
}

void deleteFingerprint() {
  Serial.println("Enter fingerprint ID to delete (1-127):");
  while (Serial.available() == 0) {
    delay(100);
  }
  
  int id = Serial.parseInt();
  if (finger.deleteModel(id) == FINGERPRINT_OK) {
    Serial.println("✅ Fingerprint deleted successfully");
    blinkLED(LED_SUCCESS_PIN, 2);
  } else {
    Serial.println("❌ Failed to delete fingerprint");
    blinkLED(LED_ERROR_PIN, 2);
  }
}

void listFingerprints() {
  Serial.println("Enrolled fingerprints:");
  for (int i = 1; i <= 127; i++) {
    if (finger.loadModel(i) == FINGERPRINT_OK) {
      Serial.println("ID: " + String(i));
    }
  }
}

void showDeviceStatus() {
  Serial.println("=== Device Status ===");
  Serial.println("WiFi: " + String(WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected"));
  Serial.println("IP: " + WiFi.localIP().toString());
  Serial.println("Device Registered: " + String(deviceRegistered ? "Yes" : "No"));
  Serial.println("Sensor: AS608");
  Serial.println("Capacity: " + String(finger.capacity));
}

void testConnectivity() {
  Serial.println("Testing API connectivity...");
  sendHeartbeat();
}

void clearAllFingerprints() {
  Serial.println("⚠️ This will delete ALL fingerprints. Type 'YES' to confirm:");
  while (Serial.available() == 0) {
    delay(100);
  }
  
  String confirmation = Serial.readString();
  confirmation.trim();
  
  if (confirmation == "YES") {
    if (finger.emptyDatabase() == FINGERPRINT_OK) {
      Serial.println("✅ All fingerprints cleared");
      blinkLED(LED_SUCCESS_PIN, 5);
    } else {
      Serial.println("❌ Failed to clear fingerprints");
      blinkLED(LED_ERROR_PIN, 3);
    }
  } else {
    Serial.println("Operation cancelled");
  }
}

void handleEnrollment() {
  // This function is called during enrollment mode
  // The actual enrollment is handled in enterEnrollmentMode()
  // This is just a placeholder for future enhancements
}

