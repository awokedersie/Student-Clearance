import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';

import { SkeletonClearanceRequest } from '../common/Skeleton';

const ClearanceRequest: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/student/clearance-request/data');
                if (response.data.success) {
                    setData(response.data);
                    setUser(response.data.user);
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    useEffect(() => {
        // If no targetDate, set a sentinel so we never show "Calculating..."
        if (!data) return;
        if (!data.targetDate) {
            setTimeLeft(null); // will be handled in render with proper label
            return;
        }

        let interval: NodeJS.Timeout;

        const updateTime = () => {
            const now = new Date().getTime();
            const target = new Date(data.targetDate).getTime();
            const diffTime = target - now;

            if (diffTime <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                clearInterval(interval);
                window.location.reload();
            } else {
                setTimeLeft({
                    days: Math.floor(diffTime / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((diffTime % (1000 * 60)) / 1000)
                });
            }
        };

        updateTime(); // compute immediately — no first-frame "Calculating..."
        interval = setInterval(updateTime, 1000);

        return () => clearInterval(interval);
    }, [data?.targetDate, data?.systemActive]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        try {
            const response = await axios.post('/student/clearance-request', {
                submit_all_clearance: true,
                reason: reason
            });

            setMessage({
                type: response.data.success ? 'success' : 'error',
                text: response.data.message
            });

            if (response.data.success) {
                setReason('');
                // Refresh data
                const refreshRes = await axios.get('/student/clearance-request/data');
                setData(refreshRes.data);
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Submission failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <SkeletonClearanceRequest />;

    return (
        <StudentLayout user={user}>
            <div className="request-page-container">
                {/* System Status Alert */}
                <div className={`system-status-alert ${data?.systemActive ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-red-50 border-red-100 text-red-900'}`}>
                    <div className={`status-icon-badge ${data?.systemActive ? 'bg-emerald-500' : 'bg-red-500'}`}>
                        {data?.systemActive ? '✅' : '🔒'}
                    </div>
                    <div className="flex-1">
                        <p className="font-black text-sm uppercase tracking-widest">{data?.systemActive ? 'System Active' : 'System Closed'}</p>
                        <p className="font-medium mt-0.5">{data?.systemMessage}</p>
                    </div>
                    {data?.systemActive && data?.targetDate && (
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase font-black opacity-60">Closes In</p>
                            <p className="text-lg font-black font-mono tracking-tight">
                                {timeLeft ? (
                                    <>
                                        {timeLeft.days > 0 && `${timeLeft.days}d `}
                                        {timeLeft.hours}h {timeLeft.minutes}m <span className="opacity-50">{timeLeft.seconds}s</span>
                                    </>
                                ) : (
                                    <span className="text-sm font-bold opacity-60">—</span>
                                )}
                            </p>
                        </div>
                    )}
                </div>

                {message && (
                    <div className={`p-4 rounded-xl font-bold flex items-center gap-3 animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20'}`}>
                        <span>{message.type === 'success' ? '✓' : '✕'}</span>
                        {message.text}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="request-info-mini-card">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Account Status</h3>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${data?.isStudentActive ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'} flex items-center justify-center font-bold`}>
                                {data?.isStudentActive ? 'OK' : '!!'}
                            </div>
                            <div>
                                <p className="font-black text-gray-900">Student Profile</p>
                                <p className="text-sm text-gray-500 font-medium">{data?.isStudentActive ? 'Active & Verified' : 'Inactive Account'}</p>
                            </div>
                        </div>
                    </div>
                    <div className="request-info-mini-card">
                        <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4">Clearance Check</h3>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl ${!data?.hasCurrentClearance ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center font-bold`}>
                                {!data?.hasCurrentClearance ? 'NEW' : 'FIN'}
                            </div>
                            <div>
                                <p className="font-black text-gray-900">Academic Year {data?.academicYear}</p>
                                <p className="text-sm text-gray-500 font-medium">{!data?.hasCurrentClearance ? 'No active request found' : 'Clearance already obtained'}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {data?.canSubmitRequests ? (
                    <div className="request-form-card">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Submit Clearance Request</h3>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <div className="flex justify-between mb-2 px-1">
                                    <label className="block text-sm font-black text-gray-700 uppercase tracking-widest">Reason for Clearance</label>
                                    <span className={`text-xs font-bold ${reason.length < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        {reason.length}/10 min chars
                                    </span>
                                </div>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain why you are requesting clearance (e.g., Graduation, Transfer, Withdrawal)"
                                    className="request-textarea"
                                    rows={4}
                                    minLength={10}
                                    required
                                ></textarea>
                            </div>
                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <p className="text-indigo-900 font-bold mb-2 flex items-center gap-2">
                                    <span>📨</span> Bulk Submission
                                </p>
                                <p className="text-indigo-800/70 text-sm">This will automatically send clearance requests to all required departments (Library, Cafeteria, Dormitory, etc.) for the current academic year.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="submit-button-large"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>Submit All Requests ⟶</>
                                )}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="unavailable-card">
                        <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-3xl mx-auto mb-6 grayscale opacity-50">
                            🔒
                        </div>
                        <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight">Submission Unavailable</h3>
                        <p className="text-gray-500 font-medium max-w-sm mx-auto mt-2 italic">
                            {data?.canSubmitMessage || "You cannot submit a new request at this time. Please contact the administration."}
                        </p>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default ClearanceRequest;
