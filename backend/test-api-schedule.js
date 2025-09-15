// Test the exact API call that's failing
import { validateScheduleData } from './middleware/scheduleValidation.js';
import { pool } from './config/database.js';

async function testAPISchedule() {
    console.log('🧪 Testing API Schedule Creation...\n');

    try {
        // Test the exact data that's being sent
        const scheduleData = {
            teacherId: 4, // Michael Chen
            sectionId: 2, // Section B
            dayOfWeek: 'Thu',
            startTime: '08:00',
            endTime: '09:00'
        };

        console.log('Testing with data:', scheduleData);

        // Test validation
        console.log('\n1. Testing validation:');
        const validation = await validateScheduleData(scheduleData);
        console.log('Validation result:', validation);

        if (!validation.isValid) {
            console.log('❌ Validation failed with errors:', validation.errors);
        } else {
            console.log('✅ Validation passed');
        }

        // Test direct database queries
        console.log('\n2. Testing teacher overlap check:');
        const [teacherSchedules] = await pool.execute(`
            SELECT ScheduleID, SubjectID, TimeIn, TimeOut, s.SubjectName
            FROM teacherschedule ts
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            WHERE ts.TeacherID = ? AND ts.DayOfWeek = ?
        `, [4, 'Thu']);
        console.log('Teacher schedules on Thursday:', teacherSchedules);

        console.log('\n3. Testing section overlap check:');
        const [sectionSchedules] = await pool.execute(`
            SELECT ts.ScheduleID, ts.SubjectID, ts.TimeIn, ts.TimeOut, s.SubjectName, tr.FullName as TeacherName
            FROM teacherschedule ts
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
            WHERE ts.SectionID = ? AND ts.DayOfWeek = ?
        `, [2, 'Thu']);
        console.log('Section schedules on Thursday:', sectionSchedules);

    } catch (error) {
        console.error('❌ Test failed:', error);
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (pool && pool.end) {
            await pool.end();
        }
    }
}

testAPISchedule();
