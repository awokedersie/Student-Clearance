import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import '../../styles/student.css';

const Login: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
        <div className="login-page">
            <div className="login-content">
                
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
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

                {/* Form Elements */}
                <form onSubmit={handleSubmit} className="w-full mt-8">
                    <div className="mb-6 relative">
                        <label className="form-label">STUDENT USERNAME</label>
                        <div className="input-wrapper group">
                            <span className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 opacity-70">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </span>
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

                    <div className="mb-8 relative">
                        <label className="form-label">PASSWORD</label>
                        <div className="input-wrapper group">
                            <span className="input-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 opacity-70 scale-x-[-1] -rotate-45">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-.1.43-.563A6 6 0 1 1 21.75 8.25Z" />
                                </svg>
                            </span>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="input-field"
                                required
                            />
                        </div>
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

                <div className="mt-10 pt-8 border-t border-white/10 text-center">
                    <button
                        onClick={() => navigate('/admin/login')}
                        className="text-[#8b9de3] hover:text-white text-sm font-[700] transition-all flex items-center justify-center gap-2 mx-auto decoration-2 underline-offset-4 hover:underline"
                    >
                        <span>🛡️</span> Institutional Staff Access
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;


