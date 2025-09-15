# Schedule Overlap Prevention System

This document describes the comprehensive overlap prevention system implemented for the school schedule management system.

## Overview

The system prevents the following types of schedule conflicts:

1. **Teacher Overlaps**: A teacher cannot be assigned to more than one class at the same time
2. **Section Overlaps**: A section cannot be scheduled for more than one subject at the same time
3. **Time Slot Conflicts**: No two schedule entries should occupy overlapping time slots for the same teacher or section

## Implementation Components

### 1. Database Constraints

**File**: `backend/migrations/20250911_034_add_schedule_overlap_constraints.sql`

The database includes unique constraints to prevent exact duplicate schedules:

```sql
-- Prevent teacher overlaps
ALTER TABLE `teacherschedule`
ADD CONSTRAINT `unique_teacher_time`
UNIQUE (`TeacherID`, `DayOfWeek`, `TimeIn`, `TimeOut`);

-- Prevent section overlaps
ALTER TABLE `teacherschedule`
ADD CONSTRAINT `unique_section_time`
UNIQUE (`SectionID`, `DayOfWeek`, `TimeIn`, `TimeOut`);
```

### 2. Application-Level Validation

**File**: `backend/middleware/scheduleValidation.js`

#### Core Functions

- `timeRangesOverlap(start1, end1, start2, end2)`: Checks if two time ranges overlap
- `checkTeacherOverlap(teacherId, dayOfWeek, startTime, endTime, excludeScheduleId)`: Validates teacher schedule conflicts
- `checkSectionOverlap(sectionId, dayOfWeek, startTime, endTime, excludeScheduleId)`: Validates section schedule conflicts
- `checkScheduleOverlaps(teacherId, sectionId, dayOfWeek, startTime, endTime, excludeScheduleId)`: Comprehensive overlap checking
- `validateScheduleData(scheduleData, excludeScheduleId)`: Complete validation with error reporting

#### Time Overlap Logic

The system detects various types of overlaps:

- **Exact Overlap**: Same start and end times
- **Partial Overlap**: One range starts before the other ends
- **Complete Overlap**: One range completely contains another
- **Adjacent Times**: No overlap (e.g., 09:00-10:00 and 10:00-11:00)

### 3. API Endpoint Integration

**File**: `backend/routes/admin.js`

#### Schedule Creation (`POST /admin/schedules`)

1. Validates required fields
2. Resolves teacher and subject IDs
3. Checks for overlaps for each day before creating any schedules
4. Returns detailed conflict information if overlaps are detected
5. Creates schedules only if no conflicts exist

#### Schedule Modification (`PUT /admin/schedules/:id`)

1. Retrieves current schedule data
2. Merges updates with current values
3. Validates for overlaps only when time or day changes
4. Excludes current schedule from overlap checks
5. Provides detailed conflict information

### 4. Error Handling and Logging

#### Conflict Detection

When overlaps are detected, the system:

1. **Logs the attempt**: Uses `logScheduleConflict()` to record conflict details
2. **Returns detailed errors**: Provides specific information about conflicting schedules
3. **Handles database constraints**: Catches `ER_DUP_ENTRY` errors and provides user-friendly messages

#### Error Response Format

```json
{
  "success": false,
  "message": "Schedule conflicts detected",
  "errors": [
    "Mon: Teacher is already scheduled for Math (09:00-10:00)",
    "Tue: Section is already scheduled for Science with John Doe (09:30-10:30)"
  ],
  "conflicts": [
    {
      "day": "Mon",
      "conflicts": {
        "teacher": {
          "hasOverlap": true,
          "conflictingSchedules": [...]
        },
        "section": {
          "hasOverlap": false,
          "conflictingSchedules": []
        }
      }
    }
  ]
}
```

### 5. Test Coverage

**Files**:

- `backend/tests/scheduleValidation.test.js`
- `backend/tests/scheduleAPI.test.js`

#### Test Categories

1. **Unit Tests**: Individual function testing
2. **Integration Tests**: API endpoint testing
3. **Edge Cases**: Boundary conditions and error scenarios
4. **Conflict Scenarios**: Various overlap detection tests

#### Test Coverage

- Time range overlap detection
- Teacher overlap validation
- Section overlap validation
- API endpoint conflict handling
- Error message validation
- Database constraint handling

## Usage Examples

### Creating a Schedule

```javascript
// Valid schedule creation
const scheduleData = {
  subject: "Math",
  teacher: "John Doe",
  sectionId: 1,
  days: ["Mon", "Wed", "Fri"],
  startTime: "09:00",
  endTime: "10:00",
};

const response = await fetch("/admin/schedules", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(scheduleData),
});
```

### Handling Conflicts

```javascript
// Conflict response handling
if (!response.ok) {
  const error = await response.json();
  if (error.conflicts) {
    error.errors.forEach((errorMsg) => {
      console.error("Conflict:", errorMsg);
    });
  }
}
```

## Configuration

### Database Migration

To apply the overlap prevention constraints:

```bash
# Run the migration
node migrate.js
```

### Testing

To run the test suite:

```bash
# Install test dependencies
npm install --save-dev jest @jest/globals supertest

# Run tests
npm test

# Run with coverage
npm run test:coverage
```

## Performance Considerations

1. **Database Indexes**: Added indexes on frequently queried columns for better performance
2. **Batch Validation**: Validates all days before creating any schedules
3. **Efficient Queries**: Uses optimized SQL queries for overlap detection
4. **Caching**: Consider implementing caching for frequently accessed schedule data

## Future Enhancements

1. **Room Management**: Add room/location overlap prevention
2. **Recurring Schedules**: Support for complex recurring patterns
3. **Bulk Operations**: Optimize for bulk schedule creation/updates
4. **Real-time Validation**: Client-side validation before API calls
5. **Conflict Resolution**: Automated conflict resolution suggestions

## Troubleshooting

### Common Issues

1. **False Positives**: Ensure time format is HH:MM (24-hour format)
2. **Missing Constraints**: Verify database migration was applied
3. **Test Failures**: Check that test database is properly mocked

### Debug Mode

Enable detailed logging by setting:

```javascript
process.env.DEBUG_SCHEDULE_VALIDATION = "true";
```

This will log detailed information about overlap checks and validation steps.

## Security Considerations

1. **Input Validation**: All time inputs are validated for format and range
2. **SQL Injection**: Uses parameterized queries throughout
3. **Authorization**: All endpoints require admin authentication
4. **Audit Trail**: All schedule changes are logged for audit purposes
