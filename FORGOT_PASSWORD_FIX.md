# Forgot Password Fix - Production Deployment Guide

## Problem
The forgot password feature works locally but fails in production on Render with a 500 error because email environment variables are not configured.

## Root Cause
- **Locally**: Email credentials are loaded from `.env` file
- **On Render**: Environment variables `EMAIL_USER` and `EMAIL_PASS` are missing

## Solution

### Step 1: Add Environment Variables to Render

1. **Go to Render Dashboard**
   - Navigate to: https://dashboard.render.com
   - Select your web service (DBU Clearance System)

2. **Add Environment Variables**
   - Click on the **Environment** tab in the left sidebar
   - Click **Add Environment Variable** button
   - Add the following variables:

   ```
   EMAIL_USER=amanneby004@gmail.com
   EMAIL_PASS=duwhutearrqpgpby
   ```

3. **Save and Redeploy**
   - Click **Save Changes**
   - Render will automatically redeploy your application
   - Wait for the deployment to complete (usually 2-5 minutes)

### Step 2: Verify the Fix

After redeployment:

1. Go to your deployed application
2. Navigate to the forgot password page
3. Enter a valid student name and email
4. You should receive a verification code email
5. Check the Render logs for confirmation:
   - Look for: `✅ Verification code email sent successfully`
   - If there's still an issue, look for: `❌ Email credentials not configured!`

### Step 3: Check Render Logs (If Issues Persist)

To view logs on Render:
1. Go to your web service dashboard
2. Click on the **Logs** tab
3. Look for error messages related to email sending
4. The improved error logging will show:
   - `📧 Attempting to send email to: [email]`
   - `📧 Using email account: [account]`
   - Any error details if sending fails

## Code Changes Made

### 1. Enhanced Error Logging (`controllers/authController.js`)
- Added check for missing email credentials
- Added detailed logging for debugging
- Better error messages for troubleshooting

### 2. Removed Hardcoded Fallbacks (`config/email.js`)
- Removed default email credentials
- Forces proper environment variable configuration
- Prevents silent failures in production

## Environment Variables Checklist

Make sure these are set on Render:

- ✅ `DB_HOST` - Neon database host
- ✅ `DB_USER` - Database user
- ✅ `DB_PASSWORD` - Database password
- ✅ `DB_NAME` - Database name
- ✅ `DB_PORT` - Database port (5432)
- ✅ `DATABASE_URL` - Full PostgreSQL connection string
- ✅ `SESSION_SECRET` - Session encryption key
- ✅ `PORT` - Server port (usually 3000)
- ✅ `EMAIL_USER` - Gmail account for sending emails
- ✅ `EMAIL_PASS` - Gmail app password
- ✅ `NODE_ENV` - Set to `production`

## Important Notes

### Gmail App Password
- The `EMAIL_PASS` should be a Gmail **App Password**, not your regular Gmail password
- To generate an App Password:
  1. Go to Google Account settings
  2. Enable 2-Factor Authentication
  3. Go to Security → App Passwords
  4. Generate a new app password for "Mail"
  5. Use that 16-character password as `EMAIL_PASS`

### Security Reminder
- Never commit `.env` file to Git
- Keep email credentials secure
- Use environment variables for all sensitive data

## Testing Locally

To test the improved error handling locally:

1. Temporarily remove email credentials from `.env`:
   ```
   # EMAIL_USER=amanneby004@gmail.com
   # EMAIL_PASS=duwhutearrqpgpby
   ```

2. Restart the server:
   ```bash
   npm start
   ```

3. Try the forgot password feature
4. You should see: `❌ Email credentials not configured!` in the console

5. Restore the credentials and restart to verify it works again

## Troubleshooting

### Issue: Still getting 500 error after adding variables
**Solution**: 
- Verify the environment variables are spelled correctly
- Make sure there are no extra spaces in the values
- Check Render logs for specific error messages

### Issue: Email not being received
**Solution**:
- Check spam/junk folder
- Verify the Gmail account is active
- Ensure 2FA is enabled and App Password is valid
- Check Render logs for email sending confirmation

### Issue: "Invalid credentials" error in logs
**Solution**:
- Regenerate Gmail App Password
- Update `EMAIL_PASS` on Render
- Redeploy the application

## Next Steps

After fixing this issue, consider:
1. Setting up email templates for better formatting
2. Adding email delivery monitoring
3. Implementing email queue for better reliability
4. Adding rate limiting for forgot password requests
