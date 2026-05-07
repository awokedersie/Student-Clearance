/**
 * Structured Error Codes for the Student Clearance System
 * 
 * Error Code Ranges:
 * - 1xxx: Authentication & Authorization Errors
 * - 2xxx: Validation Errors
 * - 3xxx: Resource Errors (Not Found, Already Exists, etc.)
 * - 4xxx: System/Business Logic Errors
 * - 5xxx: Database & Infrastructure Errors
 */

const ErrorCodes = {
    // ============================================
    // Authentication Errors (1xxx)
    // ============================================
    AUTH_INVALID_CREDENTIALS: {
        code: 1001,
        status: 401,
        message: 'Invalid username or password'
    },
    AUTH_SESSION_EXPIRED: {
        code: 1002,
        status: 401,
        message: 'Your session has expired. Please log in again.'
    },
    AUTH_UNAUTHORIZED: {
        code: 1003,
        status: 403,
        message: 'You do not have permission to access this resource'
    },
    AUTH_ACCOUNT_INACTIVE: {
        code: 1004,
        status: 403,
        message: 'Your account is inactive. Please contact the administrator.'
    },
    AUTH_TOKEN_INVALID: {
        code: 1005,
        status: 401,
        message: 'Invalid or expired authentication token'
    },
    AUTH_PASSWORD_MISMATCH: {
        code: 1006,
        status: 400,
        message: 'Current password is incorrect'
    },
    AUTH_RESET_CODE_INVALID: {
        code: 1007,
        status: 400,
        message: 'Invalid or expired password reset code'
    },
    AUTH_TOO_MANY_ATTEMPTS: {
        code: 1008,
        status: 429,
        message: 'Too many login attempts. Please try again later.'
    },

    // ============================================
    // Validation Errors (2xxx)
    // ============================================
    VALIDATION_FAILED: {
        code: 2001,
        status: 400,
        message: 'Validation failed. Please check your input.'
    },
    VALIDATION_REQUIRED_FIELD: {
        code: 2002,
        status: 400,
        message: 'Required field is missing'
    },
    VALIDATION_INVALID_EMAIL: {
        code: 2003,
        status: 400,
        message: 'Please provide a valid email address'
    },
    VALIDATION_INVALID_PHONE: {
        code: 2004,
        status: 400,
        message: 'Please provide a valid phone number'
    },
    VALIDATION_PASSWORD_WEAK: {
        code: 2005,
        status: 400,
        message: 'Password does not meet security requirements'
    },
    VALIDATION_PASSWORD_MATCH: {
        code: 2006,
        status: 400,
        message: 'Passwords do not match'
    },
    VALIDATION_INVALID_FORMAT: {
        code: 2007,
        status: 400,
        message: 'Invalid data format'
    },
    VALIDATION_STRING_TOO_SHORT: {
        code: 2008,
        status: 400,
        message: 'Input is too short'
    },
    VALIDATION_STRING_TOO_LONG: {
        code: 2009,
        status: 400,
        message: 'Input exceeds maximum length'
    },
    VALIDATION_INVALID_YEAR: {
        code: 2010,
        status: 400,
        message: 'Year must be between 1 and 7'
    },
    VALIDATION_INVALID_SEMESTER: {
        code: 2011,
        status: 400,
        message: 'Semester must be 1 or 2'
    },

    // ============================================
    // Resource Errors (3xxx)
    // ============================================
    RESOURCE_NOT_FOUND: {
        code: 3001,
        status: 404,
        message: 'The requested resource was not found'
    },
    RESOURCE_ALREADY_EXISTS: {
        code: 3002,
        status: 409,
        message: 'This resource already exists'
    },
    STUDENT_NOT_FOUND: {
        code: 3003,
        status: 404,
        message: 'Student not found'
    },
    STUDENT_ALREADY_EXISTS: {
        code: 3004,
        status: 409,
        message: 'A student with this ID or email already exists'
    },
    CLEARANCE_NOT_FOUND: {
        code: 3005,
        status: 404,
        message: 'Clearance request not found'
    },
    CLEARANCE_ALREADY_EXISTS: {
        code: 3006,
        status: 409,
        message: 'You already have an active clearance request'
    },
    DEPARTMENT_NOT_FOUND: {
        code: 3007,
        status: 404,
        message: 'Department not found'
    },
    ADMIN_NOT_FOUND: {
        code: 3008,
        status: 404,
        message: 'Administrator not found'
    },

    // ============================================
    // System/Business Logic Errors (4xxx)
    // ============================================
    SYSTEM_CLOSED: {
        code: 4001,
        status: 403,
        message: 'The clearance system is currently closed. Please try again later.'
    },
    SYSTEM_MAINTENANCE: {
        code: 4002,
        status: 503,
        message: 'System is under maintenance. Please try again later.'
    },
    CLEARANCE_ALREADY_APPROVED: {
        code: 4003,
        status: 400,
        message: 'This clearance has already been approved'
    },
    CLEARANCE_ALREADY_REJECTED: {
        code: 4004,
        status: 400,
        message: 'This clearance has already been rejected'
    },
    CLEARANCE_CANNOT_MODIFY: {
        code: 4005,
        status: 400,
        message: 'This clearance request cannot be modified'
    },
    OPERATION_NOT_ALLOWED: {
        code: 4006,
        status: 403,
        message: 'This operation is not allowed'
    },
    FILE_UPLOAD_FAILED: {
        code: 4007,
        status: 400,
        message: 'File upload failed. Please try again.'
    },
    FILE_TYPE_NOT_ALLOWED: {
        code: 4008,
        status: 400,
        message: 'This file type is not allowed'
    },
    FILE_TOO_LARGE: {
        code: 4009,
        status: 400,
        message: 'File size exceeds the maximum limit'
    },
    SYSTEM_ERROR: {
        code: 4999,
        status: 500,
        message: 'An unexpected error occurred. Please try again later.'
    },

    // ============================================
    // Database & Infrastructure Errors (5xxx)
    // ============================================
    DB_CONNECTION_ERROR: {
        code: 5001,
        status: 500,
        message: 'Unable to connect to the database. Please try again later.'
    },
    DB_QUERY_ERROR: {
        code: 5002,
        status: 500,
        message: 'A database error occurred. Please try again later.'
    },
    DB_TRANSACTION_ERROR: {
        code: 5003,
        status: 500,
        message: 'Transaction failed. Please try again.'
    },
    EXTERNAL_SERVICE_ERROR: {
        code: 5004,
        status: 502,
        message: 'An external service is unavailable. Please try again later.'
    },
    EMAIL_SEND_ERROR: {
        code: 5005,
        status: 500,
        message: 'Failed to send email. Please try again later.'
    }
};

/**
 * Get an error by its code number
 * @param {number} code - The error code number
 * @returns {Object|null} The error object or null if not found
 */
const getErrorByCode = (code) => {
    return Object.values(ErrorCodes).find(err => err.code === code) || null;
};

/**
 * Create a custom error with an error code
 * @param {string} errorKey - The key from ErrorCodes
 * @param {string} customMessage - Optional custom message to override default
 * @returns {Object} Error object with code, status, and message
 */
const createError = (errorKey, customMessage = null) => {
    const error = ErrorCodes[errorKey] || ErrorCodes.SYSTEM_ERROR;
    return {
        ...error,
        message: customMessage || error.message
    };
};

module.exports = {
    ErrorCodes,
    getErrorByCode,
    createError
};
