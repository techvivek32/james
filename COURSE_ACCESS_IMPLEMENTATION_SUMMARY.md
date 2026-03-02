# Course Access Control - Changes Summary

## What Was Implemented

The system now filters courses based on:
1. **Access Mode**: Courses can be "Open to all members" or "Assigned only (manager controls access)"
2. **Training Center Toggle**: Users must have the training center feature enabled to see courses
3. **Role-Based Access**: Managers see all courses, other roles only see "open" courses

## Files Modified

### 1. API Layer
**`pages/api/courses/index.ts`**
- Added query parameters: `userId` and `userRole`
- Added filtering logic based on user's training center toggle and course access mode
- Imported UserModel to check user feature toggles

### 2. Sales Pages
**`pages/sales/training.tsx`**
- Updated to fetch courses with user context
- Changed from: `fetch("/api/courses")`
- Changed to: `fetch("/api/courses?userId=${userId}&userRole=${role}")`

### 3. Manager Pages
**`pages/manager/onlineTraining.tsx`**
- Updated to fetch courses with manager context
- Changed from: `fetch("/api/courses")`
- Changed to: `fetch("/api/courses?userId=${managerId}&userRole=manager")`

**`pages/manager/training.tsx`**
- Updated to fetch courses with manager context for team training progress

### 4. Components
**`src/portals/sales/TrainingCenter.tsx`**
- Removed local draft filtering (now handled by API)
- Changed from: `props.courses.filter((course) => course.status !== "draft")`
- Changed to: `props.courses`
- **Fixed**: Added cover image display with backgroundImage style

**`src/portals/manager/OnlineTraining.tsx`**
- Removed local draft filtering (now handled by API)
- Changed from: `props.courses.filter((course) => course.status !== "draft")`
- Changed to: `props.courses`
- **Fixed**: Added cover image display with backgroundImage style

## How It Works

### Course Visibility Rules

1. **For Admin Users**:
   - See ALL courses (draft and published) in course management
   - No filtering applied

2. **For Manager Users**:
   - Must have `trainingCenter: true` in featureToggles
   - See published courses with `accessMode: "open"` OR `accessMode: "assigned"`
   - Do NOT see draft courses

3. **For Sales/Marketing Users**:
   - Must have `trainingCenter: true` in featureToggles
   - See ONLY published courses with `accessMode: "open"`
   - Do NOT see draft courses or assigned-only courses

### Admin Course Creation Flow

When admin creates/edits a course in Course Management:
1. Set course title, description, cover image, etc.
2. Set "Course Status" toggle (Draft/Published)
3. Set "Access" dropdown:
   - "Open to all members" → visible to all roles with training center
   - "Assigned only (manager controls access)" → visible only to managers

## Testing the Implementation

### Test Case 1: Open Course
1. Admin creates course with "Open to all members"
2. Admin publishes the course
3. Sales user (with training center enabled) → ✅ Sees course
4. Manager (with training center enabled) → ✅ Sees course

### Test Case 2: Assigned Course
1. Admin creates course with "Assigned only"
2. Admin publishes the course
3. Sales user (with training center enabled) → ❌ Does NOT see course
4. Manager (with training center enabled) → ✅ Sees course

### Test Case 3: Training Center Disabled
1. Admin creates and publishes course (any access mode)
2. User with `trainingCenter: false` → ❌ Does NOT see any courses

### Test Case 4: Draft Course
1. Admin creates course but leaves as draft
2. All users → ❌ Do NOT see the course
3. Admin in course management → ✅ Sees the course

## Database Schema (Already Exists)

The implementation uses existing schema fields:

**Course Model** (`src/lib/models/Course.ts`):
```typescript
accessMode: String // "open" | "assigned"
status: String // "draft" | "published"
```

**User Model** (`src/lib/models/User.ts`):
```typescript
featureToggles: {
  trainingCenter: Boolean
  // ... other toggles
}
```

## No Breaking Changes

- Existing courses without `accessMode` default to "open" behavior
- Admin course management unchanged (still sees all courses)
- Backward compatible with existing data

## Documentation Created

- **`COURSE_ACCESS_CONTROL.md`**: Comprehensive documentation of the feature
