const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const dns = require('dns').promises;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'uploads/profile_pictures/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const fileExt = path.extname(file.originalname).toLowerCase();
        // Sanitize student_id
        const safeId = req.session.user.student_id.replace(/[\/\\]/g, '_');
        const filename = `profile_${safeId}_${Date.now()}${fileExt}`;
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPG and PNG files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 // 1MB
    },
    fileFilter: fileFilter
});

// Simple image validation
function validateImageSimple(filePath) {
    return new Promise((resolve) => {
        if (!fs.existsSync(filePath)) {
            resolve(false);
            return;
        }

        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8);
        fs.readSync(fd, buffer, 0, 8, 0);
        fs.closeSync(fd);

        // Check for JPEG magic numbers
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            resolve(true);
            return;
        }

        // Check for PNG magic numbers
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E &&
            buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A &&
            buffer[6] === 0x1A && buffer[7] === 0x0A) {
            resolve(true);
            return;
        }

        resolve(false);
    });
}

// Helper: validate password
function validatePassword(password) {
    const errors = [];
    if (password.length < 8) errors.push("• At least 8 characters long");
    if (password.length > 16) errors.push("• Maximum 16 characters allowed");
    if (!/[A-Z]/.test(password)) errors.push("• At least one uppercase letter (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("• At least one lowercase letter (a-z)");
    if (!/[0-9]/.test(password)) errors.push("• At least one number (0-9)");
    if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) errors.push("• At least one special character (!@#$%^&*()_-+=)");
    if (/\s/.test(password)) errors.push("• No spaces allowed");

    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'welcome1'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push("• Password is too common, choose a stronger one");
    }
    return errors;
}

exports.getDashboardData = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        // Get current academic year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const academicYear = `${currentYear}-${nextYear}`;

        // Get latest student status from DB
        const [students] = await db.execute(
            "SELECT status FROM student WHERE student_id = ?",
            [studentId]
        );

        const status = students.length > 0 ? students[0].status : 'inactive';

        // Get system status and remaining days
        let systemStatus = 'Inactive';
        let daysRemaining = 0;

        try {
            const [settings] = await db.execute(
                "SELECT * FROM clearance_settings WHERE academic_year = ? OR academic_year = ? ORDER BY id DESC LIMIT 1",
                [academicYear, `${currentYear - 1}-${currentYear}`]
            );

            if (settings.length > 0) {
                const setting = settings[0];
                const now = new Date();
                const end = new Date(setting.end_date);
                const start = new Date(setting.start_date);

                if (setting.is_active && now >= start && now <= end) {
                    systemStatus = 'Clearance Open';
                    const diffTime = Math.abs(end.getTime() - now.getTime());
                    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                } else if (!setting.is_active) {
                    systemStatus = 'System Inactive';
                } else if (now > end) {
                    systemStatus = 'Clearance Expired';
                } else if (now < start) {
                    systemStatus = 'Clearance Scheduled';
                }
            }
        } catch (err) {
            console.error('Error fetching system settings:', err);
        }

        res.json({
            success: true,
            user: {
                ...req.session.user,
                status: status
            },
            systemStatus,
            daysRemaining,
            academicYear: academicYear,
            title: 'Student Dashboard'
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Dashboard error',
            error: error.message
        });
    }
};

exports.getProfileData = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        const [students] = await db.execute(
            'SELECT * FROM student WHERE student_id = ?',
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];

        // Mark notifications as read
        try {
            await db.execute(
                "UPDATE clearance_requests SET is_read = TRUE WHERE student_id = ? AND target_department = 'registrar' AND is_read = FALSE",
                [studentId]
            );
        } catch (e) {
            console.warn('Could not mark notifications as read on profile view:', e.message);
        }

        res.json({
            success: true,
            user: req.session.user,
            student: {
                ...student,
                profile_photo: student.profile_picture
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;
        const { name, last_name, email, phone } = req.body;

        const [students] = await db.execute(
            'SELECT * FROM student WHERE student_id = ?',
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const student = students[0];

        // Email Validation
        if (email && email !== student.email) {
            const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            // Check uniqueness
            const [existingEmail] = await db.execute(
                "SELECT COUNT(*) as count FROM student WHERE email = ? AND student_id != ?",
                [email, studentId]
            );
            if (existingEmail[0].count > 0) {
                return res.status(400).json({ success: false, message: 'Email is already taken' });
            }

            // Real Domain Validation
            try {
                const domain = email.split('@')[1];
                const mxRecords = await dns.resolveMx(domain);
                if (!mxRecords || mxRecords.length === 0) {
                    return res.status(400).json({ success: false, message: `The email domain '@${domain}' is not valid.` });
                }
            } catch (dnsError) {
                console.error('📧 DNS Validation Error:', dnsError);
                return res.status(400).json({ success: false, message: 'Could not verify the email domain.' });
            }
        }

        const finalName = name || student.name || '';
        const finalLastName = last_name || student.last_name || '';
        const finalEmail = email || student.email || '';
        const finalPhone = phone || student.phone || '';

        let profilePicture = student.profile_picture;

        if (req.file) {
            console.log('📸 New profile photo uploaded:', req.file.filename);
            const isImage = await validateImageSimple(req.file.path);
            if (!isImage) {
                fs.unlinkSync(req.file.path);
                return res.status(400).json({ success: false, message: 'Invalid image file' });
            }

            profilePicture = `uploads/profile_pictures/${req.file.filename}`;

            // Delete old photo
            if (student.profile_picture && student.profile_picture !== profilePicture) {
                const oldPath = path.join(__dirname, '..', '..', student.profile_picture);
                if (fs.existsSync(oldPath)) {
                    try { fs.unlinkSync(oldPath); } catch (e) {
                        console.warn('⚠️ Could not delete old profile pic:', e.message);
                    }
                }
            }
        }

        console.log('💾 Updating DB for student:', studentId);
        await db.execute(
            'UPDATE student SET name = ?, last_name = ?, email = ?, phone = ?, profile_picture = ? WHERE student_id = ?',
            [finalName, finalLastName, finalEmail, finalPhone, profilePicture, studentId]
        );

        // Update session
        req.session.user.name = finalName;
        req.session.user.last_name = finalLastName;
        req.session.user.email = finalEmail;
        req.session.user.profile_picture = profilePicture;

        console.log('✅ Profile updated successfully');
        res.json({
            success: true,
            message: 'Profile updated successfully!',
            photoPath: profilePicture ? `/${profilePicture}` : null
        });

    } catch (error) {
        console.error('❌ PROFILE_UPDATE_ERROR:', {
            message: error.message,
            stack: error.stack
        });
        res.status(500).json({
            success: false,
            message: 'Internal Server Error: ' + error.message
        });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        const [students] = await db.execute(
            'SELECT * FROM student WHERE student_id = ?',
            [studentId]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Student not found'
            });
        }

        const student = students[0];

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded or invalid file type'
            });
        }

        const isImage = await validateImageSimple(req.file.path);
        if (!isImage) {
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: 'File is not a valid image'
            });
        }

        const destination = req.file.path.replace(/\\/g, '/');

        await db.execute(
            'UPDATE student SET profile_picture = ? WHERE student_id = ?',
            [destination, studentId]
        );

        if (student.profile_picture &&
            fs.existsSync(student.profile_picture) &&
            student.profile_picture.includes('uploads/profile_pictures/')) {
            try {
                fs.unlinkSync(student.profile_picture);
            } catch (err) {
                console.error('Failed to delete old profile picture:', err);
            }
        }

        req.session.user.profile_picture = destination;

        res.json({
            success: true,
            message: 'Profile picture updated successfully!',
            profilePicture: destination
        });

    } catch (error) {
        console.error('Error uploading profile picture:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload profile picture'
        });
    }
};

exports.removeProfilePicture = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        const [students] = await db.execute(
            'SELECT * FROM student WHERE student_id = ?',
            [studentId]
        );

        if (students.length === 0) {
            req.session.message = 'Student not found';
            req.session.message_type = 'error';
            return res.redirect('/student/profile');
        }

        const student = students[0];

        if (student.profile_picture &&
            fs.existsSync(student.profile_picture) &&
            student.profile_picture.includes('uploads/profile_pictures/')) {
            fs.unlinkSync(student.profile_picture);
        }

        await db.execute(
            'UPDATE student SET profile_picture = NULL WHERE student_id = ?',
            [studentId]
        );

        req.session.user.profile_picture = null;
        req.session.message = 'Profile picture removed successfully!';
        req.session.message_type = 'success';

    } catch (error) {
        console.error('Error removing profile picture:', error);
        req.session.message = 'Failed to remove profile picture';
        req.session.message_type = 'error';
    }

    res.redirect('/student/profile');
};

exports.getClearanceStatusData = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;
        const [settingsRows] = await db.execute("SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1");
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        let allClearances = [];
        let hasRequests = false;

        const [clearances] = await db.execute(
            `SELECT * FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department != 'finance' ORDER BY requested_at DESC`,
            [studentId, currentAcademicYear]
        );

        // Auto-cleanup for this specific student's decommissioned requests
        db.execute("DELETE FROM clearance_requests WHERE student_id = ? AND target_department = 'finance'", [studentId]).catch(() => { });

        clearances.forEach(row => {
            hasRequests = true;
            let statusClass = '';
            const status = row.status?.toLowerCase() || 'pending';
            if (status === 'pending') statusClass = 'status-pending';
            else if (status === 'approved') statusClass = 'status-approved';
            else statusClass = 'status-rejected';

            let requestDate = '';
            if (row.requested_at) {
                requestDate = new Date(row.requested_at).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric'
                });
            }

            const typeMap = {
                'library': 'Library',
                'cafeteria': 'Cafeteria',
                'dormitory': 'Dormitory',
                'department': 'Department',
                'registrar': 'Registrar'
            };

            allClearances.push({
                type: typeMap[row.target_department] || row.target_department.charAt(0).toUpperCase() + row.target_department.slice(1),
                department: row.student_department || '',
                reason: row.reason || '',
                status: row.status || 'pending',
                statusClass: statusClass,
                requestDate: requestDate,
                rejectReason: row.reject_reason || '',
                tableName: 'clearance_requests'
            });
        });

        res.json({
            success: true,
            user: req.session.user,
            title: 'My Clearance Status',
            currentAcademicYear: currentAcademicYear,
            clearances: allClearances,
            hasRequests: hasRequests
        });

    } catch (error) {
        console.error('💥 Clearance status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load clearance status: ' + error.message
        });
    }
};

exports.getChangePasswordData = (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = req.session.user;
        const db = req.db;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: "❌ All fields are required!" });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: "❌ New password and confirm password do not match!" });
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({ success: false, message: "❌ Password requirements not met: " + passwordErrors.join(". ") });
        }

        const [students] = await db.execute(
            'SELECT id, student_id, username, password FROM student WHERE username = ?',
            [user.username]
        );

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: "❌ Student record not found!" });
        }

        const student = students[0];
        const validCurrentPassword = await bcrypt.compare(currentPassword, student.password);

        if (!validCurrentPassword) {
            return res.status(401).json({ success: false, message: "❌ Current password is incorrect!" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            'UPDATE student SET password = ? WHERE id = ?',
            [hashedNewPassword, student.id]
        );

        res.json({ success: true, message: "✅ Password changed successfully!" });

    } catch (error) {
        console.error('💥 Change password error:', error);
        res.status(500).json({ success: false, message: "❌ Failed to change password: " + error.message });
    }
};

exports.getClearanceRequestData = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        let systemActive = false;
        let systemMessage = "";
        let clearanceSettings = null;
        let hasCurrentClearance = false;
        let daysRemaining = 0;
        let dbAcademicYear = null;

        try {
            // 1. Priority: Find the currently ACTIVE setting
            let [settingsResult] = await db.execute(
                "SELECT * FROM clearance_settings WHERE is_active = TRUE ORDER BY id DESC LIMIT 1"
            );

            // 2. Fallback: If no active setting, find the most recent one
            if (settingsResult.length === 0) {
                [settingsResult] = await db.execute(
                    "SELECT * FROM clearance_settings ORDER BY id DESC LIMIT 1"
                );
            }

            if (settingsResult.length > 0) {
                clearanceSettings = settingsResult[0];
                dbAcademicYear = clearanceSettings.academic_year;
                const now = new Date();
                const start = new Date(clearanceSettings.start_date);
                const end = new Date(clearanceSettings.end_date);

                if (clearanceSettings.is_active) {
                    // System is marked active by admin
                    systemActive = true;

                    // Calculate time remaining based on dates
                    if (now >= start && now <= end) {
                        daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                    } else if (now > end) {
                        // Expired but still active flag? Admin probably wants it open
                        daysRemaining = 0;
                    } else {
                        // Future start date but active flag? Show countdown but allow?
                        // Usually active flag = GO.
                        daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                    }
                } else {
                    // Not active flag - determine reason
                    if (now < start) {
                        systemMessage = "Clearance period has not started yet.";
                    } else if (now > end) {
                        systemMessage = "Clearance period has ended.";
                    } else {
                        systemMessage = "Clearance system is currently inactive.";
                    }
                }
            } else {
                systemMessage = "No clearance schedule found. Please contact administration.";
            }

        } catch (e) {
            console.error('Error fetching settings:', e);
        }

        // Default to a calculated year if none found in DB
        const academicYear = dbAcademicYear || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        const [students] = await db.execute("SELECT status FROM student WHERE student_id = ?", [studentId]);
        const isStudentActive = students.length > 0 && students[0].status === 'active';

        // Check if any clearance request exists for the determined academic year
        const [libCheck] = await db.execute("SELECT id FROM clearance_requests WHERE student_id = ? AND academic_year = ? LIMIT 1", [studentId, academicYear]);
        hasCurrentClearance = libCheck.length > 0;

        const canSubmitRequests = systemActive && isStudentActive && !hasCurrentClearance;

        // Generate a specific message explaining why they can't submit
        let canSubmitMessage = "";
        if (!canSubmitRequests) {
            if (!systemActive) {
                canSubmitMessage = systemMessage || "The clearance system is currently closed by the administrator.";
            } else if (!isStudentActive) {
                canSubmitMessage = "Your student account is currently inactive. Please contact the Registrar Office to reactivate your profile.";
            } else if (hasCurrentClearance) {
                canSubmitMessage = `You have already submitted a clearance request for the ${academicYear} academic year. Please check your status in the 'My Status' section.`;
            }
        }

        res.json({
            success: true,
            user: req.session.user,
            systemActive,
            systemMessage,
            daysRemaining,
            currentAcademicYear: academicYear,
            isStudentActive,
            hasCurrentClearance,
            canSubmitRequests,
            canSubmitMessage,
            academicYear: academicYear
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error loading request data' });
    }
};

exports.submitClearanceRequest = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;
        const { reason, request_type, submit_all_clearance } = req.body;
        const [settingsRows] = await db.execute("SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1");
        const academicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required' });
        }

        const [students] = await db.execute('SELECT * FROM student WHERE student_id = ?', [studentId]);
        if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
        const student = students[0];

        if (submit_all_clearance) {
            const depts = ['library', 'cafeteria', 'dormitory', 'department', 'registrar'];

            for (const dept of depts) {
                const [existing] = await db.execute(
                    `SELECT id FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = ?`,
                    [studentId, academicYear, dept]
                );

                if (existing.length === 0) {
                    await db.execute(
                        `INSERT INTO clearance_requests (student_id, name, last_name, student_department, target_department, reason, status, academic_year, requested_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
                        [studentId, student.name, student.last_name, student.department, dept, reason, academicYear]
                    );
                }
            }
            return res.json({ success: true, message: 'All clearance requests submitted successfully' });
        }

        if (!request_type) {
            return res.status(400).json({ success: false, message: 'Request type is required' });
        }

        // Check if already requested
        const [existing] = await db.execute(
            `SELECT id FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = ?`,
            [studentId, academicYear, request_type]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Request already exists for this department' });
        }

        await db.execute(
            `INSERT INTO clearance_requests (student_id, name, last_name, student_department, target_department, reason, status, academic_year, requested_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW())`,
            [studentId, student.name, student.last_name, student.department, request_type, reason, academicYear]
        );

        res.json({ success: true, message: 'Clearance request submitted successfully' });
    } catch (error) {
        console.error('Submit clearance error:', error);
        res.status(500).json({ success: false, message: 'Error submitting clearance request' });
    }
};

exports.getNotificationsData = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        // Fetch notifications from clearance_requests where target is registrar
        const [notifications] = await db.execute(
            "SELECT *, notification_message as message, requested_at as date_sent FROM clearance_requests WHERE student_id = ? AND target_department = 'registrar' AND (notification_message IS NOT NULL OR status != 'pending') ORDER BY requested_at DESC",
            [studentId]
        );

        // Mark as read
        await db.execute(
            "UPDATE clearance_requests SET is_read = TRUE WHERE student_id = ? AND target_department = 'registrar' AND is_read = FALSE",
            [studentId]
        );

        // Check if download button should show (if latest registrar status is approved)
        const showDownloadButton = notifications.length > 0 && notifications[0].status === 'approved';

        res.json({
            success: true,
            user: req.session.user,
            notifications: notifications,
            showDownloadButton: showDownloadButton
        });

    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to load notifications' });
    }
};

exports.getUnreadNotificationCount = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;
        const [rows] = await db.execute(
            "SELECT COUNT(*) as count FROM clearance_requests WHERE student_id = ? AND target_department = 'registrar' AND is_read = FALSE AND (notification_message IS NOT NULL OR status != 'pending')",
            [studentId]
        );
        res.json({ success: true, count: rows[0]?.count || 0 });
    } catch (error) {
        console.error('Notification count error:', error);
        res.status(500).json({ success: false, count: 0 });
    }
};

exports.downloadCertificate = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;
        const { jsPDF } = require("jspdf");

        // Check if student is approved for final clearance
        const [clearance] = await db.execute(
            "SELECT * FROM clearance_requests WHERE student_id = ? AND target_department = 'registrar' AND status = 'approved' ORDER BY requested_at DESC LIMIT 1",
            [studentId]
        );

        if (clearance.length === 0) {
            return res.status(403).send(`
                <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #e11d48;">Access Denied</h1>
                    <p>Your final clearance has not been approved yet. You can only download the certificate once the Registrar Office approves your request.</p>
                    <a href="/student/dashboard" style="color: #4f46e5; font-weight: bold;">Return to Dashboard</a>
                </div>
            `);
        }

        const cert = clearance[0];
        const studentName = `${req.session.user.name} ${req.session.user.lastName}`;

        // Fetch all department approvals to get admin names
        const [approvals] = await db.execute(
            "SELECT target_department, approved_by, approved_at FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND status = 'approved'",
            [studentId, cert.academic_year]
        );

        const approvalMap = {};
        approvals.forEach(app => {
            approvalMap[app.target_department] = app.approved_by || 'Verified System Admin';
        });

        // Create PDF
        const doc = new jsPDF({
            orientation: "p",
            unit: "mm",
            format: "a4"
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const startY = 30;

        // --- Header ---
        doc.setFont("helvetica", "bold");
        doc.setFontSize(22);
        doc.text("DEBRE BERHAN UNIVERSITY", pageWidth / 2, startY, { align: "center" });

        doc.setFontSize(16);
        doc.text("OFFICE OF THE REGISTRAR", pageWidth / 2, startY + 10, { align: "center" });

        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.line(20, startY + 15, pageWidth - 20, startY + 15);

        doc.setFontSize(18);
        doc.text("STUDENT CLEARANCE CERTIFICATE", pageWidth / 2, startY + 28, { align: "center" });

        // --- Student Details ---
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        const detailsY = startY + 45;

        doc.text(`This is to certify that:`, 20, detailsY);
        doc.setFont("helvetica", "bold");
        doc.text(studentName.toUpperCase(), 70, detailsY);

        doc.setFont("helvetica", "normal");
        doc.text(`Student ID:`, 20, detailsY + 8);
        doc.setFont("helvetica", "bold");
        doc.text(studentId.toString(), 70, detailsY + 8);

        doc.setFont("helvetica", "normal");
        doc.text(`Department:`, 20, detailsY + 16);
        doc.setFont("helvetica", "bold");
        doc.text((cert.student_department || 'N/A').toUpperCase(), 70, detailsY + 16);

        doc.setFont("helvetica", "normal");
        doc.text(`Academic Year:`, 20, detailsY + 24);
        doc.setFont("helvetica", "bold");
        doc.text((cert.academic_year || new Date().getFullYear().toString()).toString(), 70, detailsY + 24);

        // --- Clearance Statement ---
        const stmtY = detailsY + 40;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const text = `The above mentioned student has successfully cleared all obligations with the following departments and is free from any university liabilities.`;
        doc.text(doc.splitTextToSize(text, pageWidth - 40), 20, stmtY);

        // --- Approver List ---
        let approverY = stmtY + 15;
        doc.setFontSize(10);

        const depts = [
            { id: 'department', label: 'Department Head' },
            { id: 'library', label: 'Library' },
            { id: 'dormitory', label: 'Proctor' },
            { id: 'cafeteria', label: 'Cafeteria' },
            { id: 'registrar', label: 'Registrar' }
        ];

        depts.forEach((dept, index) => {
            const approverName = approvalMap[dept.id] || 'System Verified';
            const yPos = approverY + (index * 8);

            doc.setFont("helvetica", "bold");
            doc.text(`${dept.label}:`, 30, yPos);
            doc.setFont("helvetica", "normal");
            doc.text(`Approved by ${approverName}`, 80, yPos);

            // Replaced '✔' with text '(Cleared)' to avoid encoding issues
            doc.setTextColor(0, 100, 0);
            doc.text("(Cleared)", 160, yPos);
            doc.setTextColor(0);
        });

        // --- Signature Section ---
        const sigY = approverY + (depts.length * 8) + 30;

        doc.setLineWidth(0.3);
        doc.line(120, sigY, 190, sigY); // Signature line
        doc.setFont("helvetica", "bold");
        doc.text("Registrar Officer Signature", 135, sigY + 5);

        doc.setFont("helvetica", "italic");
        doc.setFontSize(8);
        doc.text(`(Date: ${new Date().toLocaleDateString()})`, 140, sigY + 10);

        // Footer
        const footerY = doc.internal.pageSize.getHeight() - 15;
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text("System Generated by DBU Clearance System - Valid without physical stamp if verified online.", pageWidth / 2, footerY, { align: "center" });

        // Output
        const pdfBuffer = doc.output("arraybuffer");

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `attachment; filename=DBU_Clearance_${studentId}.pdf`);
        res.send(Buffer.from(pdfBuffer));

    } catch (error) {
        console.error("💥 Download certificate error:", error);
        res.status(500).send("Failed to generate certificate");
    }
};

// Export multer upload middleware for use in routes
exports.upload = upload;
