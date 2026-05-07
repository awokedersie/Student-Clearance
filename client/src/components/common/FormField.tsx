import React, { useState, useEffect, useCallback, useId } from 'react';

/**
 * FormField Component
 * 
 * Enhanced form input with:
 * - Real-time inline validation
 * - Error/success visual feedback
 * - Password strength meter
 * - Character counter
 * - Shake animation on error
 */

interface ValidationRule {
    /** Whether the field is required */
    required?: boolean;
    /** Minimum length */
    minLength?: number;
    /** Maximum length */
    maxLength?: number;
    /** Regex pattern to match */
    pattern?: RegExp;
    /** Custom validation function */
    custom?: (value: string) => string | null;
}

interface FormFieldProps {
    /** Field label */
    label: string;
    /** Input type */
    type?: 'text' | 'email' | 'password' | 'textarea' | 'tel' | 'number';
    /** Field name for form submission */
    name: string;
    /** Current value */
    value: string;
    /** Change handler */
    onChange: (value: string) => void;
    /** Blur handler */
    onBlur?: () => void;
    /** Validation rules */
    validation?: ValidationRule;
    /** Show password strength meter (for password fields) */
    showStrength?: boolean;
    /** Show character counter */
    showCounter?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Help text shown below the field */
    helpText?: string;
    /** Whether the field is disabled */
    disabled?: boolean;
    /** Custom error message (overrides validation) */
    error?: string;
    /** Additional CSS classes */
    className?: string;
    /** Number of rows for textarea */
    rows?: number;
    /** Whether to validate on change (default: on blur) */
    validateOnChange?: boolean;
    /** Auto focus this field */
    autoFocus?: boolean;
}

/**
 * Calculate password strength (0-4)
 */
const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
    let score = 0;
    
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) score++;

    const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-400', 'bg-green-600'];

    // Cap at 4
    const finalScore = Math.min(score, 4);
    
    return {
        score: finalScore,
        label: labels[finalScore],
        color: colors[finalScore]
    };
};

/**
 * Password Strength Meter Component
 */
const PasswordStrengthMeter: React.FC<{ password: string }> = ({ password }) => {
    const strength = calculatePasswordStrength(password);

    if (!password) return null;

    return (
        <div className="mt-2 space-y-1">
            <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                    <div
                        key={level}
                        className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                            level <= strength.score ? strength.color : 'bg-gray-200'
                        }`}
                    />
                ))}
            </div>
            <p className={`text-xs ${
                strength.score <= 1 ? 'text-red-500' : 
                strength.score <= 2 ? 'text-yellow-600' : 
                'text-green-600'
            }`}>
                {strength.label}
            </p>
        </div>
    );
};

/**
 * Validate a field value against rules
 */
const validateField = (value: string, rules?: ValidationRule): string | null => {
    if (!rules) return null;

    const trimmedValue = value.trim();

    if (rules.required && !trimmedValue) {
        return 'This field is required';
    }

    if (rules.minLength && trimmedValue.length < rules.minLength) {
        return `Must be at least ${rules.minLength} characters`;
    }

    if (rules.maxLength && trimmedValue.length > rules.maxLength) {
        return `Must not exceed ${rules.maxLength} characters`;
    }

    if (rules.pattern && !rules.pattern.test(trimmedValue)) {
        return 'Invalid format';
    }

    if (rules.custom) {
        const customError = rules.custom(trimmedValue);
        if (customError) return customError;
    }

    return null;
};

/**
 * FormField Component
 */
export const FormField: React.FC<FormFieldProps> = ({
    label,
    type = 'text',
    name,
    value,
    onChange,
    onBlur,
    validation,
    showStrength = false,
    showCounter = false,
    placeholder,
    helpText,
    disabled = false,
    error: externalError,
    className = '',
    rows = 4,
    validateOnChange = false,
    autoFocus = false,
}) => {
    const id = useId();
    const [touched, setTouched] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [shake, setShake] = useState(false);

    // Determine the actual error to display
    const error = externalError || (touched ? internalError : null);

    // Validate the field
    const validate = useCallback(() => {
        const validationError = validateField(value, validation);
        setInternalError(validationError);
        return validationError === null;
    }, [value, validation]);

    // Validate on blur or change based on settings
    useEffect(() => {
        if (touched && validateOnChange) {
            validate();
        }
    }, [value, touched, validateOnChange, validate]);

    // Trigger shake animation when error appears
    useEffect(() => {
        if (error) {
            setShake(true);
            const timer = setTimeout(() => setShake(false), 500);
            return () => clearTimeout(timer);
        }
    }, [error]);

    const handleBlur = () => {
        setTouched(true);
        validate();
        onBlur?.();
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value);
        if (validateOnChange && touched) {
            validate();
        }
    };

    // Base input classes
    const inputBaseClasses = `
        w-full px-4 py-3 rounded-2xl border-2 transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-1
        disabled:bg-gray-100 disabled:cursor-not-allowed
        ${error 
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
            : touched && !error && value
            ? 'border-green-300 focus:border-green-500 focus:ring-green-200'
            : 'border-gray-200 focus:border-indigo-500 focus:ring-indigo-200'
        }
        ${shake ? 'animate-shake' : ''}
    `.trim();

    const renderInput = () => {
        if (type === 'textarea') {
            return (
                <textarea
                    id={id}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={rows}
                    autoFocus={autoFocus}
                    className={`${inputBaseClasses} resize-none`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
                />
            );
        }

        return (
            <div className="relative">
                <input
                    id={id}
                    type={type === 'password' && showPassword ? 'text' : type}
                    name={name}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus={autoFocus}
                    className={`${inputBaseClasses} ${type === 'password' ? 'pr-12' : ''}`}
                    aria-invalid={!!error}
                    aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
                />
                
                {/* Password toggle button */}
                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </button>
                )}

                {/* Success/Error icons */}
                {touched && !error && value && type !== 'password' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </span>
                )}
                
                {error && type !== 'password' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className={`space-y-1.5 ${className}`}>
            {/* Label */}
            <div className="flex justify-between items-center">
                <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                    {label}
                    {validation?.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {/* Character counter */}
                {showCounter && validation?.maxLength && (
                    <span className={`text-xs ${
                        value.length > validation.maxLength 
                            ? 'text-red-500' 
                            : value.length > validation.maxLength * 0.8 
                            ? 'text-yellow-600' 
                            : 'text-gray-400'
                    }`}>
                        {value.length}/{validation.maxLength}
                    </span>
                )}
            </div>

            {/* Input */}
            {renderInput()}

            {/* Password strength meter */}
            {type === 'password' && showStrength && value && (
                <PasswordStrengthMeter password={value} />
            )}

            {/* Error message */}
            {error && (
                <p id={`${id}-error`} className="text-sm text-red-500 flex items-center gap-1 animate-fade-in">
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </p>
            )}

            {/* Help text */}
            {helpText && !error && (
                <p id={`${id}-help`} className="text-sm text-gray-500">
                    {helpText}
                </p>
            )}
        </div>
    );
};

/**
 * Common validation patterns
 */
export const ValidationPatterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^[0-9+\-\s()]{10,15}$/,
    studentId: /^[A-Za-z0-9_-]{3,20}$/,
    alphanumeric: /^[A-Za-z0-9]+$/,
    alphabetic: /^[A-Za-z\s]+$/,
};

/**
 * Common validation rules
 */
export const ValidationRules = {
    required: { required: true },
    email: {
        required: true,
        pattern: ValidationPatterns.email,
        custom: (value: string) => {
            if (!ValidationPatterns.email.test(value)) {
                return 'Please enter a valid email address';
            }
            return null;
        }
    },
    phone: {
        required: true,
        pattern: ValidationPatterns.phone,
        custom: (value: string) => {
            if (!ValidationPatterns.phone.test(value)) {
                return 'Please enter a valid phone number';
            }
            return null;
        }
    },
    password: {
        required: true,
        minLength: 8,
        maxLength: 16,
        custom: (value: string) => {
            if (!/[A-Z]/.test(value)) return 'Must contain an uppercase letter';
            if (!/[a-z]/.test(value)) return 'Must contain a lowercase letter';
            if (!/[0-9]/.test(value)) return 'Must contain a number';
            if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(value)) return 'Must contain a special character';
            if (/\s/.test(value)) return 'Must not contain spaces';
            return null;
        }
    },
    name: {
        required: true,
        minLength: 2,
        maxLength: 50,
    },
    studentId: {
        required: true,
        minLength: 3,
        maxLength: 20,
        pattern: ValidationPatterns.studentId,
    }
};

export default FormField;
