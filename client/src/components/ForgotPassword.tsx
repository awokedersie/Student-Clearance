import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword: React.FC = () => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/forgot-password', { name, email });
            if (response.data.success) {
                setStep(2);
                setMessage({ type: 'success', text: 'Verification code sent to your email.' });
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to initiate recovery' });
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/verify-code', { verification_code: otp });
            if (response.data.success) {
                setStep(3);
                setMessage({ type: 'success', text: 'Identity verified. You can now set a new password.' });
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Verification failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match' });
            return;
        }
        setLoading(true);
        setMessage(null);
        try {
            const response = await axios.post('/reset-password', {
                new_password: newPassword,
                confirm_password: confirmPassword
            });
            if (response.data.success) {
                setMessage({ type: 'success', text: 'Password reset successful!' });
                setStep(4);
            } else {
                setMessage({ type: 'error', text: response.data.message });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Reset failed' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Animated Background Gradients */}
            <div className="absolute top-0 -left-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/10 backdrop-blur-2xl rounded-[40px] shadow-2xl border border-white/20 p-8 sm:p-12 overflow-hidden">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl shadow-indigo-500/30">
                            🛡️
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase">Recovery Hub</h2>
                        <p className="text-indigo-200/60 font-medium text-sm mt-2">Institutional Credential Restoration</p>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-2xl mb-8 font-bold text-xs text-center animate-in zoom-in-95 backdrop-blur-md ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                            {message.text}
                        </div>
                    )}

                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 px-1">First Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your first name"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 px-1">Institutional Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="institutional@dbu.edu.et"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-5 rounded-2xl font-black shadow-xl shadow-indigo-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-[3px] text-xs"
                            >
                                {loading ? 'Initializing Stream...' : 'Send Verification Code ⟶'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
                            <div>
                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 px-1">6-Digit Access Token</label>
                                <input
                                    type="text"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000000"
                                    className="w-48 bg-white/5 border border-white/10 rounded-2xl px-2 py-6 text-white font-black text-4xl text-center tracking-[8px] focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-white/10 mx-auto"
                                    required
                                />
                                <p className="text-[10px] text-white/30 font-bold uppercase mt-4 tracking-widest px-4">Check your inbox for the authorization code.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black shadow-xl transition-all uppercase tracking-[3px] text-xs border border-white/10"
                            >
                                {loading ? 'Validating Token...' : 'Verify Identity ⟶'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 px-1">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 px-1">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500/50 transition-all placeholder:text-white/20"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-xl transition-all uppercase tracking-[3px] text-xs shadow-indigo-600/30"
                            >
                                {loading ? 'Updating Credentials...' : 'Re-establish Access ⟶'}
                            </button>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-8 py-4">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-emerald-500/20 text-emerald-500">
                                ✓
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Restored</h3>
                                <p className="text-indigo-200/60 text-sm mt-2">Your password has been successfully updated in the main directory.</p>
                            </div>
                            <Link
                                to="/login"
                                className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black shadow-xl transition-all uppercase tracking-[3px] text-xs"
                            >
                                Return to Login
                            </Link>
                        </div>
                    )}

                    {step < 4 && (
                        <div className="mt-10 text-center">
                            <Link to="/login" className="text-[10px] font-black text-white/40 hover:text-white uppercase tracking-[4px] transition-colors flex items-center justify-center gap-2">
                                <span className="text-lg">⇠</span> Recall credentials? Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
