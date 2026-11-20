-- Postgres Schema for DBU Clearance System (Unified Version)
-- This file represents the CURRENT state of the database structure.

-- 1. Students Table
CREATE TABLE IF NOT EXISTS student (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    department VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    year VARCHAR(20) DEFAULT '1st Year',
    semester VARCHAR(10) DEFAULT '1',
    profile_picture VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    reset_code VARCHAR(10),
    reset_code_expires TIMESTAMP
);

-- 2. Sessions Table (for connect-pg-simple)
CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
) WITH (OIDS=FALSE);
ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid") NOT DEFERRABLE INITIALLY IMMEDIATE;
CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "session" ("expire");

-- 3. Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,  
    last_name VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    role VARCHAR(50) NOT NULL,
    department_name VARCHAR(100)
);

-- 3. Clearance Settings
CREATE TABLE IF NOT EXISTS clearance_settings (
    id SERIAL PRIMARY KEY,
    academic_year VARCHAR(20) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    extension_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Unified Clearance Requests Table
-- This replaces all legacy department-specific tables
CREATE TABLE IF NOT EXISTS clearance_requests (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    student_department VARCHAR(100) NOT NULL,
    target_department VARCHAR(50) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    academic_year VARCHAR(20) NOT NULL,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    rejected_at TIMESTAMP,
    approved_by VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    notification_message TEXT
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER,
    admin_name VARCHAR(100),
    admin_role VARCHAR(50),
    action VARCHAR(50) NOT NULL, -- e.g., 'APPROVE', 'REJECT', 'UPDATE_SETTINGS'
    target_student_id VARCHAR(50),
    target_student_name VARCHAR(100),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- ==========================================================
-- SEED DATA (Example Data)
-- ==========================================================

-- Students
INSERT INTO student (student_id, name, last_name, phone, email, department, username, password, year, semester, status) VALUES
('DBU001/26', 'Awoke', 'Derssie', '0948013830', 'student@university.edu', 'Information Technology', 'student1', '$2b$10$.pdgqeK4m4PkYVLt9xVk3OE.zqiX1IWY/nH4GNTPl9rbk8zGTdSMO', '3', '2', 'active')
ON CONFLICT (student_id) DO NOTHING;

-- Admins
INSERT INTO admin (name, last_name, username, password, email, phone, role, department_name) VALUES
('System', 'Admin', 'system', '$2b$10$9IDuLpi5trr4yN64vL9e0.iMOKOBLhrKnJK1y49ugEEQv6U1QLnES', 'admin@university.edu', '0912345678', 'system_admin', NULL)
ON CONFLICT (username) DO NOTHING;

-- Initial Settings
INSERT INTO clearance_settings (academic_year, start_date, end_date, is_active) VALUES
('2025-2026', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', TRUE)
ON CONFLICT DO NOTHING;
