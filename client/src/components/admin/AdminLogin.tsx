import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/admin.css';

const AdminLogin: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axios.post('/admin/login', { username, password });
            if (response.data.success) {
                // Redirect based on backend response
                navigate(response.data.redirect);
            } else {
                setError(response.data.message || 'Invalid credentials');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page admin-panel">
            <div className="admin-login-wrapper">
                <div className="admin-login-card">
                    {/* Animated background decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>

                    <div className="admin-login-header">
                        <div className="admin-logo-badge">
                            <span className="text-4xl text-white">👨‍💼</span>
                        </div>
                        <h1 className="admin-login-title">
                            ADMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PORTAL</span>
                        </h1>
                        <p className="admin-login-subtitle">Debre Berhan University</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm font-medium animate-shake text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="admin-input-group">
                            <label className="admin-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="admin-input"
                                placeholder="Enter admin username"
                                required
                            />
                        </div>

                        <div className="admin-input-group">
                            <label className="admin-label">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="admin-input"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="admin-submit-btn"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Verifying...</span>
                                </>
                            ) : (
                                <span>Login to Dashboard</span>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-white/5 text-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="text-indigo-400 hover:text-white text-sm font-bold transition-all flex items-center justify-center gap-2 mx-auto decoration-2 underline-offset-4 hover:underline"
                        >
                            <span>👩‍🎓</span> Student Access?
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
