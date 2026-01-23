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
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-black flex items-center justify-center p-6 font-sans admin-panel">
            <div className="w-full max-w-md">
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 p-10 relative overflow-hidden group">
                    {/* Animated background decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity"></div>

                    <div className="relative text-center mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 shadow-xl mb-6 transform -rotate-6 group-hover:rotate-0 transition-transform duration-500">
                            <span className="text-4xl text-white">👨‍💼</span>
                        </div>
                        <h1 className="text-3xl font-black text-white tracking-tight italic">
                            ADMIN <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PORTAL</span>
                        </h1>
                        <p className="text-indigo-200/60 mt-2 font-medium">Debre Berhan University</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm font-medium animate-shake text-center">
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-indigo-200 uppercase tracking-widest px-1 opacity-70">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                                placeholder="Enter admin username"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-black text-indigo-200 uppercase tracking-widest px-1 opacity-70">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 tracking-widest uppercase flex items-center justify-center gap-2"
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
