/**
 * Unified Response Handler
 * Standardizes API responses across all controllers.
 * 
 * Enhanced with:
 * - Structured error codes
 * - Timestamps on all responses
 * - Detailed validation error support
 * - Context-aware error logging
 */

const { ErrorCodes, createError } = require('./errorCodes');

const responseHandler = {
    /**
     * Send a success response
     * @param {Response} res - Express response object
     * @param {Object} data - Data to include in response
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     */
    success: (res, data = {}, message = 'Operation successful', statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            message,
            timestamp: new Date().toISOString(),
            ...data
        });
    },

    /**
     * Send an error response using error codes
     * @param {Response} res - Express response object
     * @param {string} errorKey - Key from ErrorCodes (e.g., 'AUTH_INVALID_CREDENTIALS')
     * @param {Object} options - Additional options
     * @param {string} options.customMessage - Override the default error message
     * @param {Object} options.details - Additional details (only shown in development)
     * @param {string} options.context - Context for logging (e.g., 'StudentController.login')
     */
    errorWithCode: (res, errorKey, options = {}) => {
        const { customMessage, details, context } = options;
        const error = createError(errorKey, customMessage);
        
        const response = {
            success: false,
            code: error.code,
            message: error.message,
            timestamp: new Date().toISOString()
        };

        // Include details in development mode only
        if (details && process.env.NODE_ENV === 'development') {
            response.details = details;
        }

        // Log the error with context
        console.error(`[ERROR ${error.code}]${context ? ` [${context}]` : ''} ${error.message}`, details || '');
        
        return res.status(error.status).json(response);
    },

    /**
     * Send a validation error response
     * @param {Response} res - Express response object
     * @param {Array} errors - Array of validation errors
     * @param {string} message - Error message
     */
    validationError: (res, errors, message = 'Validation failed. Please check your input.') => {
        const response = {
            success: false,
            code: ErrorCodes.VALIDATION_FAILED.code,
            message,
            errors,
            timestamp: new Date().toISOString()
        };

        console.error(`[VALIDATION ERROR] ${message}`, JSON.stringify(errors));
        return res.status(400).json(response);
    },

    /**
     * Legacy error method for backward compatibility
     * @param {Response} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {Error} error - Original error object
     */
    error: (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
        const errorCode = statusCodeToErrorCode(statusCode);
        
        const response = {
            success: false,
            code: errorCode,
            message,
            timestamp: new Date().toISOString()
        };

        if (error && process.env.NODE_ENV === 'development') {
            response.details = {
                error: error.message || error,
                stack: error.stack
            };
        }

        console.error(`[ERROR ${errorCode}] [${statusCode}] ${message}`, error || '');
        return res.status(statusCode).json(response);
    },

    /**
     * Common HTTP error helpers with error codes
     */
    unauthorized: (res, message = 'Unauthorized access') => {
        return responseHandler.errorWithCode(res, 'AUTH_UNAUTHORIZED', { customMessage: message });
    },
    
    forbidden: (res, message = 'Forbidden access') => {
        return responseHandler.errorWithCode(res, 'AUTH_UNAUTHORIZED', { customMessage: message });
    },
    
    notFound: (res, message = 'Resource not found') => {
        return responseHandler.errorWithCode(res, 'RESOURCE_NOT_FOUND', { customMessage: message });
    },
    
    badRequest: (res, message = 'Invalid request data') => {
        return responseHandler.errorWithCode(res, 'VALIDATION_FAILED', { customMessage: message });
    },

    /**
     * System-specific error helpers
     */
    systemClosed: (res) => {
        return responseHandler.errorWithCode(res, 'SYSTEM_CLOSED');
    },

    accountInactive: (res) => {
        return responseHandler.errorWithCode(res, 'AUTH_ACCOUNT_INACTIVE');
    },

    invalidCredentials: (res) => {
        return responseHandler.errorWithCode(res, 'AUTH_INVALID_CREDENTIALS');
    },

    sessionExpired: (res) => {
        return responseHandler.errorWithCode(res, 'AUTH_SESSION_EXPIRED');
    },

    tooManyAttempts: (res) => {
        return responseHandler.errorWithCode(res, 'AUTH_TOO_MANY_ATTEMPTS');
    },

    dbError: (res, error = null) => {
        return responseHandler.errorWithCode(res, 'DB_QUERY_ERROR', { 
            details: error,
            context: 'Database'
        });
    },

    /**
     * Resource-specific helpers
     */
    studentNotFound: (res) => {
        return responseHandler.errorWithCode(res, 'STUDENT_NOT_FOUND');
    },

    studentExists: (res) => {
        return responseHandler.errorWithCode(res, 'STUDENT_ALREADY_EXISTS');
    },

    clearanceNotFound: (res) => {
        return responseHandler.errorWithCode(res, 'CLEARANCE_NOT_FOUND');
    },

    clearanceExists: (res) => {
        return responseHandler.errorWithCode(res, 'CLEARANCE_ALREADY_EXISTS');
    }
};

/**
 * Map HTTP status codes to our error codes
 * @param {number} statusCode - HTTP status code
 * @returns {number} Our error code
 */
const statusCodeToErrorCode = (statusCode) => {
    const codeMap = {
        400: ErrorCodes.VALIDATION_FAILED.code,
        401: ErrorCodes.AUTH_UNAUTHORIZED.code,
        403: ErrorCodes.AUTH_UNAUTHORIZED.code,
        404: ErrorCodes.RESOURCE_NOT_FOUND.code,
        409: ErrorCodes.RESOURCE_ALREADY_EXISTS.code,
        429: ErrorCodes.AUTH_TOO_MANY_ATTEMPTS.code,
        500: ErrorCodes.SYSTEM_ERROR.code,
        502: ErrorCodes.EXTERNAL_SERVICE_ERROR.code,
        503: ErrorCodes.SYSTEM_MAINTENANCE.code
    };
    return codeMap[statusCode] || ErrorCodes.SYSTEM_ERROR.code;
};

module.exports = responseHandler;
