import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { pool } from '../config/database.js';
import adminRoutes from '../routes/admin.js';

// Mock the database
jest.mock('../config/database.js', () => ({
    pool: {
        execute: jest.fn()
    },
    createAuditTrail: jest.fn()
}));

// Mock authentication middleware
jest.mock('../middleware/auth.js', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { userId: 1, role: 'admin' };
        next();
    },
    requireAdmin: (req, res, next) => next()
}));

const app = express();
app.use(express.json());
app.use('/admin', adminRoutes);

describe('Schedule API Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /admin/schedules', () => {
        it('should create schedule successfully when no conflicts exist', async () => {
            // Mock teacher and subject lookup
            pool.execute
                .mockResolvedValueOnce([[{ UserID: 1 }]]) // Teacher lookup
                .mockResolvedValueOnce([[{ SubjectID: 1 }]]) // Subject lookup
                .mockResolvedValueOnce([[]]) // Teacher overlap check
                .mockResolvedValueOnce([[]]) // Section overlap check
                .mockResolvedValueOnce([[]]) // Teacher overlap check for second day
                .mockResolvedValueOnce([[]]) // Section overlap check for second day
                .mockResolvedValueOnce([{ insertId: 1 }]) // First insert
                .mockResolvedValueOnce([{ insertId: 2 }]); // Second insert

            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon', 'Tue'],
                startTime: '09:00',
                endTime: '10:00'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.ids).toHaveLength(2);
        });

        it('should reject schedule creation when teacher has conflicts', async () => {
            // Mock teacher and subject lookup
            pool.execute
                .mockResolvedValueOnce([[{ UserID: 1 }]]) // Teacher lookup
                .mockResolvedValueOnce([[{ SubjectID: 1 }]]) // Subject lookup
                .mockResolvedValueOnce([[{ 
                    ScheduleID: 1, 
                    SubjectID: 2, 
                    TimeIn: '09:00', 
                    TimeOut: '10:00', 
                    SubjectName: 'Science' 
                }]]) // Teacher overlap check
                .mockResolvedValueOnce([[]]); // Section overlap check

            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon'],
                startTime: '09:30',
                endTime: '10:30'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Schedule conflicts detected');
            expect(response.body.errors).toContain('Mon: Teacher is already scheduled for Science (09:00-10:00)');
        });

        it('should reject schedule creation when section has conflicts', async () => {
            // Mock teacher and subject lookup
            pool.execute
                .mockResolvedValueOnce([[{ UserID: 1 }]]) // Teacher lookup
                .mockResolvedValueOnce([[{ SubjectID: 1 }]]) // Subject lookup
                .mockResolvedValueOnce([[]]) // Teacher overlap check
                .mockResolvedValueOnce([[{ 
                    ScheduleID: 1, 
                    SubjectID: 2, 
                    TimeIn: '09:00', 
                    TimeOut: '10:00', 
                    SubjectName: 'Science',
                    TeacherName: 'Jane Smith'
                }]]); // Section overlap check

            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon'],
                startTime: '09:30',
                endTime: '10:30'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Schedule conflicts detected');
            expect(response.body.errors).toContain('Mon: Section is already scheduled for Science with Jane Smith (09:00-10:00)');
        });

        it('should handle database constraint violations', async () => {
            // Mock teacher and subject lookup
            pool.execute
                .mockResolvedValueOnce([[{ UserID: 1 }]]) // Teacher lookup
                .mockResolvedValueOnce([[{ SubjectID: 1 }]]) // Subject lookup
                .mockResolvedValueOnce([[]]) // Teacher overlap check
                .mockResolvedValueOnce([[]]) // Section overlap check
                .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' }); // Insert fails

            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon'],
                startTime: '09:00',
                endTime: '10:00'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Schedule conflict: A schedule already exists for this teacher/section at this time');
            expect(response.body.errorCode).toBe('DUPLICATE_SCHEDULE');
        });

        it('should validate required fields', async () => {
            const scheduleData = {
                subject: '',
                teacher: 'John Doe',
                days: ['Mon'],
                startTime: '09:00',
                endTime: '10:00'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('subject, teacher, startTime, endTime are required');
        });

        it('should handle teacher not found', async () => {
            pool.execute
                .mockResolvedValueOnce([[]]) // Teacher lookup returns empty
                .mockResolvedValueOnce([[{ SubjectID: 1 }]]); // Subject lookup

            const scheduleData = {
                subject: 'Math',
                teacher: 'NonExistent Teacher',
                sectionId: 1,
                days: ['Mon'],
                startTime: '09:00',
                endTime: '10:00'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Teacher not found');
        });
    });

    describe('PUT /admin/schedules/:id', () => {
        it('should update schedule successfully when no conflicts exist', async () => {
            const currentRecord = {
                ScheduleID: 1,
                TeacherID: 1,
                SubjectID: 1,
                SectionID: 1,
                TimeIn: '09:00',
                TimeOut: '10:00',
                DayOfWeek: 'Mon'
            };

            pool.execute
                .mockResolvedValueOnce([[currentRecord]]) // Get current record
                .mockResolvedValueOnce([[{ SubjectID: 2 }]]) // Subject lookup
                .mockResolvedValueOnce([[]]) // Teacher overlap check
                .mockResolvedValueOnce([[]]) // Section overlap check
                .mockResolvedValueOnce([{ affectedRows: 1 }]) // Update
                .mockResolvedValueOnce([[{ 
                    ScheduleID: 1,
                    SubjectID: 2,
                    TeacherID: 1,
                    SectionID: 1,
                    TimeIn: '09:00',
                    TimeOut: '10:00',
                    DayOfWeek: 'Mon',
                    GracePeriod: 15
                }]]); // Return updated record

            const updateData = {
                subject: 'Science',
                startTime: '09:00',
                endTime: '10:00'
            };

            const response = await request(app)
                .put('/admin/schedules/1')
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should reject update when conflicts are detected', async () => {
            const currentRecord = {
                ScheduleID: 1,
                TeacherID: 1,
                SubjectID: 1,
                SectionID: 1,
                TimeIn: '09:00',
                TimeOut: '10:00',
                DayOfWeek: 'Mon'
            };

            pool.execute
                .mockResolvedValueOnce([[currentRecord]]) // Get current record
                .mockResolvedValueOnce([[{ SubjectID: 2 }]]) // Subject lookup
                .mockResolvedValueOnce([[{ 
                    ScheduleID: 2, 
                    SubjectID: 3, 
                    TimeIn: '09:00', 
                    TimeOut: '10:00', 
                    SubjectName: 'Physics' 
                }]]) // Teacher overlap check
                .mockResolvedValueOnce([[]]); // Section overlap check

            const updateData = {
                subject: 'Science',
                startTime: '09:30',
                endTime: '10:30'
            };

            const response = await request(app)
                .put('/admin/schedules/1')
                .send(updateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Schedule conflicts detected');
            expect(response.body.errors).toContain('Mon: Teacher is already scheduled for Physics (09:00-10:00)');
        });

        it('should handle schedule not found', async () => {
            pool.execute
                .mockResolvedValueOnce([[]]); // Get current record returns empty

            const updateData = {
                subject: 'Science'
            };

            const response = await request(app)
                .put('/admin/schedules/999')
                .send(updateData)
                .expect(404);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Schedule not found');
        });

        it('should handle database constraint violations during update', async () => {
            const currentRecord = {
                ScheduleID: 1,
                TeacherID: 1,
                SubjectID: 1,
                SectionID: 1,
                TimeIn: '09:00',
                TimeOut: '10:00',
                DayOfWeek: 'Mon'
            };

            pool.execute
                .mockResolvedValueOnce([[currentRecord]]) // Get current record
                .mockResolvedValueOnce([[{ SubjectID: 2 }]]) // Subject lookup
                .mockResolvedValueOnce([[]]) // Teacher overlap check
                .mockResolvedValueOnce([[]]) // Section overlap check
                .mockRejectedValueOnce({ code: 'ER_DUP_ENTRY' }); // Update fails

            const updateData = {
                subject: 'Science'
            };

            const response = await request(app)
                .put('/admin/schedules/1')
                .send(updateData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Schedule conflict: A schedule already exists for this teacher/section at this time');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        it('should handle multiple day conflicts', async () => {
            pool.execute
                .mockResolvedValueOnce([[{ UserID: 1 }]]) // Teacher lookup
                .mockResolvedValueOnce([[{ SubjectID: 1 }]]) // Subject lookup
                .mockResolvedValueOnce([[{ ScheduleID: 1, SubjectID: 2, TimeIn: '09:00', TimeOut: '10:00', SubjectName: 'Science' }]]) // Mon conflict
                .mockResolvedValueOnce([[]]) // Mon section check
                .mockResolvedValueOnce([[]]) // Tue teacher check
                .mockResolvedValueOnce([[]]); // Tue section check

            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon', 'Tue'],
                startTime: '09:30',
                endTime: '10:30'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.errors).toContain('Mon: Teacher is already scheduled for Science (09:00-10:00)');
        });

        it('should handle time format validation', async () => {
            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon'],
                startTime: '25:00', // Invalid time
                endTime: '10:00'
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.errors.some(error => error.includes('Start time must be in HH:MM format'))).toBe(true);
        });

        it('should handle start time after end time', async () => {
            const scheduleData = {
                subject: 'Math',
                teacher: 'John Doe',
                sectionId: 1,
                days: ['Mon'],
                startTime: '10:00',
                endTime: '09:00' // End before start
            };

            const response = await request(app)
                .post('/admin/schedules')
                .send(scheduleData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.errors.some(error => error.includes('Start time must be before end time'))).toBe(true);
        });
    });
});
