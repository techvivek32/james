# Apps & Tools Module

## Overview
The Apps & Tools module allows admins to create and manage apps, tools, and other resources that are automatically visible across all three portals: Sales, Marketing, and Manager.

## What Was Created

### 1. Database Model
- **File**: `src/lib/models/AppTool.ts`
- Stores app/tool information in MongoDB with fields:
  - title
  - imageUrl
  - description
  - link
  - category (apps, tools, or other)

### 2. API Endpoints
- **GET/POST** `/api/apps-tools` - List all apps/tools or create new ones
- **PUT/DELETE** `/api/apps-tools/[id]` - Update or delete specific app/tool

### 3. Admin Interface (Updated)
- **File**: `src/portals/admin/AppsTools.tsx`
- Admins can create, view, and delete apps/tools
- Organized into three categories: Apps, Tools, Other
- Supports image upload and external links

### 4. Viewer Component
- **File**: `src/components/AppsToolsViewer.tsx`
- Read-only component that displays all apps/tools
- Used across Sales, Marketing, and Manager portals

### 5. Portal Pages
Created new pages for each portal:
- **Sales**: `pages/sales/apps-tools.tsx` → `/sales/apps-tools`
- **Marketing**: `pages/marketing/apps-tools.tsx` → `/marketing/apps-tools`
- **Manager**: `pages/manager/apps-tools.tsx` → `/manager/apps-tools`

### 6. Sidebar Updates
Added "Apps & Tools" menu item to:
- `src/components/SalesSidebar.tsx`
- `src/components/MarketingSidebar.tsx`
- `src/components/ManagerSidebar.tsx`

## How It Works

1. **Admin creates an app/tool**:
   - Go to `/admin/apps-tools`
   - Click "+ Create App/Tool/Other"
   - Fill in title, image, description, and link
   - Click "Create"

2. **Data is saved to MongoDB**:
   - API endpoint stores the data with category

3. **All portals see the content**:
   - Sales, Marketing, and Manager users can navigate to "Apps & Tools"
   - They see all apps/tools created by admin
   - They can click links to open external resources

## Usage

### For Admins
1. Navigate to Admin Portal → Apps & Tools
2. Create new apps, tools, or other resources
3. Add images (400x300px recommended)
4. Add descriptions and external links
5. Delete items when no longer needed

### For Sales/Marketing/Manager Users
1. Navigate to their portal
2. Click "Apps & Tools" in the sidebar
3. View all available apps and tools
4. Click "Open" to access external links

## Routes
- Admin: `http://localhost:3000/admin/apps-tools`
- Sales: `http://localhost:3000/sales/apps-tools`
- Marketing: `http://localhost:3000/marketing/apps-tools`
- Manager: `http://localhost:3000/manager/apps-tools`
