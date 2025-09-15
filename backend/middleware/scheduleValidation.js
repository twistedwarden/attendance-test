import { pool } from '../config/database.js';

/**
 * Check if two time ranges overlap
 * @param {string} start1 - Start time of first range (HH:MM format)
 * @param {string} end1 - End time of first range (HH:MM format)
 * @param {string} start2 - Start time of second range (HH:MM format)
 * @param {string} end2 - End time of second range (HH:MM format)
 * @returns {boolean} - True if ranges overlap
 */
function timeRangesOverlap(start1, end1, start2, end2) {
    // Convert time strings to minutes since midnight for easier comparison
    const timeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const start1Min = timeToMinutes(start1);
    const end1Min = timeToMinutes(end1);
    const start2Min = timeToMinutes(start2);
    const end2Min = timeToMinutes(end2);

    // Two ranges overlap if one starts before the other ends
    return start1Min < end2Min && start2Min < end1Min;
}

/**
 * Check if a teacher has overlapping schedules for a given day and time
 * @param {number} teacherId - Teacher ID
 * @param {string} dayOfWeek - Day of the week
 * @param {string} startTime - Start time (HH:MM format)
 * @param {string} endTime - End time (HH:MM format)
 * @param {number} excludeScheduleId - Schedule ID to exclude from check (for updates)
 * @returns {Promise<Object>} - { hasOverlap: boolean, conflictingSchedules: Array }
 */
export async function checkTeacherOverlap(teacherId, dayOfWeek, startTime, endTime, excludeScheduleId = null) {
    try {
        let query = `
            SELECT ts.ScheduleID, ts.SubjectID, ts.TimeIn, ts.TimeOut, s.SubjectName
            FROM teacherschedule ts
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            WHERE ts.TeacherID = ? AND ts.DayOfWeek = ?
        `;
        const params = [teacherId, dayOfWeek];

        if (excludeScheduleId) {
            query += ' AND ts.ScheduleID != ?';
            params.push(excludeScheduleId);
        }

        const [schedules] = await pool.execute(query, params);

        const conflictingSchedules = schedules.filter(schedule => 
            timeRangesOverlap(startTime, endTime, schedule.TimeIn, schedule.TimeOut)
        );

        return {
            hasOverlap: conflictingSchedules.length > 0,
            conflictingSchedules
        };
    } catch (error) {
        console.error('Error checking teacher overlap:', error);
        throw new Error('Failed to check teacher schedule overlap');
    }
}

/**
 * Check if a section has overlapping schedules for a given day and time
 * @param {number} sectionId - Section ID
 * @param {string} dayOfWeek - Day of the week
 * @param {string} startTime - Start time (HH:MM format)
 * @param {string} endTime - End time (HH:MM format)
 * @param {number} excludeScheduleId - Schedule ID to exclude from check (for updates)
 * @returns {Promise<Object>} - { hasOverlap: boolean, conflictingSchedules: Array }
 */
export async function checkSectionOverlap(sectionId, dayOfWeek, startTime, endTime, excludeScheduleId = null) {
    try {
        if (!sectionId) {
            return { hasOverlap: false, conflictingSchedules: [] };
        }

        let query = `
            SELECT ts.ScheduleID, ts.SubjectID, ts.TimeIn, ts.TimeOut, s.SubjectName, tr.FullName as TeacherName
            FROM teacherschedule ts
            LEFT JOIN subject s ON s.SubjectID = ts.SubjectID
            LEFT JOIN teacherrecord tr ON tr.UserID = ts.TeacherID
            WHERE ts.SectionID = ? AND ts.DayOfWeek = ?
        `;
        const params = [sectionId, dayOfWeek];

        if (excludeScheduleId) {
            query += ' AND ts.ScheduleID != ?';
            params.push(excludeScheduleId);
        }

        const [schedules] = await pool.execute(query, params);

        const conflictingSchedules = schedules.filter(schedule => 
            timeRangesOverlap(startTime, endTime, schedule.TimeIn, schedule.TimeOut)
        );

        return {
            hasOverlap: conflictingSchedules.length > 0,
            conflictingSchedules
        };
    } catch (error) {
        console.error('Error checking section overlap:', error);
        throw new Error('Failed to check section schedule overlap');
    }
}

/**
 * Check for any overlapping schedules (teacher, section, or general time slot conflicts)
 * @param {number} teacherId - Teacher ID
 * @param {number} sectionId - Section ID
 * @param {string} dayOfWeek - Day of the week
 * @param {string} startTime - Start time (HH:MM format)
 * @param {string} endTime - End time (HH:MM format)
 * @param {number} excludeScheduleId - Schedule ID to exclude from check (for updates)
 * @returns {Promise<Object>} - { hasOverlap: boolean, conflicts: Object }
 */
export async function checkScheduleOverlaps(teacherId, sectionId, dayOfWeek, startTime, endTime, excludeScheduleId = null) {
    try {
        const [teacherOverlap, sectionOverlap] = await Promise.all([
            checkTeacherOverlap(teacherId, dayOfWeek, startTime, endTime, excludeScheduleId),
            checkSectionOverlap(sectionId, dayOfWeek, startTime, endTime, excludeScheduleId)
        ]);

        const hasOverlap = teacherOverlap.hasOverlap || sectionOverlap.hasOverlap;
        const conflicts = {
            teacher: teacherOverlap,
            section: sectionOverlap
        };

        return { hasOverlap, conflicts };
    } catch (error) {
        console.error('Error checking schedule overlaps:', error);
        throw new Error('Failed to check schedule overlaps');
    }
}

/**
 * Validate schedule data before creation or update
 * @param {Object} scheduleData - Schedule data to validate
 * @param {number} excludeScheduleId - Schedule ID to exclude (for updates)
 * @returns {Promise<Object>} - { isValid: boolean, errors: Array }
 */
export async function validateScheduleData(scheduleData, excludeScheduleId = null) {
    const { teacherId, sectionId, dayOfWeek, startTime, endTime } = scheduleData;
    const errors = [];

    // Basic validation
    if (!teacherId) {
        errors.push('Teacher ID is required');
    }
    if (!dayOfWeek) {
        errors.push('Day of week is required');
    }
    if (!startTime || !endTime) {
        errors.push('Start time and end time are required');
    }

    // Validate time format
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (startTime && !timeRegex.test(startTime)) {
        errors.push('Start time must be in HH:MM format');
    }
    if (endTime && !timeRegex.test(endTime)) {
        errors.push('End time must be in HH:MM format');
    }

    // Validate start time is before end time
    if (startTime && endTime && startTime >= endTime) {
        errors.push('Start time must be before end time');
    }

    if (errors.length > 0) {
        return { isValid: false, errors };
    }

    // Check for overlaps
    try {
        const overlapCheck = await checkScheduleOverlaps(teacherId, sectionId, dayOfWeek, startTime, endTime, excludeScheduleId);
        
        if (overlapCheck.hasOverlap) {
            const conflictErrors = [];
            
            if (overlapCheck.conflicts.teacher.hasOverlap) {
                const teacherConflicts = overlapCheck.conflicts.teacher.conflictingSchedules;
                conflictErrors.push(`Teacher is already scheduled for ${teacherConflicts.map(c => `${c.SubjectName} (${c.TimeIn}-${c.TimeOut})`).join(', ')}`);
            }
            
            if (overlapCheck.conflicts.section.hasOverlap) {
                const sectionConflicts = overlapCheck.conflicts.section.conflictingSchedules;
                conflictErrors.push(`Section is already scheduled for ${sectionConflicts.map(c => `${c.SubjectName} with ${c.TeacherName} (${c.TimeIn}-${c.TimeOut})`).join(', ')}`);
            }
            
            errors.push(...conflictErrors);
        }

        return { isValid: errors.length === 0, errors, overlapCheck };
    } catch (error) {
        console.error('Error validating schedule data:', error);
        errors.push('Failed to validate schedule data');
        return { isValid: false, errors };
    }
}

/**
 * Log schedule conflict attempts for audit purposes
 * @param {Object} conflictData - Conflict data to log
 * @param {string} action - Action being attempted (create/update)
 * @param {number} userId - User ID attempting the action
 */
export function logScheduleConflict(conflictData, action, userId) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        userId,
        conflictData,
        message: `Schedule conflict detected during ${action}`
    };
    
    console.warn('SCHEDULE_CONFLICT:', JSON.stringify(logEntry, null, 2));
    
    // In a production environment, you might want to store this in a dedicated audit table
    // or send to a logging service
}
