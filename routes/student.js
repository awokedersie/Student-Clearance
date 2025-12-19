const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dns = require('dns').promises;

// Middleware to check if user is student
const requireStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        res.redirect('/login');
    }
};

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
        // Sanitize student_id by replacing slashes/backslashes (found in some student IDs)
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

        // Check for JPEG magic numbers: FF D8 FF
        if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
            resolve(true);
            return;
        }

        // Check for PNG magic numbers: 89 50 4E 47 0D 0A 1A 0A
        if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E &&
            buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A &&
            buffer[6] === 0x1A && buffer[7] === 0x0A) {
            resolve(true);
            return;
        }

        resolve(false);
    });
}

// Student Dashboard
router.get('/dashboard/data', requireStudent, async (req, res) => {
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
            // Fallback to default values
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
});

// Legacy redirect for old API calls (prevents 404s while caches clear)
router.get('/dashboard', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/dashboard/data');
    }
    // Pass through to SPA handler for browser page loads
    next();
});

// Student Profile
router.get('/profile/data', requireStudent, async (req, res) => {
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

        // Mark notifications as read when viewing profile (optional requested behavior)
        try {
            await db.execute(
                "UPDATE final_clearance SET is_read = 1 WHERE student_id = ? AND is_read = 0",
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
                profile_photo: student.profile_picture // Map to match frontend expectation
            }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
});

// Legacy redirect for old API calls
router.get('/profile', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/profile/data');
    }
    next();
});

// Handle profile update (combined text and photo)
router.post('/profile', requireStudent, upload.single('profile_photo'), async (req, res) => {
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

            // Real Domain Validation (DNS MX Check)
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

        // Validation to prevent DB errors with null values
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

            // Generate a relative path for the DB
            profilePicture = `uploads/profile_pictures/${req.file.filename}`;

            // Delete old photo if it exists and is different
            if (student.profile_picture && student.profile_picture !== profilePicture) {
                const oldPath = path.join(__dirname, '..', student.profile_picture);
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
            stack: error.stack,
            body: req.body,
            file: req.file ? {
                filename: req.file.filename,
                path: req.file.path,
                mimetype: req.file.mimetype
            } : 'No file'
        });
        res.status(500).json({
            success: false,
            message: 'Internal Server Error: ' + error.message
        });
    }
});

// Handle profile picture upload
router.post('/profile/upload', requireStudent, upload.single('profile_picture'), async (req, res) => {
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

        const destination = req.file.path.replace(/\\/g, '/'); // Ensure forward slashes

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

        if (error instanceof multer.MulterError) {
            return res.status(400).json({
                success: false,
                message: error.code === 'LIMIT_FILE_SIZE' ? 'File size must be less than 1MB.' : `Upload error: ${error.message}`
            });
        }

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to upload profile picture'
        });
    }
});

// Handle profile picture removal
router.post('/profile/remove-picture', requireStudent, async (req, res) => {
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
});

// Clearance Status Page
router.get('/clearance-status/data', requireStudent, async (req, res) => {
    console.log('🚀 Clearance-status route is executing...');

    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        // Get current academic year
        const currentYear = new Date().getFullYear();
        const currentAcademicYear = `${currentYear}-${currentYear + 1}`;

        console.log('📅 Academic year:', currentAcademicYear);

        // Define clearance tables
        const tables = {
            'Library': 'library_clearance',
            'Cafeteria': 'cafeteria_clearance',
            'Dormitory': 'dormitory_clearance',
            'Department': 'department_clearance',
            'Registrar': 'academicstaff_clearance'
        };

        let allClearances = [];
        let hasRequests = false;

        // Check each table for clearance requests
        for (const [type, tableName] of Object.entries(tables)) {
            try {
                console.log(`🔍 Checking table: ${tableName}`);

                // Check if academic_year column exists
                const [columns] = await db.execute(
                    `SHOW COLUMNS FROM ${tableName} LIKE 'academic_year'`
                );
                const columnExists = columns.length > 0;

                let query, params;

                if (columnExists) {
                    query = `SELECT * FROM ${tableName} WHERE student_id = ? AND academic_year = ? ORDER BY requested_at DESC, id DESC`;
                    params = [studentId, currentAcademicYear];
                } else {
                    query = `SELECT * FROM ${tableName} WHERE student_id = ? ORDER BY requested_at DESC, id DESC`;
                    params = [studentId];
                }

                const [clearances] = await db.execute(query, params);
                console.log(`📊 Found ${clearances.length} records in ${tableName}`);

                // Add clearance type and format data
                clearances.forEach(row => {
                    hasRequests = true;

                    // Format status class
                    let statusClass = '';
                    const status = row.status?.toLowerCase() || 'pending';

                    if (status === 'pending') {
                        statusClass = 'status-pending';
                    } else if (status === 'approved') {
                        statusClass = 'status-approved';
                    } else {
                        statusClass = 'status-rejected';
                    }

                    // Format request date
                    let requestDate = '';
                    if (row.requested_at) {
                        requestDate = new Date(row.requested_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });
                    } else if (row.created_at) {
                        requestDate = new Date(row.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });
                    } else {
                        requestDate = 'N/A';
                    }

                    allClearances.push({
                        type: type,
                        department: row.department || '',
                        reason: row.reason || '',
                        status: row.status || 'pending',
                        statusClass: statusClass,
                        requestDate: requestDate,
                        rejectReason: row.reject_reason || '',
                        tableName: tableName
                    });
                });

            } catch (error) {
                console.error(`❌ Error fetching ${type} clearance:`, error.message);
            }
        }

        console.log('✅ Total clearances found:', allClearances.length);
        console.log('📤 Rendering template with currentAcademicYear:', currentAcademicYear);

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
        const currentAcademicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        res.status(500).json({
            success: false,
            message: 'Failed to load clearance status: ' + error.message
        });
    }
});

// Legacy redirect for old API calls
router.get('/clearance-status', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/clearance-status/data');
    }
    next();
});

// Change Password
router.get('/change-password/data', requireStudent, (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
});

// Legacy redirect for old API calls and SPA pass-through
router.get('/change-password', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/change-password/data');
    }
    next();
});

router.post('/change-password', requireStudent, async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = req.session.user;
        const db = req.db;

        console.log('🔑 Change password attempt for:', user.username);
        console.log('📝 Form data:', { currentPassword, newPassword, confirmPassword });

        // Validate that all fields are provided
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "❌ All fields are required!"
            });
        }

        // Validate password match
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "❌ New password and confirm password do not match!"
            });
        }

        // Strong password validation
        const passwordErrors = validatePassword(newPassword);

        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "❌ Password requirements not met: " + passwordErrors.join(". ")
            });
        }

        // Get student data using username from session
        const [students] = await db.execute(
            'SELECT id, student_id, username, password FROM student WHERE username = ?',
            [user.username]
        );

        if (students.length === 0) {
            return res.status(404).json({
                success: false,
                message: "❌ Student record not found!"
            });
        }

        const student = students[0];

        console.log('🔍 Student found:', student.username);
        console.log('🔑 Verifying current password...');

        // Verify current password
        const validCurrentPassword = await bcrypt.compare(currentPassword, student.password);
        console.log('🔑 Current password valid:', validCurrentPassword);

        if (!validCurrentPassword) {
            return res.status(401).json({
                success: false,
                message: "❌ Current password is incorrect!"
            });
        }

        // Check if new password is same as current password
        const isSamePassword = await bcrypt.compare(newPassword, student.password);
        console.log('🔑 Is new password same as current:', isSamePassword);

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: "❌ New password cannot be the same as current password!"
            });
        }

        // Hash new password and update
        console.log('🔑 Hashing new password...');
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        console.log('💾 Updating password in database...');
        await db.execute(
            'UPDATE student SET password = ? WHERE id = ?',
            [hashedNewPassword, student.id]
        );

        console.log('✅ Password updated successfully!');
        res.json({
            success: true,
            message: "✅ Password changed successfully!"
        });

    } catch (error) {
        console.error('💥 Change password error:', error);
        res.status(500).json({
            success: false,
            message: "❌ Failed to change password: " + error.message
        });
    }
});

// Strong password validation function
function validatePassword(password) {
    const errors = [];

    // Minimum length
    if (password.length < 8) {
        errors.push("• At least 8 characters long");
    }

    // Maximum length
    if (password.length > 16) {
        errors.push("• Maximum 16 characters allowed");
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        errors.push("• At least one uppercase letter (A-Z)");
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
        errors.push("• At least one lowercase letter (a-z)");
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
        errors.push("• At least one number (0-9)");
    }

    // At least one special character
    if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) {
        errors.push("• At least one special character (!@#$%^&*()_-+=)");
    }

    // No spaces allowed
    if (/\s/.test(password)) {
        errors.push("• No spaces allowed");
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'welcome1'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push("• Password is too common, choose a stronger one");
    }

    return errors;
}

// Clearance Request Page
router.get('/clearance-request/data', requireStudent, async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        // Get current academic year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const academicYear = `${currentYear}-${nextYear}`;

        // Initialize all variables with default values
        let systemActive = false;
        let systemMessage = "";
        let clearanceSettings = null;
        const currentServerTime = Math.floor(Date.now() / 1000);
        let student = null;
        let hasCurrentClearance = false;
        let isStudentActive = false;
        let canSubmitRequests = false;
        let timeRemaining = 0;
        let daysRemaining = 0;
        let hoursRemaining = 0;
        let minutesRemaining = 0;

        // Check system status - PHP conversion
        try {
            // Check if clearance_settings table exists
            const [tables] = await db.execute("SHOW TABLES LIKE 'clearance_settings'");

            if (tables.length > 0) {
                // Get clearance system status for current academic year
                const [settingsResult] = await db.execute(
                    "SELECT start_date, end_date, is_active FROM clearance_settings WHERE academic_year = ?",
                    [academicYear]
                );

                if (settingsResult.length > 0) {
                    clearanceSettings = settingsResult[0];
                    const startTimestamp = Math.floor(new Date(clearanceSettings.start_date).getTime() / 1000);
                    const endTimestamp = Math.floor(new Date(clearanceSettings.end_date).getTime() / 1000);

                    if (clearanceSettings.is_active) {
                        if (currentServerTime >= startTimestamp && currentServerTime <= endTimestamp) {
                            systemActive = true;
                            systemMessage = `Clearance system is OPEN until ${new Date(clearanceSettings.end_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`;
                        } else if (currentServerTime < startTimestamp) {
                            systemActive = false;
                            systemMessage = `Clearance system opens on ${new Date(clearanceSettings.start_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`;
                        } else {
                            systemActive = false;
                            systemMessage = `Clearance system closed on ${new Date(clearanceSettings.end_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`;
                        }
                    } else {
                        systemActive = false;
                        systemMessage = "Clearance system is currently CLOSED by administration";
                    }
                } else {
                    systemMessage = `Clearance system settings not configured for academic year ${academicYear}`;
                }
            } else {
                systemMessage = "Clearance system not configured. Please contact administrator.";
            }
        } catch (error) {
            console.error('System status check error:', error);
            systemMessage = "Error checking system status: " + error.message;
        }

        // Get student data - PHP conversion
        try {
            const [students] = await db.execute(
                "SELECT id, student_id, name, last_name, department, status FROM student WHERE student_id = ?",
                [studentId]
            );

            if (students.length === 0) {
                return res.status(404).render('error', {
                    title: 'Error - DBU',
                    user: req.session.user,
                    error: 'Student record not found for ID: ' + studentId
                });
            }

            student = students[0];
            isStudentActive = student.status === 'active';
        } catch (error) {
            console.error('Student data error:', error);
            return res.status(500).render('error', {
                title: 'Error - DBU',
                user: req.session.user,
                error: 'Database error: ' + error.message
            });
        }

        // Check if student has clearance for current academic year - PHP conversion
        try {
            const [clearance] = await db.execute(
                "SELECT status FROM final_clearance WHERE student_id = ? AND academic_year = ?",
                [studentId, academicYear]
            );
            hasCurrentClearance = clearance.length > 0;
        } catch (error) {
            console.error('Clearance check error:', error);
            return res.status(500).render('error', {
                title: 'Error - DBU',
                user: req.session.user,
                error: 'Clearance check error: ' + error.message
            });
        }

        // Student can submit requests if:
        // 1. Account is active AND 
        // 2. Doesn't have clearance for current academic year
        // 3. Clearance system is active
        canSubmitRequests = isStudentActive && !hasCurrentClearance && systemActive;

        // Calculate time remaining for display (using server time) - PHP conversion
        if (systemActive && clearanceSettings) {
            const endTimestamp = Math.floor(new Date(clearanceSettings.end_date).getTime() / 1000);
            timeRemaining = endTimestamp - currentServerTime;

            if (timeRemaining > 0) {
                daysRemaining = Math.floor(timeRemaining / (60 * 60 * 24));
                hoursRemaining = Math.floor((timeRemaining % (60 * 60 * 24)) / (60 * 60));
                minutesRemaining = Math.floor((timeRemaining % (60 * 60)) / 60);
            }
        }

        // Get messages from session
        const message = req.session.message || '';
        const messageType = req.session.messageType || '';
        const submittedReason = req.session.submittedReason || '';

        // Clear session messages after reading
        if (req.session.message) {
            delete req.session.message;
            delete req.session.messageType;
            delete req.session.submittedReason;
        }

        console.log('📊 Clearance request page data:', {
            systemActive,
            systemMessage,
            isStudentActive,
            hasCurrentClearance,
            canSubmitRequests,
            daysRemaining,
            student: student ? student.name : 'No student'
        });

        res.json({
            success: true,
            user: req.session.user,
            title: 'Clearance Request - DBU',
            academicYear: academicYear,
            systemActive: systemActive,
            systemMessage: systemMessage,
            clearanceSettings: clearanceSettings,
            currentServerTime: currentServerTime,
            student: student,
            hasCurrentClearance: hasCurrentClearance,
            isStudentActive: isStudentActive,
            canSubmitRequests: canSubmitRequests,
            timeRemaining: timeRemaining,
            daysRemaining: daysRemaining,
            hoursRemaining: hoursRemaining,
            minutesRemaining: minutesRemaining,
            message: message,
            messageType: messageType,
            submittedReason: submittedReason
        });

    } catch (error) {
        console.error('💥 Clearance request route error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load clearance request page'
        });
    }
});

// Legacy redirect for old API calls
router.get('/clearance-request', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/clearance-request/data');
    }
    next();
});

// Handle Clearance Request Submission - FIXED VERSION (No Transactions)
router.post('/clearance-request', requireStudent, async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;
        const { submit_all_clearance, reason } = req.body;

        // Get current academic year
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const academicYear = `${currentYear}-${nextYear}`;

        let message = '';
        let messageType = '';

        // Get student data first
        const [students] = await db.execute(
            "SELECT id, student_id, name, last_name, department, status FROM student WHERE student_id = ?",
            [studentId]
        );

        if (students.length === 0) {
            req.session.message = "Student record not found";
            req.session.messageType = "error";
            return res.redirect('/student/clearance-request');
        }

        const student = students[0];

        // Check system status
        const [settingsResult] = await db.execute(
            "SELECT start_date, end_date, is_active FROM clearance_settings WHERE academic_year = ?",
            [academicYear]
        );

        let systemActive = false;
        if (settingsResult.length > 0) {
            const clearanceSettings = settingsResult[0];
            const currentServerTime = Math.floor(Date.now() / 1000);
            const startTimestamp = Math.floor(new Date(clearanceSettings.start_date).getTime() / 1000);
            const endTimestamp = Math.floor(new Date(clearanceSettings.end_date).getTime() / 1000);

            systemActive = clearanceSettings.is_active &&
                currentServerTime >= startTimestamp &&
                currentServerTime <= endTimestamp;
        }

        // Check if student can submit requests
        const [existingClearance] = await db.execute(
            "SELECT status FROM final_clearance WHERE student_id = ? AND academic_year = ?",
            [studentId, academicYear]
        );
        const hasCurrentClearance = existingClearance.length > 0;
        const isStudentActive = student.status === 'active';
        const canSubmitRequests = isStudentActive && !hasCurrentClearance && systemActive;

        if (!canSubmitRequests) {
            return res.status(403).json({
                success: false,
                message: "Cannot submit clearance requests at this time"
            });
        }

        if (!reason || reason.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Please enter a reason for clearance"
            });
        }

        const trimmedReason = reason.trim();

        // Define clearance tables - PHP conversion
        const clearanceTables = {
            'Library': 'library_clearance',
            'Cafeteria': 'cafeteria_clearance',
            'Dormitory': 'dormitory_clearance',
            'Department': 'department_clearance',
            'Registrar': 'academicstaff_clearance'
        };

        let successCount = 0;
        let errorCount = 0;
        let alreadyExistsCount = 0;
        const errors = [];

        // Process each clearance without transactions (simpler approach)
        for (const [clearanceType, tableName] of Object.entries(clearanceTables)) {
            try {
                // Check if already exists
                const [existing] = await db.execute(
                    `SELECT id FROM ${tableName} WHERE student_id = ? AND academic_year = ?`,
                    [student.student_id, academicYear]
                );

                if (existing.length > 0) {
                    alreadyExistsCount++;
                    continue;
                }

                // Insert clearance request - FIXED: Added requested_at field
                await db.execute(
                    `INSERT INTO ${tableName} (student_id, name, last_name, department, reason, academic_year, status, requested_at) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
                    [
                        student.student_id,
                        student.name,
                        student.last_name,
                        student.department,
                        trimmedReason,
                        academicYear
                    ]
                );
                successCount++;
                console.log(`✅ Successfully created ${clearanceType} clearance request`);
            } catch (error) {
                errorCount++;
                errors.push(`${clearanceType}: ${error.message}`);
                console.error(`❌ Error creating ${clearanceType} clearance:`, error.message);
            }
        }

        // Set appropriate message based on results
        if (successCount > 0) {
            message = "Clearance requests submitted successfully! ";
            message += `Created ${successCount} new clearance requests. `;

            if (alreadyExistsCount > 0) {
                message += `${alreadyExistsCount} departments already had pending requests. `;
            }

            if (errorCount > 0) {
                message += `${errorCount} departments failed to process. `;
                message += "Errors: " + errors.join(", ");
                messageType = "warning";
            } else {
                messageType = "success";
            }
        } else if (alreadyExistsCount > 0) {
            message = "You already have pending clearance requests for all departments.";
            messageType = "info";
        } else {
            message = "No clearance requests were created. Please try again or contact support.";
            messageType = "error";
        }

        console.log('📊 Clearance submission results:', {
            successCount,
            alreadyExistsCount,
            errorCount,
            messageType
        });

        if (successCount > 0) {
            return res.json({
                success: true,
                message: message,
                messageType: messageType
            });
        } else {
            return res.json({
                success: false,
                message: message,
                messageType: messageType
            });
        }

    } catch (error) {
        console.error('💥 Clearance request submission error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to submit clearance requests: " + error.message
        });
    }
});

// Get unread notification count
router.get('/notifications/unread-count', requireStudent, async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        const [result] = await db.execute(
            "SELECT COUNT(*) as count FROM final_clearance WHERE student_id = ? AND is_read = 0",
            [studentId]
        );

        res.json({
            success: true,
            count: result[0].count
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({ success: false, count: 0 });
    }
});

// Download Clearance Certificate
router.get('/download-certificate', requireStudent, async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        // Get student data
        const [students] = await db.execute(
            "SELECT * FROM student WHERE student_id = ?",
            [studentId]
        );

        if (students.length === 0) return res.redirect('/login');
        const student = students[0];

        // Get final clearance status
        const [clearance] = await db.execute(
            "SELECT * FROM final_clearance WHERE student_id = ? AND status = 'approved' ORDER BY date_sent DESC LIMIT 1",
            [studentId]
        );

        if (clearance.length === 0) {
            return res.status(403).send("<h1>Access Denied</h1><p>You do not have an approved final clearance yet.</p>");
        }

        const cert = clearance[0];
        const date = new Date(cert.date_sent).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Clearance Certificate - ${studentId}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 50px; background: #f0f2f5; }
                    .certificate { 
                        max-width: 800px; 
                        margin: 0 auto; 
                        background: #fff; 
                        padding: 80px; 
                        border: 20px solid #1e293b; 
                        position: relative;
                        box-shadow: 0 20px 50px rgba(0,0,0,0.1);
                    }
                    .certificate::after {
                        content: '';
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        border: 2px solid #e2e8f0;
                        margin: 10px;
                        pointer-events: none;
                    }
                    .header { text-align: center; margin-bottom: 50px; }
                    .header h1 { margin: 0; color: #1e293b; text-transform: uppercase; letter-spacing: 5px; font-size: 32px; }
                    .header p { margin: 10px 0; color: #64748b; font-weight: bold; }
                    .content { text-align: center; line-height: 1.8; color: #334155; }
                    .content h2 { font-style: italic; color: #475569; font-weight: normal; margin-bottom: 40px; }
                    .student-name { font-size: 36px; font-weight: 900; color: #0f172a; margin: 20px 0; text-decoration: underline; text-underline-offset: 10px; }
                    .details { margin: 40px 0; font-size: 18px; }
                    .footer { margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
                    .signature { text-align: center; width: 200px; }
                    .signature-line { border-top: 2px solid #1e293b; margin-top: 10px; padding-top: 5px; font-weight: bold; color: #1e293b; }
                    .qr-placeholder { width: 80px; height: 80px; background: #eee; border: 1px solid #ddd; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; }
                    @media print {
                        body { background: none; padding: 0; }
                        .certificate { box-shadow: none; border: 15px solid #000; margin: 0; width: 100%; height: 100%; box-sizing: border-box; }
                        .no-print { display: none; }
                    }
                    .btn-print {
                        position: fixed; top: 20px; right: 20px;
                        background: #4f46e5; color: white; padding: 12px 24px;
                        border-radius: 12px; font-weight: bold; cursor: pointer;
                        text-decoration: none; border: none; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                        z-index: 100;
                    }
                </style>
            </head>
            <body>
                <button class="btn-print no-print" onclick="window.print()">Print Certificate</button>
                <div class="certificate">
                    <div class="header">
                        <h1>OFFICIAL CLEARANCE</h1>
                        <p>DEBRE BERHAN UNIVERSITY</p>
                    </div>
                    
                    <div class="content">
                        <h2>This is to certify that</h2>
                        <div class="student-name">${student.name} ${student.last_name}</div>
                        <div class="details">
                            ID Number: <strong>${student.student_id}</strong><br>
                            Department: <strong>${student.department}</strong><br>
                            Academic Year: <strong>${cert.academic_year}</strong>
                        </div>
                        <p>Has successfully completed all institutional clearance protocols and is hereby cleared from all university obligations as of <strong>${date}</strong>.</p>
                    </div>

                    <div class="footer">
                        <div class="signature">
                            <div class="qr-placeholder">VERIFIED<br>CERTIFICATE</div>
                        </div>
                        <div class="signature">
                            <div class="signature-line">University Registrar</div>
                            <div style="font-size: 12px; color: #64748b;">(Electronic Signature)</div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Certificate error:', error);
        res.status(500).send("Error generating certificate");
    }
});
// Notifications Page
router.get('/notifications/data', requireStudent, async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        // Get student data
        const [students] = await db.execute(
            "SELECT student_id, name, last_name, department, year FROM student WHERE student_id = ?",
            [studentId]
        );

        if (students.length === 0) {
            req.session.destroy();
            return res.redirect('/login');
        }

        const student = students[0];
        const actualStudentId = student.student_id;

        // Get notifications (fetch first so is_read=0 is visible in this response)
        const [notifications] = await db.execute(
            "SELECT * FROM final_clearance WHERE student_id = ? ORDER BY date_sent DESC",
            [actualStudentId]
        );

        // Mark notifications as read in the background for next time
        await db.execute(
            "UPDATE final_clearance SET is_read = 1 WHERE student_id = ? AND is_read = 0",
            [actualStudentId]
        );

        // Check if there's any approved clearance to show download button
        let showDownloadButton = false;
        if (notifications.length > 0) {
            notifications.forEach(notification => {
                if (notification.status === 'approved') {
                    showDownloadButton = true;
                }
            });
        }

        res.json({
            success: true,
            user: req.session.user,
            title: 'Clearance Notifications',
            student: student,
            notifications: notifications,
            showDownloadButton: showDownloadButton
        });

    } catch (error) {
        console.error('Notifications error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to load notifications'
        });
    }
});

// Legacy redirect for old API calls (prevents 404s while caches clear)
router.get('/notifications', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/notifications/data');
    }
    next();
});

module.exports = router;
