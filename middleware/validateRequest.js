const { ZodError } = require('zod');
const { ErrorCodes } = require('../utils/errorCodes');

/**
 * Validation Middleware Factory
 * 
 * Creates Express middleware that validates request data against Zod schemas.
 * Supports validation of body, query, and params.
 * 
 * @param {Object} schemas - Object containing Zod schemas for different parts of the request
 * @param {ZodSchema} schemas.body - Schema for request body
 * @param {ZodSchema} schemas.query - Schema for query parameters
 * @param {ZodSchema} schemas.params - Schema for URL parameters
 * @returns {Function} Express middleware function
 */
const validate = (schemas) => {
    return async (req, res, next) => {
        const errors = [];

        try {
            // Validate body if schema provided
            if (schemas.body) {
                try {
                    req.validatedBody = schemas.body.parse(req.body);
                } catch (error) {
                    if (error instanceof ZodError) {
                        errors.push(...formatZodErrors(error, 'body'));
                    } else {
                        throw error;
                    }
                }
            }

            // Validate query if schema provided
            if (schemas.query) {
                try {
                    req.validatedQuery = schemas.query.parse(req.query);
                } catch (error) {
                    if (error instanceof ZodError) {
                        errors.push(...formatZodErrors(error, 'query'));
                    } else {
                        throw error;
                    }
                }
            }

            // Validate params if schema provided
            if (schemas.params) {
                try {
                    req.validatedParams = schemas.params.parse(req.params);
                } catch (error) {
                    if (error instanceof ZodError) {
                        errors.push(...formatZodErrors(error, 'params'));
                    } else {
                        throw error;
                    }
                }
            }

            // If there are validation errors, return them
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    code: ErrorCodes.VALIDATION_FAILED.code,
                    message: 'Validation failed. Please check your input.',
                    errors,
                    timestamp: new Date().toISOString()
                });
            }

            next();
        } catch (error) {
            console.error('[Validation Middleware] Unexpected error:', error);
            return res.status(500).json({
                success: false,
                code: ErrorCodes.SYSTEM_ERROR.code,
                message: 'An unexpected error occurred during validation',
                timestamp: new Date().toISOString()
            });
        }
    };
};

/**
 * Simple body validation middleware
 * Convenience wrapper for validate({ body: schema })
 * 
 * @param {ZodSchema} schema - Zod schema for request body
 * @returns {Function} Express middleware function
 */
const validateBody = (schema) => validate({ body: schema });

/**
 * Simple query validation middleware
 * Convenience wrapper for validate({ query: schema })
 * 
 * @param {ZodSchema} schema - Zod schema for query parameters
 * @returns {Function} Express middleware function
 */
const validateQuery = (schema) => validate({ query: schema });

/**
 * Format Zod errors into a consistent structure
 * 
 * @param {ZodError} zodError - The Zod error object
 * @param {string} source - The source of the error (body, query, params)
 * @returns {Array} Array of formatted error objects
 */
const formatZodErrors = (zodError, source) => {
    return zodError.errors.map(err => ({
        field: err.path.length > 0 ? err.path.join('.') : source,
        message: err.message,
        source,
        code: getValidationErrorCode(err.code)
    }));
};

/**
 * Map Zod error codes to our error codes
 * 
 * @param {string} zodCode - Zod error code
 * @returns {number} Our error code
 */
const getValidationErrorCode = (zodCode) => {
    const codeMap = {
        'invalid_type': ErrorCodes.VALIDATION_INVALID_FORMAT.code,
        'invalid_string': ErrorCodes.VALIDATION_INVALID_FORMAT.code,
        'too_small': ErrorCodes.VALIDATION_STRING_TOO_SHORT.code,
        'too_big': ErrorCodes.VALIDATION_STRING_TOO_LONG.code,
        'invalid_email': ErrorCodes.VALIDATION_INVALID_EMAIL.code,
        'custom': ErrorCodes.VALIDATION_FAILED.code
    };
    return codeMap[zodCode] || ErrorCodes.VALIDATION_FAILED.code;
};

/**
 * Sanitize a string by removing potentially dangerous characters
 * Can be used in conjunction with Zod's transform
 * 
 * @param {string} str - The string to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .trim()
        .replace(/[<>]/g, '') // Remove angle brackets
        .replace(/javascript:/gi, '') // Remove javascript: protocol
        .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Create a sanitizing schema wrapper
 * Applies sanitization to all string fields in the schema result
 * 
 * @param {ZodSchema} schema - The Zod schema to wrap
 * @returns {ZodSchema} Wrapped schema with sanitization
 */
const withSanitization = (schema) => {
    return schema.transform((data) => {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            sanitized[key] = typeof value === 'string' ? sanitizeString(value) : value;
        }
        return sanitized;
    });
};

module.exports = {
    validate,
    validateBody,
    validateQuery,
    formatZodErrors,
    sanitizeString,
    withSanitization
};
