const { z } = require('zod');

/**
 * Zod Validation Schemas for the Student Clearance System
 * 
 * These schemas provide:
 * - Type validation
 * - Input sanitization
 * - Detailed error messages
 * - Consistent validation across the application
 */

// ============================================
// Common Validation Patterns
// ============================================

const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
const studentIdRegex = /^[A-Za-z0-9_-]{3,20}$/;

// Password validation with detailed messages
const passwordSchema = z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(16, 'Password must not exceed 16 characters')
    .refine(val => /[A-Z]/.test(val), 'Password must contain at least one uppercase letter')
    .refine(val => /[a-z]/.test(val), 'Password must contain at least one lowercase letter')
    .refine(val => /[0-9]/.test(val), 'Password must contain at least one number')
    .refine(val => /[!@#$%^&*()\-_=+{};:,<.>]/.test(val), 'Password must contain at least one special character')
    .refine(val => !/\s/.test(val), 'Password must not contain spaces');

// ============================================
// Authentication Schemas
// ============================================

const loginSchema = z.object({
    username: z.string()
        .min(1, 'Username is required')
        .max(50, 'Username must not exceed 50 characters')
        .trim(),
    password: z.string()
        .min(1, 'Password is required'),
    role: z.enum(['student', 'admin', 'department']).optional()
});

const passwordChangeSchema = z.object({
    currentPassword: z.string()
        .min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string()
        .min(1, 'Please confirm your new password')
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword']
});

const forgotPasswordSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase()
});

const resetPasswordSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    resetCode: z.string()
        .min(1, 'Reset code is required'),
    newPassword: passwordSchema
});

// ============================================
// Student Schemas
// ============================================

const createStudentSchema = z.object({
    student_id: z.string()
        .min(3, 'Student ID must be at least 3 characters')
        .max(20, 'Student ID must not exceed 20 characters')
        .regex(studentIdRegex, 'Student ID can only contain letters, numbers, underscores, and hyphens')
        .trim(),
    name: z.string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must not exceed 50 characters')
        .trim(),
    last_name: z.string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must not exceed 50 characters')
        .trim(),
    email: z.string()
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    phone: z.string()
        .regex(phoneRegex, 'Please enter a valid phone number')
        .trim(),
    department: z.string()
        .min(2, 'Department must be at least 2 characters')
        .trim(),
    year: z.coerce.number()
        .int('Year must be a whole number')
        .min(1, 'Year must be at least 1')
        .max(7, 'Year must not exceed 7'),
    semester: z.coerce.number()
        .int('Semester must be a whole number')
        .min(1, 'Semester must be 1 or 2')
        .max(2, 'Semester must be 1 or 2'),
    password: passwordSchema.optional(),
    section: z.string().max(10).optional(),
    library_fine: z.coerce.number().min(0).optional().default(0),
    cafe_unpaid_balance: z.coerce.number().min(0).optional().default(0),
    sport_fee_status: z.enum(['PAID', 'UNPAID', 'N/A']).optional().default('N/A'),
    has_uniform: z.boolean().optional().default(false),
    has_id_card: z.boolean().optional().default(false),
    has_proctor_approval: z.boolean().optional().default(false)
});

const updateStudentSchema = createStudentSchema.partial().omit({ password: true });

const updateStudentProfileSchema = z.object({
    email: z.string()
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase()
        .optional(),
    phone: z.string()
        .regex(phoneRegex, 'Please enter a valid phone number')
        .trim()
        .optional()
});

// ============================================
// Clearance Request Schemas
// ============================================

const clearanceRequestSchema = z.object({
    reason: z.string()
        .min(10, 'Please provide a reason with at least 10 characters')
        .max(500, 'Reason must not exceed 500 characters')
        .trim()
});

const clearanceActionSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED'], {
        errorMap: () => ({ message: 'Status must be either APPROVED or REJECTED' })
    }),
    notes: z.string()
        .max(500, 'Notes must not exceed 500 characters')
        .optional()
        .transform(val => val?.trim() || null)
});

// ============================================
// Admin Schemas
// ============================================

const createAdminSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must not exceed 50 characters')
        .trim(),
    password: passwordSchema,
    full_name: z.string()
        .min(2, 'Full name must be at least 2 characters')
        .max(100, 'Full name must not exceed 100 characters')
        .trim(),
    email: z.string()
        .email('Please enter a valid email address')
        .trim()
        .toLowerCase(),
    role: z.enum(['system_admin', 'department_admin'], {
        errorMap: () => ({ message: 'Role must be either system_admin or department_admin' })
    }),
    department: z.string()
        .min(2, 'Department is required for department admins')
        .optional()
        .nullable()
});

const updateAdminSchema = createAdminSchema.partial().omit({ password: true });

// ============================================
// System Settings Schema
// ============================================

const systemSettingsSchema = z.object({
    system_open: z.boolean().optional(),
    academic_year: z.string()
        .regex(/^\d{4}\/\d{4}$/, 'Academic year must be in format YYYY/YYYY')
        .optional(),
    semester: z.coerce.number()
        .int()
        .min(1)
        .max(2)
        .optional(),
    announcement: z.string()
        .max(1000, 'Announcement must not exceed 1000 characters')
        .optional()
        .nullable(),
    clearance_deadline: z.string()
        .datetime({ message: 'Invalid date format' })
        .optional()
        .nullable()
});

// ============================================
// Search/Filter Schemas
// ============================================

const paginationSchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc')
});

const searchStudentsSchema = paginationSchema.extend({
    q: z.string().max(100).optional(),
    department: z.string().optional(),
    year: z.coerce.number().int().min(1).max(7).optional(),
    status: z.enum(['active', 'inactive', 'cleared', 'pending']).optional()
});

// ============================================
// Export All Schemas
// ============================================

module.exports = {
    // Auth
    loginSchema,
    passwordChangeSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    passwordSchema,
    
    // Student
    createStudentSchema,
    updateStudentSchema,
    updateStudentProfileSchema,
    
    // Clearance
    clearanceRequestSchema,
    clearanceActionSchema,
    
    // Admin
    createAdminSchema,
    updateAdminSchema,
    
    // System
    systemSettingsSchema,
    
    // Search/Pagination
    paginationSchema,
    searchStudentsSchema
};
