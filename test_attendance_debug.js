// Test script to debug attendance creation
import { createManualAttendance } from './config/database.js';

async function testAttendance() {
  try {
    console.log('Testing manual attendance creation...');
    
    const result = await createManualAttendance({
      studentId: 8, // Christian Bo Mahusay from the image
      date: '2025-09-14',
      timeIn: '09:25:00',
      status: 'Present',
      validatedBy: 1 // admin user
    });
    
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAttendance();
