# Troubleshooting Forgot Password on Render

## Current Status
Your environment variables are set on Render, but the forgot password feature is still not working. Let's diagnose the issue.

## Step-by-Step Troubleshooting

### Step 1: Deploy the Latest Changes

I've added diagnostic logging to help identify the issue. You need to deploy these changes:

1. **Commit and push the changes:**
   ```bash
   git add .
   git commit -m "Add email configuration diagnostics"
   git push origin main
   ```

2. **Wait for Render to auto-deploy** (or manually trigger a deploy)

### Step 2: Check the Startup Logs

Once deployed, check your Render logs immediately after startup. You should see:

```
📧 Email Configuration Check:
   EMAIL_USER: ✅ Set (amanneby004@gmail.com)
   EMAIL_PASS: ✅ Set (***hidden***)
✅ SMTP Server is ready to send emails
```

**If you see:**
- `❌ NOT SET` - The environment variables aren't being read
- `❌ SMTP Connection Error` - The credentials are wrong or Gmail is blocking access

### Step 3: Test the Debug Endpoint

Visit this URL in your browser (replace with your actual Render URL):
```
https://your-app.onrender.com/debug-email-config
```

You should see:
```json
{
  "emailConfigured": true,
  "emailUser": "ama***@gmail.com",
  "emailPassConfigured": true,
  "nodeEnv": "production"
}
```

**If `emailConfigured` is `false`**, the environment variables aren't being loaded.

### Step 4: Try Forgot Password Again

After confirming the config is correct, try the forgot password feature and check the logs for:

```
📧 Attempting to send email to: student@example.com
📧 Using email account: amanneby004@gmail.com
✅ Verification code email sent successfully: <message-id>
```

## Common Issues and Solutions

### Issue 1: Environment Variables Not Loading

**Symptoms:**
- Debug endpoint shows `emailConfigured: false`
- Logs show `❌ NOT SET`

**Solution:**
1. Double-check the variable names are EXACTLY:
   - `EMAIL_USER` (not `EMAIL_USERNAME` or `EMAILUSER`)
   - `EMAIL_PASS` (not `EMAIL_PASSWORD`)
2. Make sure there are no extra spaces in the values
3. Click "Save Changes" on Render
4. Manually trigger a redeploy

### Issue 2: Gmail Authentication Error

**Symptoms:**
- Logs show `❌ SMTP Connection Error: Invalid login`
- Email configured but sending fails

**Solution:**
The `EMAIL_PASS` must be a **Gmail App Password**, not your regular password:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (required for App Passwords)
3. Go to **App Passwords**: https://myaccount.google.com/apppasswords
4. Select "Mail" and "Other (Custom name)"
5. Name it "DBU Clearance System"
6. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
7. **Remove all spaces**: `abcdefghijklmnop`
8. Update `EMAIL_PASS` on Render with this new password
9. Redeploy

### Issue 3: Gmail Blocking "Less Secure Apps"

**Symptoms:**
- Error: "Username and Password not accepted"

**Solution:**
Gmail no longer supports "less secure apps". You MUST use an App Password (see Issue 2).

### Issue 4: Session Issues

**Symptoms:**
- Email sends successfully but verification code doesn't work

**Solution:**
Add `NODE_ENV=production` to your Render environment variables. This ensures sessions work correctly.

### Issue 5: Port Configuration

**Symptoms:**
- App crashes or doesn't start

**Solution:**
Render dynamically assigns the PORT. Your current setting of `PORT=3000` should work, but if you have issues, try removing it and let Render set it automatically.

## Recommended Environment Variables

Based on your screenshot, here's what you should have:

| Variable | Value | Status |
|----------|-------|--------|
| `DATABASE_URL` | postgresql://... | ✅ Set |
| `DB_HOST` | ep-jolly-moon-... | ✅ Set |
| `DB_NAME` | neondb | ✅ Set |
| `DB_PASSWORD` | npg_... | ✅ Set |
| `DB_PORT` | 5432 | ✅ Set |
| `DB_USER` | neondb_owner | ✅ Set |
| `EMAIL_PASS` | duwhutearrqpgpby | ⚠️ Verify this is correct |
| `EMAIL_USER` | amanneby004@gmail.com | ✅ Set |
| `PORT` | 3000 | ✅ Set |
| `SESSION_SECRET` | ••••••••••• | ✅ Set |
| `NODE_ENV` | production | ❌ **MISSING - ADD THIS!** |

## Action Items

1. **Add `NODE_ENV=production`** to your Render environment variables
2. **Verify the Gmail App Password** is correct (regenerate if needed)
3. **Deploy the latest code** with diagnostic logging
4. **Check the startup logs** for email configuration status
5. **Test the debug endpoint** to confirm variables are loaded
6. **Try forgot password** and check logs for detailed error messages

## Getting Detailed Logs

To see detailed logs on Render:

1. Go to your Render dashboard
2. Select your web service
3. Click **Logs** in the left sidebar
4. Set filter to "All logs"
5. Try the forgot password feature
6. Look for the diagnostic messages

## Next Steps

After deploying the changes:

1. Share the startup logs (the first 50 lines after deployment)
2. Share the output from `/debug-email-config`
3. Share any error messages when trying forgot password

This will help me pinpoint the exact issue!
