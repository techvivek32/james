# Course Access Control Implementation

## Overview
This document describes the course access control system that filters which courses are visible to users based on their role and training center feature toggle.

## Features

### 1. Access Mode
Courses now have an `accessMode` field with two options:
- **"open"** (default): Course is visible to all members who have the training center enabled
- **"assigned"**: Course is only visible to managers (manager controls access)

### 2. Training Center Feature Toggle
Users must have the `trainingCenter` feature toggle enabled in their profile to see any courses.

### 3. Role-Based Filtering
- **Admin**: Can see all courses (draft and published) in the course management interface
- **Manager**: Can see published courses that are either "open" or "assigned" (if training center is enabled)
- **Sales/Marketing**: Can only see published courses with "open" access mode (if training center is enabled)

## Implementation Details

### API Changes
**File**: `pages/api/courses/index.ts`

The GET endpoint now accepts query parameters:
- `userId`: The ID of the user requesting courses
- `userRole`: The role of the user (admin, manager, sales, marketing)

Filtering logic:
1. If no userId/userRole provided → return all courses (for admin)
2. Check if user has `trainingCenter` feature toggle enabled
3. Filter out draft courses
4. Apply access mode filtering based on role

### Frontend Changes

#### Sales Training Page
**File**: `pages/sales/training.tsx`
- Fetches courses with user context: `/api/courses?userId=${userId}&userRole=${role}`
- Only displays courses the user has access to

#### Manager Training Pages
**Files**: 
- `pages/manager/onlineTraining.tsx`
- `pages/manager/training.tsx`

Both pages now fetch courses with manager context to include "assigned" courses.

#### Training Center Component
**File**: `src/portals/sales/TrainingCenter.tsx`
- Removed local draft filtering (now handled by API)
- Displays only courses returned by the API

#### Manager Online Training Component
**File**: `src/portals/manager/OnlineTraining.tsx`
- Removed local draft filtering (now handled by API)

### Admin Course Management
**File**: `pages/admin/course-management.tsx`
- Unchanged - fetches all courses without user context
- Can create and edit courses with access mode settings

## Usage

### For Admins
1. Go to Course Management
2. Create or edit a course
3. Set the "Access" dropdown:
   - "Open to all members" - visible to everyone with training center enabled
   - "Assigned only (manager controls access)" - visible only to managers

### For Users
- Users will only see courses if:
  1. Their `trainingCenter` feature toggle is enabled
  2. The course is published (not draft)
  3. The course access mode matches their role:
     - Managers: see both "open" and "assigned" courses
     - Sales/Marketing: see only "open" courses

## Database Schema
The Course model already includes the `accessMode` field:
```typescript
accessMode: String // "open" | "assigned"
```

The User model includes the training center toggle:
```typescript
featureToggles: {
  trainingCenter: Boolean
}
```

## Testing Scenarios

### Scenario 1: Open Course with Training Center Enabled
- Admin creates course with "Open to all members"
- Admin publishes the course
- Sales user with `trainingCenter: true` → sees the course
- Manager with `trainingCenter: true` → sees the course

### Scenario 2: Assigned Course
- Admin creates course with "Assigned only"
- Admin publishes the course
- Sales user with `trainingCenter: true` → does NOT see the course
- Manager with `trainingCenter: true` → sees the course

### Scenario 3: Training Center Disabled
- Admin creates and publishes course (any access mode)
- User with `trainingCenter: false` → does NOT see any courses
- User with `trainingCenter: true` → sees courses based on access mode

### Scenario 4: Draft Course
- Admin creates course but leaves it as draft
- All users (regardless of settings) → do NOT see the course
- Only admin sees it in course management

## Future Enhancements
- Add individual course assignment tracking
- Add course completion tracking per user
- Add manager interface to assign specific courses to team members
- Add notifications when new courses are assigned
