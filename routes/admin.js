const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const router = express.Router();

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'amanneby004@gmail.com',
        pass: process.env.EMAIL_PASS || 'duwhutearrqpgpby'
    }
});

// Departments array
const departments = [
    'Information Technology',
    'Information System',
    'Software Engineering',
    'Computer Science',
    'Accounting',
    'Management',
    'Economics'
];

// List of common disposable/fake email domains to block
const disposableDomains = [
    'mailinator.com', 'yopmail.com', 'temp-mail.org', 'guerrillamail.com',
    '10minutemail.com', 'dropmail.me', 'dispostable.com', 'sharklasers.com',
    'fake.com', 'example.com', 'test.com', 'mail.com'
];




// ==================== AUTHENTICATION MIDDLEWARES ====================
/**
 * Middleware to ensure the user is an admin
 */
const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role === 'student') {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as admin' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

/**
 * Middleware to ensure the user is a system admin or super admin
 */
const requireSystemAdmin = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'system_admin' && req.session.user.role !== 'super_admin')) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - System Admin access required' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

/**
 * Middleware to ensure the user is a library admin
 */
const requireLibraryAdmin = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'library_admin' && req.session.user.role !== 'super_admin')) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Library Admin access required' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

// Admin Login Process
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = req.db;

        console.log('🔐 Admin login attempt for:', username);

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Check in admin table
        const [admins] = await db.execute(
            'SELECT * FROM admin WHERE username = ?',
            [username.trim()]
        );

        if (admins.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password!'
            });
        }

        const admin = admins[0];
        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password!'
            });
        }

        // Create admin session
        req.session.user = {
            id: admin.id,
            username: admin.username,
            name: admin.name,
            lastName: admin.last_name,
            email: admin.email,
            role: admin.role.toLowerCase(),
            department: admin.role.toLowerCase() === 'department_admin' ? admin.department_name : null,
            full_name: `${admin.name} ${admin.last_name}`
        };

        console.log('🎉 Admin login successful for:', admin.name);
        console.log('👨‍💼 Admin role:', admin.role);

        res.json({
            success: true,
            user: req.session.user,
            redirect: getDashboardPath(admin.role)
        });

    } catch (error) {
        console.error('💥 Admin login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed. Please try again.'
        });
    }
});

// Admin Dashboard - FIXED: Check if view exists, otherwise redirect to appropriate dashboard
router.get('/dashboard', (req, res) => {
    if (!req.session.user || req.session.user.role === 'student') {
        return res.redirect('/admin/login');
    }

    // If user has a specific role, redirect to their specific dashboard
    const role = req.session.user.role;
    if (req.session.user.role !== 'super_admin' && role !== 'system_admin') {
        return redirectToDashboard(req, res);
    }

    const user = req.session.user;

    // Try to render admin dashboard, if it doesn't exist, redirect to system dashboard
    try {
        res.json({
            success: true,
            user: req.session.user,
            redirect: '/admin/system/dashboard'
        });
    } catch (error) {
        // If admin/dashboard doesn't exist, redirect to system dashboard
        console.log('⚠️ Admin dashboard view not found, redirecting to system dashboard');
        res.redirect('/admin/system/dashboard');
    }
});

// System Dashboard Route
// System Dashboard Route (Renamed to avoid SPA route collision)
router.get('/system/dashboard/data', requireSystemAdmin, async (req, res) => {
    try {
        const db = req.db;

        // Get statistics data
        const [studentCount] = await db.execute("SELECT COUNT(*) as total FROM student");
        const [adminCount] = await db.execute("SELECT COUNT(*) as total FROM admin");
        const [approvedCount] = await db.execute("SELECT COUNT(*) as total FROM final_clearance WHERE status = 'approved'");
        const [rejectedCount] = await db.execute("SELECT COUNT(*) as total FROM final_clearance WHERE status = 'rejected'");

        const statistics = {
            total_students: studentCount[0].total,
            total_admins: adminCount[0].total,
            approved_students: approvedCount[0].total,
            rejected_students: rejectedCount[0].total,
            active_requests: studentCount[0].total - approvedCount[0].total
        };

        console.log('📊 System dashboard loaded for:', req.session.user.username);

        res.json({
            success: true,
            user: req.session.user,
            stats: statistics
        });

    } catch (error) {
        console.error('💥 System dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load system dashboard: ' + error.message
        });
    }
});

// Clearance Settings Data Route
router.get('/clearance-settings/data', requireSystemAdmin, async (req, res) => {
    try {
        const db = req.db;

        // Get current academic year
        const current_year = new Date().getFullYear();
        const next_year = current_year + 1;
        const academic_year = `${current_year}-${next_year}`;

        // Get current clearance settings
        const [settings] = await db.execute(
            "SELECT * FROM clearance_settings WHERE academic_year = ? LIMIT 1",
            [academic_year]
        );

        let clearance_settings = settings[0];

        // If no settings exist for current academic year, create default ones
        if (!clearance_settings) {
            const default_start = new Date();
            const default_end = new Date();
            default_end.setDate(default_end.getDate() + 7); // 7 days from now

            const [result] = await db.execute(
                "INSERT INTO clearance_settings (academic_year, start_date, end_date, is_active) VALUES (?, ?, ?, ?)",
                [academic_year, default_start, default_end, 0] // Inactive by default
            );

            // Reload settings
            const [newSettings] = await db.execute(
                "SELECT * FROM clearance_settings WHERE academic_year = ? LIMIT 1",
                [academic_year]
            );
            clearance_settings = newSettings[0];
        }

        // Get current server time
        const server_time = new Date();
        const server_time_display = server_time.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });

        // Calculate time status using SERVER TIME
        const start_timestamp = new Date(clearance_settings.start_date).getTime();
        const end_timestamp = new Date(clearance_settings.end_date).getTime();
        const server_timestamp = server_time.getTime();
        const is_active_setting = clearance_settings.is_active;

        // Determine system status based on SERVER TIME
        let system_status = 'INACTIVE';
        let status_class = 'status-inactive';
        let status_icon = '🔴';

        if (is_active_setting) {
            if (server_timestamp < start_timestamp) {
                system_status = 'SCHEDULED';
                status_class = 'status-scheduled';
                status_icon = '🟡';
            } else if (server_timestamp <= end_timestamp) {
                system_status = 'ACTIVE';
                status_class = 'status-active';
                status_icon = '🟢';
            } else {
                system_status = 'EXPIRED';
                status_class = 'status-expired';
                status_icon = '🔴';
            }
        }

        // Calculate time remaining using SERVER TIME
        const time_remaining = end_timestamp - server_timestamp;
        const total_duration = end_timestamp - start_timestamp;

        let days_remaining = 0;
        let hours_remaining = 0;
        if (time_remaining > 0) {
            days_remaining = Math.floor(time_remaining / (1000 * 60 * 60 * 24));
            hours_remaining = Math.floor((time_remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        }

        // Calculate time until start (if scheduled)
        const time_until_start = start_timestamp - server_timestamp;
        let days_until_start = 0;
        let hours_until_start = 0;
        if (time_until_start > 0) {
            days_until_start = Math.floor(time_until_start / (1000 * 60 * 60 * 24));
            hours_until_start = Math.floor((time_until_start % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        }

        // Get clearance statistics
        const [studentCount] = await db.execute("SELECT COUNT(*) as total FROM student WHERE status = 'active'");
        const total_students = studentCount[0].total;

        // Count students with pending requests (not approved) from library_clearance
        const [requestStudents] = await db.execute(`
            SELECT COUNT(DISTINCT student_id) as requested 
            FROM library_clearance 
            WHERE academic_year = ? 
            AND status != 'approved' 
            AND status != 'cleared'
        `, [academic_year]);
        const request_students = requestStudents[0].requested;

        // Count students with approved clearance from final_clearance table
        const [approvedStudents] = await db.execute(`
            SELECT COUNT(DISTINCT student_id) as approved 
            FROM final_clearance 
            WHERE academic_year = ? 
            AND status = 'approved'
        `, [academic_year]);
        const approved_students = approvedStudents[0].approved;

        // Calculate total students in clearance process (requested + approved)
        const students_in_process = request_students + approved_students;

        // Calculate submission progress - ensure it never exceeds 100%
        const submission_rate = total_students > 0 ? Math.min(100, Math.round((students_in_process / total_students) * 100 * 10) / 10) : 0;

        // For display in the card
        const submitted_clearances = students_in_process;
        const pending_students = total_students - students_in_process;

        // Flash messages
        const messages = req.session.messages || [];
        req.session.messages = []; // Clear messages after displaying

        res.json({
            success: true,
            user: req.session.user,
            clearance_settings: clearance_settings,
            academic_year: academic_year,
            server_time_display: server_time_display,
            server_timestamp: server_timestamp,
            start_timestamp: start_timestamp,
            end_timestamp: end_timestamp,
            system_status: system_status,
            status_class: status_class,
            status_icon: status_icon,
            days_remaining: days_remaining,
            hours_remaining: hours_remaining,
            days_until_start: days_until_start,
            hours_until_start: hours_until_start,
            total_duration: total_duration,
            total_students: total_students,
            submission_rate: submission_rate,
            submitted_clearances: submitted_clearances,
            pending_students: pending_students
        });

    } catch (error) {
        console.error('💥 Clearance settings error:', error);
        req.session.messages = [{ type: 'error', msg: 'Failed to load clearance settings' }];
        res.redirect('/admin/system/dashboard');
    }
});

// Handle Clearance Settings Update - MOVED from /system/clearance-settings to /clearance-settings
router.post('/clearance-settings', requireSystemAdmin, async (req, res) => {
    try {
        const db = req.db;
        const { start_date, end_date, is_active } = req.body;
        const form_errors = [];

        // Get current academic year from the latest record
        const [latestSettings] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );

        let academic_year;
        if (latestSettings.length > 0) {
            academic_year = latestSettings[0].academic_year;
        } else {
            const current_year = new Date().getFullYear();
            academic_year = `${current_year}-${current_year + 1}`;
        }

        // Validation
        if (!start_date || !end_date) {
            form_errors.push("Start date and end date are required.");
        }

        const start_timestamp = new Date(start_date).getTime();
        const end_timestamp = new Date(end_date).getTime();

        if (start_timestamp >= end_timestamp) {
            form_errors.push("End date must be after start date.");
        }

        if (form_errors.length === 0) {
            // Update clearance settings
            const is_active_bool = is_active ? 1 : 0;

            await db.execute(
                "UPDATE clearance_settings SET start_date = ?, end_date = ?, is_active = ?, updated_at = NOW() WHERE academic_year = ?",
                [start_date, end_date, is_active_bool, academic_year]
            );

            req.session.messages = [{ type: 'success', msg: 'Clearance settings updated successfully!' }];
            console.log(`✅ Clearance settings updated for ${academic_year}: Start=${start_date}, End=${end_date}, Active=${is_active_bool}`);

            return res.json({
                success: true,
                message: 'Clearance settings updated successfully!'
            });
        } else {
            // Reload page with errors
            const [settings] = await db.execute(
                "SELECT * FROM clearance_settings WHERE academic_year = ? LIMIT 1",
                [academic_year]
            );
            const clearance_settings = settings[0];

            req.session.messages = form_errors.map(error => ({ type: 'error', msg: error }));
            return res.status(400).json({
                success: false,
                message: form_errors.join(". ")
            });
        }

    } catch (error) {
        console.error('💥 Update clearance settings error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to update clearance settings: ' + error.message
        });
    }
});

// Handle Quick Actions - GET ROUTES (KEEP EXISTING)



// ADD POST ROUTES FOR CLEARANCE SETTINGS ACTIONS
router.post('/clearance-settings/action/:action', async (req, res) => {
    try {
        // Check if user is logged in and has system admin role
        if (!req.session.user || (req.session.user.role !== 'system_admin' && req.session.user.role !== 'super_admin')) {
            return res.redirect('/admin/login');
        }

        const db = req.db;
        const { action } = req.params;

        const [settingsRows] = await db.execute(
            "SELECT * FROM clearance_settings ORDER BY academic_year DESC LIMIT 1"
        );
        const clearance_settings = settingsRows[0];

        if (!clearance_settings) {
            return res.status(404).json({ success: false, message: 'Settings not found' });
        }

        const academic_year = clearance_settings.academic_year;

        switch (action) {
            case 'activate':
                const threeDaysLater = new Date();
                threeDaysLater.setDate(threeDaysLater.getDate() + 3);
                await db.execute(
                    "UPDATE clearance_settings SET start_date = NOW(), end_date = ?, is_active = 1 WHERE academic_year = ?",
                    [threeDaysLater, academic_year]
                );
                break;
            case 'deactivate':
                await db.execute("UPDATE clearance_settings SET is_active = 0 WHERE academic_year = ?", [academic_year]);
                break;
            case 'extend_1_day':
                const d1 = new Date(clearance_settings.end_date);
                d1.setDate(d1.getDate() + 1);
                await db.execute("UPDATE clearance_settings SET end_date = ? WHERE academic_year = ?", [d1, academic_year]);
                break;
            case 'extend_3_days':
                const d3 = new Date(clearance_settings.end_date);
                d3.setDate(d3.getDate() + 3);
                await db.execute("UPDATE clearance_settings SET end_date = ? WHERE academic_year = ?", [d3, academic_year]);
                break;
            case 'start_now':
                const endD3 = new Date();
                endD3.setDate(endD3.getDate() + 3);
                await db.execute(
                    "UPDATE clearance_settings SET start_date = NOW(), end_date = ?, is_active = 1 WHERE academic_year = ?",
                    [endD3, academic_year]
                );
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        res.json({ success: true, message: `System ${action} successfully.` });

    } catch (error) {
        console.error('💥 Clearance action error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to perform action: ' + error.message
        });
    }
});

// Admin Logout
router.get('/logout', (req, res) => {
    console.log('👋 Admin logging out:', req.session.user?.username);
    req.session.destroy((err) => {
        if (err) {
            console.error('💥 Logout error:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }

        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.json({ success: true, message: 'Logged out successfully' });
        }
        res.redirect('/admin/login');
    });
});

// Helper function to get the appropriate dashboard path
function getDashboardPath(role) {
    const redirectPaths = {
        'library_admin': '/admin/departments/library',
        'cafeteria_admin': '/admin/departments/cafeteria',
        'department_admin': '/admin/departments/department',
        'registrar_admin': '/admin/registrar/dashboard',
        'dormitory_admin': '/admin/departments/dormitory',
        'system_admin': '/admin/system/dashboard',
        'personal_protector': '/admin/protector/dashboard',
        'super_admin': '/admin/dashboard'
    };

    return redirectPaths[role] || '/admin/system/dashboard';
}

// Helper function to redirect to appropriate dashboard
function redirectToDashboard(req, res) {
    const role = req.session.user.role;
    const path = getDashboardPath(role);
    console.log('🔄 Redirecting to:', path);
    res.redirect(path);
}

// Manage Admins Page Route (Renamed to avoid SPA route collision)
router.get('/system/manage-admins/data', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const search = req.query.search || '';
        const editAdminId = req.query.edit_admin || null;

        let admins;
        let departments = [
            'Information Technology',
            'Information System',
            'Software Engineering',
            'Computer Science',
            'Accounting',
            'Management',
            'Economics'
        ];
        let editAdmin = null;

        // Search functionality
        if (search) {
            const searchTerm = `%${search}%`;
            [admins] = await db.execute(
                "SELECT * FROM admin WHERE username LIKE ? OR name LIKE ? OR last_name LIKE ? ORDER BY id DESC",
                [searchTerm, searchTerm, searchTerm]
            );
        } else {
            [admins] = await db.execute("SELECT * FROM admin ORDER BY id DESC");
        }

        // Get admin for editing
        if (editAdminId) {
            [editAdmin] = await db.execute(
                "SELECT * FROM admin WHERE id = ?",
                [editAdminId]
            );
            editAdmin = editAdmin[0] || null;
        }

        res.json({
            success: true,
            user: req.session.user,
            admins: admins,
            departments: departments,
            edit_admin: editAdmin
        });

    } catch (error) {
        console.error('💥 Manage admins error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load admins: ' + error.message
        });
    }
});

// Library Admin Dashboard Route - GET (Renamed to avoid SPA route collision)
router.get('/departments/library/data', requireLibraryAdmin, async (req, res) => {
    try {

        const db = req.db;
        const user = req.session.user;

        // Get current academic year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const academicYear = `${currentYear}-${nextYear}`;

        // Get search and filter parameters with proper defaults
        const search = req.query.search || '';
        const status_filter = req.query.status || 'all';

        // Build main query with filters - FIXED: changed request_date to requested_at
        let main_query = `
            SELECT lc.*, s.name, s.last_name, s.student_id, s.department,
                   CONCAT(s.name, ' ', s.last_name) as student_name,
                   lc.requested_at as updated_at
            FROM library_clearance lc 
            JOIN student s ON lc.student_id = s.student_id 
            WHERE lc.academic_year = ?
        `;

        const params = [academicYear];

        // Apply search filter
        if (search) {
            main_query += ` AND (s.name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        // Apply status filter
        if (status_filter !== 'all') {
            main_query += ` AND lc.status = ?`;
            params.push(status_filter);
        }

        // FIXED: Changed request_date to requested_at
        main_query += ` ORDER BY lc.requested_at DESC`;

        // Get all requests with filters
        const [all_requests] = await db.execute(main_query, params);

        // Check cafeteria clearance for each request to determine lock status
        for (let request of all_requests) {
            const [cafeteriaCheck] = await db.execute(
                "SELECT status FROM cafeteria_clearance WHERE student_id = ? AND academic_year = ? AND status = 'approved'",
                [request.student_id, academicYear]
            );
            request.is_locked = cafeteriaCheck.length > 0;
        }

        // Get statistics from library_clearance table
        const [statsResult] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(status = 'pending') as pending,
                SUM(status = 'approved') as approved,
                SUM(status = 'rejected') as rejected
            FROM library_clearance
            WHERE academic_year = ?
        `, [academicYear]);

        const stats = statsResult[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        // Ensure values are numbers even if SUM returns null
        stats.total = stats.total || 0;
        stats.pending = stats.pending || 0;
        stats.approved = stats.approved || 0;
        stats.rejected = stats.rejected || 0;

        // Get messages from session
        const messages = req.session.messages || [];
        let success_message = null;
        let error_message = null;

        // Extract success and error messages
        messages.forEach(msg => {
            if (msg.type === 'success') {
                success_message = msg.text || msg.msg;
            } else if (msg.type === 'error') {
                error_message = msg.text || msg.msg;
            }
        });

        // Clear messages from session immediately after reading
        req.session.messages = [];

        res.json({
            success: true,
            user: user,
            all_requests: all_requests,
            stats: stats,
            currentYear: currentYear,
            search: search,
            status: status_filter
        });

    } catch (error) {
        console.error('💥 Library dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load library dashboard: ' + error.message
        });
    }
});

// Library Admin Actions - Approve/Reject Requests - POST
router.post('/departments/library', requireLibraryAdmin, async (req, res) => {
    try {

        const db = req.db;
        const { request_id, approve, reject, reject_reason, bulk_action, selected_requests, bulk_reject_reason } = req.body;

        // Get current academic year from settings
        const [settingsRows] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const academicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Function to check if cafeteria has approved this student
        const isLockedForLibrary = async (student_id) => {
            try {
                const [result] = await db.execute(
                    "SELECT status FROM cafeteria_clearance WHERE student_id = ? AND academic_year = ? AND status = 'approved'",
                    [student_id, academicYear]
                );
                return result.length > 0;
            } catch (error) {
                console.error('Error checking cafeteria clearance:', error);
                return false;
            }
        };

        // Handle single approval
        if (approve && request_id) {
            try {
                // Get student_id for this request
                const [requestData] = await db.execute(
                    "SELECT student_id FROM library_clearance WHERE id = ? AND academic_year = ?",
                    [request_id, academicYear]
                );

                if (requestData.length > 0) {
                    const student_id = requestData[0].student_id;

                    // Check if locked (cafeteria has approved)
                    if (await isLockedForLibrary(student_id)) {
                        req.session.messages = [{ type: 'error', text: `Cannot modify: Cafeteria has already approved this student for ${currentYear}!` }];
                    } else {
                        await db.execute(
                            "UPDATE library_clearance SET status = 'approved', approved_at = NOW(), reject_reason = NULL WHERE id = ? AND academic_year = ?",
                            [request_id, academicYear]
                        );
                        req.session.messages = [{ type: 'success', text: `Request approved successfully for ${currentYear}!` }];
                    }
                } else {
                    req.session.messages = [{ type: 'error', text: `Request not found for ${currentYear}!` }];
                }
            } catch (error) {
                console.error('Error approving request:', error);
                req.session.messages = [{ type: 'error', text: 'Error approving request. Please try again.' }];
            }
        }
        // Handle single rejection
        else if (reject && request_id) {
            try {
                // Validate reject reason
                if (!reject_reason || reject_reason.trim() === '') {
                    return res.status(400).json({ success: false, message: 'Reject reason is required!' });
                }

                // Get student_id for this request
                const [requestData] = await db.execute(
                    "SELECT student_id FROM library_clearance WHERE id = ? AND academic_year = ?",
                    [request_id, academicYear]
                );

                if (requestData.length > 0) {
                    const student_id = requestData[0].student_id;

                    // Check if locked (cafeteria has approved)
                    if (await isLockedForLibrary(student_id)) {
                        req.session.messages = [{ type: 'error', text: `Cannot modify: Cafeteria has already approved this student for ${currentYear}!` }];
                    } else {
                        await db.execute(
                            "UPDATE library_clearance SET status = 'rejected', reject_reason = ?, rejected_at = NOW() WHERE id = ? AND academic_year = ?",
                            [reject_reason.trim(), request_id, academicYear]
                        );
                        req.session.messages = [{ type: 'success', text: `Request rejected successfully for ${currentYear}!` }];
                    }
                } else {
                    req.session.messages = [{ type: 'error', text: `Request not found for ${currentYear}!` }];
                }
            } catch (error) {
                console.error('Error rejecting request:', error);
                req.session.messages = [{ type: 'error', text: 'Error rejecting request. Please try again.' }];
            }
        }
        // Handle bulk actions
        else if (bulk_action && selected_requests) {
            try {
                // Handle both single and array cases for selected_requests
                const requestIds = Array.isArray(selected_requests) ? selected_requests : [selected_requests];

                if (requestIds.length === 0) {
                    return res.status(400).json({ success: false, message: 'Please select at least one request!' });
                }

                if (bulk_action === 'approve') {
                    let processed_count = 0;
                    let locked_count = 0;
                    let error_count = 0;

                    // Process each request individually to check locks
                    for (const requestId of requestIds) {
                        try {
                            // Get student_id for this request
                            const [requestData] = await db.execute(
                                "SELECT student_id FROM library_clearance WHERE id = ? AND academic_year = ?",
                                [requestId, academicYear]
                            );

                            if (requestData.length > 0) {
                                const student_id = requestData[0].student_id;

                                // Check if locked (cafeteria has approved)
                                if (!(await isLockedForLibrary(student_id))) {
                                    await db.execute(
                                        "UPDATE library_clearance SET status = 'approved', approved_at = NOW(), reject_reason = NULL WHERE id = ? AND academic_year = ?",
                                        [requestId, academicYear]
                                    );
                                    processed_count++;
                                } else {
                                    locked_count++;
                                }
                            } else {
                                error_count++;
                            }
                        } catch (error) {
                            console.error(`Error processing request ${requestId}:`, error);
                            error_count++;
                        }
                    }

                    // Set appropriate messages based on results
                    if (processed_count > 0) {
                        req.session.messages = [{ type: 'success', text: `${processed_count} request(s) approved successfully for ${currentYear}!` }];
                        if (locked_count > 0) {
                            req.session.messages.push({ type: 'error', text: `${locked_count} request(s) could not be processed (approved by cafeteria).` });
                        }
                        if (error_count > 0) {
                            req.session.messages.push({ type: 'error', text: `${error_count} request(s) had errors.` });
                        }
                    } else if (locked_count > 0) {
                        req.session.messages = [{ type: 'error', text: 'Selected requests are locked and cannot be modified (approved by cafeteria).' }];
                    } else {
                        req.session.messages = [{ type: 'error', text: `No requests could be processed. Please check if requests exist for ${currentYear}.` }];
                    }
                }
                else if (bulk_action === 'reject') {
                    // Validate bulk reject reason
                    if (!bulk_reject_reason || bulk_reject_reason.trim() === '') {
                        return res.status(400).json({ success: false, message: 'Reject reason is required for bulk rejection!' });
                    }

                    let processed_count = 0;
                    let locked_count = 0;
                    let error_count = 0;

                    // Process each request individually to check locks
                    for (const requestId of requestIds) {
                        try {
                            // Get student_id for this request
                            const [requestData] = await db.execute(
                                "SELECT student_id FROM library_clearance WHERE id = ? AND academic_year = ?",
                                [requestId, academicYear]
                            );

                            if (requestData.length > 0) {
                                const student_id = requestData[0].student_id;

                                // Check if locked (cafeteria has approved)
                                if (!(await isLockedForLibrary(student_id))) {
                                    await db.execute(
                                        "UPDATE library_clearance SET status = 'rejected', reject_reason = ?, rejected_at = NOW() WHERE id = ? AND academic_year = ?",
                                        [bulk_reject_reason.trim(), requestId, academicYear]
                                    );
                                    processed_count++;
                                } else {
                                    locked_count++;
                                }
                            } else {
                                error_count++;
                            }
                        } catch (error) {
                            console.error(`Error processing request ${requestId}:`, error);
                            error_count++;
                        }
                    }

                    // Set appropriate messages based on results
                    if (processed_count > 0) {
                        req.session.messages = [{ type: 'success', text: `${processed_count} request(s) rejected successfully for ${currentYear}!` }];
                        if (locked_count > 0) {
                            req.session.messages.push({ type: 'error', text: `${locked_count} request(s) could not be processed (approved by cafeteria).` });
                        }
                        if (error_count > 0) {
                            req.session.messages.push({ type: 'error', text: `${error_count} request(s) had errors.` });
                        }
                    } else if (locked_count > 0) {
                        req.session.messages = [{ type: 'error', text: 'Selected requests are locked and cannot be modified (approved by cafeteria).' }];
                    } else {
                        req.session.messages = [{ type: 'error', text: `No requests could be processed. Please check if requests exist for ${currentYear}.` }];
                    }
                }
            } catch (error) {
                console.error('Error processing bulk action:', error);
                req.session.messages = [{ type: 'error', text: 'Error processing bulk action. Please try again.' }];
            }
        } else {
            // No valid action detected
            req.session.messages = [{ type: 'error', text: 'No valid action specified.' }];
        }

        // Return JSON response for React frontend
        res.json({
            success: true,
            messages: req.session.messages
        });

        // Clear messages
        req.session.messages = [];

    } catch (error) {
        console.error('💥 Library action error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request: ' + error.message
        });
    }
});
// Debug route to check all routes
router.get('/debug-routes', (req, res) => {
    const routes = [];
    router.stack.forEach((layer) => {
        if (layer.route) {
            const methods = Object.keys(layer.route.methods).map(method => method.toUpperCase());
            routes.push({
                path: layer.route.path,
                methods: methods
            });
        }
    });

    res.json({
        message: 'Admin Routes Debug',
        availableRoutes: routes
    });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads/profile_pics');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile_' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 2 * 1024 * 1024 // 2MB
    },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// =================== MANAGE STUDENTS ROUTES ===================

// Manage Students Data Fetching (Renamed to avoid SPA route collision)
router.get('/system/manage-students/data', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const search = req.query.search || '';
        const editStudentId = req.query.edit_student || null;

        let students;
        let editStudent = null;

        // Search functionality
        if (search) {
            const searchTerm = `%${search}%`;
            [students] = await db.execute(
                "SELECT * FROM student WHERE student_id LIKE ? OR name LIKE ? OR last_name LIKE ? ORDER BY student_id ASC",
                [searchTerm, searchTerm, searchTerm]
            );
        } else {
            [students] = await db.execute("SELECT * FROM student ORDER BY student_id ASC");
        }

        // Get student for editing
        if (editStudentId) {
            [editStudent] = await db.execute(
                "SELECT * FROM student WHERE student_id = ?",
                [editStudentId]
            );
            editStudent = editStudent[0] || null;
        }

        // Get flash messages
        const messages = req.session.messages || [];
        req.session.messages = [];

        res.json({
            success: true,
            user: req.session.user,
            students: students,
            departments: departments,
            search: search,
            edit_student: editStudent,
            current_page: 'manage-students',
            messages: messages
        });

    } catch (error) {
        console.error('💥 Manage students error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load students: ' + error.message
        });
    }
});

// Add Student
router.post('/system/manage-students/add', requireSystemAdmin, upload.single('profile_picture'), async (req, res) => {
    try {

        const db = req.db;
        const {
            name,
            last_name,
            username,
            email,
            department,
            phone,
            year,
            semester,
            password
        } = req.body;

        // Automatic Student ID Generation
        let final_student_id = '';

        // Get official academic year from settings
        const [settingsRows] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const academicYearFull = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        // Extract suffix (e.g., from "2015-2016" or "24-25" or "15")
        // The user example DBU005/15 suggests '15' is the suffix
        const yearSuffix = academicYearFull.split('-')[0].slice(-2);

        // Get the latest student to find the next number across ALL years to ensure unique number if desired, 
        // OR just the highest number for this specific year suffix.
        const [latestStudent] = await db.execute(
            "SELECT student_id FROM student WHERE student_id LIKE ? ORDER BY id DESC LIMIT 1",
            [`DBU%/${yearSuffix}`]
        );

        if (latestStudent.length > 0) {
            const lastId = latestStudent[0].student_id;
            // Extract number from DBU001/15 format
            const match = lastId.match(/DBU(\d+)\//i);
            if (match) {
                const nextNum = parseInt(match[1]) + 1;
                final_student_id = `DBU${nextNum.toString().padStart(3, '0')}/${yearSuffix}`;
            } else {
                final_student_id = `DBU001/${yearSuffix}`;
            }
        } else {
            // Check if there are ANY students to start from a reasonable baseline if no students exist for THIS year
            const [anyStudent] = await db.execute("SELECT student_id FROM student ORDER BY id DESC LIMIT 1");
            if (anyStudent.length > 0) {
                const match = anyStudent[0].student_id.match(/DBU(\d+)\//i);
                if (match) {
                    const nextNum = parseInt(match[1]) + 1;
                    final_student_id = `DBU${nextNum.toString().padStart(3, '0')}/${yearSuffix}`;
                } else {
                    final_student_id = `DBU001/${yearSuffix}`;
                }
            } else {
                final_student_id = `DBU001/${yearSuffix}`;
            }
        }

        const form_errors = [];

        // Validation
        if (!name || !/^[a-zA-Z]+$/.test(name)) {
            form_errors.push("First name is required and must contain letters only.");
        }

        if (!last_name || !/^[a-zA-Z]+$/.test(last_name)) {
            form_errors.push("Last name is required and must contain letters only.");
        }

        if (!username) {
            form_errors.push("Username is required.");
        } else {
            const [existingUser] = await db.execute(
                "SELECT COUNT(*) as count FROM student WHERE username = ?",
                [username]
            );
            if (existingUser[0].count > 0) {
                form_errors.push(`Username '${username}' is already taken.`);
            }
        }

        if (!email) {
            form_errors.push("A valid institutional or personal email is mandatory for registration.");
        } else {
            // 1. Basic Format Validation
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                form_errors.push("Please provide a valid email address format (e.g., example@gmail.com).");
            } else {
                // 2. Uniqueness Validation
                const [existingEmail] = await db.execute(
                    "SELECT COUNT(*) as count FROM student WHERE email = ?",
                    [email]
                );
                if (existingEmail[0].count > 0) {
                    form_errors.push(`Email '${email}' is already registered.`);
                } else {
                    // 3. Real Domain Validation (DNS MX Check)
                    try {
                        const domain = email.split('@')[1].toLowerCase();

                        // Check against disposable domain list
                        if (disposableDomains.includes(domain)) {
                            form_errors.push(`The email domain '@${domain}' is blocked. Please use an institutional or personal email.`);
                        } else {
                            const mxRecords = await dns.resolveMx(domain);
                            if (!mxRecords || mxRecords.length === 0) {
                                form_errors.push(`The email domain '@${domain}' does not appear to be a real or active email service.`);
                            }
                        }
                    } catch (dnsError) {
                        console.error('📧 DNS Validation Error:', dnsError);
                        form_errors.push(`Could not verify the email domain '@${email.split('@')[1]}'. Please ensure it's a real email address.`);
                    }
                }
            }
        }

        if (!department || !departments.includes(department)) {
            form_errors.push("Please select a valid department.");
        }

        if (!phone || !/^\d{10}$/.test(phone)) {
            form_errors.push("Phone number is required and must be exactly 10 digits.");
        }

        if (!year || !/^[1-4]$/.test(year)) {
            form_errors.push("Year is required and must be selected from the dropdown.");
        }

        if (!semester || !['1', '2'].includes(semester)) {
            form_errors.push("Semester is required and must be selected from the dropdown.");
        }

        if (!password || password.length < 8) {
            form_errors.push("Password is required and must be at least 8 characters long.");
        }

        if (form_errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: form_errors.join(". ")
            });
        }

        // Student ID already handled above from req.body or manual input

        // Handle profile picture
        let profile_picture = null;
        if (req.file) {
            profile_picture = 'uploads/profile_pics/' + req.file.filename;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert student
        const params = [
            final_student_id,
            name || '',
            last_name || '',
            phone || '',
            email || '',
            department || '',
            username || '',
            hashedPassword,
            year || '1',
            semester || '1',
            profile_picture || null
        ];

        await db.execute(
            "INSERT INTO student (student_id, name, last_name, phone, email, department, username, password, year, semester, profile_picture, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
            params
        );

        // Send email notification to student
        const mailOptions = {
            from: `"DBU Clearance System" <${process.env.EMAIL_USER || 'amanneby004@gmail.com'}>`,
            to: email,
            subject: 'Account Created - DBU Clearance Management System',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #4f46e5;">Welcome to DBU Clearance System</h2>
                    <p>Dear ${name} ${last_name},</p>
                    <p>Your account has been created successfully in the DBU Clearance Management System.</p>
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Your Login Credentials:</strong></p>
                        <p style="margin: 10px 0 0 0;">Username: <strong>${username}</strong></p>
                        <p style="margin: 5px 0 0 0;">Password: <strong>${password}</strong></p>
                    </div>
                    <p style="color: #ef4444; font-weight: bold;">For security reasons, please change your password immediately after first login.</p>
                    <p>Best regards,<br>DBU Administration</p>
                </div>
            `
        };

        try {
            await emailTransporter.sendMail(mailOptions);
            console.log('✅ Registration email sent to:', email);
        } catch (mailError) {
            console.error('❌ Failed to send registration email. Rolling back student creation:', mailError);

            // ROLLBACK: Delete the student if the email is invalid/rejected by SMTP
            await db.execute("DELETE FROM student WHERE student_id = ?", [final_student_id]);

            return res.status(400).json({
                success: false,
                message: "Email not found. Please enter a correct email address."
            });
        }

        res.json({
            success: true,
            message: 'Student added successfully and notification email sent.',
            student_id: final_student_id
        });

    } catch (error) {
        console.error('💥 Add student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add student: ' + error.message
        });
    }
});

// Update Student
router.post('/system/manage-students/update', requireSystemAdmin, upload.single('profile_picture'), async (req, res) => {
    try {

        const db = req.db;
        const {
            student_id,
            name,
            last_name,
            username,
            email,
            department,
            phone,
            year,
            semester,
            password,
            status
        } = req.body;

        const final_student_id = Array.isArray(student_id) ? student_id[0] : student_id;

        if (!final_student_id) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        const form_errors = [];

        // Validation
        if (!name || !/^[a-zA-Z]+$/.test(name)) {
            form_errors.push("First name is required and must contain letters only.");
        }

        if (!last_name || !/^[a-zA-Z]+$/.test(last_name)) {
            form_errors.push("Last name is required and must contain letters only.");
        }

        if (!username) {
            form_errors.push("Username is required.");
        } else {
            const [existingUser] = await db.execute(
                "SELECT COUNT(*) as count FROM student WHERE username = ? AND student_id != ?",
                [username, final_student_id]
            );
            if (existingUser[0].count > 0) {
                form_errors.push(`Username '${username}' is already taken.`);
            }
        }

        if (!email) {
            form_errors.push("Email is required.");
        } else {
            const [existingEmail] = await db.execute(
                "SELECT COUNT(*) as count FROM student WHERE email = ? AND student_id != ?",
                [email, final_student_id]
            );
            if (existingEmail[0].count > 0) {
                form_errors.push(`Email '${email}' is already registered.`);
            }
        }

        if (!department || !departments.includes(department)) {
            form_errors.push("Please select a valid department.");
        }

        if (!phone || !/^\d{10}$/.test(phone)) {
            form_errors.push("Phone number is required and must be exactly 10 digits.");
        }

        if (password && password.length < 8) {
            form_errors.push("Password must be at least 8 characters long.");
        }

        if (!status || !['active', 'inactive'].includes(status)) {
            form_errors.push("Status is required and must be either active or inactive.");
        }

        if (!year || !/^[1-4]$/.test(year)) {
            form_errors.push("Year is required and must be selected from the dropdown.");
        }

        if (!semester || !['1', '2'].includes(semester)) {
            form_errors.push("Semester is required and must be selected from the dropdown.");
        }

        if (form_errors.length > 0) {
            return res.status(400).json({
                success: false,
                message: form_errors.join(". ")
            });
        }

        // Get current profile picture path
        const [currentStudent] = await db.execute(
            "SELECT profile_picture FROM student WHERE student_id = ?",
            [final_student_id]
        );
        let profile_picture = currentStudent[0]?.profile_picture;

        // Handle profile picture update
        let profile_picture_update = profile_picture;
        if (req.file) {
            profile_picture_update = 'uploads/profile_pics/' + req.file.filename;

            // Delete old profile picture if exists
            if (profile_picture) {
                const oldPath = path.join(__dirname, '../public', profile_picture);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            const params = [
                name || '',
                last_name || '',
                phone || '',
                email || '',
                department || '',
                username || '',
                hashedPassword,
                profile_picture_update || null,
                status || 'active',
                year || '1',
                semester || '1',
                final_student_id
            ];
            await db.execute(
                "UPDATE student SET name=?, last_name=?, phone=?, email=?, department=?, username=?, password=?, profile_picture=?, status=?, year=?, semester=? WHERE student_id=?",
                params
            );
        } else {
            const params = [
                name || '',
                last_name || '',
                phone || '',
                email || '',
                department || '',
                username || '',
                profile_picture_update || null,
                status || 'active',
                year || '1',
                semester || '1',
                final_student_id
            ];
            await db.execute(
                "UPDATE student SET name=?, last_name=?, phone=?, email=?, department=?, username=?, profile_picture=?, status=?, year=?, semester=? WHERE student_id=?",
                params
            );
        }

        res.json({
            success: true,
            message: 'Student updated successfully.'
        });

    } catch (error) {
        console.error('💥 Update student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student: ' + error.message
        });
    }
});

// Delete Student
router.get('/system/manage-students/delete/:id', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const student_id = req.params.id;

        // Get profile picture path
        const [student] = await db.execute(
            "SELECT profile_picture FROM student WHERE student_id = ?",
            [student_id]
        );

        // Delete profile picture file if exists
        if (student.length > 0 && student[0].profile_picture) {
            const filePath = path.join(__dirname, '../public', student[0].profile_picture);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Delete student from database
        await db.execute(
            "DELETE FROM student WHERE student_id = ?",
            [student_id]
        );

        res.json({
            success: true,
            message: 'Student deleted successfully.'
        });

    } catch (error) {
        console.error('💥 Delete student error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete student: ' + error.message
        });
    }
});

// Toggle Student Status
router.get('/system/manage-students/toggle-status/:id', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const student_id = req.params.id;

        // Get current status
        const [student] = await db.execute(
            "SELECT status FROM student WHERE student_id = ?",
            [student_id]
        );

        if (student.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        // Toggle status
        const current_status = student[0].status;
        const new_status = current_status === 'active' ? 'inactive' : 'active';

        await db.execute(
            "UPDATE student SET status = ? WHERE student_id = ?",
            [new_status, student_id]
        );

        res.json({
            success: true,
            message: `Student status changed to ${new_status} successfully.`
        });

    } catch (error) {
        console.error('💥 Toggle status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update student status: ' + error.message
        });
    }
});

// Bulk Actions
router.post('/system/manage-students/bulk-actions', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const { bulk_action, selected_students } = req.body;

        if (!selected_students || !Array.isArray(selected_students) || selected_students.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one student!'
            });
        }

        let success_count = 0;
        let failed_count = 0;

        switch (bulk_action) {
            case 'activate':
                for (const student_id of selected_students) {
                    try {
                        await db.execute(
                            "UPDATE student SET status = 'active' WHERE student_id = ?",
                            [student_id]
                        );
                        success_count++;
                    } catch (error) {
                        failed_count++;
                    }
                }
                break;

            case 'deactivate':
                for (const student_id of selected_students) {
                    try {
                        await db.execute(
                            "UPDATE student SET status = 'inactive' WHERE student_id = ?",
                            [student_id]
                        );
                        success_count++;
                    } catch (error) {
                        failed_count++;
                    }
                }
                break;

            case 'delete':
                for (const student_id of selected_students) {
                    try {
                        // Get profile picture path
                        const [student] = await db.execute(
                            "SELECT profile_picture FROM student WHERE student_id = ?",
                            [student_id]
                        );

                        // Delete profile picture file if exists
                        if (student.length > 0 && student[0].profile_picture) {
                            const filePath = path.join(__dirname, '../public', student[0].profile_picture);
                            if (fs.existsSync(filePath)) {
                                fs.unlinkSync(filePath);
                            }
                        }

                        // Delete student
                        await db.execute(
                            "DELETE FROM student WHERE student_id = ?",
                            [student_id]
                        );
                        success_count++;
                    } catch (error) {
                        failed_count++;
                    }
                }
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action!'
                });
        }

        let message = '';
        if (success_count > 0) {
            message = `${success_count} student(s) processed successfully!`;
            if (failed_count > 0) {
                message += ` ${failed_count} student(s) failed to process.`;
            }
        } else {
            message = 'No students were processed.';
        }

        res.json({
            success: success_count > 0,
            message: message
        });

    } catch (error) {
        console.error('💥 Bulk actions error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process bulk actions: ' + error.message
        });
    }
});
// =================== MANAGE ADMINS ROUTES ===================

// Add Admin
router.post('/system/manage-admins/add', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const {
            name,
            last_name,
            username,
            email,
            phone,
            role,
            department_name,
            password
        } = req.body;

        const form_errors = [];
        const form_data = { name, last_name, username, email, phone, role, department_name };

        console.log('📝 Add admin attempt:', { name, username, email, role });

        // VALIDATION
        if (!name || !/^[a-zA-Z]+$/.test(name)) {
            form_errors.push("First name is required and must contain letters only.");
        }
        if (!last_name || !/^[a-zA-Z]+$/.test(last_name)) {
            form_errors.push("Last name is required and must contain letters only.");
        }
        if (!username) {
            form_errors.push("Username is required.");
        } else {
            const [existingUser] = await db.execute(
                "SELECT COUNT(*) as count FROM admin WHERE username = ?",
                [username]
            );
            if (existingUser[0].count > 0) {
                form_errors.push(`Username '${username}' is already taken.`);
            }
        }
        if (!email) {
            form_errors.push("Email is required.");
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            form_errors.push("Invalid email format.");
        } else {
            const [existingEmail] = await db.execute(
                "SELECT COUNT(*) as count FROM admin WHERE email = ?",
                [email]
            );
            if (existingEmail[0].count > 0) {
                form_errors.push(`Email '${email}' is already registered.`);
            }
        }
        if (!phone || !/^\d{10}$/.test(phone)) {
            form_errors.push("Phone number is required and must be exactly 10 digits.");
        }

        const valid_roles = ['system_admin', 'registrar_admin', 'department_admin', 'cafeteria_admin', 'library_admin', 'dormitory_admin', 'personal_protector'];
        if (!role || !valid_roles.includes(role)) {
            form_errors.push("Please select a valid role.");
        }

        // Department validation - required only for department_admin role
        if (role === 'department_admin') {
            if (!department_name) {
                form_errors.push("Department name is required for Department Admin role.");
            } else if (!departments.includes(department_name)) {
                form_errors.push("Please select a valid department.");
            }
        }

        if (!password || password.length < 8) {
            form_errors.push("Password is required and must be at least 8 characters long.");
        }

        if (form_errors.length > 0) {
            console.log('❌ Form errors:', form_errors);
            return res.status(400).json({
                success: false,
                message: form_errors.join(". "),
                form_errors: form_errors,
                form_data: form_data
            });
        }

        // If no errors, insert admin
        const hashedPassword = await bcrypt.hash(password, 10);
        const finalDepartment = role === 'department_admin' ? department_name : null;

        await db.execute(
            "INSERT INTO admin (name, last_name, username, email, phone, role, department_name, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, last_name, username, email, phone, role, finalDepartment, hashedPassword]
        );

        console.log('✅ Admin added successfully:', username);
        res.json({
            success: true,
            message: 'Admin added successfully.'
        });

    } catch (error) {
        console.error('💥 Add admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add admin: ' + error.message
        });
    }
});

// Update Admin
// Update Admin - Support both body ID and param ID for flexibility
// Update Admin
router.post(['/system/manage-admins/update', '/system/manage-admins/update/:id'], requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const adminId = req.params.id || req.body.id;
        const {
            name,
            last_name,
            username,
            email,
            phone,
            role,
            department_name,
            password
        } = req.body;

        const form_errors = [];
        const form_data = { name, last_name, username, email, phone, role, department_name };

        console.log('📝 Update admin attempt:', { id: adminId, name, username, role });

        // VALIDATION for update (similar but allow current record username/email)
        if (!name || !/^[a-zA-Z]+$/.test(name)) {
            form_errors.push("First name is required and must contain letters only.");
        }
        if (!last_name || !/^[a-zA-Z]+$/.test(last_name)) {
            form_errors.push("Last name is required and must contain letters only.");
        }
        if (!username) {
            form_errors.push("Username is required.");
        } else {
            const [existingUser] = await db.execute(
                "SELECT COUNT(*) as count FROM admin WHERE username = ? AND id != ?",
                [username, adminId]
            );
            if (existingUser[0].count > 0) {
                form_errors.push(`Username '${username}' is already taken by another admin.`);
            }
        }
        if (!email) {
            form_errors.push("Email is required.");
        } else if (!/^\S+@\S+\.\S+$/.test(email)) {
            form_errors.push("Invalid email format.");
        } else {
            const [existingEmail] = await db.execute(
                "SELECT COUNT(*) as count FROM admin WHERE email = ? AND id != ?",
                [email, adminId]
            );
            if (existingEmail[0].count > 0) {
                form_errors.push(`Email '${email}' is already registered by another admin.`);
            }
        }
        if (!phone || !/^\d{10}$/.test(phone)) {
            form_errors.push("Phone number is required and must be exactly 10 digits.");
        }

        const valid_roles = ['system_admin', 'registrar_admin', 'department_admin', 'cafeteria_admin', 'library_admin', 'dormitory_admin', 'personal_protector'];
        if (!role || !valid_roles.includes(role)) {
            form_errors.push("Please select a valid role.");
        }

        // Department validation - required only for department_admin role
        if (role === 'department_admin') {
            if (!department_name) {
                form_errors.push("Department name is required for Department Admin role.");
            } else if (!departments.includes(department_name)) {
                form_errors.push("Please select a valid department.");
            }
        }

        if (password && password.length < 8) {
            form_errors.push("Password must be at least 8 characters long if you want to update it.");
        }

        if (form_errors.length > 0) {
            console.log('❌ Form errors:', form_errors);
            return res.status(400).json({
                success: false,
                message: form_errors.join(". "),
                form_errors: form_errors,
                form_data: form_data
            });
        }

        // Update admin
        const finalDepartment = role === 'department_admin' ? department_name : null;

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            await db.execute(
                "UPDATE admin SET name=?, last_name=?, email=?, phone=?, role=?, department_name=?, username=?, password=? WHERE id=?",
                [name, last_name, email, phone, role, finalDepartment, username, hashedPassword, adminId]
            );
            console.log('✅ Admin updated with new password:', username);
        } else {
            await db.execute(
                "UPDATE admin SET name=?, last_name=?, email=?, phone=?, role=?, department_name=?, username=? WHERE id=?",
                [name, last_name, email, phone, role, finalDepartment, username, adminId]
            );
            console.log('✅ Admin updated without password change:', username);
        }

        res.json({
            success: true,
            message: 'Admin updated successfully.'
        });

    } catch (error) {
        console.error('💥 Update admin error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update admin: ' + error.message
        });
    }
});

// Delete Admin
router.get('/system/manage-admins/delete/:id', requireSystemAdmin, async (req, res) => {
    try {

        const db = req.db;
        const admin_id = req.params.id;

        console.log('🗑️ Delete admin attempt:', admin_id);

        // Prevent self-deletion
        if (parseInt(admin_id) === req.session.user.id) {
            req.session.messages = [{ type: 'error', msg: 'You cannot delete your own account!' }];
            return res.redirect('/admin/system/manage-admins');
        }

        await db.execute(
            "DELETE FROM admin WHERE id = ?",
            [admin_id]
        );

        console.log('✅ Admin deleted successfully:', admin_id);
        req.session.messages = [{ type: 'success', msg: 'Admin deleted successfully.' }];
        res.redirect('/admin/system/manage-admins');

    } catch (error) {
        console.error('💥 Delete admin error:', error);
        req.session.messages = [{ type: 'error', msg: 'Failed to delete admin: ' + error.message }];
        res.redirect('/admin/system/manage-admins');
    }
});

// Help/Contact Route (Publicly accessible)
router.post('/contact', async (req, res) => {
    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        const mailOptions = {
            from: `"Contact Form - ${name}" <${process.env.EMAIL_USER || 'amanneby004@gmail.com'}>`, // Must be authorized sender
            to: process.env.EMAIL_USER || 'amanneby004@gmail.com', // Recipient (Admin)
            replyTo: email,
            subject: `Support Request: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #4f46e5; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px;">Support Request</h2>
                    <p><strong>From:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 20px;">
                        <p style="margin: 0; font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Message Content:</p>
                        <p style="white-space: pre-wrap; margin-top: 10px; line-height: 1.6;">${message}</p>
                    </div>
                    <p style="font-size: 11px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #f3f4f6; padding-top: 10px;">
                        This message was sent via the DBU Clearance System Contact Form.
                    </p>
                </div>
            `
        };

        await emailTransporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Your message has been sent successfully!'
        });

    } catch (error) {
        console.error('💥 Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message. Please try again later.'
        });
    }
});

module.exports = router;
