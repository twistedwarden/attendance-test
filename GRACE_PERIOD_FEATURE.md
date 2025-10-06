# Grace Period Feature for Admin Schedules

## Overview

The grace period feature allows administrators to adjust the amount of time (in minutes) after a class start time before a student is marked as "Late" for attendance purposes.

## Features Added

### Backend Changes

1. **Database Support**: The `teacherschedule` table already had a `GracePeriod` column (default: 15 minutes)
2. **API Endpoints**:
   - `POST /api/admin/schedules` - Now accepts `gracePeriod` parameter
   - `PUT /api/admin/schedules/:id` - Now accepts `gracePeriod` parameter for updates
3. **Data Validation**: Grace period is validated to be a reasonable number (0-60 minutes)

### Frontend Changes

1. **Admin Schedules Section**:

   - Added grace period input field to both Create and Edit schedule modals
   - Added grace period column to the schedules table display
   - Grace period is displayed as "X min" in the table
   - Input field includes helpful description text

2. **Form Controls**:
   - Number input with min=0, max=60
   - Default value of 15 minutes
   - Clear labeling and help text

## How It Works

### For Administrators

1. **Creating Schedules**: When creating a new schedule, administrators can set a custom grace period (default: 15 minutes)
2. **Editing Schedules**: Existing schedules can have their grace period adjusted
3. **Viewing Schedules**: The grace period is displayed in the schedules table for easy reference

### For Attendance System

The grace period is used by the attendance system to determine when a student should be marked as "Late":

- If a student arrives before or at the class start time: **Present**
- If a student arrives after the start time but within the grace period: **Late**
- If a student arrives after the grace period has expired: **Absent** (if after class end time + grace period)

## Technical Implementation

### Database Schema

```sql
ALTER TABLE `teacherschedule`
ADD COLUMN `GracePeriod` int(11) DEFAULT 15 COMMENT 'Grace period in minutes for late arrivals' AFTER `DayOfWeek`;
```

### API Usage

```javascript
// Create schedule with grace period
POST /api/admin/schedules
{
  "subject": "Mathematics",
  "teacher": "John Doe",
  "startTime": "08:00",
  "endTime": "09:00",
  "days": ["Mon", "Wed", "Fri"],
  "gracePeriod": 20
}

// Update grace period
PUT /api/admin/schedules/123
{
  "gracePeriod": 30
}
```

### Frontend Usage

```typescript
// AdminService methods now support gracePeriod
AdminService.createSchedule({
  // ... other fields
  gracePeriod: 20,
});

AdminService.updateSchedule(id, {
  // ... other fields
  gracePeriod: 30,
});
```

## Benefits

1. **Flexibility**: Different subjects or grade levels can have different grace periods
2. **Fairness**: Accommodates different teaching styles and classroom needs
3. **Transparency**: Grace period is clearly visible to administrators
4. **Consistency**: Maintains consistent attendance marking across the system

## Default Values

- **Default Grace Period**: 15 minutes
- **Minimum Grace Period**: 0 minutes
- **Maximum Grace Period**: 60 minutes (recommended limit)

## Future Enhancements

- Global grace period settings per grade level
- Grace period templates for different subject types
- Historical grace period tracking for audit purposes
