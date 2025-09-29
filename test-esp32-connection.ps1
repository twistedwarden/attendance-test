# ESP32 Connection Test Script
# This script tests all ESP32 endpoints to help debug connection issues

Write-Host "=== ESP32 CONNECTION TEST ===" -ForegroundColor Green
Write-Host ""

$apiKey = "765a6c3504ca79e2cdbd9197fbe9f99d"
$deviceId = "ESP32-01"
$baseUrl = "http://localhost:3000"

# Test 1: ESP32 Command Polling
Write-Host "1. Testing ESP32 Command Polling..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/esp32/devices/$deviceId/command" -Method GET -Headers @{"X-API-Key"=$apiKey; "X-Device-ID"=$deviceId}
    Write-Host "✅ Command Polling: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Command Polling Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: ESP32 Status Update
Write-Host "2. Testing ESP32 Status Update..." -ForegroundColor Yellow
try {
    $body = @{status="active"; uptime=3600; fingerprintCount=0} | ConvertTo-Json
    $response = Invoke-WebRequest -Uri "$baseUrl/api/esp32/devices/$deviceId/status" -Method POST -Body $body -ContentType "application/json" -Headers @{"X-API-Key"=$apiKey; "X-Device-ID"=$deviceId}
    Write-Host "✅ Status Update: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Status Update Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: ESP32 Connection Test (Health)
Write-Host "3. Testing ESP32 Connection Test..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/fingerprint/health" -Method GET -Headers @{"X-API-Key"=$apiKey; "X-Device-ID"=$deviceId}
    Write-Host "✅ Connection Test: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Connection Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: ESP32 Clear Fingerprints
Write-Host "4. Testing ESP32 Clear Fingerprints..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/esp32/devices/$deviceId/clear-fingerprints" -Method DELETE -Headers @{"X-API-Key"=$apiKey; "X-Device-ID"=$deviceId}
    Write-Host "✅ Clear Fingerprints: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Clear Fingerprints Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: ESP32 Device List
Write-Host "5. Testing ESP32 Device List..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/esp32/devices" -Method GET -Headers @{"X-API-Key"=$apiKey; "X-Device-ID"=$deviceId}
    Write-Host "✅ Device List: Status $($response.StatusCode)" -ForegroundColor Green
    Write-Host "   Response: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Device List Failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== TEST COMPLETE ===" -ForegroundColor Green
Write-Host "If all tests pass, your ESP32 should connect successfully!" -ForegroundColor Cyan
Write-Host "If any test fails, check the error message above." -ForegroundColor Yellow
