const logger = {
    /**
     * Log an administrative action to the audit_logs table
     * @param {Object} req - The Express request object containing session and IP
     * @param {string} action - The action being performed (e.g., 'APPROVE', 'REJECT')
     * @param {string|null} targetStudentId - The ID of the student being acted upon
     * @param {string|null} details - Additional information about the action
     */
    log: async (req, action, targetStudentId = null, details = null, targetStudentName = null) => {
        try {
            const db = req.db;
            const user = req.session?.user;

            if (!user) {
                console.warn('⚠️ Attempted to log audit action without an active session');
                return;
            }

            const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;

            await db.execute(
                `INSERT INTO audit_logs (admin_id, admin_name, admin_role, action, target_student_id, target_student_name, details, ip_address) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    user.id,
                    user.full_name || `${user.name} ${user.lastName}`,
                    user.role,
                    action,
                    targetStudentId,
                    targetStudentName,
                    details,
                    ip
                ]
            );

            console.log(`📝 Audit Log: ${user.role} ${user.name} performed ${action} on ${targetStudentId || 'N/A'}`);
        } catch (error) {
            console.error('💥 Failed to write audit log:', error);
            // We don't throw the error here because audit logging shouldn't break the main business logic
            // but in a strictly secure system, we might want to block the action if logging fails.
        }
    }
};

module.exports = logger;
