import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../student/StudentLayout';
import AdminLayout from '../admin/AdminLayout';

const ChangePassword: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<any>(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const fetchUser = async () => {
            const isAdminPath = window.location.pathname.startsWith('/admin');
            try {
                // Fetch the common user info route
                const response = await axios.get('/change-password-data');
                if (response.data.success) {
                    setUser(response.data.user);
                } else {
                    navigate(isAdminPath ? '/admin/login' : '/login');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                navigate(isAdminPath ? '/admin/login' : '/login');
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate, location.pathname]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            return;
        }

        setSubmitting(true);
        setMessage(null);

        try {
            const response = await axios.post('/change-password', {
                currentPassword: oldPassword,
                newPassword: newPassword,
                confirmPassword: confirmPassword
            });

            setMessage({
                type: response.data.success ? 'success' : 'error',
                text: response.data.message
            });

            if (response.data.success) {
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Password update failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-indigo-600 uppercase tracking-tighter">DBU</div>
                </div>
            </div>
        );
    }

    const isAdmin = user?.role && user.role !== 'student';
    const Layout = isAdmin ? AdminLayout : StudentLayout;

    return (
        <Layout user={user}>
            <div className="max-w-xl mx-auto py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="settings-config-card relative overflow-hidden">
                    {/* Decorative element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                    <div className="relative z-10 text-center mb-12">
                        <div className="w-20 h-20 bg-gradient-to-tr from-indigo-500 to-indigo-700 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-6 shadow-xl shadow-indigo-200 ring-8 ring-indigo-50">
                            <span className="animate-pulse">🔐</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Security Protocol</h2>
                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-2 px-4">Initialize password update to maintain account integrity</p>
                    </div>

                    {message && (
                        <div className={`p-5 rounded-2xl mb-10 font-black text-[11px] uppercase tracking-wider flex items-center gap-4 animate-in zoom-in-95 duration-300 ${message.type === 'success'
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                            : 'bg-rose-50 text-rose-600 border border-rose-100'
                            }`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                                }`}>
                                {message.type === 'success' ? '✓' : '✕'}
                            </div>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Current Authorization</label>
                            <input
                                type="password"
                                placeholder="Enter current password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="settings-input-field"
                                required
                            />
                        </div>

                        <div className="grid gap-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">New Security Hash</label>
                                <input
                                    type="password"
                                    placeholder="Minimum 8 characters"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="settings-input-field"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Verify New Hash</label>
                                <input
                                    type="password"
                                    placeholder="Repeat new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="settings-input-field"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full bg-gray-900 hover:bg-black text-white px-8 py-6 rounded-[28px] font-black transition-all shadow-2xl shadow-gray-200 active:scale-[0.98] uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-4 disabled:opacity-50 mt-4 group"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Syncing Protocol...
                                </>
                            ) : (
                                <>
                                    Update Password
                                    <span className="text-lg group-hover:translate-x-1 transition-transform">🔒</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-white/40 backdrop-blur-sm rounded-3xl p-8 border border-white/60 flex items-start gap-6 shadow-sm">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-xl shrink-0">💡</div>
                    <div>
                        <p className="text-gray-900 text-[10px] font-black uppercase tracking-widest mb-1 italic">Security Tip</p>
                        <p className="text-gray-600 text-xs font-medium leading-relaxed opacity-80">
                            A strong password prevents unauthorized access to your clearance records. Use mixed character types and avoid predictable patterns.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ChangePassword;
