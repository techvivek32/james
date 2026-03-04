# Forgot Password - Quick Start Guide

## 🚀 5-Minute Setup

### Step 1: Install Dependencies (1 min)
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer @types/bcryptjs
```

### Step 2: Configure SMTP (2 min)

#### For Testing (Mailtrap - No Real Emails):
1. Sign up: https://mailtrap.io/
2. Copy credentials from your inbox
3. Update `.env`:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-username
SMTP_PASS=your-mailtrap-password
```

#### For Gmail (Real Emails):
1. Enable 2FA: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Update `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
```

### Step 3: Update .env File (1 min)
```env
MONGODB_URI=mongodb://localhost:27017/millerstorm
NEXT_PUBLIC_APP_URL=http://localhost:3000

SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your-username
SMTP_PASS=your-password
SMTP_FROM="Miller Storm OS <noreply@millerstorm.com>"
```

### Step 4: Restart Server (1 min)
```bash
npm run dev
```

### Step 5: Test It! (1 min)
1. Go to: http://localhost:3000/login
2. Click "Forgot Password"
3. Enter: `chris.lee@company.com`
4. Check Mailtrap inbox (or Gmail)
5. Click reset link
6. Set new password
7. Login!

---

## 📋 What You Get

### New Pages:
- `/forgot-password` - Request password reset
- `/reset-password?token=xxx` - Set new password

### Features:
- ✅ Email with reset link
- ✅ Secure tokens (expire in 1 hour)
- ✅ Professional email template
- ✅ Works for Sales, Manager, Marketing
- ✅ Admin protection (admins can't reset via email)

---

## 🔧 SMTP Providers Quick Reference

| Provider | Host | Port | Free Tier |
|----------|------|------|-----------|
| **Mailtrap** (Testing) | smtp.mailtrap.io | 2525 | Unlimited (no real emails) |
| **Gmail** | smtp.gmail.com | 587 | 500/day |
| **SendGrid** | smtp.sendgrid.net | 587 | 100/day |
| **Mailgun** | smtp.mailgun.org | 587 | 5,000/month |
| **AWS SES** | email-smtp.us-east-1.amazonaws.com | 587 | 62,000/month |

---

## 🧪 Quick Test

### Test User (from seed.js):
```
Email: chris.lee@company.com
Password: sales123
Role: Sales
```

### Test Flow:
1. Request reset for `chris.lee@company.com`
2. Check email inbox
3. Click reset link
4. Set password to: `newsales123`
5. Login with new password
6. Should redirect to `/sales/dashboard`

---

## ⚠️ Common Issues

### "Email not sending"
- Check SMTP credentials in `.env`
- Restart server after changing `.env`
- Check console for errors

### "Invalid token"
- Token expires after 1 hour
- Request new reset link
- Check if token was already used

### "Can't login after reset"
- Verify password was changed
- Check if account is suspended
- Try forgot password again

---

## 📚 Full Documentation

- **SMTP_SETUP_GUIDE.md** - Detailed email setup
- **FORGOT_PASSWORD_FLOW.md** - Technical docs
- **FORGOT_PASSWORD_SUMMARY.md** - Complete overview

---

## 🎯 Production Deployment

### Before Going Live:
1. ✅ Use production email service (SendGrid/Mailgun)
2. ✅ Update `NEXT_PUBLIC_APP_URL` to your domain
3. ✅ Test with real email addresses
4. ✅ Set up email monitoring
5. ✅ Configure SPF/DKIM records

### Recommended for Production:
```env
# SendGrid (99,000 free emails/month)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

---

## 💡 Pro Tips

1. **Use Mailtrap for development** - No risk of sending test emails to real users
2. **Gmail App Passwords** - More secure than regular password
3. **Monitor email delivery** - Track bounces and spam complaints
4. **Test thoroughly** - Try expired tokens, used tokens, invalid emails
5. **Document for support team** - They'll need to help users with issues

---

## ✅ Done!

Your forgot password feature is ready to use. Users can now reset their passwords via email!

**Need help?** Check the full documentation files or contact support.
