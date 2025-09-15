import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import { 
    timeRangesOverlap, 
    checkTeacherOverlap, 
    checkSectionOverlap, 
    checkScheduleOverlaps, 
    validateScheduleData 
} from '../middleware/scheduleValidation.js';
import { pool } from '../config/database.js';

// Mock database for testing
jest.mock('../config/database.js', () => ({
    pool: {
        execute: jest.fn()
    }
}));

describe('Schedule Validation Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('timeRangesOverlap', () => {
        it('should detect overlapping time ranges', () => {
            // Exact overlap
            expect(timeRangesOverlap('09:00', '10:00', '09:00', '10:00')).toBe(true);
            
            // Partial overlap - start time in middle
            expect(timeRangesOverlap('09:00', '10:00', '09:30', '10:30')).toBe(true);
            
            // Partial overlap - end time in middle
            expect(timeRangesOverlap('09:30', '10:30', '09:00', '10:00')).toBe(true);
            
            // Complete overlap - one range contains another
            expect(timeRangesOverlap('09:00', '11:00', '09:30', '10:30')).toBe(true);
            expect(timeRangesOverlap('09:30', '10:30', '09:00', '11:00')).toBe(true);
        });

        it('should not detect non-overlapping time ranges', () => {
            // Adjacent times (no overlap)
            expect(timeRangesOverlap('09:00', '10:00', '10:00', '11:00')).toBe(false);
            
            // Completely separate times
            expect(timeRangesOverlap('09:00', '10:00', '11:00', '12:00')).toBe(false);
            
            // Different time periods
            expect(timeRangesOverlap('09:00', '10:00', '14:00', '15:00')).toBe(false);
        });

        it('should handle edge cases correctly', () => {
            // Same start time, different end times
            expect(timeRangesOverlap('09:00', '10:00', '09:00', '11:00')).toBe(true);
            
            // Same end time, different start times
            expect(timeRangesOverlap('09:00', '10:00', '08:00', '10:00')).toBe(true);
            
            // One minute overlap
            expect(timeRangesOverlap('09:00', '09:01', '09:01', '10:00')).toBe(false);
        });
    });

    describe('checkTeacherOverlap', () => {
        it('should detect teacher schedule overlaps', async () => {
            const mockSchedules = [
                { ScheduleID: 1, SubjectID: 1, TimeIn: '09:00', TimeOut: '10:00', SubjectName: 'Math' },
                { ScheduleID: 2, SubjectID: 2, TimeIn: '09:30', TimeOut: '10:30', SubjectName: 'Science' }
            ];

            pool.execute.mockResolvedValue([mockSchedules]);

            const result = await checkTeacherOverlap(1, 'Mon', '09:15', '09:45');

            expect(result.hasOverlap).toBe(true);
            expect(result.conflictingSchedules).toHaveLength(2);
            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT ScheduleID, SubjectID, TimeIn, TimeOut, s.SubjectName'),
                [1, 'Mon']
            );
        });

        it('should not detect overlaps when teacher is free', async () => {
            pool.execute.mockResolvedValue([[]]);

            const result = await checkTeacherOverlap(1, 'Mon', '09:00', '10:00');

            expect(result.hasOverlap).toBe(false);
            expect(result.conflictingSchedules).toHaveLength(0);
        });

        it('should exclude specified schedule ID from overlap check', async () => {
            const mockSchedules = [
                { ScheduleID: 2, SubjectID: 2, TimeIn: '09:30', TimeOut: '10:30', SubjectName: 'Science' }
            ];

            pool.execute.mockResolvedValue([mockSchedules]);

            const result = await checkTeacherOverlap(1, 'Mon', '09:00', '10:00', 1);

            expect(result.hasOverlap).toBe(true);
            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('AND ts.ScheduleID != ?'),
                [1, 'Mon', 1]
            );
        });

        it('should handle database errors gracefully', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            await expect(checkTeacherOverlap(1, 'Mon', '09:00', '10:00'))
                .rejects.toThrow('Failed to check teacher schedule overlap');
        });
    });

    describe('checkSectionOverlap', () => {
        it('should detect section schedule overlaps', async () => {
            const mockSchedules = [
                { 
                    ScheduleID: 1, 
                    SubjectID: 1, 
                    TimeIn: '09:00', 
                    TimeOut: '10:00', 
                    SubjectName: 'Math',
                    TeacherName: 'John Doe'
                }
            ];

            pool.execute.mockResolvedValue([mockSchedules]);

            const result = await checkSectionOverlap(1, 'Mon', '09:30', '10:30');

            expect(result.hasOverlap).toBe(true);
            expect(result.conflictingSchedules).toHaveLength(1);
            expect(pool.execute).toHaveBeenCalledWith(
                expect.stringContaining('SELECT ts.ScheduleID, ts.SubjectID, ts.TimeIn, ts.TimeOut'),
                [1, 'Mon']
            );
        });

        it('should return no overlap when sectionId is null', async () => {
            const result = await checkSectionOverlap(null, 'Mon', '09:00', '10:00');

            expect(result.hasOverlap).toBe(false);
            expect(result.conflictingSchedules).toHaveLength(0);
            expect(pool.execute).not.toHaveBeenCalled();
        });

        it('should not detect overlaps when section is free', async () => {
            pool.execute.mockResolvedValue([[]]);

            const result = await checkSectionOverlap(1, 'Mon', '09:00', '10:00');

            expect(result.hasOverlap).toBe(false);
            expect(result.conflictingSchedules).toHaveLength(0);
        });
    });

    describe('checkScheduleOverlaps', () => {
        it('should check both teacher and section overlaps', async () => {
            const teacherOverlap = { hasOverlap: true, conflictingSchedules: [] };
            const sectionOverlap = { hasOverlap: false, conflictingSchedules: [] };

            pool.execute
                .mockResolvedValueOnce([[]]) // Teacher check
                .mockResolvedValueOnce([[]]); // Section check

            const result = await checkScheduleOverlaps(1, 1, 'Mon', '09:00', '10:00');

            expect(result.hasOverlap).toBe(false);
            expect(result.conflicts.teacher).toBeDefined();
            expect(result.conflicts.section).toBeDefined();
        });

        it('should detect overlaps when either teacher or section has conflicts', async () => {
            pool.execute
                .mockResolvedValueOnce([[{ ScheduleID: 1, SubjectID: 1, TimeIn: '09:00', TimeOut: '10:00', SubjectName: 'Math' }]])
                .mockResolvedValueOnce([[]]);

            const result = await checkScheduleOverlaps(1, 1, 'Mon', '09:30', '10:30');

            expect(result.hasOverlap).toBe(true);
        });
    });

    describe('validateScheduleData', () => {
        it('should validate basic schedule data', async () => {
            pool.execute.mockResolvedValue([[]]);

            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:00',
                endTime: '10:00'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect missing required fields', async () => {
            const scheduleData = {
                teacherId: null,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:00',
                endTime: '10:00'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Teacher ID is required');
        });

        it('should validate time format', async () => {
            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: 'invalid-time',
                endTime: '10:00'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Start time must be in HH:MM format');
        });

        it('should validate start time is before end time', async () => {
            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '10:00',
                endTime: '09:00'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Start time must be before end time');
        });

        it('should detect schedule overlaps', async () => {
            pool.execute
                .mockResolvedValueOnce([[{ ScheduleID: 1, SubjectID: 1, TimeIn: '09:00', TimeOut: '10:00', SubjectName: 'Math' }]])
                .mockResolvedValueOnce([[]]);

            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:30',
                endTime: '10:30'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Teacher is already scheduled'))).toBe(true);
        });

        it('should handle validation errors gracefully', async () => {
            pool.execute.mockRejectedValue(new Error('Database error'));

            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:00',
                endTime: '10:00'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Failed to validate schedule data');
        });
    });

    describe('Integration Tests', () => {
        it('should prevent teacher double-booking', async () => {
            // Mock existing schedule
            pool.execute
                .mockResolvedValueOnce([[{ ScheduleID: 1, SubjectID: 1, TimeIn: '09:00', TimeOut: '10:00', SubjectName: 'Math' }]])
                .mockResolvedValueOnce([[]]);

            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:30',
                endTime: '10:30'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Teacher is already scheduled'))).toBe(true);
        });

        it('should prevent section double-booking', async () => {
            pool.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([[{ 
                    ScheduleID: 1, 
                    SubjectID: 1, 
                    TimeIn: '09:00', 
                    TimeOut: '10:00', 
                    SubjectName: 'Math',
                    TeacherName: 'John Doe'
                }]]);

            const scheduleData = {
                teacherId: 2,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:30',
                endTime: '10:30'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(false);
            expect(result.errors.some(error => error.includes('Section is already scheduled'))).toBe(true);
        });

        it('should allow non-overlapping schedules', async () => {
            pool.execute
                .mockResolvedValueOnce([[]])
                .mockResolvedValueOnce([[]]);

            const scheduleData = {
                teacherId: 1,
                sectionId: 1,
                dayOfWeek: 'Mon',
                startTime: '09:00',
                endTime: '10:00'
            };

            const result = await validateScheduleData(scheduleData);

            expect(result.isValid).toBe(true);
        });
    });
});
