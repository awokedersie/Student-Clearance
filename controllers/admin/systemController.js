const bcrypt = require('bcryptjs');
const logger = require('../../utils/logger');
const responseHandler = require('../../utils/responseHandler');

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

exports.login = async (req, res) => {
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

        return responseHandler.success(res, {
            user: req.session.user,
            redirect: getDashboardPath(admin.role)
        }, 'Login successful');

    } catch (error) {
        return responseHandler.error(res, 'Login failed. Please try again.', 500, error);
    }
};

exports.getDashboard = (req, res) => {
    if (!req.session.user || req.session.user.role === 'student') {
        return res.redirect('/admin/login');
    }

    const role = req.session.user.role;
    if (req.session.user.role !== 'super_admin' && role !== 'system_admin') {
        return redirectToDashboard(req, res);
    }

    try {
        res.json({
            success: true,
            user: req.session.user,
            redirect: '/admin/system/dashboard'
        });
    } catch (error) {
        console.log('⚠️ Admin dashboard view not found, redirecting to system dashboard');
        res.redirect('/admin/system/dashboard');
    }
};

exports.getSystemDashboardData = async (req, res) => {
    try {
        const db = req.db;

        // Auto-cleanup: Delete orphan records and decommissioned departments (finance)
        try {
            await db.execute("DELETE FROM clearance_requests WHERE student_id NOT IN (SELECT student_id FROM student)");

            await db.execute("DELETE FROM clearance_requests WHERE target_department = 'finance'");
        } catch (cleanupErr) {
            console.warn('⚠️ Minor issue during dashboard auto-cleanup:', cleanupErr.message);
        }

        const [studentStats] = await db.execute("SELECT status, COUNT(*) as count FROM student GROUP BY status");
        const [adminCount] = await db.execute("SELECT COUNT(*) as total FROM admin");

        // Detailed clearance stats by department (excluding decommissioned ones)
        const [deptStats] = await db.execute(`
            SELECT target_department, status, COUNT(*) as count 
            FROM clearance_requests 
            WHERE target_department != 'finance'
            GROUP BY target_department, status
        `);

        // Registrar status (Final Approval)
        const [registrarStats] = await db.execute(`
            SELECT status, COUNT(*) as count 
            FROM clearance_requests 
            WHERE target_department = 'registrar' 
            GROUP BY status
        `);

        // Format student breakdown
        const studentBreakdown = { active: 0, inactive: 0, total: 0 };
        studentStats.forEach(s => {
            if (s.status === 'active') studentBreakdown.active = parseInt(s.count);
            else studentBreakdown.inactive = parseInt(s.count);
            studentBreakdown.total += parseInt(s.count);
        });

        const statistics = {
            total_students: studentBreakdown.total,
            active_students: studentBreakdown.active,
            inactive_students: studentBreakdown.inactive,
            total_admins: adminCount[0].total,
            approved_students: registrarStats.find(r => r.status === 'approved')?.count || 0,
            rejected_students: registrarStats.find(r => r.status === 'rejected')?.count || 0,
            pending_students: registrarStats.find(r => r.status === 'pending')?.count || 0,
            department_stats: deptStats,
            active_requests: studentBreakdown.total - (registrarStats.find(r => r.status === 'approved')?.count || 0)
        };

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
};

exports.getClearanceSettingsData = async (req, res) => {
    try {
        const db = req.db;
        const current_year = new Date().getFullYear();
        const next_year = current_year + 1;
        const academic_year = `${current_year}-${next_year}`;

        const [settings] = await db.execute(
            "SELECT * FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );

        let clearance_settings = settings[0];

        if (!clearance_settings) {
            const default_start = new Date();
            const default_end = new Date();
            default_end.setDate(default_end.getDate() + 7);

            await db.execute(
                "INSERT INTO clearance_settings (academic_year, start_date, end_date, is_active) VALUES (?, ?, ?, ?)",
                [academic_year, default_start, default_end, false]
            );
            const [newSettings] = await db.execute("SELECT * FROM clearance_settings ORDER BY id DESC LIMIT 1");
            clearance_settings = newSettings[0];
        }

        // Calculate system status
        const now = new Date();
        const start = new Date(clearance_settings.start_date);
        const end = new Date(clearance_settings.end_date);

        let system_status = 'CLOSED';
        let status_icon = '🔒';
        let status_class = 'text-red-600 bg-red-50';

        if (clearance_settings.is_active) {
            if (now >= start && now <= end) {
                system_status = 'ACTIVE';
                status_icon = '✅';
                status_class = 'text-emerald-600 bg-emerald-50';
            } else if (now < start) {
                system_status = 'SCHEDULED';
                status_icon = '⏳';
                status_class = 'text-amber-600 bg-amber-50';
            } else if (now > end) {
                system_status = 'EXPIRED';
                status_icon = '⏰';
                status_class = 'text-orange-600 bg-orange-50';
            }
        }

        // Stats calculation
        const [studentCount] = await db.execute("SELECT COUNT(*) as total FROM student");
        const [finalizedCount] = await db.execute("SELECT COUNT(*) as total FROM clearance_requests WHERE target_department = 'registrar' AND status = 'approved' AND academic_year = ?", [clearance_settings.academic_year]);

        const total_students = studentCount[0].total || 0;
        const submitted = finalizedCount[0].total || 0;
        const pending = Math.max(0, total_students - submitted);
        const rate = total_students > 0 ? Math.round((submitted / total_students) * 100) : 0;

        res.json({
            success: true,
            user: req.session.user,
            clearance_settings: clearance_settings,
            academic_year: clearance_settings.academic_year,
            system_status,
            status_icon,
            status_class,
            submission_rate: rate,
            submitted_clearances: submitted,
            pending_students: pending
        });

    } catch (error) {
        console.error('💥 Clearance settings error:', error);
        res.status(500).json({ success: false, message: 'Failed to load settings: ' + error.message });
    }
};

exports.handleClearanceAction = async (req, res) => {
    try {
        const db = req.db;
        const { action } = req.params;

        const [settings] = await db.execute("SELECT * FROM clearance_settings ORDER BY id DESC LIMIT 1");
        if (settings.length === 0) return res.status(404).json({ success: false, message: 'Settings not found' });
        const current = settings[0];

        let message = '';
        if (action === 'activate') {
            const now = new Date();
            const end = new Date(current.end_date);

            if (now > end) {
                // If the end date has passed, reset start to now and end to 7 days from now
                const newEnd = new Date(now);
                newEnd.setDate(newEnd.getDate() + 7);
                await db.execute(
                    "UPDATE clearance_settings SET is_active = TRUE, start_date = ?, end_date = ? WHERE id = ?",
                    [now, newEnd, current.id]
                );
                message = 'Clearance system activated and dates adjusted (extended to 7 days from now)';
            } else {
                await db.execute("UPDATE clearance_settings SET is_active = TRUE WHERE id = ?", [current.id]);
                message = 'Clearance system activated';
            }
        } else if (action === 'deactivate') {
            await db.execute("UPDATE clearance_settings SET is_active = FALSE WHERE id = ?", [current.id]);
            message = 'Clearance system deactivated';
        } else if (action === 'extend_1_day') {
            const newEnd = new Date(current.end_date);
            newEnd.setDate(newEnd.getDate() + 1);
            await db.execute("UPDATE clearance_settings SET end_date = ? WHERE id = ?", [newEnd, current.id]);
            message = 'Clearance period extended by 1 day';
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

        res.json({ success: true, message });
    } catch (error) {
        console.error('💥 Clearance action error:', error);
        res.status(500).json({ success: false, message: 'Action failed: ' + error.message });
    }
};

exports.updateClearanceSettings = async (req, res) => {
    try {
        const db = req.db;
        const { academic_year, start_date, end_date, is_active } = req.body;
        let academicYear = academic_year;
        if (!academicYear) {
            const [last] = await db.execute("SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1");
            academicYear = last[0]?.academic_year;
        }

        if (!academicYear || !start_date || !end_date) {
            return res.status(400).json({ success: false, message: 'Missing required configuration fields' });
        }

        const isActive = (is_active === 'true' || is_active === true || is_active === 1 || is_active === '1' || is_active === 'on');

        const [existing] = await db.execute(
            "SELECT id FROM clearance_settings WHERE academic_year = ?",
            [academicYear]
        );

        if (existing.length > 0) {
            await db.execute(
                "UPDATE clearance_settings SET start_date = ?, end_date = ?, is_active = ?, updated_at = NOW() WHERE academic_year = ?",
                [start_date, end_date, isActive, academicYear]
            );
        } else {
            await db.execute(
                "INSERT INTO clearance_settings (academic_year, start_date, end_date, is_active) VALUES (?, ?, ?, ?)",
                [academicYear, start_date, end_date, isActive]
            );
        }

        res.json({ success: true, message: 'Clearance settings updated successfully' });
    } catch (error) {
        console.error('💥 Update settings error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings: ' + error.message });
    }
};

exports.logout = (req, res) => {
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
};

exports.getManageAdminsData = async (req, res) => {
    try {
        const db = req.db;
        const search = req.query.search || '';

        let query = "SELECT id, name, last_name, username, email, phone, role, department_name FROM admin";
        let params = [];

        if (search) {
            query += " WHERE name ILIKE ? OR last_name ILIKE ? OR username ILIKE ? OR role ILIKE ? OR CAST(id AS TEXT) LIKE ?";
            const searchTerm = `%${search}%`;
            params = [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm];
        }

        query += " ORDER BY id DESC";

        const [admins] = await db.execute(query, params);

        res.json({
            success: true,
            user: req.session.user,
            admins: admins,
            departments: [
                'Information Technology', 'Computer Science', 'Software Engineering',
                'Management', 'Economics', 'Accounting', 'Psychology'
            ]
        });
    } catch (error) {
        console.error('💥 Manage admins data error:', error);
        res.status(500).json({ success: false, message: 'Failed to load admins' });
    }
};

exports.getManageStudentsData = async (req, res) => {
    try {
        const db = req.db;
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        let baseQuery = `
            FROM student s
            LEFT JOIN clearance_requests cr ON s.student_id = cr.student_id 
                AND cr.target_department = 'registrar'
                AND cr.academic_year = (SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1)
        `;

        let whereClause = "";
        let params = [];

        if (search) {
            whereClause = " WHERE s.name ILIKE ? OR s.last_name ILIKE ? OR s.student_id ILIKE ? OR s.department ILIKE ?";
            const searchTerm = `%${search}%`;
            params = [searchTerm, searchTerm, searchTerm, searchTerm];
        }

        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total ${baseQuery} ${whereClause}`;
        const [countResult] = await db.execute(countQuery, params);
        const totalStudents = countResult[0].total || 0;

        // Get paginated data
        const dataQuery = `
            SELECT s.*, 
                   cr.status as clearance_status,
                   cr.reject_reason as clearance_reject_reason
            ${baseQuery}
            ${whereClause}
            ORDER BY s.id DESC
            LIMIT ? OFFSET ?
        `;

        // Add pagination params
        params.push(limit, offset);

        const [students] = await db.execute(dataQuery, params);

        res.json({
            success: true,
            user: req.session.user,
            students: students,
            pagination: {
                total: parseInt(totalStudents),
                page: page,
                limit: limit,
                totalPages: Math.ceil(totalStudents / limit)
            },
            departments: [
                'Information Technology', 'Computer Science', 'Software Engineering',
                'Management', 'Economics', 'Accounting', 'Psychology'
            ]
        });
    } catch (error) {
        console.error('💥 Manage students data error:', error);
        res.status(500).json({ success: false, message: 'Failed to load students' });
    }
};

exports.addAdmin = async (req, res) => {
    try {
        const db = req.db;
        const { name, last_name, username, password, email, phone, role, department_name } = req.body;

        if (!username || !password || !email || !role) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.execute(
            "INSERT INTO admin (name, last_name, username, password, email, phone, role, department_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [name, last_name, username, hashedPassword, email, phone, role, department_name || null]
        );

        await logger.log(req, 'ADD_ADMIN', username, `Registered new staff member: ${name} ${last_name} (${username}) with role: ${role}`, `${name} ${last_name}`);

        res.json({ success: true, message: 'Admin added successfully' });
    } catch (error) {
        console.error('💥 Add admin error:', error);
        res.status(500).json({ success: false, message: 'Failed to add admin: ' + error.message });
    }
};

exports.updateAdmin = async (req, res) => {
    try {
        const db = req.db;
        const { id } = req.params;
        const { name, last_name, username, password, email, phone, role, department_name } = req.body;

        let query = "UPDATE admin SET name = ?, last_name = ?, username = ?, email = ?, phone = ?, role = ?, department_name = ?";
        let params = [name, last_name, username, email, phone, role, department_name || null];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ", password = ?";
            params.push(hashedPassword);
        }

        query += " WHERE id = ?";
        params.push(id);

        await db.execute(query, params);
        await logger.log(req, 'UPDATE_ADMIN', username, `Updated staff details for: ${name} ${last_name} (${username}). New Role: ${role}`, `${name} ${last_name}`);
        res.json({ success: true, message: 'Admin updated successfully' });
    } catch (error) {
        console.error('💥 Update admin error:', error);
        res.status(500).json({ success: false, message: 'Failed to update admin' });
    }
};

exports.deleteAdmin = async (req, res) => {
    try {
        const db = req.db;
        const { id } = req.params;

        if (parseInt(id) === req.session.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot delete yourself!' });
        }

        await db.execute("DELETE FROM admin WHERE id = ?", [id]);
        await logger.log(req, 'DELETE_ADMIN', id, `Permanently deleted staff member with ID ${id}`, id);
        res.json({ success: true, message: 'Admin deleted successfully' });
    } catch (error) {
        console.error('💥 Delete admin error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete admin' });
    }
};

const { validateEmail } = require('../../utils/emailValidator');

exports.addStudent = async (req, res) => {
    try {
        const db = req.db;
        const { name, last_name, username, password, email, phone, department, year, semester, student_id } = req.body;
        const profile_picture = req.file ? req.file.path.replace(/\\/g, '/') : null;

        // Capitalize first letter of names
        const capitalizedName = name ? name.charAt(0).toUpperCase() + name.slice(1) : '';
        const capitalizedLastName = last_name ? last_name.charAt(0).toUpperCase() + last_name.slice(1) : '';

        // Email Validation
        const emailValidation = await validateEmail(email);
        if (!emailValidation.isValid) {
            if (req.file) { try { require('fs').unlinkSync(req.file.path); } catch (e) { } } // Cleanup
            return res.status(400).json({ success: false, message: emailValidation.error });
        }

        // Generate student_id if not provided
        let final_student_id = student_id;
        if (!final_student_id) {
            const yearSuffix = new Date().getFullYear().toString().slice(-2);

            // Find the highest existing student number to avoid duplicates
            const [existingIds] = await db.execute(
                "SELECT student_id FROM student WHERE student_id LIKE ? ORDER BY student_id DESC LIMIT 1",
                [`DBU%/${yearSuffix}`]
            );

            let nextNum = 1;
            if (existingIds.length > 0) {
                // Extract number from format DBU001/25
                const match = existingIds[0].student_id.match(/DBU(\d+)\//);
                if (match) {
                    nextNum = parseInt(match[1]) + 1;
                }
            }

            final_student_id = `DBU${nextNum.toString().padStart(3, '0')}/${yearSuffix}`;
        }

        const hashedPassword = await bcrypt.hash(password || '12345678', 10);

        await db.execute(
            "INSERT INTO student (student_id, name, last_name, username, password, email, phone, department, year, semester, status, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)",
            [final_student_id, capitalizedName, capitalizedLastName, username, hashedPassword, email, phone, department, year, semester, profile_picture]
        );

        const fullName = `${capitalizedName} ${capitalizedLastName}`;
        await logger.log(req, 'ADD_STUDENT', final_student_id, `Registered new student: ${fullName}`, fullName);

        res.json({ success: true, message: 'Student added successfully', student_id: final_student_id });
    } catch (error) {
        console.error('💥 Add student error:', error);
        res.status(500).json({ success: false, message: 'Failed to add student: ' + error.message });
    }
};

exports.updateStudent = async (req, res) => {
    try {
        const db = req.db;
        const { student_id, name, last_name, username, password, email, phone, department, year, semester, status } = req.body;
        const profile_picture = req.file ? req.file.path.replace(/\\/g, '/') : null;

        // Email Validation (if changed or present)
        if (email) {
            const emailValidation = await validateEmail(email);
            if (!emailValidation.isValid) {
                if (req.file) { try { require('fs').unlinkSync(req.file.path); } catch (e) { } } // Cleanup
                return res.status(400).json({ success: false, message: emailValidation.error });
            }
        }

        let query = "UPDATE student SET name = ?, last_name = ?, username = ?, email = ?, phone = ?, department = ?, year = ?, semester = ?, status = ?";
        let params = [name, last_name, username, email, phone, department, year, semester, status];

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += ", password = ?";
            params.push(hashedPassword);
        }

        if (profile_picture) {
            query += ", profile_picture = ?";
            params.push(profile_picture);
        }

        query += " WHERE student_id = ?";
        params.push(student_id);

        await db.execute(query, params);
        const fullName = `${name} ${last_name}`;
        await logger.log(req, 'UPDATE_STUDENT', student_id, `Updated student profile: ${fullName}`, fullName);
        res.json({ success: true, message: 'Student updated successfully' });
    } catch (error) {
        console.error('💥 Update student error:', error);
        res.status(500).json({ success: false, message: 'Failed to update student' });
    }
};

exports.deleteStudent = async (req, res) => {
    try {
        const db = req.db;
        const { studentId } = req.params;

        // 1. Fetch student details for logging and file cleanup before actual deletion
        const [students] = await db.execute("SELECT name, last_name, profile_picture FROM student WHERE student_id = ?", [studentId]);
        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student record not found or already deleted.' });
        }

        const student = students[0];
        const studentName = `${student.name} ${student.last_name}`;

        console.log(`🗑️ Starting permanent deletion for student: ${studentName} (${studentId})`);

        // 2. Delete related records from tables without auto-cascade
        // clearance_requests has CASCADE in schema, but we do it manually to be 100% sure across any DB variation

        await db.execute("DELETE FROM clearance_requests WHERE student_id = ?", [studentId]);

        // 3. Delete the main student record
        await db.execute("DELETE FROM student WHERE student_id = ?", [studentId]);

        // 4. File Cleanup: Remove profile picture if it exists
        if (student.profile_picture) {
            const fs = require('fs');
            const path = require('path');
            const photoPath = path.join(__dirname, '..', '..', student.profile_picture);

            try {
                if (fs.existsSync(photoPath)) {
                    fs.unlinkSync(photoPath);
                    console.log(`✅ Deleted profile picture: ${student.profile_picture}`);
                }
            } catch (fsErr) {
                console.warn(`⚠️ Could not delete profile picture file: ${fsErr.message}`);
            }
        }

        // 5. Log the action in Audit Trail
        await logger.log(req, 'DELETE_STUDENT', studentId, `Permanently removed student: ${studentName}`, studentName);

        res.json({
            success: true,
            message: `Student ${studentName} and all associated data have been permanently erased.`
        });

    } catch (error) {
        console.error('💥 Critical Error during student deletion:', error);
        res.status(500).json({
            success: false,
            message: 'A server error occurred while trying to erase the student record: ' + error.message
        });
    }
};

exports.toggleStudentStatus = async (req, res) => {
    try {
        const db = req.db;
        const { studentId } = req.params;
        const [students] = await db.execute("SELECT status, name, last_name FROM student WHERE student_id = ?", [studentId]);

        if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });

        const newStatus = students[0].status === 'active' ? 'inactive' : 'active';
        const studentName = `${students[0].name} ${students[0].last_name}`;

        await db.execute("UPDATE student SET status = ? WHERE student_id = ?", [newStatus, studentId]);

        await logger.log(req, 'TOGGLE_STUDENT_STATUS', studentId, `Status changed to ${newStatus}`, studentName);

        res.json({ success: true, message: `Student marked as ${newStatus}` });
    } catch (error) {
        console.error('💥 Toggle status error:', error);
        res.status(500).json({ success: false, message: 'Failed to toggle status' });
    }
};

exports.bulkStudentActions = async (req, res) => {
    try {
        const db = req.db;
        const { bulk_action, selected_students } = req.body;

        if (!selected_students || selected_students.length === 0) {
            return res.status(400).json({ success: false, message: 'No students selected' });
        }

        if (bulk_action === 'delete') {
            const placeholders = selected_students.map(() => '?').join(',');

            // 1. Fetch all profile pictures for these students before deletion
            const [students] = await db.execute(`SELECT profile_picture FROM student WHERE student_id IN (${placeholders})`, selected_students);

            // 2. Delete from all related tables

            await db.execute(`DELETE FROM clearance_requests WHERE student_id IN (${placeholders})`, selected_students);

            // 3. Delete from main student table
            await db.execute(`DELETE FROM student WHERE student_id IN (${placeholders})`, selected_students);

            // 4. Bulk File Cleanup
            const fs = require('fs');
            const path = require('path');
            students.forEach(student => {
                if (student.profile_picture) {
                    const photoPath = path.join(__dirname, '..', '..', student.profile_picture);
                    try {
                        if (fs.existsSync(photoPath)) fs.unlinkSync(photoPath);
                    } catch (e) { }
                }
            });

            await logger.log(req, 'BULK_DELETE_STUDENTS', null, `Bulk deleted ${selected_students.length} students and their related data. Targets: ${selected_students.join(', ')}`);
        } else if (bulk_action === 'activate' || bulk_action === 'deactivate') {
            const newStatus = bulk_action === 'activate' ? 'active' : 'inactive';
            const placeholders = selected_students.map(() => '?').join(',');
            await db.execute(`UPDATE student SET status = ? WHERE student_id IN (${placeholders})`, [newStatus, ...selected_students]);
        }

        res.json({ success: true, message: 'Bulk action completed successfully' });
    } catch (error) {
        console.error('💥 Bulk action error:', error);
        res.status(500).json({ success: false, message: 'Bulk action failed' });
    }
};

exports.getAuditLogs = async (req, res) => {
    try {
        const db = req.db;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const [logs] = await db.execute(
            `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [count] = await db.execute(`SELECT COUNT(*) as total FROM audit_logs`);

        res.json({
            success: true,
            user: req.session.user,
            logs,
            pagination: {
                total: count[0].total,
                page,
                limit,
                pages: Math.ceil(count[0].total / limit)
            }
        });
    } catch (error) {
        console.error('💥 Error fetching audit logs:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
};
