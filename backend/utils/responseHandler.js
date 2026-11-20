/**
 * Unified Response Handler
 * Standardizes API responses across all controllers.
 */

const responseHandler = {
    /**
     * Send a success response
     */
    success: (res, data = {}, message = 'Operation successful', statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            message,
            ...data
        });
    },

    /**
     * Send an error response
     */
    error: (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
        const response = {
            success: false,
            message
        };

        if (error && process.env.NODE_ENV === 'development') {
            response.error = error.message || error;
            response.stack = error.stack;
        }

        console.error(`💥 [${statusCode}] ${message}`, error || '');
        return res.status(statusCode).json(response);
    },

    /**
     * Common 401/403/404 helpers
     */
    unauthorized: (res, message = 'Unauthorized access') => responseHandler.error(res, message, 401),
    forbidden: (res, message = 'Forbidden access') => responseHandler.error(res, message, 403),
    notFound: (res, message = 'Resource not found') => responseHandler.error(res, message, 404),
    badRequest: (res, message = 'Invalid request data') => responseHandler.error(res, message, 400)
};

module.exports = responseHandler;
