const nodemailer = require('nodemailer');
const transporter = require('../../config/email');
const logger = require('../../utils/logger');

// Configure email transporter (using config/email.js now)
// const emailTransporter = ... (Removed redundant config)

// Function to send email notification to student
async function sendClearanceDecisionEmail(studentEmail, studentName, decision, reason = '') {
    try {
        let mailOptions;

        if (decision === 'approved') {
            mailOptions = {
                from: `"DBU Clearance System" <${process.env.EMAIL_USER || 'no-reply@dbu.edu.et'}>`,
                to: studentEmail,
                subject: 'Final Clearance Approved - DBU Clearance System',
                html: `
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <h2 style='color: #2c3e50;'>🎉 Final Clearance Approved!</h2>
                        <p>Dear <strong>${studentName}</strong>,</p>
                        <p>We are pleased to inform you that your final clearance has been <strong>APPROVED</strong> by the Registrar Office.</p>
                        
                        <div style='background: #d4edda; padding: 20px; border-radius: 8px; border: 2px solid #c3e6cb; margin: 20px 0;'>
                            <h3 style='margin: 0; color: #155724;'>✅ Clearance Status: Approved</h3>
                            <p style='margin: 10px 0 0 0; color: #155724;'>
                                Your clearance process is now complete. You have successfully cleared all requirements.
                            </p>
                        </div>
                        
                        <p><strong>Important Notes:</strong></p>
                        <ul>
                            <li>You can download your clearance certificate from the student portal</li>
                            <li><a href='https://dbu-clearance-system.onrender.com/login'>Click here to login and download certificate</a></li>
                            <li>You have completed all clearance requirements</li>
                            <li>This completes your clearance process at DBU</li>
                        </ul>
                        
                        <p>If you have any questions, please contact the Registrar Office.</p>
                        
                        <hr style='border: none; border-top: 1px solid #ddd;'>
                        <p style='color: #7f8c8d; font-size: 12px;'>
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                `,
                text: `Final Clearance Approved: Dear ${studentName}, your final clearance has been APPROVED. Your student status has been updated to inactive. This completes your clearance process at DBU.`
            };
        } else {
            mailOptions = {
                from: `"DBU Clearance System" <${process.env.EMAIL_USER || 'no-reply@dbu.edu.et'}>`,
                to: studentEmail,
                subject: 'Final Clearance Rejected - DBU Clearance System',
                html: `
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <h2 style='color: #2c3e50;'>⚠️ Final Clearance Requires Attention</h2>
                        <p>Dear <strong>${studentName}</strong>,</p>
                        <p>Your final clearance request has been <strong>REJECTED</strong> by the Registrar Office.</p>
                        
                        <div style='background: #f8d7da; padding: 20px; border-radius: 8px; border: 2px solid #f5c6cb; margin: 20px 0;'>
                            <h3 style='margin: 0; color: #721c24;'>❌ Clearance Status: Rejected</h3>
                            <p style='margin: 10px 0 0 0; color: #721c24;'>
                                <strong>Reason:</strong> ${reason}
                            </p>
                        </div>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Please address the issue mentioned above</li>
                            <li>Your student status remains <strong>active</strong></li>
                            <li>You may reapply for clearance after resolving the issue</li>
                            <li>Contact the relevant department for assistance</li>
                            <li><a href='https://dbu-clearance-system.onrender.com/login'>Login to check your status</a></li>
                        </ul>
                        
                        <p>If you need clarification, please visit the Registrar Office.</p>
                        
                        <hr style='border: none; border-top: 1px solid #ddd;'>
                        <p style='color: #7f8c8d; font-size: 12px;'>
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                `,
                text: `Final Clearance Rejected: Dear ${studentName}, your final clearance has been REJECTED. Reason: ${reason}. Please address the issue and reapply. Your student status remains active.`
            };
        }

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
}

exports.getDashboardData = async (req, res) => {
    try {
        console.log('🏁 Starting registrar dashboard render');
        const db = req.db;
        // Get current academic year from settings
        const [settingsRows = []] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Get search and filter parameters
        const search = req.query.search || '';
        const status_filter = req.query.status || 'all';

        console.log('📊 Fetching statistics...');
        // Get comprehensive statistics for dashboard from unified table
        const [statsRows] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM clearance_requests ac 
                 INNER JOIN clearance_requests dc ON ac.student_id = dc.student_id AND dc.target_department = 'department' AND dc.status = 'approved'
                 WHERE ac.academic_year = ? AND ac.target_department = 'registrar') as total,
                (SELECT COUNT(*) FROM clearance_requests WHERE target_department = 'registrar' AND status = 'approved' AND academic_year = ?) as approved,
                (SELECT COUNT(*) FROM clearance_requests ac 
                 INNER JOIN clearance_requests dc ON ac.student_id = dc.student_id AND dc.target_department = 'department' AND dc.status = 'approved'
                 WHERE ac.status = 'pending' AND ac.academic_year = ? AND ac.target_department = 'registrar') as pending,
                (SELECT COUNT(*) FROM clearance_requests WHERE target_department = 'registrar' AND status = 'rejected' AND academic_year = ?) as rejected
        `, [currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear]);

        const stats = statsRows[0] || { total: 0, approved: 0, pending: 0, rejected: 0 };
        // Ensure values are numbers
        stats.total = stats.total || 0;
        stats.approved = stats.approved || 0;
        stats.pending = stats.pending || 0;
        stats.rejected = stats.rejected || 0;

        console.log('📈 Stats fetched:', stats);

        // Build query for students based on filters - ONLY DEPARTMENT APPROVED STUDENTS AND CURRENT ACADEMIC YEAR
        let query = `
            SELECT ac.*,
                   CONCAT(ac.name, ' ', ac.last_name) as student_name,
                   ac.student_department as department,
                   ac.requested_at as updated_at,
                   (SELECT status FROM clearance_requests WHERE student_id = ac.student_id AND academic_year = ? AND target_department = 'library' ORDER BY id DESC LIMIT 1) as library_status,
                   (SELECT status FROM clearance_requests WHERE student_id = ac.student_id AND academic_year = ? AND target_department = 'cafeteria' ORDER BY id DESC LIMIT 1) as cafeteria_status,
                   (SELECT status FROM clearance_requests WHERE student_id = ac.student_id AND academic_year = ? AND target_department = 'dormitory' ORDER BY id DESC LIMIT 1) as dormitory_status,
                   (SELECT status FROM clearance_requests WHERE student_id = ac.student_id AND academic_year = ? AND target_department = 'department' ORDER BY id DESC LIMIT 1) as department_status,
                   ac.status as final_status,
                   ac.reject_reason as final_reject_reason
            FROM clearance_requests ac 
            INNER JOIN clearance_requests dc ON ac.student_id = dc.student_id AND dc.target_department = 'department' AND dc.status = 'approved'
            WHERE ac.academic_year = ? AND ac.target_department = 'registrar'
        `;

        let queryParams = [
            currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear, // SELECT subqueries
            currentAcademicYear // WHERE clause
        ];

        // Apply search filter
        if (search) {
            query += " AND (ac.name ILIKE ? OR ac.last_name ILIKE ? OR ac.student_id ILIKE ? OR ac.student_department ILIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Apply status filter
        if (status_filter === 'pending') {
            query += " AND ac.status = 'pending'";
        } else if (status_filter === 'approved') {
            query += " AND ac.status = 'approved'";
        } else if (status_filter === 'rejected') {
            query += " AND ac.status = 'rejected'";
        }

        query += ` ORDER BY (CASE WHEN ac.status = 'pending' THEN 1 ELSE 2 END) ASC, ac.student_id ASC`;

        const [allStudents] = await db.execute(query, queryParams);

        // Map lock status
        const students = allStudents.map(s => {
            return {
                ...s,
                is_locked: false, // Registrar can toggle statuses to fix mistakes
                locked_by_dept: null,
                can_approve: s.status !== 'approved' && s.department_status === 'approved',
                can_reject: s.status !== 'rejected'
            };
        });

        // Get approved final clearances for history - CURRENT ACADEMIC YEAR ONLY
        const [historyRows] = await db.execute(`
            SELECT * FROM clearance_requests
            WHERE target_department = 'registrar' AND status = 'approved' AND academic_year = ?
            ORDER BY requested_at DESC 
            LIMIT 50
        `, [currentAcademicYear]);

        res.json({
            success: true,
            user: req.session.user,
            stats: stats,
            all_requests: students,
            history: historyRows,
            search: search,
            status: status_filter
        });

    } catch (error) {
        console.error('❌ Error loading registrar dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading registrar dashboard: ' + error.message
        });
    }
};

exports.handleAction = async (req, res) => {
    try {
        console.log('🔄 Processing registrar action...');
        const db = req.db;
        const {
            approve,
            reject,
            student_id,
            reject_reason,
            bulk_action,
            selected_students,
            bulk_reject_reason
        } = req.body;

        // Get current academic year from settings
        const [settingsRows] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        let processedCount = 0;
        let studentsToProcess = [];

        if (bulk_action) {
            if (Array.isArray(selected_students)) {
                studentsToProcess = selected_students;
            } else if (selected_students) {
                studentsToProcess = [selected_students];
            }
        } else if (student_id) {
            studentsToProcess = [student_id];
        }

        if (studentsToProcess.length === 0) {
            return res.status(400).json({ success: false, message: 'No students selected' });
        }

        // Determine if this is an approval or rejection
        const isApprove = bulk_action ? (bulk_action === 'approve') : (approve === 'true' || approve === true || !!approve);
        const finalStatus = isApprove ? 'approved' : 'rejected';
        const finalRejectReason = bulk_action ? bulk_reject_reason : reject_reason;

        console.log(`📝 Processing ${studentsToProcess.length} students. Action: ${finalStatus}`);

        for (const sid of studentsToProcess) {
            // Get student details for email
            const [students] = await db.execute("SELECT * FROM student WHERE student_id = ?", [sid]);
            if (students.length === 0) {
                console.warn(`⚠️ Student not found: ${sid}`);
                continue;
            }
            const student = students[0];

            // 1. Update clearance_requests status for registrar
            const notificationMsg = isApprove ? 'Your final clearance has been approved. You can now download your certificate.' : `Your final clearance has been rejected. Reason: ${finalRejectReason || 'Please contact office'}`;
            await db.execute(
                "UPDATE clearance_requests SET status = ?, reject_reason = ?, notification_message = ?, is_read = FALSE, approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, approved_by = ? WHERE student_id = ? AND academic_year = ? AND target_department = 'registrar'",
                [finalStatus, isApprove ? null : finalRejectReason, notificationMsg, finalStatus, req.session.user.full_name || 'Registrar', sid, currentAcademicYear]
            );

            // Audit Log
            const actionLabel = finalStatus === 'approved' ? 'APPROVE_STUDENT' : 'REJECT_STUDENT';
            const logDetails = finalStatus === 'approved'
                ? `Final registrar seal provided for: ${student.name} ${student.last_name}. Digital certificate generated.`
                : `Final registrar seal rejected for: ${student.name} ${student.last_name}. Reason: ${finalRejectReason || 'No reason specified'}`;

            await logger.log(req, actionLabel, sid, logDetails, `${student.name} ${student.last_name}`);

            // 2. Update student status in the main student table
            const studentStatus = isApprove ? 'inactive' : 'active';
            await db.execute("UPDATE student SET status = ? WHERE student_id = ?", [studentStatus, sid]);

            // 3. Send Email Notification
            await sendClearanceDecisionEmail(student.email, student.name, finalStatus, finalRejectReason);

            processedCount++;
        }

        res.json({
            success: true,
            message: `${processedCount} student(s) ${finalStatus} successfully.`
        });

    } catch (error) {
        console.error('❌ Error processing registrar action:', error);
        res.status(500).json({ success: false, message: 'Error processing request: ' + error.message });
    }
};
