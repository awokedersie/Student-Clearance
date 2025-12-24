---
description: How to deploy the DBU Clearance System for free using Render and Neon
---

# Deploying DBU Clearance System (Free Tier)

This guide shows you how to deploy your full-stack PERN application (PostgreSQL, Express, React, Node) for free.

We will use:
- **Neon.tech** for the Database (Free PostgreSQL, no expiration).
- **Render.com** for the Web Service (Node.js backend + React frontend).

## Prerequisites
- A GitHub account.
- Your project pushed to a GitHub repository.

---

## Step 1: Set up the Database (Neon)

Since Render's free database expires after 30 days, we successfully use **Neon**, which offers a generous free tier.

1. Go to [Neon.tech](https://neon.tech) and sign up.
2. Create a new project (e.g., `dbu-clearance`).
3. Neon will give you a **connection string** that looks like this:
   `postgres://user:password@ep-cool-site.us-east-2.aws.neon.tech/neondb?sslmode=require`
4. Copy this string; you will need it later.

---

## Step 2: Prepare Your Code

(Optional) If you haven't already, make sure your specific `package.json` at the root has a build script. We have already added this for you:
```json
"build": "npm install && cd client && npm install && npm run build"
```

---

## Step 3: Deploy to Render

1. Go to [Render.com](https://render.com) and log in with GitHub.
2. Click **New +** and select **Web Service**.
3. Select your repository `dbu-clearance-system`.
4. Configure the service:
   - **Name**: `dbu-clearance-system` (or any name)
   - **Region**: Choose the one closest to you (e.g., Frankfurt or Singapore).
   - **Branch**: `main` (or `master`)
   - **Runtime**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select **Free**.

5. **Environment Variables**:
   Scroll down to "Environment Variables" and add the following keys. Use the details from your Neon connection string.

   | Key | Value (Example) |
   |-----|-----------------|
   | `NODE_ENV` | `production` |
   | `DB_HOST` | `ep-cool-site.us-east-2.aws.neon.tech` (from Neon) |
   | `DB_USER` | `neondb_owner` (from Neon) |
   | `DB_PASSWORD` | `nEoN_PaSsWoRd` (from Neon) |
   | `DB_PORT` | `5432` |
   | `DB_NAME` | `neondb` (Default Neon DB name) |
   | `SESSION_SECRET` | (Type any random long string, e.g. `mySuperSecretKey123`) |
   | `PGSSLMODE` | `require` (Important for Neon!) |
   | `EMAIL_USER` | `your-email@gmail.com` (Gmail account for sending emails) |
   | `EMAIL_PASS` | `your-app-password` (Gmail App Password - see note below) |

   *> **Tip**: If you have a full connection string `postgres://...`, you can parse it to get the Host, User, Password, etc., or just check the Neon dashboard for "Connection Details".*

   *> **Gmail App Password**: The `EMAIL_PASS` must be a Gmail App Password (not your regular password). To generate one:*
   - *Enable 2-Factor Authentication on your Google Account*
   - *Go to Security → App Passwords*
   - *Generate a new app password for "Mail"*
   - *Use the 16-character password as `EMAIL_PASS`*

6. Click **Create Web Service**.

---

## Step 4: Run Database Migration

Once the deployment starts, Render will run the build command. However, since this is a fresh database, it needs the tables.

1. Wait for the deployment to finish (Status: Live).
2. Go to the **Shell** tab in your Render dashboard for this service.
3. Run the schema migrations manually by pasting this command into the web terminal:
   ```bash
   node setup_pg.js
   ```
   *This connects to your remote Neon database and creates all tables.*

---

## Step 5: Access Your App

Click the URL provided by Render (e.g., `https://dbu-clearance.onrender.com`).
- The first load might take 30-60 seconds because the free tier "spins down" after inactivity.
- Log in with the default admin credentials (if you seeded them) or register a new user.

### Troubleshooting
- **Logs**: Check the "Logs" tab in Render if something fails.
- **Database Errors**: Ensure `PGSSLMODE` is set to `require` in environment variables.
