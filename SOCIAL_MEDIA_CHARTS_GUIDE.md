# Social Media Dashboard Charts - Feature Guide

## Overview
The Admin Dashboard now displays beautiful interactive charts for social media metrics with hover tooltips showing detailed information.

---

## Layout

### Two-Column Design:

```
┌─────────────────────────────────────────────────────────────┐
│                  Social Media Dashboard                      │
├──────────────────────────┬──────────────────────────────────┤
│  LEFT SIDE               │  RIGHT SIDE                       │
│  (Data Table)            │  (Interactive Charts)             │
│                          │                                   │
│  Summary Cards:          │  📊 Followers Chart               │
│  - Total Followers       │  ████████████ Instagram           │
│  - Posts (30 Days)       │  ██████ Facebook                  │
│  - Views (30 Days)       │  ████████████████ TikTok          │
│                          │  ██████████ YouTube               │
│  Detailed Table:         │                                   │
│  Platform | Followers    │  📊 Posts Chart                   │
│  Instagram | 18,250      │  ████████ Instagram               │
│  Facebook  | 9,450       │  ██████ Facebook                  │
│  TikTok    | 30,420      │  ████████ TikTok                  │
│  YouTube   | 12,780      │  ████ YouTube                     │
│                          │                                   │
│                          │  📊 Views Chart                   │
│                          │  ████████ Instagram               │
│                          │  ████ Facebook                    │
│                          │  ████████████████ TikTok          │
│                          │  ████████████ YouTube             │
└──────────────────────────┴──────────────────────────────────┘
```

---

## Chart Features

### 1. Followers Chart
- **Color-coded bars** by platform:
  - Instagram: Pink (#E4405F)
  - Facebook: Blue (#1877F2)
  - TikTok: Black (#000000)
  - YouTube: Red (#FF0000)
- **Hover effect**: Bar scales up slightly
- **Tooltip**: Shows exact follower count
- **Platform icons**: 📷 Instagram, 👥 Facebook, 🎵 TikTok, ▶️ YouTube

### 2. Posts Chart (Last 30 Days)
- Same color scheme as followers
- Shows number of posts in last 30 days
- Hover tooltip displays exact post count
- Bars scale proportionally to max value

### 3. Views Chart (Last 30 Days)
- Same color scheme as followers
- Shows total views in last 30 days
- Hover tooltip displays exact view count
- Bars scale proportionally to max value

---

## Interactive Features

### Hover Tooltips:
When you hover over any bar:
1. **Bar animation**: Scales up (10% larger)
2. **Shadow effect**: Adds depth
3. **Tooltip appears**: Shows exact value
4. **Tooltip position**: Centered above the bar
5. **Arrow pointer**: Points to the bar

**Tooltip Example:**
```
┌─────────────────┐
│ 18,250 followers│
└────────┬────────┘
         │
    ████████████
```

### Smooth Transitions:
- All animations use CSS transitions (0.3s ease)
- Bars grow/shrink smoothly
- Tooltips fade in/out
- No jarring movements

---

## Color Scheme

### Platform Colors:
```css
Instagram: #E4405F (Pink/Red)
Facebook:  #1877F2 (Blue)
TikTok:    #000000 (Black)
YouTube:   #FF0000 (Red)
```

### UI Colors:
```css
Background:     #f3f4f6 (Light Gray)
Text:           #111827 (Dark Gray)
Hover Tooltip:  #111827 (Dark Gray)
Tooltip Text:   #ffffff (White)
```

---

## Responsive Design

### Chart Scaling:
- Bars scale relative to maximum value
- If Instagram has 30,000 followers (max), it shows 100% width
- If Facebook has 15,000 followers, it shows 50% width
- Ensures visual comparison is accurate

### Layout:
- Two-column grid on desktop
- Left: Data table (50% width)
- Right: Charts (50% width)
- Responsive to container size

---

## Data Flow

### 1. Data Loading:
```javascript
// Dashboard loads metrics from API
const [socialMetrics, setSocialMetrics] = useState([]);

// Fetch from database
fetch("/api/social-media-metrics")
  .then(res => res.json())
  .then(data => setSocialMetrics(data));
```

### 2. Data Transformation:
```javascript
// Convert to chart format
const socialPlatforms = socialMetrics.map(metric => ({
  id: metric.platform,
  name: metric.platformName,
  followers: metric.followers,
  posts30d: metric.posts30d,
  views30d: metric.views30d
}));
```

### 3. Chart Rendering:
```javascript
// Pass to chart component
<SocialMediaCharts platforms={socialPlatforms} />
```

---

## Component Structure

### File: `src/components/SocialMediaCharts.tsx`

**Props:**
```typescript
type Platform = {
  id: string;           // "instagram", "facebook", etc.
  name: string;         // "Instagram", "Facebook", etc.
  followers: number;    // Total followers
  posts30d: number;     // Posts in last 30 days
  views30d: number;     // Views in last 30 days
};

type SocialMediaChartsProps = {
  platforms: Platform[];
};
```

**State:**
```typescript
const [hoveredBar, setHoveredBar] = useState<{
  type: string;      // "followers", "posts", "views"
  platform: string;  // "instagram", "facebook", etc.
  value: number;     // Actual value
} | null>(null);
```

---

## Usage

### In Admin Dashboard:

1. **Navigate to:** Admin Panel → Dashboard
2. **Scroll to:** "Social Media Dashboard" section
3. **View charts:** Right side shows interactive charts
4. **Hover over bars:** See detailed tooltips
5. **Toggle details:** Click "Hide Details" to collapse table

### Managing Data:

1. **Click:** "Manage Metrics" button
2. **Edit:** Update follower counts, posts, views
3. **Save:** Click "Save All Changes"
4. **Refresh:** Dashboard updates automatically
5. **Charts update:** Bars resize based on new data

---

## Chart Calculations

### Bar Width Calculation:
```javascript
// Find maximum value
const maxFollowers = Math.max(...platforms.map(p => p.followers));

// Calculate percentage for each platform
const percentage = (platform.followers / maxFollowers) * 100;

// Apply to bar width
<div style={{ width: `${percentage}%` }} />
```

### Example:
```
Instagram: 30,000 followers (max) → 100% width
Facebook:  15,000 followers       → 50% width
TikTok:    22,500 followers       → 75% width
YouTube:   10,000 followers       → 33% width
```

---

## Customization

### Change Colors:
Edit `src/components/SocialMediaCharts.tsx`:
```typescript
const platformColors: Record<string, string> = {
  instagram: "#E4405F",  // Change to your color
  facebook: "#1877F2",
  tiktok: "#000000",
  youtube: "#FF0000"
};
```

### Change Icons:
```typescript
const platformIcons: Record<string, string> = {
  instagram: "📷",  // Change to your emoji
  facebook: "👥",
  tiktok: "🎵",
  youtube: "▶️"
};
```

### Adjust Bar Height:
```typescript
<div style={{ 
  height: 32,  // Change this value (in pixels)
  // ...
}} />
```

### Adjust Hover Scale:
```typescript
transform: isHovered ? "scaleY(1.1)" : "scaleY(1)",
// Change 1.1 to 1.2 for 20% scale, etc.
```

---

## Browser Compatibility

### Supported Browsers:
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Features Used:
- CSS Grid
- CSS Transitions
- Flexbox
- Hover states
- Absolute positioning

---

## Performance

### Optimizations:
- No external chart libraries (pure CSS/React)
- Minimal re-renders (useState for hover only)
- CSS transitions (GPU accelerated)
- No canvas rendering
- Lightweight component (~200 lines)

### Load Time:
- Instant rendering
- No library downloads
- No chart initialization
- Smooth 60fps animations

---

## Accessibility

### Features:
- Semantic HTML structure
- Color contrast meets WCAG AA
- Hover states for mouse users
- Keyboard navigation support (future enhancement)
- Screen reader friendly (future enhancement)

---

## Future Enhancements

Potential improvements:
- [ ] Click to drill down into platform details
- [ ] Export chart as image
- [ ] Animated bar growth on page load
- [ ] Historical data comparison
- [ ] Trend indicators (↑ ↓)
- [ ] Percentage change from last period
- [ ] Custom date range selection
- [ ] Real-time updates via WebSocket

---

## Troubleshooting

### Charts not showing?
1. Check if metrics exist in database
2. Run: `node seed-social-metrics.js`
3. Refresh dashboard page
4. Check browser console for errors

### Bars not scaling correctly?
1. Verify data has numeric values
2. Check max value calculation
3. Ensure percentage is between 0-100

### Tooltips not appearing?
1. Check hover state is working
2. Verify tooltip positioning
3. Check z-index values
4. Clear browser cache

### Colors not matching platform?
1. Check platform ID matches color key
2. Verify platformColors object
3. Check CSS specificity

---

## Summary

The Social Media Dashboard now features:
- ✅ Two-column layout (table + charts)
- ✅ Three interactive bar charts
- ✅ Hover tooltips with exact values
- ✅ Platform-specific colors
- ✅ Smooth animations
- ✅ Responsive design
- ✅ Real-time data from database
- ✅ No external dependencies

The charts provide a visual representation of your social media performance at a glance! 📊
