# Social Media Metrics - Troubleshooting Guide

## Issue: Metrics Not Saving

### Quick Fixes:

#### 1. Check Browser Console
Open browser console (F12) and look for errors when clicking "Save All Changes"

**Expected logs:**
```
Saving metrics: [...]
Save response: {message: "Metrics updated successfully"}
Loading metrics...
Loaded metrics: [...]
```

**If you see errors:**
- Check the error message
- Verify MongoDB is running
- Check server console for API errors

#### 2. Check Server Console
Look at your terminal where `npm run dev` is running

**Expected logs:**
```
Saving metrics: [...]
Metrics saved successfully
```

**If you see errors:**
- MongoDB connection error → Check MongoDB is running
- Model error → Check if model is imported correctly
- Validation error → Check data format

#### 3. Test API Directly

Run the test script:
```bash
node test-social-metrics-api.js
```

This will test:
- GET /api/social-media-metrics
- PUT /api/social-media-metrics
- Data persistence

#### 4. Check MongoDB

Connect to MongoDB and verify data:
```bash
mongosh
use millerstorm
db.socialmediamet rics.find().pretty()
```

**Expected output:**
```javascript
{
  _id: ObjectId("..."),
  id: "social-instagram-...",
  platform: "instagram",
  platformName: "Instagram",
  followers: 25000,
  posts30d: 45,
  views30d: 350000,
  lastUpdated: ISODate("...")
}
```

---

## Common Issues & Solutions

### Issue 1: "Failed to save metrics"

**Cause:** API endpoint not responding

**Solution:**
1. Check server is running: `npm run dev`
2. Check MongoDB is running: `mongod` or `brew services start mongodb-community`
3. Check `.env` has correct MongoDB URI:
   ```
   MONGODB_URI=mongodb://localhost:27017/millerstorm
   ```
4. Restart server after changing `.env`

### Issue 2: Metrics save but don't appear on dashboard

**Cause:** Dashboard not fetching data

**Solution:**
1. Open browser console on dashboard page
2. Look for "Dashboard: Loading social metrics..." log
3. Check if data is returned
4. Refresh the page (Ctrl+R or Cmd+R)
5. Clear browser cache

### Issue 3: "Expected array of metrics" error

**Cause:** Wrong data format sent to API

**Solution:**
1. Check browser console for the data being sent
2. Verify it's an array: `[{...}, {...}]`
3. Check each metric has required fields:
   - id
   - platform
   - platformName
   - followers
   - posts30d
   - views30d

### Issue 4: New metrics have ID "social-new-..."

**Cause:** Metrics not saved yet

**Solution:**
1. Click "Edit" on the new metric
2. Enter values
3. Click "Done"
4. Click "Save All Changes"
5. Wait for success message
6. Page will reload with proper IDs

### Issue 5: Dashboard shows "No social media metrics configured"

**Cause:** No data in database

**Solution:**
1. Run seed script: `node seed-social-metrics.js`
2. Or manually add metrics via Social Media Metrics page
3. Refresh dashboard

---

## Step-by-Step Debugging

### Step 1: Verify Server is Running
```bash
# Terminal should show:
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

### Step 2: Verify MongoDB is Running
```bash
# Check MongoDB status
mongosh --eval "db.adminCommand('ping')"

# Should output:
{ ok: 1 }
```

### Step 3: Test API Endpoint
```bash
# Test GET
curl http://localhost:3000/api/social-media-metrics

# Should return JSON array
```

### Step 4: Check Database Connection
```bash
# In MongoDB shell
mongosh
use millerstorm
show collections

# Should show: socialmediamet rics
```

### Step 5: Verify Model is Loaded
Check server console when server starts. Should see:
```
✓ Compiled /api/social-media-metrics in XXXms
```

---

## Manual Testing Steps

### Test 1: Add New Metric
1. Go to: http://localhost:3000/admin/social-media-metrics
2. Click "+ Add Platform"
3. Select "Instagram"
4. Enter:
   - Followers: 10000
   - Posts: 20
   - Views: 50000
5. Click "Done"
6. Click "Save All Changes"
7. Wait for "Metrics saved successfully!" alert
8. Check if metric appears with proper ID (not "social-new-...")

### Test 2: Edit Existing Metric
1. Click "Edit" on any metric
2. Change followers to 99999
3. Click "Done"
4. Click "Save All Changes"
5. Refresh page
6. Verify followers shows 99999

### Test 3: Delete Metric
1. Click "Delete" on any metric
2. Confirm deletion
3. Metric should disappear immediately
4. Refresh page
5. Verify metric is still gone

### Test 4: View on Dashboard
1. Go to: http://localhost:3000/admin/dashboard
2. Scroll to "Social Media Dashboard" section
3. Should show:
   - Total Followers (sum of all)
   - Posts (Last 30 Days) (sum of all)
   - Views (Last 30 Days) (sum of all)
4. Click "Show Details" to see breakdown
5. Should show all platforms with correct data

---

## API Endpoint Reference

### GET /api/social-media-metrics
**Returns:** Array of all metrics
```json
[
  {
    "_id": "...",
    "id": "social-instagram-1",
    "platform": "instagram",
    "platformName": "Instagram",
    "followers": 25000,
    "posts30d": 45,
    "views30d": 350000,
    "lastUpdated": "2026-03-04T10:00:00Z"
  }
]
```

### PUT /api/social-media-metrics
**Accepts:** Array of metrics
**Returns:** Success message
```json
{
  "message": "Metrics updated successfully"
}
```

### DELETE /api/social-media-metrics/[id]
**Returns:** Success message
```json
{
  "message": "Metric deleted successfully"
}
```

---

## Reset Everything

If nothing works, reset the feature:

```bash
# 1. Stop server (Ctrl+C)

# 2. Clear database
mongosh
use millerstorm
db.socialmediamet rics.deleteMany({})
exit

# 3. Seed fresh data
node seed-social-metrics.js

# 4. Restart server
npm run dev

# 5. Clear browser cache (Ctrl+Shift+Delete)

# 6. Test again
```

---

## Still Not Working?

### Check These Files:

1. **Model exists:**
   ```bash
   ls src/lib/models/SocialMediaMetrics.ts
   ```

2. **API routes exist:**
   ```bash
   ls pages/api/social-media-metrics/index.ts
   ls pages/api/social-media-metrics/[id].ts
   ```

3. **Component exists:**
   ```bash
   ls src/portals/admin/SocialMediaMetrics.tsx
   ```

4. **Page exists:**
   ```bash
   ls pages/admin/social-media-metrics.tsx
   ```

### Check Imports:

In `pages/api/social-media-metrics/index.ts`:
```typescript
import { SocialMediaMetricsModel } from "../../../src/lib/models/SocialMediaMetrics";
```

In `src/portals/admin/Dashboard.tsx`:
```typescript
const [socialMetrics, setSocialMetrics] = useState<SocialMetric[]>([]);
```

---

## Success Checklist

- [ ] Server running without errors
- [ ] MongoDB running and accessible
- [ ] Can access /admin/social-media-metrics page
- [ ] Can add new platform
- [ ] Can edit existing metrics
- [ ] Can delete metrics
- [ ] "Save All Changes" shows success alert
- [ ] Page reloads with updated data
- [ ] Dashboard shows metrics in "Social Media Dashboard" section
- [ ] Summary totals calculate correctly
- [ ] Detailed breakdown shows all platforms

---

## Contact Support

If you've tried everything and it still doesn't work:

1. Check browser console for errors (F12)
2. Check server console for errors
3. Run test script: `node test-social-metrics-api.js`
4. Share error messages for debugging
