# Forgot Password Feature - Implementation Summary

## ✅ What Was Implemented

### 1. User-Facing Pages
- **`/forgot-password`** - Request password reset
- **`/reset-password?token=xxx`** - Set new password
- Updated **`/login`** - Added "Forgot Password" link

### 2. API Endpoints
- **POST `/api/forgot-password`** - Generate reset token and send email
- **GET `/api/reset-password?token=xxx`** - Verify token validity
- **POST `/api/reset-password`** - Reset password with token

### 3. Database Models
- **PasswordReset** - Stores reset tokens with expiration

### 4. Email System
- **Email service** (`src/lib/email.ts`) - Send emails via SMTP
- **Email template** - Professional HTML email with branding
- **Plain text fallback** - For email clients without HTML support

### 5. Security Features
- ✅ Secure token generation (crypto.randomBytes)
- ✅ Token expiration (1 hour)
- ✅ One-time use tokens
- ✅ No email enumeration
- ✅ Admin protection (admins cannot reset via email)
- ✅ Suspended account protection
- ✅ Password hashing with bcrypt

---

## 📁 Files Created

### Pages:
1. `pages/forgot-password.tsx` - Request reset page
2. `pages/reset-password.tsx` - Set new password page

### API Routes:
3. `pages/api/forgot-password.ts` - Handle reset requests
4. `pages/api/reset-password.ts` - Handle password reset

### Libraries:
5. `src/lib/email.ts` - Email sending functionality
6. `src/lib/models/PasswordReset.ts` - Database model

### Documentation:
7. `SMTP_SETUP_GUIDE.md` - Email provider setup guide
8. `FORGOT_PASSWORD_FLOW.md` - Feature documentation
9. `FORGOT_PASSWORD_SUMMARY.md` - This file
10. `setup-forgot-password.sh` - Setup script

### Configuration:
11. Updated `package.json` - Added nodemailer dependency
12. Updated `.env` - Added SMTP configuration

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer @types/bcryptjs
```

Or run the setup script:
```bash
bash setup-forgot-password.sh
```

### 2. Configure SMTP (Choose One)

#### Option A: Gmail (Development)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Get App Password:**
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords

#### Option B: Mailtrap (Testing - No Real Emails)
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

**Sign up:** https://mailtrap.io/

#### Option C: SendGrid (Production)
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

**Sign up:** https://sendgrid.com/

### 3. Update .env File
```env
MONGODB_URI=mongodb://localhost:27017/millerstorm
NEXT_PUBLIC_APP_URL=http://localhost:3000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM="Miller Storm OS <noreply@millerstorm.com>"
```

### 4. Start Server
```bash
npm run dev
```

### 5. Test the Feature
1. Go to http://localhost:3000/login
2. Click "Forgot Password"
3. Enter email: `chris.lee@company.com` (or any test user)
4. Check email inbox (or Mailtrap)
5. Click reset link
6. Set new password
7. Login with new password

---

## 🔐 Security Features Explained

### 1. No Email Enumeration
**Problem:** Attackers can discover valid emails by checking error messages.

**Solution:** Always return the same success message, whether email exists or not.

```javascript
// Always returns 200 OK
res.status(200).json({ 
  message: "If an account exists with this email, you will receive a password reset link shortly." 
});
```

### 2. Secure Token Generation
**Problem:** Predictable tokens can be guessed.

**Solution:** Use cryptographically secure random tokens.

```javascript
const token = crypto.randomBytes(32).toString("hex"); // 64-char hex string
```

### 3. Token Expiration
**Problem:** Old tokens can be used indefinitely.

**Solution:** Tokens expire after 1 hour.

```javascript
const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
```

### 4. One-Time Use
**Problem:** Tokens can be reused multiple times.

**Solution:** Mark tokens as "used" after password reset.

```javascript
resetRequest.used = true;
resetRequest.usedAt = new Date();
```

### 5. Admin Protection
**Problem:** Attackers can reset admin passwords.

**Solution:** Admins cannot reset password via email.

```javascript
if (user.role === "admin") {
  // Return success but don't send email
  return;
}
```

### 6. Suspended Account Protection
**Problem:** Suspended users can circumvent suspension.

**Solution:** Suspended users cannot reset password.

```javascript
if (user.suspended) {
  // Return success but don't send email
  return;
}
```

---

## 📧 Email Template Preview

### Subject:
```
Reset Your Password - Miller Storm OS
```

### Content:
```
Hi [Name],

We received a request to reset your password for your Miller Storm OS account.

Click the button below to reset your password:

[Reset Password Button]

Or copy and paste this link into your browser:
http://localhost:3000/reset-password?token=abc123...

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, you can safely ignore this email.

© 2026-2027 Miller Storm. All Rights Reserved.
```

---

## 🧪 Testing Checklist

### Setup:
- [ ] Dependencies installed (`nodemailer`)
- [ ] SMTP credentials configured in `.env`
- [ ] Server restarted after `.env` changes

### Forgot Password Page:
- [ ] Can access `/forgot-password`
- [ ] Form validates email
- [ ] Shows success message after submission
- [ ] "Back to Login" link works

### Email Delivery:
- [ ] Email received in inbox (or Mailtrap)
- [ ] Email has correct subject
- [ ] Email has user's name
- [ ] Reset link is clickable
- [ ] Plain text link is included

### Reset Password Page:
- [ ] Reset link opens `/reset-password?token=xxx`
- [ ] Token is verified successfully
- [ ] Shows user's email
- [ ] Password fields work
- [ ] Show/hide password toggles work
- [ ] Password confirmation validates
- [ ] Shows success message after reset

### Login:
- [ ] Can login with new password
- [ ] Redirects to correct role dashboard
- [ ] Old password doesn't work

### Security:
- [ ] Non-existent email shows same success message
- [ ] Admin email shows same success message (no email sent)
- [ ] Suspended user shows same success message (no email sent)
- [ ] Expired token shows error
- [ ] Used token shows error
- [ ] Invalid token shows error

---

## 🎯 User Roles Supported

### ✅ Can Reset Password:
- **Sales** - Full access to forgot password feature
- **Manager** - Full access to forgot password feature
- **Marketing** - Full access to forgot password feature

### ❌ Cannot Reset Password:
- **Admin** - Must contact super admin for password reset

---

## 🔄 Complete User Flow

```
1. User forgets password
   ↓
2. Clicks "Forgot Password" on login page
   ↓
3. Enters email address
   ↓
4. Receives email with reset link
   ↓
5. Clicks link in email
   ↓
6. Enters new password (twice)
   ↓
7. Clicks "Reset Password"
   ↓
8. Sees success message
   ↓
9. Clicks "Go to Login"
   ↓
10. Logs in with new password
   ↓
11. Redirected to role dashboard
```

---

## 📊 Database Schema

### PasswordReset Collection:
```javascript
{
  _id: ObjectId("..."),
  id: "reset-1234567890",           // Unique identifier
  userId: "user-123",                // Reference to User
  email: "user@company.com",         // User's email
  token: "abc123...xyz",             // 64-char hex token
  expiresAt: ISODate("2026-03-04T12:00:00Z"), // 1 hour expiration
  used: false,                       // Token usage flag
  usedAt: null,                      // When token was used
  createdAt: ISODate("2026-03-04T11:00:00Z"),
  updatedAt: ISODate("2026-03-04T11:00:00Z")
}
```

### Indexes:
- `token` - Unique index for fast lookup
- `expiresAt` - TTL index for automatic cleanup

---

## 🛠️ Customization

### Change Token Expiration:
Edit `pages/api/forgot-password.ts`:
```javascript
// Change from 1 hour to 2 hours
const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
```

### Change Password Requirements:
Edit `pages/api/reset-password.ts`:
```javascript
if (password.length < 8) { // Changed from 6 to 8
  res.status(400).json({ error: "Password must be at least 8 characters" });
}
```

### Customize Email Template:
Edit `src/lib/email.ts` → `generatePasswordResetEmail()` function

### Allow Admin Reset:
Edit `pages/api/forgot-password.ts`:
```javascript
// Remove or comment out this check:
if (user.role === "admin") {
  res.status(200).json({ message: "..." });
  return;
}
```

---

## 📚 Additional Resources

- **SMTP_SETUP_GUIDE.md** - Detailed email provider setup
- **FORGOT_PASSWORD_FLOW.md** - Technical documentation
- **Nodemailer Docs:** https://nodemailer.com/
- **Gmail App Passwords:** https://myaccount.google.com/apppasswords
- **Mailtrap:** https://mailtrap.io/
- **SendGrid:** https://sendgrid.com/

---

## 🐛 Troubleshooting

### Email not sending?
1. Check SMTP credentials in `.env`
2. Verify SMTP port is not blocked
3. Check server console for errors
4. Test with Mailtrap first

### Reset link not working?
1. Check if link expired (1 hour)
2. Verify token wasn't already used
3. Check browser console for errors
4. Try copying full URL

### Can't login after reset?
1. Verify password was actually changed
2. Check if account is suspended
3. Try "Forgot Password" again
4. Contact admin if issue persists

---

## ✅ Production Checklist

- [ ] Use production email service (SendGrid/Mailgun/SES)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Configure SPF/DKIM/DMARC records
- [ ] Set up email delivery monitoring
- [ ] Test with real email addresses
- [ ] Document process for support team
- [ ] Set up error logging/alerting
- [ ] Consider rate limiting (optional)
- [ ] Backup email provider (optional)

---

## 🎉 Summary

You now have a complete, secure forgot password feature that:
- ✅ Works for Sales, Manager, and Marketing roles
- ✅ Sends professional branded emails
- ✅ Uses secure, expiring tokens
- ✅ Protects against common attacks
- ✅ Provides excellent user experience
- ✅ Is production-ready with proper SMTP setup

**Next Steps:**
1. Install dependencies: `npm install nodemailer`
2. Configure SMTP in `.env`
3. Test the feature
4. Deploy to production
