-- Postgres Schema for DBU Clearance System

-- Students Table
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

-- Admin Table
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

-- Clearance Settings
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

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);

-- Clearance Tables

-- Library Clearance
CREATE TABLE IF NOT EXISTS library_clearance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    academic_year VARCHAR(20),
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    rejected_at TIMESTAMP
);

-- Cafeteria Clearance
CREATE TABLE IF NOT EXISTS cafeteria_clearance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reject_reason TEXT,
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    academic_year VARCHAR(20)
);

-- Dormitory Clearance
CREATE TABLE IF NOT EXISTS dormitory_clearance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reject_reason TEXT,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    academic_year VARCHAR(20)
);

-- Department Clearance
CREATE TABLE IF NOT EXISTS department_clearance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reject_reason TEXT,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    academic_year VARCHAR(20)
);

-- Registrar Clearance (academicstaff_clearance)
CREATE TABLE IF NOT EXISTS academicstaff_clearance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reject_reason TEXT,
    approved_at TIMESTAMP,
    approved_by VARCHAR(100),
    academic_year VARCHAR(20)
);

-- Final Clearance
CREATE TABLE IF NOT EXISTS final_clearance (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    year VARCHAR(10) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'finalized')),
    reject_reason VARCHAR(255),
    date_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    department VARCHAR(100),
    academic_year VARCHAR(20),
    is_read BOOLEAN DEFAULT FALSE,
    email_sent BOOLEAN DEFAULT FALSE,
    email_sent_at TIMESTAMP
);

-- Special Clearance Students
CREATE TABLE IF NOT EXISTS special_clearance_students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    student_name VARCHAR(100) NOT NULL,
    exception_type VARCHAR(20) NOT NULL CHECK (exception_type IN ('withdrawal', 'transfer', 'disciplinary', 'medical', 'other')),
    reason TEXT NOT NULL,
    granted_by INTEGER NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATE,
    is_active BOOLEAN DEFAULT TRUE,
    notes TEXT
);

-- SEED DATA

-- Students
INSERT INTO student (student_id, name, last_name, phone, email, department, username, password, year, semester, profile_picture, status) VALUES
('DBU001/25', 'Awoke', 'Derssie', '0948013830', 'tomasderese49@gmail.com', 'Information Technology', 'awoke123', '$2b$10$.pdgqeK4m4PkYVLt9xVk3OE.zqiX1IWY/nH4GNTPl9rbk8zGTdSMO', '3', '2', 'uploads/profile_pictures/profile_DBU001_25_1766069795395.png', 'inactive'),
('DBU002/25', 'Azanaw', 'Nega', '0948013830', 'tomasderese4@gmail.com', 'Information Technology', 'aze123', '$2b$10$Esd6iKJmb0IJt.4u9RnqQOnBHOp7xv6KEtO5OgUdpMdHTz8UwnVb.', '3', '2', 'uploads/profile_pictures/profile_DBU002_25_1766070994767.png', 'active'),
('DBU003/25', 'Amanuel', 'Neby', '0948013830', 'amanneby004@gmail.com', 'Information Technology', 'aman123', '$2b$10$DstntivR9KFDfGLPrRq8MOO7yrvfZXs5C86H/0iGGjEC/CoBkoWbe', '3', '2', 'uploads/profile_pictures/profile_DBU003_25_1766092706936.png', 'inactive'),
('DBU004/25', 'Mulugeta', 'ababi', '0958585858', 'mulugeta@gmail.com', 'Information Technology', 'mul123', '$2b$10$wfib1aW/bPpymwVDoyP6auOyOHos0c.zRxl0x/NQ4QrlkQEOn.cO6', '3', '2', NULL, 'active')
ON CONFLICT (student_id) DO NOTHING;

-- Admins
INSERT INTO admin (id, name, last_name, username, password, email, phone, role, department_name) VALUES
(1, 'Aman', 'Baye', 'cafeteria', '$2b$10$lQ13dakILkqKpB67tAo52eac7hUFCOodTNSs5x5os5s1nvp0PJ8h.', 'admin@university.edu', '0912345678', 'cafeteria_admin', NULL),
(2, 'Azanaw', 'Nega', 'system', '$2b$10$9IDuLpi5trr4yN64vL9e0.iMOKOBLhrKnJK1y49ugEEQv6U1QLnES', 'aza@gmail.com', '0986767676', 'system_admin', NULL),
(3, 'Awoke', 'Derssie', 'registrar', '$2y$10$nr5jaHlx18dUgrbCjKe3z.B8XHvbDm5Cd3j6Kw32PpYorRJpn4UBG', 'tomasderese49@gmail.com', '0939013630', 'registrar_admin', NULL),
(10, 'Amanuel', 'Neby', 'dormitory', '$2y$10$RvcEI1/AvazqTMxGg4WmX.kxlxmPnw53mlO3qDIobGJu.xaDPqKzW', 'tomasdere@gmail.com', '0939013630', 'dormitory_admin', NULL),
(11, 'Aman', 'Adis', 'library', '$2b$10$nb6vtURXf9p.CWU.bNuQGewobGj6QLHruvlUYSYkym6s763bFJyVK', 'adsmin@university.edu', '0912345678', 'library_admin', NULL),
(13, 'Tadele', 'Derso', 'department', '$2y$10$hneo0kNcPOr7L1teMuq/Y.XN.NGi7lAjUxijThaxbz7yDA7itIHga', 'adsvmin@university.edu', '0915166228', 'department_admin', 'Information Technology'),
(17, 'Abrham', 'Daniel', 'protector', '$2b$10$urtbEuhctN99O3AGQd1NE.8LElvVjaxvp94iAF2JoHPOxswKMzP/y', 'tilahunsitotaw418@gmail.com', '0939013639', 'personal_protector', NULL),
(21, 'Awoke', 'Nega', 'aze1234', '$2b$10$CFHJ/A/4HesR9DyWh.CzYuGM0dcAj4ISUHFMvqxjSJ2hRrlV0yX6.', 'moba23607@gmail.com', '0948813479', 'department_admin', 'Management'),
(23, 'Abrham', 'Daniel', 'abe123', '$2b$10$39wVh6IeCYiGmcfGbsCb8e7/JhXlv1wpJW96gQIFZkcRTZ0pK6cny', 'kman5819@gmail.com', '0948813479', 'dormitory_admin', NULL)
ON CONFLICT (id) DO NOTHING;

-- Clearance Settings
INSERT INTO clearance_settings (id, academic_year, start_date, end_date, is_active, extension_days) VALUES
(2, '2025-2026', '2025-12-18 19:00:00', '2025-12-19 22:31:00', FALSE, 0)
ON CONFLICT (id) DO NOTHING;

-- Note: Other clearance tables populated as needed.

-- Fix sequences to avoid ID conflicts
SELECT setval('admin_id_seq', (SELECT MAX(id) FROM admin));
SELECT setval('student_id_seq', (SELECT MAX(id) FROM student));
SELECT setval('clearance_settings_id_seq', (SELECT MAX(id) FROM clearance_settings));
