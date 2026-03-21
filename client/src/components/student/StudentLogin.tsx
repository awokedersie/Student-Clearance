import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/student.css';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page student-portal">
            {/* Background Decorative Elements */}
            <div className="bg-decorative-1"></div>
            <div className="bg-decorative-2"></div>

            <div className="login-content">
                {/* Login Container */}
                <div className="login-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                    <div className="relative z-10">
                        {/* Logo/Identity Area - Now Inside Container */}
                        <div className="text-center mb-10">
                            <div className="logo-container">
                                🎓
                            </div>
                            <h1 className="login-title">
                                STUDENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PORTAL</span>
                            </h1>
                            <p className="login-subtitle">Debre Berhan University</p>
                        </div>

                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="form-label">Student Username</label>
                                <div className="input-wrapper">
                                    <span className="input-icon">👤</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="form-label">Password</label>
                                <div className="input-wrapper relative">
                                    <span className="input-icon">🔑</span>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field pr-12"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors focus:outline-none"
                                        title={showPassword ? "Hide password" : "Show password"}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="submit-button !w-auto !mt-0 px-8 min-w-[140px]"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Login</span>
                                            <span className="transition-transform group-hover:translate-x-1">⟶</span>
                                        </>
                                    )}
                                </button>

                                <Link
                                    to="/forgot-password"
                                    className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-all tracking-wide underline decoration-indigo-400/30 underline-offset-4 hover:decoration-indigo-300 hover:scale-105 transform inline-block"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </form>

                        <div className="mt-8 pt-8 border-t border-white/5 text-center">
                            <Link
                                to="/admin/login"
                                className="footer-link"
                            >
                                <span>👨‍💼</span> Staff Access?
                            </Link>
                        </div>
                    </div>
                </div>

                <p className="copyright-text">
                    © 2025 DEBRE BERHAN UNIVERSITY
                </p>
            </div>
        </div>
    );
};

export default Login;

