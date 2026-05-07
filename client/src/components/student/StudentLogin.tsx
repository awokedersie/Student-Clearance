import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/student.css';

// Inline validation rules
const validateUsername = (value: string): string | null => {
    if (!value.trim()) return 'Username is required';
    if (value.length < 3) return 'Username must be at least 3 characters';
    return null;
};

const validatePassword = (value: string): string | null => {
    if (!value) return 'Password is required';
    if (value.length < 6) return 'Password must be at least 6 characters';
    return null;
};

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Inline validation states
    const [touched, setTouched] = useState<{ username: boolean; password: boolean }>({
        username: false,
        password: false
    });
    const [fieldErrors, setFieldErrors] = useState<{ username: string | null; password: string | null }>({
        username: null,
        password: null
    });

    // Auto-dismiss error after 5 seconds
    useEffect(() => {
        if (!error) return;
        const timer = setTimeout(() => setError(''), 5000);
        return () => clearTimeout(timer);
    }, [error]);
    
    // Validate fields on change
    useEffect(() => {
        if (touched.username) {
            setFieldErrors(prev => ({ ...prev, username: validateUsername(username) }));
        }
    }, [username, touched.username]);

    useEffect(() => {
        if (touched.password) {
            setFieldErrors(prev => ({ ...prev, password: validatePassword(password) }));
        }
    }, [password, touched.password]);

    const navigate = useNavigate();

    const handleBlur = (field: 'username' | 'password') => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all fields before submit
        const usernameError = validateUsername(username);
        const passwordError = validatePassword(password);
        
        setTouched({ username: true, password: true });
        setFieldErrors({ username: usernameError, password: passwordError });
        
        if (usernameError || passwordError) {
            return;
        }
        
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/login', { username, password });
            if (response.data.success) {
                if (response.data.user.role === 'student') {
                    navigate('/student/dashboard');
                } else {
                    navigate('/admin/dashboard');
                }
            } else {
                setError(response.data.message || 'Login failed');
            }
        } catch (err: any) {
            // Handle structured error responses
            const errorData = err.response?.data;
            if (errorData?.code) {
                // Structured error with code
                setError(errorData.message || 'Login failed');
            } else if (errorData?.errors) {
                // Validation errors
                const firstError = errorData.errors[0];
                setError(firstError?.message || 'Validation failed');
            } else {
                setError(errorData?.message || 'Something went wrong. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-content">
                <div className="login-card">

                    {/* Logo and Typography */}
                    <div className="login-title-container">
                        <div className="flex justify-center mb-4">
                            <div className="logo-container">
                                <img src="/logo.png" className="w-full h-full object-contain p-2" alt="DBU Logo" />
                            </div>
                        </div>
                        <h1 className="login-title">
                            STUDENT <span className="portal-accent">PORTAL</span>
                        </h1>
                        <p className="login-subtitle">Debre Berhan University</p>
                    </div>

                    {error && (
                        <div className="error-message animate-shake">
                            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Form Elements */}
                    <form onSubmit={handleSubmit} className="w-full mt-8">
                        <div className="mb-6 relative">
                            <label className="form-label">STUDENT USERNAME</label>
                            <div className={`input-wrapper group ${touched.username && fieldErrors.username ? 'ring-2 ring-red-500/50' : ''}`}>
                                <span className="input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 opacity-70">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    onBlur={() => handleBlur('username')}
                                    placeholder="Enter your username"
                                    className="input-field"
                                    required
                                    aria-invalid={touched.username && !!fieldErrors.username}
                                    aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                                />
                                {touched.username && !fieldErrors.username && username && (
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </span>
                                )}
                            </div>
                            {touched.username && fieldErrors.username && (
                                <p id="username-error" className="mt-2 text-sm text-red-400 flex items-center gap-1.5 animate-slideDown">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {fieldErrors.username}
                                </p>
                            )}
                        </div>

                        <div className="mb-8 relative">
                            <label className="form-label">PASSWORD</label>
                            <div className={`input-wrapper group ${touched.password && fieldErrors.password ? 'ring-2 ring-red-500/50' : ''}`}>
                                <span className="input-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 opacity-70 scale-x-[-1] -rotate-45">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-.1.43-.563A6 6 0 1 1 21.75 8.25Z" />
                                    </svg>
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onBlur={() => handleBlur('password')}
                                    placeholder="Enter your password"
                                    className="input-field pr-12"
                                    required
                                    aria-invalid={touched.password && !!fieldErrors.password}
                                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors focus:outline-none"
                                    title={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                            {touched.password && fieldErrors.password && (
                                <p id="password-error" className="mt-2 text-sm text-red-400 flex items-center gap-1.5 animate-slideDown">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <div className="login-actions">
                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-button"
                            >
                                {loading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        LOGIN <span>&rarr;</span>
                                    </>
                                )}
                            </button>

                            <Link to="/forgot-password" className="forgot-password-link">
                                forgot password
                            </Link>
                        </div>
                    </form>


                </div>
            </div>
        </div>
    );
};

export default Login;
