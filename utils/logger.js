/**
 * Enhanced Logger Utility
 * 
 * Provides:
 * - Audit logging to database
 * - Application logging with context
 * - Structured log formats
 * - Request correlation tracking
 */

const crypto = require('crypto');

/**
 * Generate a unique correlation ID for request tracking
 * @returns {string} Correlation ID
 */
const generateCorrelationId = () => {
    return crypto.randomBytes(8).toString('hex');
};

/**
 * Format log data for output
 * @param {Object} data - Data to format
 * @returns {string} Formatted string
 */
const formatData = (data) => {
    if (!data || Object.keys(data).length === 0) return '';
    try {
        return JSON.stringify(data, null, process.env.NODE_ENV === 'development' ? 2 : 0);
    } catch {
        return String(data);
    }
};

/**
 * Get timestamp in ISO format
 * @returns {string} ISO timestamp
 */
const getTimestamp = () => new Date().toISOString();

const logger = {
    /**
     * Log an administrative action to the audit_logs table
     * @param {Object} req - The Express request object containing session and IP
     * @param {string} action - The action being performed (e.g., 'APPROVE', 'REJECT')
     * @param {string|null} targetStudentId - The ID of the student being acted upon
     * @param {string|null} details - Additional information about the action
     * @param {string|null} targetStudentName - Name of the target student
     */
    audit: async (req, action, targetStudentId = null, details = null, targetStudentName = null) => {
        try {
            const db = req.db;
            const user = req.session?.user;

            if (!user) {
                logger.warn('AuditLog', 'Attempted to log audit action without an active session');
                return;
            }

            // Get the real client IP from the first entry of x-forwarded-for or fallback to req.ip
            let ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || req.connection.remoteAddress;
            
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

            logger.info('AuditLog', `${user.role} ${user.name} performed ${action}`, {
                targetStudentId: targetStudentId || 'N/A',
                ip
            });
        } catch (error) {
            logger.error('AuditLog', 'Failed to write audit log', error);
            // We don't throw the error here because audit logging shouldn't break the main business logic
        }
    },

    // Backward compatible alias for existing code
    log: async (req, action, targetStudentId = null, details = null, targetStudentName = null) => {
        return logger.audit(req, action, targetStudentId, details, targetStudentName);
    },

    /**
     * Log an informational message
     * @param {string} context - The context/module name (e.g., 'AuthController', 'StudentService')
     * @param {string} message - The log message
     * @param {Object} data - Additional data to log
     */
    info: (context, message, data = {}) => {
        const timestamp = getTimestamp();
        const formattedData = formatData(data);
        console.log(`[${timestamp}] [INFO] [${context}] ${message}${formattedData ? ' ' + formattedData : ''}`);
    },

    /**
     * Log a warning message
     * @param {string} context - The context/module name
     * @param {string} message - The log message
     * @param {Object} data - Additional data to log
     */
    warn: (context, message, data = {}) => {
        const timestamp = getTimestamp();
        const formattedData = formatData(data);
        console.warn(`[${timestamp}] [WARN] [${context}] ${message}${formattedData ? ' ' + formattedData : ''}`);
    },

    /**
     * Log an error message
     * @param {string} context - The context/module name
     * @param {string} message - The log message
     * @param {Error} error - The error object
     * @param {Object} data - Additional data to log
     */
    error: (context, message, error = null, data = {}) => {
        const timestamp = getTimestamp();
        const errorInfo = error ? {
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            code: error.code,
            ...data
        } : data;
        const formattedData = formatData(errorInfo);
        console.error(`[${timestamp}] [ERROR] [${context}] ${message}${formattedData ? ' ' + formattedData : ''}`);
    },

    /**
     * Log a debug message (only in development)
     * @param {string} context - The context/module name
     * @param {string} message - The log message
     * @param {Object} data - Additional data to log
     */
    debug: (context, message, data = {}) => {
        if (process.env.NODE_ENV !== 'development') return;
        const timestamp = getTimestamp();
        const formattedData = formatData(data);
        console.debug(`[${timestamp}] [DEBUG] [${context}] ${message}${formattedData ? ' ' + formattedData : ''}`);
    },

    /**
     * Log an HTTP request (for request logging middleware)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     * @param {number} duration - Request duration in ms
     */
    request: (req, res, duration) => {
        const timestamp = getTimestamp();
        const method = req.method;
        const url = req.originalUrl || req.url;
        const status = res.statusCode;
        const correlationId = req.correlationId || 'N/A';
        const userId = req.session?.user?.id || 'anonymous';
        
        const logLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARN' : 'INFO';
        const logFn = status >= 500 ? console.error : status >= 400 ? console.warn : console.log;
        
        logFn(`[${timestamp}] [${logLevel}] [HTTP] ${method} ${url} ${status} ${duration}ms [user:${userId}] [cid:${correlationId}]`);
    },

    /**
     * Create a child logger with a fixed context
     * @param {string} context - The context/module name
     * @returns {Object} Logger with pre-set context
     */
    child: (context) => ({
        info: (message, data) => logger.info(context, message, data),
        warn: (message, data) => logger.warn(context, message, data),
        error: (message, error, data) => logger.error(context, message, error, data),
        debug: (message, data) => logger.debug(context, message, data)
    }),

    /**
     * Middleware to add correlation ID to requests
     */
    correlationMiddleware: (req, res, next) => {
        req.correlationId = req.headers['x-correlation-id'] || generateCorrelationId();
        res.setHeader('x-correlation-id', req.correlationId);
        next();
    },

    /**
     * Middleware to log all HTTP requests
     */
    requestMiddleware: (req, res, next) => {
        const start = Date.now();
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            logger.request(req, res, duration);
        });
        
        next();
    }
};

module.exports = logger;
