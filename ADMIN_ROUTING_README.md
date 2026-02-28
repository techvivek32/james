# Admin Portal - Separate Pages Structure

## Overview
The admin portal has been restructured into separate pages with individual routes. Each admin section now has its own URL.

## Routes Created

| Page | URL | Component |
|------|-----|-----------|
| Dashboard | `/admin/dashboard` | `Dashboard.tsx` |
| User Management | `/admin/user-management` | `UserManagement.tsx` |
| Role & Hierarchy | `/admin/role-hierarchy` | `RoleHierarchy.tsx` |
| Business Units | `/admin/business-units` | `BusinessUnits.tsx` |
| Sales Overview | `/admin/sales-overview` | `SalesOverview.tsx` |
| Marketing Overview | `/admin/marketing-overview` | `MarketingOverview.tsx` |
| Course Management | `/admin/course-management` | `CourseManagement.tsx` |
| Materials Library | `/admin/materials-library` | `MaterialsLibrary.tsx` |
| Approval Workflows | `/admin/approval-workflows` | `ApprovalWorkflows.tsx` |
| AI Bots | `/admin/ai-bots` | `AIBots.tsx` |
| Web Templates | `/admin/web-templates` | `WebTemplates.tsx` |
| Apps/Tools | `/admin/apps-tools` | `AppsTools.tsx` |

## File Structure

```
pages/
  admin/
    dashboard.tsx
    user-management.tsx
    role-hierarchy.tsx
    business-units.tsx
    sales-overview.tsx
    marketing-overview.tsx
    course-management.tsx
    materials-library.tsx
    approval-workflows.tsx
    ai-bots.tsx
    web-templates.tsx
    apps-tools.tsx

src/
  portals/
    admin/
      AdminLayout.tsx          # Shared layout with sidebar & header
      Dashboard.tsx            # Dashboard component
      UserManagement.tsx       # User management component
      RoleHierarchy.tsx        # Role hierarchy component
      BusinessUnits.tsx        # Business units component
      SalesOverview.tsx        # Sales overview component
      MarketingOverview.tsx    # Marketing overview component
      CourseManagement.tsx     # Course management component
      MaterialsLibrary.tsx     # Materials library component
      ApprovalWorkflows.tsx    # Approval workflows component
      AIBots.tsx               # AI bots component
      WebTemplates.tsx         # Web templates component
      AppsTools.tsx            # Apps/tools component
    AdminPortal.tsx            # Original file (kept as reference)
```

## How It Works

1. **AdminLayout.tsx**: Shared layout component that wraps all admin pages
   - Contains the sidebar navigation
   - Contains the header with logout
   - Handles routing between pages
   - Loads user and course data

2. **Page Components**: Each admin section has its own component
   - Wraps content in `<AdminLayout currentView="...">`
   - Contains section-specific content
   - Can be expanded with full functionality

3. **Route Files**: Next.js page files in `/pages/admin/`
   - Each file exports a Next.js page component
   - Imports and renders the corresponding admin component

## Navigation

The sidebar automatically handles navigation using Next.js router:
- Click any sidebar item to navigate to that page
- URL updates to match the selected page
- Browser back/forward buttons work correctly

## Original File

The original `AdminPortal.tsx` file has been kept as a reference. You can:
- Copy functionality from it to the new component files
- Use it as a template for implementing features
- Delete it once migration is complete

## Next Steps

1. Copy content from `AdminPortal.tsx` to individual component files
2. Test each route: `http://localhost:3000/admin/dashboard`, etc.
3. Add authentication checks if needed
4. Implement full functionality for each section
