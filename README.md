# 🎓 DBU Online Student Clearance System
### *State-of-the-Art Digital Clearance Solution for Debre Berhan University*

---

## 📝 Project Overview
The **DBU Clearance System** is a comprehensive full-stack web application designed to digitize and automate the traditional manual student clearance process at Debre Berhan University. It eliminates paperwork, reduces wait times, and provides real-time transparency for students and administrators alike.

---

## 🛠️ Modern Technology Stack
The system is built using industry-standard technologies to ensure scalability, security, and performance.

| Layer | Technologies |
|---|---|
| **Frontend** | React.js (Vite), Tailwind CSS (Premium Styling), Framer Motion (Animations), Axios |
| **Backend** | Node.js, Express.js (Modular Architecture) |
| **Database** | PostgreSQL (Neon.tech) |
| **Real-time** | Nodemailer (SMTP Service) with Render-optimized links |
| **Security** | Session-based Auth, Bcrypt.js, Helmet.js, Rate Limiting, DNS MX Verification |
| **File Storage** | Multer (Profile Pictures & Document Uploads) |

---

## 🚀 Key Features

### 1. 👨‍🎓 Intelligent Student Portal
- **Real-time Dashboard**: Live countdown of the 3-day clearance window, status badges, and prioritized tasks.
- **Unified Clearance Request**: A single-click application that triggers the entire institutional workflow.
- **Digital Clearance Certificate**: Automatically generated upon Registrar approval, featuring a secure "Final Seal."
- **Profile Management**: Dynamic photo uploading and real-time email domain verification to prevent fake accounts.

### 2. 🛡️ Administrative Ecosystem
- **Sequential Chain of Responsibility**: Approvals flow logically from **Library → Cafeteria → Dormitory → Department Head → Registrar**.
- **Adaptive Locking Logic**: A groundbreaking security feature that allows admins to undo decisions *only* if the next department in the chain hasn't yet acted.
- **Bulk Processing Engine**: Handle hundreds of clearance requests simultaneously with automated conflict resolution.
- **Audit Logs**: Enhanced traceability including **student names**, admin IDs, IP addresses, and detailed action timestamps.
- **Special Clearance Management**: Dedicated module for handling withdrawals, transfers, and disciplinary exceptions.

### 3. 📧 Advanced Communication
- **Context-Aware Emails**: Custom-styled HTML email templates for Approval/Rejection/Recovery.
- **Production-Ready Links**: Automated link generation pointing to the live Render deployment (`https://dbu-clearance-system.onrender.com`).

---

## 🔄 The Modular Workflow

### 🌊 Sequential Approval Chain
The system enforces a strict business logic to ensure no property is left unreturned:
1.  **Library**: Clears books, digital resources, and library cards.
2.  **Cafeteria**: Verifies no outstanding mess fees or returned utensils.
3.  **Dormitory**: Confirms room keys and furniture are in original condition.
4.  **Department Head**: Final academic check for grades and departmental equipment.
5.  **Registrar (Final Seal)**: The ultimate authority. Approving here generates the certificate and marks the student as "Inactive."

### 🔒 Security & Integrity
- **Route Guards**: Middleware-based protection.
- **Session Persistence**: Secure PostgreSQL-backed sessions (via `connect-pg-simple`) for reliable admin login.
- **Hashed Secrets**: All sensitive data is encrypted using salt-rounds performance-optimized Bcrypt.

### 📊 Workflow Diagram
```mermaid
graph TD
    Start[Admin Opens Period] --> Request[Student Submits Request]
    Request --> Lib[Library Approval]
    Lib -- Locks Library --> Caf[Cafeteria Approval]
    Caf -- Locks Cafeteria --> Dor[Dormitory Approval]
    Dor -- Locks Dormitory --> Dept[Department Head Approval]
    Dept -- Locks Dept Head --> Reg[Registrar Final Seal]
    
    Reg --> Success[Final Clearance Generated]
    Reg --> Notify[Automated Email Notification Sent]
    
    style Start fill:#4f46e5,color:#fff
    style Request fill:#1e293b,color:#fff
    style Success fill:#22c55e,color:#fff
    style Reg fill:#3d5afe,color:#fff
```

---

## 🗄️ Database Migrations (Version Control)

This project uses `node-pg-migrate` to manage database schema changes safely and predictably, functioning as "version control" for your PostgreSQL database.

### The Standard Workflow

1. **Create a new migration file:**
   ```bash
   npx node-pg-migrate create description-of-change
   ```
   *This generates a timestamped skeleton file in the `migrations/` directory.*

2. **Write the schema definition:**
   Open the generated file and define your tables or columns inside `exports.up`. Provide a rollback strategy in `exports.down`.
   ```javascript
   exports.up = (pgm) => {
       pgm.createTable('example_table', {
           id: 'id',
           name: { type: 'varchar(50)', notNull: true }
       });
   };
   
   exports.down = (pgm) => {
       pgm.dropTable('example_table');
   };
   ```

3. **Execute the migration (UP):**
   ```bash
   npm run migrate up
   ```
   *This translates your JavaScript into PostgreSQL commands, builds the tables, and records the timestamp in the `pgmigrations` tracking table so it never runs twice.*

4. **Rollback if needed (DOWN):**
   ```bash
   npm run migrate down
   ```
   *This runs the `exports.down` function of the most recent migration to safely undo mistakes.*

---

## 📂 Project Architecture
```text
/
├── client/              # React frontend (Vite + Tailwind)
│   ├── src/components/   # UI Modules (Dashboards, Logs, Settings)
│   └── public/           # Static assets & Icons
├── routes/              # Express API Routes (Modularized by Role)
├── controllers/         # Core Business Logic & DB Queries
├── middleware/          # Security & Auth Guards
├── config/              # DB, Email, & Env Configuration
├── utils/               # Loggers & Response Handlers
├── uploads/             # Student Profile Pictures
└── server.js            # Main Entry Point & Middleware Chain
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- PostgreSQL Database (Neon or Local)
- Gmail App Password (for SMTP)

### Installation
1. **Clone the repository**
   ```bash
   git clone https://github.com/your-repo/dbu-clearance.git
   cd dbu-clearance
   ```

2. **Setup Backend**
   - Create a `.env` file in the root directory:
     ```env
     DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
     EMAIL_USER=your-email@gmail.com
     EMAIL_PASS=your-app-password
     SESSION_SECRET=your_secret
     PORT=3000
     ```
   - Install dependencies: `npm install`
   - Run the SQL schema script in your PostgreSQL database (`schema_pg.sql`).

3. **Setup Frontend**
   - Navigate to `/client`
   - Install dependencies: `npm install`
   - Build assets: `npm run build`

4. **Run Application**
   ```bash
   npm start
   ```

---

## ☁️ Deployment Guide (Render + Neon)

This guide shows you how to deploy this full-stack PERN application (PostgreSQL, Express, React, Node) for free using **Neon** (Database) and **Render** (Web Service).

### Step 1: Set up the Database (Neon)
1. Go to [Neon.tech](https://neon.tech) and create a free project.
2. Copy the **Connection String** provided by Neon (e.g., `postgres://user:pass@host/db...`).

### Step 2: Deploy to Render
1. Go to [Render.com](https://render.com), create a **Web Service**, and connect your GitHub repo.
2. Settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. **Environment Variables**: Add these in the Render dashboard:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`: Use values from Neon.
   - `PGSSLMODE`: `require` (Crucial for Neon connection).
   - `NODE_ENV`: `production`
   - `EMAIL_USER` & `EMAIL_PASS`: Your Gmail credentials.

### Step 3: Run Database Migration
Once deployed, go to the **Shell** tab in Render and run:
```bash
node setup_pg.js
```
This initializes the database tables in your live Neon instance.

---
© 2025 Debre Berhan University. *Digitizing the future of campus management.*
