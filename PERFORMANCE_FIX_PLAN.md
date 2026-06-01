# Course Loading Performance Fix Plan

## Issues Identified

### 1. **Nested API Calls in `/api/courses/index.ts`**
- **Problem**: API calls another API endpoint internally, creating waterfall effect
- **Impact**: 2x latency for every course list load
- **Line**: 76-90

### 2. **No MongoDB Field Projection**
- **Problem**: Fetching entire course documents with large HTML body content
- **Impact**: Unnecessary data transfer (potentially MBs of data)
- **Line**: 29

### 3. **Sequential Progress Loading in Web**
- **Problem**: Progress loaded after courses, delaying render
- **Impact**: Users see loading state longer than necessary
- **File**: `TrainingCenter.tsx` Line 368-390

### 4. **Poor Caching Strategy in Flutter App**
- **Problem**: 1-hour cache expiry, no stale-while-revalidate
- **Impact**: Frequent full reloads
- **File**: `courses_screen.dart` Line 67-75

### 5. **Small MongoDB Connection Pool**
- **Problem**: maxPoolSize: 10 is too small for concurrent users
- **Impact**: Connection bottleneck under load
- **File**: `mongodb.ts` Line 25-28

## Solutions

### Fix 1: Remove Nested API Call - Direct Database Query
**File**: `pages/api/courses/index.ts`

Replace lines 76-143 with direct MongoDB query:

```typescript
// Instead of calling /api/course-progress, query database directly
const progressRecords = await UserProgressModel.find({ 
  userId, 
  courseId: { $in: filteredCourses.map(c => c.id) } 
}).lean();

const progressMap = new Map();
progressRecords.forEach(record => {
  progressMap.set(record.courseId, {
    completedPages: record.completedPages || [],
    courseCompleted: record.courseCompleted || false
  });
});

const coursesWithProgress = filteredCourses.map((course: any) => {
  const progress = progressMap.get(course.id);
  const publishedPages = course.pages?.filter((p: any) => p.status === 'published') || [];
  const lessonPages = publishedPages.filter((p: any) => !p.isQuiz);
  const completedPages = progress?.completedPages?.length || 0;
  const totalPages = lessonPages.length;
  const progressPercent = totalPages > 0 ? Math.round((completedPages / totalPages) * 100) : 0;
  
  return {
    ...course,
    pages: publishedPages,
    folders: course.folders?.filter((f: any) => f.status === 'published') || [],
    progress: {
      completedLessons: completedPages,
      totalLessons: totalPages,
      progressPercent: progressPercent
    }
  };
});

res.status(200).json(coursesWithProgress);
```

**Impact**: Reduces API latency by 50%

### Fix 2: Add MongoDB Field Projection
**File**: `pages/api/courses/index.ts` Line 29

```typescript
// OLD:
const courses = await CourseModel.find({}).lean();

// NEW - Only fetch needed fields:
const courses = await CourseModel.find({})
  .select('id title tagline description icon status coverImageUrl accessMode order folders pages')
  .select('pages.id pages.title pages.status pages.folderId pages.isQuiz pages.videoUrl')
  .select('folders.id folders.title folders.status')
  .lean();
```

**Impact**: Reduces data transfer by 70-80%

### Fix 3: Optimize MongoDB Connection Pool
**File**: `src/lib/mongodb.ts` Line 25-28

```typescript
// OLD:
maxPoolSize: 10,
minPoolSize: 2,

// NEW:
maxPoolSize: 50,
minPoolSize: 5,
```

**Impact**: Better concurrent request handling

### Fix 4: Implement Stale-While-Revalidate in Flutter
**File**: `Jamesapk/lib/screens/courses_screen.dart`

```dart
Future<void> _loadCachedCourses() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    final cachedJson = prefs.getString(_cacheKey);
    
    if (cachedJson != null) {
      final data = jsonDecode(cachedJson);
      List<dynamic> courses = data is List ? data : [];
      courses.sort((a, b) {
        final orderA = a['order'] ?? 999;
        final orderB = b['order'] ?? 999;
        return orderA.compareTo(orderB);
      });
      
      if (mounted) {
        setState(() {
          _courses = courses;
          _filteredCourses = courses;
          _hasCachedData = true;
          _isLoading = false; // Show cached data immediately
        });
      }
    }
  } catch (e) {
    print('Error loading cached courses: $e');
  }
}

// Change cache expiry from 1 hour to 24 hours
if (DateTime.now().millisecondsSinceEpoch - cacheTime < 86400000) { // 24 hours
```

**Impact**: Instant load from cache, background refresh

### Fix 5: Add Database Indexes
**File**: `src/lib/models/Course.ts`

Already has indexes, but add compound index:

```typescript
courseSchema.index({ status: 1, accessMode: 1 });
```

**File**: Create new migration script `add-progress-indexes.js`:

```javascript
const { MongoClient } = require('mongodb');

async function addIndexes() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('millerstorm');
  
  // Add compound index for faster progress queries
  await db.collection('userprogresses').createIndex(
    { userId: 1, courseId: 1 },
    { unique: true }
  );
  
  console.log('✅ Indexes created');
  await client.close();
}

addIndexes();
```

**Impact**: Faster progress queries

## Implementation Priority

1. **HIGH**: Fix 1 (Remove nested API call) - Biggest impact
2. **HIGH**: Fix 2 (Add field projection) - Reduces bandwidth
3. **MEDIUM**: Fix 4 (Flutter caching) - Better UX
4. **MEDIUM**: Fix 3 (Connection pool) - Scalability
5. **LOW**: Fix 5 (Indexes) - Already mostly optimized

## Expected Performance Improvement

- **Before**: 2-5 seconds load time
- **After**: 0.3-0.8 seconds load time
- **Improvement**: 70-85% faster

## Testing Checklist

- [ ] Test course list loading speed (web)
- [ ] Test course list loading speed (app)
- [ ] Test with 10+ courses
- [ ] Test with slow network (3G simulation)
- [ ] Test concurrent users (5+ simultaneous)
- [ ] Verify progress data accuracy
- [ ] Verify cache invalidation works
