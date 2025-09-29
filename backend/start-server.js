#!/usr/bin/env node

/**
 * Enhanced Server Startup Script with Auto-Restart
 * This script prevents server crashes and automatically restarts the server
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const SERVER_FILE = 'server.js';
const MAX_RESTARTS = 10;
const RESTART_DELAY = 5000; // 5 seconds
const LOG_FILE = 'server.log';

let restartCount = 0;
let serverProcess = null;

// Create log file if it doesn't exist
if (!fs.existsSync(LOG_FILE)) {
  fs.writeFileSync(LOG_FILE, '');
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

function startServer() {
  log(`🚀 Starting server (attempt ${restartCount + 1}/${MAX_RESTARTS})`);
  
  serverProcess = spawn('node', [SERVER_FILE], {
    stdio: ['inherit', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  // Capture server output
  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      log(`📤 SERVER: ${output}`);
    }
  });

  serverProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    if (error) {
      log(`❌ ERROR: ${error}`);
    }
  });

  // Handle server exit
  serverProcess.on('exit', (code, signal) => {
    log(`🛑 Server exited with code ${code}, signal ${signal}`);
    
    if (restartCount < MAX_RESTARTS) {
      restartCount++;
      log(`🔄 Restarting server in ${RESTART_DELAY/1000} seconds...`);
      
      setTimeout(() => {
        startServer();
      }, RESTART_DELAY);
    } else {
      log(`❌ Maximum restart attempts (${MAX_RESTARTS}) reached. Stopping.`);
      process.exit(1);
    }
  });

  // Handle server errors
  serverProcess.on('error', (error) => {
    log(`❌ Failed to start server: ${error.message}`);
  });
}

// Handle script termination
process.on('SIGINT', () => {
  log('🛑 Received SIGINT, shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('🛑 Received SIGTERM, shutting down...');
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  process.exit(0);
});

// Start the server
log('🎯 Enhanced Server Manager Starting...');
startServer();
