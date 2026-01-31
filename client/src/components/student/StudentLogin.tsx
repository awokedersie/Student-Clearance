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
        <div className="login-page student-portal">
            {/* Background Decorative Elements */}
            <div className="bg-decorative-1"></div>
            <div className="bg-decorative-2"></div>

            <div className="login-content">
                {/* Logo/Identity Area */}
                <div className="text-center mb-10">
                    <div className="logo-container">
                        🎓
                    </div>
                    <h1 className="login-title">
                        STUDENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PORTAL</span>
                    </h1>
                    <p className="login-subtitle">Debre Berhan University</p>
                </div>

                {/* Login Container */}
                <div className="login-card">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                    <div className="relative z-10">
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
                                <div className="flex justify-between items-center px-1">
                                    <label className="form-label">Password</label>
                                    <Link to="/forgot-password" title="Recover Access" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Lost?</Link>
                                </div>
                                <div className="input-wrapper">
                                    <span className="input-icon">🔑</span>
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-button group"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Authenticating...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Enter Portal</span>
                                        <span className="transition-transform group-hover:translate-x-1">⟶</span>
                                    </>
                                )}
                            </button>
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
                    © 2024 DEBRE BERHAN UNIVERSITY
                </p>
            </div>
        </div>
    );
};

export default Login;
