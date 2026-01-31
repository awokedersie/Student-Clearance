import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from './AdminLayout';

const ClearanceSettings: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/clearance-settings/data');
            if (response.data.success) {
                setData(response.data);
            } else {
                navigate('/admin/login');
            }
        } catch (error: any) {
            console.error('Error fetching settings:', error);
            if (error.response?.status === 401) {
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAction = async (action: string) => {
        if (!confirm(`Are you sure you want to ${action.replace('_', ' ')}?`)) return;
        try {
            const response = await axios.post(`/admin/clearance-settings/action/${action}`);
            alert(response.data.message || 'Action completed successfully');
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Action failed');
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const payload = Object.fromEntries(formData.entries());

        try {
            await axios.post('/admin/clearance-settings', payload);
            fetchData();
        } catch (error: any) {
            alert(error.response?.data?.message || 'Failed to update settings');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading && !data) return <div className="p-8 text-center text-gray-500 font-medium italic animate-pulse">🔒 Initialising Clearance Engine...</div>;
    if (!data) return (
        <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center p-12 bg-red-50 rounded-[40px] border border-red-100 max-w-md">
                <div className="text-5xl mb-6">⚠️</div>
                <h3 className="text-xl font-black text-red-900 mb-2">Configuration Error</h3>
                <p className="text-red-700 font-medium mb-6">We couldn't retrieve the system settings. This may be due to a temporary database disconnection.</p>
                <button onClick={() => fetchData()} className="bg-red-600 text-white font-black px-8 py-3 rounded-2xl hover:bg-red-700 transition-all">
                    Try Again
                </button>
            </div>
        </div>
    );

    const { clearance_settings, system_status, status_class, status_icon, user } = data;

    return (
        <AdminLayout user={user}>
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Status Card */}
                <div className="settings-hero-card">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

                    <div className="relative z-10 flex items-center gap-6">
                        <div className={`settings-status-box ${status_class.includes('emerald') ? 'bg-emerald-50 text-emerald-600' :
                            status_class.includes('amber') ? 'bg-amber-50 text-amber-600' :
                                status_class.includes('orange') ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'
                            }`}>
                            {status_icon}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1 italic">Current System State</p>
                            <h2 className={`text-4xl font-black ${status_class.split(' ')[0]}`}>{system_status}</h2>
                            <p className="text-gray-500 font-medium mt-1">Academic Year: <span className="text-indigo-600 font-bold">{clearance_settings.academic_year}</span></p>
                        </div>
                    </div>

                    <div className="relative z-10 flex flex-wrap justify-center gap-4">
                        {system_status !== 'ACTIVE' ? (
                            <button onClick={() => handleAction('activate')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95 uppercase tracking-widest text-xs">
                                ⚡ Activate System
                            </button>
                        ) : (
                            <button onClick={() => handleAction('deactivate')} className="bg-red-600 hover:bg-red-700 text-white font-black px-8 py-4 rounded-2xl shadow-lg shadow-red-100 transition-all active:scale-95 uppercase tracking-widest text-xs">
                                🛑 Deactivate System
                            </button>
                        )}
                        <button onClick={() => handleAction('extend_1_day')} className="bg-gray-900 hover:bg-black text-white font-black px-6 py-4 rounded-2xl shadow-lg shadow-gray-200 transition-all active:scale-95 text-xs">
                            +1 Day
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Settings Form */}
                    <div className="settings-config-card">
                        <h3 className="text-xl font-black text-gray-800 mb-8 flex items-center gap-3">
                            <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">⏳</span>
                            Clearance Schedule
                        </h3>

                        <form
                            key={`${clearance_settings.start_date}-${clearance_settings.end_date}-${clearance_settings.is_active}-${clearance_settings.academic_year}`}
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Academic Year</label>
                                <input
                                    required
                                    name="academic_year"
                                    defaultValue={clearance_settings.academic_year}
                                    placeholder="e.g. 2025-2026"
                                    className="settings-input-field text-indigo-600 font-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Clearance Starts</label>
                                <input
                                    type="datetime-local"
                                    name="start_date"
                                    defaultValue={new Date(clearance_settings.start_date).toISOString().slice(0, 16)}
                                    className="settings-input-field"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Clearance Ends</label>
                                <input
                                    type="datetime-local"
                                    name="end_date"
                                    defaultValue={new Date(clearance_settings.end_date).toISOString().slice(0, 16)}
                                    className="settings-input-field"
                                />
                            </div>

                            <div className="settings-toggle-container">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        className="sr-only peer"
                                        checked={!!clearance_settings.is_active}
                                        onChange={() => handleAction(clearance_settings.is_active ? 'deactivate' : 'activate')}
                                    />
                                    <div className="w-14 h-8 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                                <span className="text-sm font-black text-indigo-900 uppercase tracking-widest">Master Enable Switch</span>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-100 transform active:scale-95 transition-all text-sm uppercase tracking-widest"
                            >
                                {submitting ? '♻️ Updating Schedule...' : '💾 Save System Config'}
                            </button>
                        </form>
                    </div>

                    {/* Stats Card */}
                    <div className="settings-progress-card">
                        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700"></div>

                        <h3 className="text-xl font-black mb-10 relative z-10 flex items-center gap-3">
                            <span className="p-3 bg-white/10 rounded-2xl">📈</span>
                            Submission Progress
                        </h3>

                        <div className="space-y-10 relative z-10">
                            <div>
                                <div className="flex justify-between items-end mb-4">
                                    <p className="text-indigo-200 text-xs font-black uppercase tracking-widest">Global Completion Rate</p>
                                    <p className="text-4xl font-black">{data.submission_rate}%</p>
                                </div>
                                <div className="settings-progress-track">
                                    <div
                                        className="settings-progress-fill"
                                        style={{ width: `${data.submission_rate}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">Submitted</p>
                                    <p className="text-3xl font-black">{data.submitted_clearances}</p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-[30px] border border-white/5">
                                    <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mb-2">Pending</p>
                                    <p className="text-3xl font-black">{data.pending_students}</p>
                                </div>
                            </div>

                            <div className="pt-6">
                                <p className="text-indigo-200/60 text-xs italic">
                                    * Data reflects students currently in the clearance workflow for this academic session.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ClearanceSettings;
