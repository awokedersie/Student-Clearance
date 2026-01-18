import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-blue-900 to-black flex items-center justify-center p-6 font-sans relative overflow-hidden selection:bg-indigo-500/30">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="max-w-md w-full relative z-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Logo/Identity Area */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-[32px] shadow-2xl shadow-indigo-500/20 flex items-center justify-center text-5xl mx-auto mb-6 transform hover:scale-110 hover:rotate-3 transition-all duration-500 border-4 border-white/10 backdrop-blur-xl">
                        🎓
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic leading-none">
                        STUDENT <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">PORTAL</span>
                    </h1>
                    <p className="text-indigo-200/60 mt-2 font-medium">Debre Berhan University</p>
                </div>

                {/* Login Container */}
                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>

                    <div className="relative z-10">
                        {error && (
                            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm font-medium animate-shake text-center backdrop-blur-md">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-xs font-black text-indigo-200 uppercase tracking-widest px-1 opacity-70">Student Username</label>
                                <div className="relative group/input">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within/input:opacity-100 transition-opacity">👤</span>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        placeholder="Enter your username"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-indigo-200 uppercase tracking-widest opacity-70 px-1">Password</label>
                                <div className="relative group/input">
                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl opacity-40 group-focus-within/input:opacity-100 transition-opacity">🔑</span>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-5 py-4 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                                <div className="text-right px-1">
                                    <Link to="/forgot-password" className="text-xs font-bold text-indigo-400 hover:text-white transition-colors">Forgot Password?</Link>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transform active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 tracking-widest uppercase flex items-center justify-center gap-2"
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
                                className="text-indigo-400 hover:text-white text-sm font-bold transition-all flex items-center justify-center gap-2 mx-auto decoration-2 underline-offset-4 hover:underline"
                            >
                                <span>👨‍💼</span> Staff Access?
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="text-center mt-12">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[6px] italic">
                        © 2024 DEBRE BERHAN UNIVERSITY
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
