// Simple test to create a schedule without validation
import { pool } from './config/database.js';

async function testSimpleSchedule() {
    console.log('🧪 Testing Simple Schedule Creation...\n');

    try {
        // First, let's check what teachers and subjects exist
        console.log('1. Checking existing teachers:');
        const [teachers] = await pool.execute('SELECT UserID, Username FROM useraccount WHERE Role = "Teacher" LIMIT 5');
        console.log('Teachers:', teachers);

        console.log('\n2. Checking existing subjects:');
        const [subjects] = await pool.execute('SELECT SubjectID, SubjectName FROM subject LIMIT 5');
        console.log('Subjects:', subjects);

        console.log('\n3. Checking existing sections:');
        const [sections] = await pool.execute('SELECT SectionID, SectionName FROM section LIMIT 5');
        console.log('Sections:', sections);

        // Try to create a simple schedule directly
        if (teachers.length > 0 && subjects.length > 0) {
            console.log('\n4. Creating a test schedule:');
            const [result] = await pool.execute(
                'INSERT INTO teacherschedule (TeacherID, SubjectID, SectionID, TimeIn, TimeOut, DayOfWeek) VALUES (?, ?, ?, ?, ?, ?)',
                [teachers[0].UserID, subjects[0].SubjectID, sections[0]?.SectionID || null, '08:00', '09:00', 'Thu']
            );
            console.log('✅ Schedule created with ID:', result.insertId);

            // Now try to create another schedule on a different day (should work)
            console.log('\n5. Creating another schedule on different day:');
            const [result2] = await pool.execute(
                'INSERT INTO teacherschedule (TeacherID, SubjectID, SectionID, TimeIn, TimeOut, DayOfWeek) VALUES (?, ?, ?, ?, ?, ?)',
                [teachers[0].UserID, subjects[0].SubjectID, sections[0]?.SectionID || null, '08:00', '09:00', 'Fri']
            );
            console.log('✅ Second schedule created with ID:', result2.insertId);

            // Clean up
            await pool.execute('DELETE FROM teacherschedule WHERE ScheduleID IN (?, ?)', [result.insertId, result2.insertId]);
            console.log('✅ Test schedules cleaned up');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        if (pool && pool.end) {
            await pool.end();
        }
    }
}

testSimpleSchedule();
