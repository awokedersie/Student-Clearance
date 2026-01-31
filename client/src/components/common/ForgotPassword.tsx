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
        <div className="login-page">
            {/* Animated Background Gradients */}
            <div className="bg-decorative-1"></div>
            <div className="bg-decorative-2"></div>

            <div className="login-content">
                <div className="login-card">
                    <div className="text-center mb-10">
                        <div className="logo-container">
                            🛡️
                        </div>
                        <h2 className="login-title">Recovery Hub</h2>
                        <p className="login-subtitle">Institutional Credential Restoration</p>
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
                                    <label className="form-label">First Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Enter your first name"
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Institutional Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="institutional@dbu.edu.et"
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-button"
                            >
                                {loading ? 'Initializing Stream...' : 'Send Verification Code ⟶'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6 text-center">
                            <div>
                                <label className="form-label mb-4">6-Digit Access Token</label>
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
                                className="submit-button"
                            >
                                {loading ? 'Validating Token...' : 'Verify Identity ⟶'}
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="form-label">New Password</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Confirm New Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="input-field"
                                        required
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="submit-button"
                            >
                                {loading ? 'Updating Credentials...' : 'Re-establish Access ⟶'}
                            </button>
                        </form>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-8 py-4">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-4xl mx-auto shadow-2xl shadow-emerald-500/20 text-emerald-500 border border-emerald-500/30">
                                ✓
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight">Access Restored</h3>
                                <p className="text-indigo-200/60 text-sm mt-2">Your password has been successfully updated in the main directory.</p>
                            </div>
                            <Link
                                to="/login"
                                className="submit-button"
                            >
                                Return to Login
                            </Link>
                        </div>
                    )}

                    {step < 4 && (
                        <div className="mt-10 text-center">
                            <Link to="/login" className="footer-link">
                                <span>⇠</span> Recall credentials? Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
