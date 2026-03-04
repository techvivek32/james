# User Registration & Login Flow - Testing Guide

## Complete Flow Overview

### 1. User Registration (Public)
**URL:** `/register`

**Steps:**
1. User fills registration form:
   - Name: "John Smith"
   - Email: "john.smith@company.com"
   - Role: "Sales" (dropdown: Manager, Sales, Marketing)
   - Password: "password123"
   - Confirm Password: "password123"

2. User clicks "Submit Request"

3. System:
   - Validates all fields
   - Checks password match
   - Hashes password with bcrypt
   - Creates UserRequest in database with status "pending"
   - Shows success message: "Your request has been sent to administration. You will receive access within 24 hours."

4. User sees success screen with "Back to Login" button

---

### 2. Admin Reviews Request
**URL:** `/admin/user-management` → "User Requests" tab

**Steps:**
1. Admin logs in with admin credentials
2. Navigates to User Management page
3. Clicks "User Requests" tab
4. Sees "Pending" tab with new request showing:
   - Name: John Smith
   - Email: john.smith@company.com
   - Role: Sales
   - Requested: [date]

**Admin Actions:**

#### Option A: Approve
1. Admin clicks "Approve" button
2. Confirms approval
3. System:
   - Creates User account in database
   - Copies passwordHash from UserRequest to User
   - Sets role to "sales"
   - Sets all default feature toggles
   - Updates UserRequest status to "approved"
   - Records reviewer name and date
4. Success message: "User approved successfully!"
5. Request moves to "Approved" tab

#### Option B: Reject
1. Admin clicks "Reject" button
2. Dialog opens asking for rejection reason
3. Admin enters reason: "Invalid email domain"
4. Clicks "Reject Request"
5. System:
   - Updates UserRequest status to "rejected"
   - Stores rejection reason
   - Records reviewer name and date
6. Request moves to "Rejected" tab

---

### 3. User Login (After Approval)
**URL:** `/login`

**Steps:**
1. User enters credentials:
   - Email: "john.smith@company.com"
   - Password: "password123"

2. User clicks "Sign In"

3. System:
   - Finds user by email
   - Compares password with stored passwordHash using bcrypt
   - Validates password matches
   - Returns user data with role

4. System redirects based on role:
   - **Sales** → `/sales/dashboard`
   - **Manager** → `/manager/dashboard`
   - **Marketing** → `/marketing/dashboard`
   - **Admin** → `/admin/dashboard`

5. User sees their respective portal dashboard

---

## Database Flow

### Registration Request Created:
```javascript
{
  id: "req-1234567890",
  name: "John Smith",
  email: "john.smith@company.com",
  passwordHash: "$2a$10$...", // bcrypt hashed
  role: "sales",
  status: "pending",
  requestedAt: "2026-03-04T10:00:00Z"
}
```

### After Admin Approval:
```javascript
// UserRequest updated:
{
  id: "req-1234567890",
  status: "approved",
  reviewedAt: "2026-03-04T11:00:00Z",
  reviewedBy: "Alex Morgan"
}

// User created:
{
  id: "user-1234567891",
  name: "John Smith",
  email: "john.smith@company.com",
  role: "sales",
  passwordHash: "$2a$10$...", // SAME hash from request
  strengths: "",
  weaknesses: "",
  publicProfile: { ... },
  featureToggles: { ... }
}
```

### Login Authentication:
```javascript
// User enters: "password123"
// System:
1. Finds user by email
2. bcrypt.compare("password123", user.passwordHash)
3. Returns true → Login successful
4. Redirects to /sales/dashboard
```

---

## Security Features

1. **Password Hashing:** Passwords are hashed with bcrypt (10 rounds) during registration
2. **Password Never Stored:** Only passwordHash is stored in database
3. **Duplicate Prevention:** 
   - Cannot register with existing user email
   - Cannot have multiple pending requests with same email
4. **Role-Based Access:** Users can only access their role's portal
5. **Suspended Account Check:** Login fails if account is suspended

---

## Testing Checklist

### Registration Tests:
- [ ] Can access `/register` page
- [ ] Form validates all required fields
- [ ] Password confirmation works
- [ ] Cannot submit with mismatched passwords
- [ ] Cannot register with existing email
- [ ] Success message shows after submission
- [ ] Can return to login page

### Admin Review Tests:
- [ ] Admin can see User Requests tab
- [ ] Pending requests show in Pending tab
- [ ] Can approve request
- [ ] Can reject request with reason
- [ ] Approved requests move to Approved tab
- [ ] Rejected requests move to Rejected tab
- [ ] Cannot approve/reject already processed requests

### Login Tests:
- [ ] Approved user can login with registered email/password
- [ ] Login redirects to correct role dashboard
- [ ] Sales → `/sales/dashboard`
- [ ] Manager → `/manager/dashboard`
- [ ] Marketing → `/marketing/dashboard`
- [ ] Wrong password shows error
- [ ] Non-existent email shows error
- [ ] Rejected user cannot login (no account created)

---

## Example Test Scenario

**Test User Registration:**
```
Name: Test Sales Rep
Email: test.sales@company.com
Password: TestPass123
Role: Sales
```

**Admin Approval:**
1. Login as admin: alex.morgan@company.com / admin123
2. Go to User Management → User Requests
3. Approve "Test Sales Rep"

**User Login:**
1. Go to /login
2. Email: test.sales@company.com
3. Password: TestPass123
4. Should redirect to /sales/dashboard
5. Should see Sales Team Portal with all features

---

## Troubleshooting

**User cannot login after approval:**
- Check if User was created in database
- Verify passwordHash was copied from UserRequest
- Check if email matches exactly (case-insensitive)
- Verify user is not suspended

**Registration fails:**
- Check MongoDB connection
- Verify all required fields are filled
- Check for duplicate email in users or pending requests

**Admin cannot see requests:**
- Verify admin is logged in
- Check if UserRequest collection exists
- Verify API endpoint is working: GET /api/user-requests
