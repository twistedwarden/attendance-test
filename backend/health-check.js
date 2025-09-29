#!/usr/bin/env node

/**
 * Server Health Check Script
 * Monitors server health and restarts if needed
 */

import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:3000';
const HEALTH_ENDPOINT = '/api/fingerprint/health';
const CHECK_INTERVAL = 30000; // 30 seconds
const MAX_FAILURES = 3;

let failureCount = 0;
let isRunning = false;

async function checkServerHealth() {
  try {
    const response = await fetch(`${SERVER_URL}${HEALTH_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'X-API-Key': '765a6c3504ca79e2cdbd9197fbe9f99d',
        'X-Device-ID': 'ESP32-01'
      },
      timeout: 5000
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Server health check passed: ${data.message}`);
      failureCount = 0;
      isRunning = true;
    } else {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    failureCount++;
    console.log(`❌ Health check failed (${failureCount}/${MAX_FAILURES}): ${error.message}`);
    isRunning = false;

    if (failureCount >= MAX_FAILURES) {
      console.log('🚨 Server appears to be down. Consider restarting...');
      // You could add automatic restart logic here
    }
  }
}

function startHealthCheck() {
  console.log('🏥 Starting server health monitoring...');
  console.log(`📊 Checking server every ${CHECK_INTERVAL/1000} seconds`);
  console.log(`🎯 Server URL: ${SERVER_URL}${HEALTH_ENDPOINT}`);
  console.log('Press Ctrl+C to stop monitoring\n');

  // Initial check
  checkServerHealth();

  // Set up interval
  setInterval(checkServerHealth, CHECK_INTERVAL);
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n🛑 Health monitoring stopped');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Health monitoring stopped');
  process.exit(0);
});

// Start monitoring
startHealthCheck();
