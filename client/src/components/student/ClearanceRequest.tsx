import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';

const ClearanceRequest: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<any>(null);
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

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
                    {data?.systemActive && (
                        <div className="text-right hidden sm:block">
                            <p className="text-[10px] uppercase font-black opacity-60">Time Remaining</p>
                            <p className="text-lg font-black">{data?.daysRemaining}d {data?.hoursRemaining}h</p>
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
                                <label className="block text-sm font-black text-gray-700 uppercase tracking-widest mb-2 px-1">Reason for Clearance</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Explain why you are requesting clearance (e.g., Graduation, Transfer, Completion of Study...)"
                                    className="request-textarea"
                                    rows={4}
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
