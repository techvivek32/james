# Social Media Metrics Management - Complete Guide

## Overview
Admin can now manage social media metrics (Instagram, Facebook, TikTok, YouTube) that display on the Admin Dashboard in real-time.

---

## Features

### 1. Social Media Metrics Page
**Location:** Admin Panel → Social Media Metrics

**Capabilities:**
- ✅ Add new social media platforms
- ✅ Edit followers, posts, and views
- ✅ Delete platforms
- ✅ Save all changes to database
- ✅ View summary totals

### 2. Admin Dashboard Integration
**Location:** Admin Panel → Dashboard

**Display:**
- Total Followers (sum of all platforms)
- Posts (Last 30 Days) (sum of all platforms)
- Views (Last 30 Days) (sum of all platforms)
- Detailed breakdown by platform
- "Manage Metrics" button to edit data

---

## How to Use

### Adding a New Platform

1. Go to: **Admin Panel → Social Media Metrics**
2. Click **"+ Add Platform"**
3. Select platform from dropdown:
   - Instagram
   - Facebook
   - TikTok
   - YouTube
4. Enter metrics:
   - **Followers:** Total follower count
   - **Posts (30d):** Number of posts in last 30 days
   - **Views (30d):** Total views in last 30 days
5. Click **"Done"** to finish editing
6. Click **"Save All Changes"** to save to database

### Editing Existing Metrics

1. Go to: **Admin Panel → Social Media Metrics**
2. Find the platform you want to edit
3. Click **"Edit"** button
4. Update the values
5. Click **"Done"**
6. Click **"Save All Changes"**

### Deleting a Platform

1. Go to: **Admin Panel → Social Media Metrics**
2. Find the platform you want to delete
3. Click **"Delete"** button
4. Confirm deletion
5. Platform is removed immediately

---

## Database Structure

### Collection: `socialMediaMetrics`

```javascript
{
  _id: ObjectId("..."),
  id: "social-instagram-1",
  platform: "instagram",        // enum: instagram, facebook, tiktok, youtube
  platformName: "Instagram",
  followers: 18250,
  posts30d: 36,
  views30d: 245000,
  lastUpdated: ISODate("2026-03-04T10:00:00Z"),
  createdAt: ISODate("2026-03-04T10:00:00Z"),
  updatedAt: ISODate("2026-03-04T10:00:00Z")
}
```

---

## API Endpoints

### GET `/api/social-media-metrics`
**Description:** Fetch all social media metrics

**Response:**
```json
[
  {
    "id": "social-instagram-1",
    "platform": "instagram",
    "platformName": "Instagram",
    "followers": 18250,
    "posts30d": 36,
    "views30d": 245000,
    "lastUpdated": "2026-03-04T10:00:00Z"
  }
]
```

### POST `/api/social-media-metrics`
**Description:** Create a new metric

**Request:**
```json
{
  "platform": "instagram",
  "platformName": "Instagram",
  "followers": 18250,
  "posts30d": 36,
  "views30d": 245000
}
```

### PUT `/api/social-media-metrics`
**Description:** Update all metrics (bulk update)

**Request:**
```json
[
  {
    "id": "social-instagram-1",
    "platform": "instagram",
    "platformName": "Instagram",
    "followers": 20000,
    "posts30d": 40,
    "views30d": 300000
  }
]
```

### PUT `/api/social-media-metrics/[id]`
**Description:** Update a single metric

**Request:**
```json
{
  "platform": "instagram",
  "platformName": "Instagram",
  "followers": 20000,
  "posts30d": 40,
  "views30d": 300000
}
```

### DELETE `/api/social-media-metrics/[id]`
**Description:** Delete a metric

**Response:**
```json
{
  "message": "Metric deleted successfully"
}
```

---

## Setup Instructions

### 1. Seed Initial Data (Optional)

Run the seed script to add sample data:

```bash
node seed-social-metrics.js
```

This will create 4 platforms with sample data:
- Instagram: 18,250 followers
- Facebook: 9,450 followers
- TikTok: 30,420 followers
- YouTube: 12,780 followers

### 2. Access the Feature

1. Login as admin
2. Go to: **Admin Panel → Social Media Metrics**
3. Add/Edit/Delete metrics as needed
4. View results on **Admin Panel → Dashboard**

---

## Admin Dashboard Display

### Summary Cards:
```
┌─────────────────────┬─────────────────────┬─────────────────────┐
│ Total Followers     │ Posts (Last 30 Days)│ Views (Last 30 Days)│
│ 70,900             │ 94                  │ 1,376,000          │
└─────────────────────┴─────────────────────┴─────────────────────┘
```

### Detailed Breakdown:
```
Platform    Followers    Posts (30 days)    Views (30 days)
─────────────────────────────────────────────────────────────
📷 Instagram   18,250          36              245,000
👥 Facebook     9,450          18              121,000
🎵 TikTok      30,420          28              612,000
▶️ YouTube     12,780          12              398,000
```

---

## Files Created

### Components:
1. `src/portals/admin/SocialMediaMetrics.tsx` - Management UI

### API Routes:
2. `pages/api/social-media-metrics/index.ts` - List/Create/Bulk Update
3. `pages/api/social-media-metrics/[id].ts` - Update/Delete single metric

### Pages:
4. `pages/admin/social-media-metrics.tsx` - Admin page

### Models:
5. `src/lib/models/SocialMediaMetrics.ts` - Database model

### Scripts:
6. `seed-social-metrics.js` - Seed initial data

### Documentation:
7. `SOCIAL_MEDIA_METRICS_GUIDE.md` - This file

---

## Files Modified

1. `src/components/AdminSidebar.tsx` - Added "Social Media Metrics" menu item
2. `src/portals/admin/Dashboard.tsx` - Fetch real data from database instead of static data

---

## Features Summary

### Admin Can:
- ✅ Add new social media platforms
- ✅ Edit follower counts
- ✅ Edit post counts (last 30 days)
- ✅ Edit view counts (last 30 days)
- ✅ Delete platforms
- ✅ Save changes to database
- ✅ View real-time totals
- ✅ See data reflected on dashboard immediately

### Dashboard Shows:
- ✅ Real data from database (not static)
- ✅ Total followers across all platforms
- ✅ Total posts in last 30 days
- ✅ Total views in last 30 days
- ✅ Breakdown by platform
- ✅ "Manage Metrics" button for quick access

---

## Testing Checklist

- [ ] Can access Social Media Metrics page
- [ ] Can add new platform
- [ ] Can edit existing metrics
- [ ] Can delete platform
- [ ] Changes save to database
- [ ] Dashboard shows updated data
- [ ] Summary totals calculate correctly
- [ ] Platform icons display correctly
- [ ] "Manage Metrics" button works
- [ ] Empty state shows when no metrics

---

## Usage Tips

1. **Update Regularly:** Update metrics weekly or monthly to keep dashboard current
2. **Consistent Timing:** Update all platforms at the same time for accurate comparisons
3. **Track Trends:** Keep historical data by noting changes over time
4. **Use Real Data:** Connect to social media APIs for automatic updates (future enhancement)

---

## Future Enhancements

Potential improvements:
- Auto-sync with social media APIs
- Historical data tracking and charts
- Engagement rate calculations
- Growth percentage indicators
- Export metrics to CSV
- Scheduled automatic updates
- Email alerts for milestone achievements

---

## Troubleshooting

### Metrics not showing on dashboard?
1. Check if metrics exist in database
2. Verify API endpoint is working: GET `/api/social-media-metrics`
3. Check browser console for errors
4. Refresh the dashboard page

### Can't save changes?
1. Check MongoDB connection
2. Verify all required fields are filled
3. Check server console for errors
4. Try saving one metric at a time

### Dashboard shows 0 for all metrics?
1. Run seed script: `node seed-social-metrics.js`
2. Or manually add metrics via Social Media Metrics page
3. Refresh dashboard after adding data

---

## Summary

You now have a complete social media metrics management system where:
- Admin can manage metrics for Instagram, Facebook, TikTok, and YouTube
- All data is stored in MongoDB
- Dashboard displays real-time data from database
- Full CRUD operations (Create, Read, Update, Delete)
- Professional UI with summary cards and detailed tables

The static data has been replaced with dynamic database-driven content! 🎉
