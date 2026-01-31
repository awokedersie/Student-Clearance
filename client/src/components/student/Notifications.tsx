import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';

const Notifications: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const response = await axios.get('/student/notifications/data');
                if (response.data.success) {
                    setUser(response.data.user);
                    setNotifications(response.data.notifications);
                    setShowDownloadButton(response.data.showDownloadButton);
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

        fetchNotifications();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50 backdrop-blur-sm">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                </div>
            </div>
        );
    }

    return (
        <StudentLayout user={user}>
            <div className="feed-container">
                <div className="feed-header">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Intelligence Feed</h2>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-[3px] mt-2">Historical and recent clearance updates</p>
                    </div>
                    {showDownloadButton && (
                        <button
                            onClick={() => window.open('/student/download-certificate', '_blank')}
                            className="download-premium-btn"
                        >
                            <span className="text-lg group-hover:animate-bounce">📥</span> Download Final Certificate
                        </button>
                    )}
                </div>

                {notifications.length === 0 ? (
                    <div className="empty-feed-card">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/50 to-transparent"></div>
                        <div className="relative z-10 font-sans">
                            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl mx-auto mb-8 border border-gray-50 transform rotate-3 grayscale opacity-30">
                                📬
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Signal Clear</h3>
                            <p className="text-gray-400 mt-3 font-medium text-sm max-w-xs mx-auto">No pending alerts or clearance updates detected at this terminal.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {notifications.map((n, i) => (
                            <div key={i} className={`notification-card ${n.is_read ? 'notification-card-read' : 'notification-card-unread'}`}>
                                <div className="flex flex-col md:flex-row items-start gap-6">
                                    <div className={`notification-status-icon ${n.status === 'approved'
                                        ? 'bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50'
                                        : 'bg-rose-50 text-rose-600 ring-4 ring-rose-50'
                                        }`}>
                                        {n.status === 'approved' ? '✓' : '✕'}
                                    </div>

                                    <div className="flex-1 space-y-3">
                                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                            <div className="flex items-center gap-3">
                                                <h4 className="font-black text-gray-900 uppercase tracking-tight text-xl leading-none">
                                                    Status Protocol: <span className={n.status === 'approved' ? 'text-emerald-500' : 'text-rose-500'}>{n.status}</span>
                                                </h4>
                                                {!n.is_read && (
                                                    <span className="notification-new-pill">
                                                        <span className="w-1 h-1 bg-white rounded-full"></span>NEW
                                                    </span>
                                                )}
                                            </div>
                                            <span className="notification-date-pill">
                                                {new Date(n.date_sent).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>

                                        <div className="h-px bg-gradient-to-r from-gray-100 to-transparent w-full"></div>

                                        <p className="text-gray-500 font-medium text-sm leading-loose">
                                            {n.message || `The central database has been updated. Access to your ${n.type || 'clearance'} request is now ${n.status}.`}
                                        </p>

                                        <div className="flex items-center gap-2 pt-2">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform"></div>
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest opacity-60">System Log: ID-{n.id || (1000 + i)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="policy-footer-card">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 rounded-full -mr-32 -mt-32 blur-[80px]"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">💡</div>
                        <div>
                            <h4 className="font-black uppercase tracking-widest text-[10px] text-indigo-400 mb-2">Notification Policy</h4>
                            <p className="text-indigo-100/70 text-sm font-medium leading-relaxed max-w-xl">
                                Alerts are generated automatically upon status changes in any department. Ensure your profile contact information is current to receive SMS updates.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default Notifications;
