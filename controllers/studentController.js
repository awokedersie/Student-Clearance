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
                "UPDATE final_clearance SET is_read = TRUE WHERE student_id = ? AND is_read = FALSE",
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
        const currentYear = new Date().getFullYear();
        const currentAcademicYear = `${currentYear}-${currentYear + 1}`;

        const tables = {
            'Library': 'library_clearance',
            'Cafeteria': 'cafeteria_clearance',
            'Dormitory': 'dormitory_clearance',
            'Department': 'department_clearance',
            'Registrar': 'academicstaff_clearance'
        };

        let allClearances = [];
        let hasRequests = false;

        for (const [type, tableName] of Object.entries(tables)) {
            try {
                // Check if academic_year column exists in PostgreSQL
                const [columns] = await db.execute(
                    "SELECT column_name FROM information_schema.columns WHERE table_name = ? AND column_name = 'academic_year'",
                    [tableName]
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

                clearances.forEach(row => {
                    hasRequests = true;
                    // Format status
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
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const academicYear = `${currentYear}-${nextYear}`;

        let systemActive = false;
        let systemMessage = "";
        let clearanceSettings = null;
        let hasCurrentClearance = false;
        let daysRemaining = 0;

        try {
            const [tables] = await db.execute(
                "SELECT table_name FROM information_schema.tables WHERE table_name = 'clearance_settings'"
            );
            if (tables.length > 0) {
                // 1. Priority: Find the currently ACTIVE setting
                let [settingsResult] = await db.execute(
                    "SELECT * FROM clearance_settings WHERE is_active = TRUE ORDER BY id DESC LIMIT 1"
                );

                // 2. Fallback: If no active setting, find the most relevant recent one
                if (settingsResult.length === 0) {
                    [settingsResult] = await db.execute(
                        "SELECT * FROM clearance_settings WHERE academic_year = ? OR academic_year = ? ORDER BY id DESC LIMIT 1",
                        [academicYear, `${currentYear - 1}-${currentYear}`]
                    );
                }

                if (settingsResult.length > 0) {
                    clearanceSettings = settingsResult[0];
                    const now = new Date();
                    const start = new Date(clearanceSettings.start_date);
                    const end = new Date(clearanceSettings.end_date);

                    if (clearanceSettings.is_active) {
                        // Double check date validity even if active, or trust the flag? 
                        // Trust the flag but warn if date is weird? 
                        // The prompt says "even if the system is on it says System Closed".
                        // So we should respect is_active = true mainly.
                        if (now > end) {
                            // If active but expired, technically we should probably allow it or update dates?
                            // But usually 'active' means GO. 
                            // adminController.handleAction 'activate' ensures dates are valid.
                            // So we can trust it.
                        }

                        // We check dates just for calculating days remaining
                        if (now >= start && now <= end) {
                            systemActive = true;
                            daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                        } else if (now > end && clearanceSettings.is_active) {
                            // Edge case: Admin forced it active but date is past. 
                            // We treat it as ACTIVE but maybe show 0 days remaining or negative?
                            systemActive = true;
                            daysRemaining = 0;
                        } else if (now < start && clearanceSettings.is_active) {
                            // Admin forced active before start date
                            systemActive = true;
                            daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
                        }

                    } else {
                        // Not active
                        if (now < start) {
                            systemMessage = "Clearance period has not started yet.";
                        } else if (now > end) {
                            systemMessage = "Clearance period has ended.";
                        } else {
                            systemMessage = "Clearance system is currently inactive.";
                        }
                    }
                } else {
                    systemMessage = "No clearance schedule found for this academic year.";
                }
            }
        } catch (e) { console.error(e); }

        const [students] = await db.execute("SELECT status FROM student WHERE student_id = ?", [studentId]);
        const isStudentActive = students.length > 0 && students[0].status === 'active';

        // Check if any clearance request exists for the current academic year
        const [libCheck] = await db.execute("SELECT id FROM library_clearance WHERE student_id = ? AND academic_year = ? LIMIT 1", [studentId, academicYear]);
        hasCurrentClearance = libCheck.length > 0;

        const canSubmitRequests = systemActive && isStudentActive && !hasCurrentClearance;

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
        const academicYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Reason is required' });
        }

        const [students] = await db.execute('SELECT * FROM student WHERE student_id = ?', [studentId]);
        if (students.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });
        const student = students[0];

        if (submit_all_clearance) {
            const tableMap = {
                'library': 'library_clearance',
                'cafeteria': 'cafeteria_clearance',
                'dormitory': 'dormitory_clearance',
                'department': 'department_clearance',
                'registrar': 'academicstaff_clearance'
            };

            for (const [dept, tableName] of Object.entries(tableMap)) {
                const [existing] = await db.execute(
                    `SELECT id FROM ${tableName} WHERE student_id = ? AND academic_year = ?`,
                    [studentId, academicYear]
                );

                if (existing.length === 0) {
                    await db.execute(
                        `INSERT INTO ${tableName} (student_id, name, last_name, department, reason, status, academic_year, requested_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
                        [studentId, student.name, student.last_name, student.department, reason, academicYear]
                    );
                }
            }
            return res.json({ success: true, message: 'All clearance requests submitted successfully' });
        }

        if (!request_type) {
            return res.status(400).json({ success: false, message: 'Request type is required' });
        }

        const tableMap = {
            'library': 'library_clearance',
            'cafeteria': 'cafeteria_clearance',
            'dormitory': 'dormitory_clearance',
            'department': 'department_clearance',
            'registrar': 'academicstaff_clearance'
        };

        const tableName = tableMap[request_type];
        if (!tableName) {
            return res.status(400).json({ success: false, message: 'Invalid request type' });
        }

        // Check if already requested
        const [existing] = await db.execute(
            `SELECT id FROM ${tableName} WHERE student_id = ? AND academic_year = ?`,
            [studentId, academicYear]
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Request already exists for this department' });
        }

        await db.execute(
            `INSERT INTO ${tableName} (student_id, name, last_name, department, reason, status, academic_year, requested_at) VALUES (?, ?, ?, ?, ?, 'pending', ?, NOW())`,
            [studentId, student.name, student.last_name, student.department, reason, academicYear]
        );

        res.json({ success: true, message: 'Clearance request submitted successfully' });

    } catch (error) {
        console.error('Submit clearance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getNotificationsData = async (req, res) => {
    try {
        const db = req.db;
        const studentId = req.session.user.student_id;

        const [notifications] = await db.execute(
            "SELECT * FROM final_clearance WHERE student_id = ? ORDER BY date_sent DESC",
            [studentId]
        );

        // Mark as read
        await db.execute(
            "UPDATE final_clearance SET is_read = TRUE WHERE student_id = ? AND is_read = FALSE",
            [studentId]
        );

        // Check if download button should show (if latest is approved)
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
            "SELECT COUNT(*) as count FROM final_clearance WHERE student_id = ? AND is_read = FALSE",
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

        // Check if student is approved for final clearance
        const [clearance] = await db.execute(
            "SELECT * FROM final_clearance WHERE student_id = ? AND status = 'approved' ORDER BY date_sent DESC LIMIT 1",
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
        const date = new Date(cert.date_sent).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });

        // Fetch approval details from all clearance tables
        const approvalData = [];

        const departments = [
            { name: 'Library', table: 'library_clearance', title: 'Library Administrator', action: 'APPROVE_STUDENT' },
            { name: 'Cafeteria', table: 'cafeteria_clearance', title: 'Cafeteria Administrator', action: 'APPROVE_STUDENT' },
            { name: 'Dormitory', table: 'dormitory_clearance', title: 'Dormitory Administrator', action: 'APPROVE_STUDENT' },
            { name: 'Department Head', table: 'department_clearance', title: 'Department Head', action: 'APPROVE_STUDENT' },
            { name: 'Registrar Office', table: 'academicstaff_clearance', title: 'Registrar Officer', action: 'APPROVE_STUDENT' }
        ];

        for (const dept of departments) {
            try {
                const [records] = await db.execute(
                    `SELECT status, approved_at, requested_at, approved_by FROM ${dept.table} WHERE student_id = ? AND academic_year = ? AND status = 'approved' ORDER BY id DESC LIMIT 1`,
                    [studentId, cert.academic_year]
                );

                if (records.length > 0) {
                    const approvalDate = records[0].approved_at || records[0].requested_at;
                    let adminName = records[0].approved_by;

                    // Fallback to audit logs if approved_by is missing (legacy records)
                    if (!adminName) {
                        adminName = dept.title; // Default
                        try {
                            const [auditRecords] = await db.execute(
                                `SELECT admin_name FROM audit_logs 
                                 WHERE target_student_id = ? 
                                 AND action = ? 
                                 AND details ILIKE ?
                                 ORDER BY created_at DESC LIMIT 1`,
                                [studentId, dept.action, `%${dept.name}%`]
                            );

                            if (auditRecords.length > 0 && auditRecords[0].admin_name) {
                                adminName = auditRecords[0].admin_name;
                            }
                        } catch (auditErr) {
                            console.error(`Error fetching admin name for ${dept.name}:`, auditErr);
                        }
                    }

                    approvalData.push({
                        department: dept.name,
                        title: dept.title,
                        adminName: adminName,
                        date: approvalDate ? new Date(approvalDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        }) : 'N/A'
                    });
                }
            } catch (err) {
                console.error(`Error fetching ${dept.name} approval:`, err);
            }
        }

        // Generate approval timeline HTML
        const approvalTimeline = approvalData.map(approval => `
            <div class="approval-item">
                <div class="approval-header">
                    <span class="approval-dept">✓ ${approval.department}</span>
                    <span class="approval-date">${approval.date}</span>
                </div>
                <div class="signature-box">
                    <div class="sig-line"></div>
                    <div class="sig-name">${approval.adminName}</div>
                    <div class="sig-title">${approval.title}</div>
                </div>
            </div>
        `).join('');

        const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>Clearance Certificate - ${cert.student_id}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Inter:wght@400;600;700&display=swap');
                    
                    body {
                        background: #f0f2f5;
                        margin: 0;
                        padding: 40px;
                        font-family: 'Inter', sans-serif;
                    }

                    .certificate-container {
                        background: white;
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 60px;
                        border: 15px solid #1e293b;
                        position: relative;
                        box-shadow: 0 40px 100px rgba(0,0,0,0.1);
                    }

                    .certificate-inner {
                        border: 2px solid #e2e8f0;
                        padding: 40px;
                        position: relative;
                    }

                    .header {
                        text-align: center;
                        margin-bottom: 40px;
                    }

                    .university-name {
                        font-family: 'Cinzel', serif;
                        font-size: 28px;
                        font-weight: 700;
                        color: #1e293b;
                        margin: 0;
                        letter-spacing: 2px;
                    }

                    .office-name {
                        font-size: 14px;
                        text-transform: uppercase;
                        letter-spacing: 4px;
                        color: #64748b;
                        margin-top: 10px;
                        font-weight: 700;
                    }

                    .title {
                        text-align: center;
                        font-family: 'Cinzel', serif;
                        font-size: 42px;
                        font-weight: 700;
                        color: #0f172a;
                        margin: 40px 0;
                        text-transform: uppercase;
                    }

                    .content {
                        text-align: center;
                        line-height: 1.8;
                        color: #334155;
                        font-size: 18px;
                    }

                    .student-name {
                        font-size: 24px;
                        font-weight: 700;
                        color: #1e293b;
                        text-decoration: underline;
                        margin: 20px 0;
                        display: block;
                    }

                    .details {
                        margin-top: 40px;
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                        text-align: left;
                        border-top: 1px solid #f1f5f9;
                        padding-top: 30px;
                    }

                    .detail-item b {
                        color: #64748b;
                        font-size: 12px;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        display: block;
                    }

                    .detail-item span {
                        font-weight: 700;
                        color: #1e293b;
                    }

                    .approval-section {
                        margin-top: 50px;
                        padding-top: 30px;
                        border-top: 2px solid #e2e8f0;
                    }

                    .approval-section-title {
                        font-family: 'Cinzel', serif;
                        font-size: 18px;
                        font-weight: 700;
                        color: #1e293b;
                        text-align: center;
                        margin-bottom: 30px;
                        text-transform: uppercase;
                        letter-spacing: 2px;
                    }

                    .approval-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 30px;
                    }

                    .approval-item {
                        background: #f8fafc;
                        padding: 20px;
                        border-radius: 8px;
                        border: 1px solid #e2e8f0;
                    }

                    .approval-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }

                    .approval-dept {
                        font-weight: 700;
                        color: #059669;
                        font-size: 14px;
                    }

                    .approval-date {
                        font-size: 11px;
                        color: #64748b;
                        font-weight: 600;
                    }

                    .signature-box {
                        margin-top: 20px;
                    }

                    .sig-line {
                        border-top: 2px solid #1e293b;
                        margin-bottom: 8px;
                        width: 100%;
                    }

                    .sig-name {
                        font-size: 13px;
                        font-weight: 700;
                        color: #1e293b;
                        margin-bottom: 4px;
                    }

                    .sig-title {
                        font-size: 11px;
                        font-weight: 700;
                        text-transform: uppercase;
                        color: #64748b;
                        letter-spacing: 1px;
                    }

                    .footer {
                        margin-top: 60px;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }

                    .seal {
                        width: 120px;
                        height: 120px;
                        border: 4px double #1e293b;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-weight: 700;
                        font-family: 'Cinzel', serif;
                        color: #1e293b;
                        font-size: 10px;
                        text-align: center;
                        padding: 10px;
                        opacity: 0.8;
                        transform: rotate(-15deg);
                    }

                    @media print {
                        @page { margin: 0; size: auto; }
                        body { background: white; padding: 0; margin: 0; -webkit-print-color-adjust: exact; }
                        .certificate-container { 
                            box-shadow: none; 
                            border: 5px solid #1e293b; 
                            width: 100%; 
                            max-width: 100%; 
                            margin: 0; 
                            padding: 20px; 
                            box-sizing: border-box; 
                            height: 100vh;
                        }
                        .certificate-inner { padding: 20px; border: 2px solid #e2e8f0; }
                        .print-btn { display: none; }
                        
                        /* Compact layout for print */
                        .header { margin-bottom: 20px; }
                        .university-name { font-size: 24px; }
                        .title { margin: 20px 0; font-size: 32px; }
                        .content { margin-left: 20px !important; }
                        .form-row { margin-bottom: 10px !important; font-size: 16px !important; }
                        .approval-section { margin-top: 20px; padding-top: 20px; }
                        .approval-section-title { font-size: 16px; margin-bottom: 20px; }
                        .approval-grid { gap: 15px; }
                        .approval-item { padding: 10px; }
                        .approval-header { margin-bottom: 5px; }
                        .signature-box { margin-top: 10px; }
                        .footer { margin-top: 30px; }
                        .seal { width: 100px; height: 100px; font-size: 9px; }
                        
                        /* Hide background graphics if any */
                        * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                    }

                    /* Regular screen styles fallback */
                    .print-btn {
                        position: fixed;
                        top: 20px;
                        right: 20px;
                        background: #1e293b;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 8px;
                        font-weight: 700;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                        transition: all 0.2s;
                    }
                    .print-btn:hover {
                        background: #0f172a;
                        transform: translateY(-2px);
                    }
                </style>
            </head>
            <body>
                <button class="print-btn" onclick="window.print()">
                    <span>🖨️</span> Print / Save as PDF
                </button>

                <div class="certificate-container">
                    <div class="certificate-inner">
                        <div class="header">
                            <h1 class="university-name">Debre Berhan University</h1>
                            <p class="office-name">Office of the Registrar</p>
                        </div>

                        <h2 class="title">Clearance Certificate</h2>

                        <div class="content" style="text-align: left; margin-left: 50px;">
                            <div class="form-row" style="margin-bottom: 20px; font-size: 20px;">
                                <span style="font-weight: 700;">Student Name:</span> 
                                <span style="border-bottom: 2px solid #333; padding: 0 10px; min-width: 300px; display: inline-block;">${cert.name} ${cert.last_name}</span>
                            </div>
                            <div class="form-row" style="margin-bottom: 20px; font-size: 20px;">
                                <span style="font-weight: 700;">Student ID:</span> 
                                <span style="border-bottom: 2px solid #333; padding: 0 10px; min-width: 200px; display: inline-block;">${cert.student_id}</span>
                            </div>
                            <div class="form-row" style="margin-bottom: 20px; font-size: 20px;">
                                <span style="font-weight: 700;">Department:</span> 
                                <span style="border-bottom: 2px solid #333; padding: 0 10px; min-width: 300px; display: inline-block;">${cert.department || 'Academic Department'}</span>
                            </div>
                            <div class="form-row" style="margin-bottom: 20px; font-size: 20px;">
                                <span style="font-weight: 700;">Academic Year:</span> 
                                <span style="border-bottom: 2px solid #333; padding: 0 10px; min-width: 150px; display: inline-block;">${cert.academic_year}</span>
                            </div>
                        </div>

                        <div style="text-align: center; margin: 40px 0; font-size: 16px; color: #555;">
                            This is to certify that the above mentioned student has successfully fulfilled all academic and administrative requirements and is hereby cleared of all obligations to the University.
                        </div>

                        <div class="approval-section">
                            <div class="approval-section-title" style="text-decoration: underline;">Approval Timeline</div>
                            <div class="approval-grid">
                                ${approvalTimeline}
                            </div>
                        </div>

                        <div class="footer">
                            <div class="seal">
                                DEBRE BERHAN UNIVERSITY<br>OFFICIAL SEAL
                            </div>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;

        res.send(html);

    } catch (error) {
        console.error('Certificate download error:', error);
        res.status(500).send('Error generating certificate');
    }
};

// Export multer upload middleware for use in routes
exports.upload = upload;
