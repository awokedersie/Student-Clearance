import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';
import Loading from '../common/Loading';

interface User {
    id: number;
    name: string;
    username: string;
    student_id?: string;
    department?: string;
    email?: string;
    role: string;
    lastName: string;
    last_name?: string;
    status: string;
}

const StudentDashboard: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [academicYear, setAcademicYear] = useState<string>('2023 - 2024');
    const [systemStatus, setSystemStatus] = useState<string>('Loading...');
    const [daysRemaining, setDaysRemaining] = useState<number>(0);
    const [hoursRemaining, setHoursRemaining] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    // New state for progress circle
    const [progress, setProgress] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axios.get('/student/dashboard/data');
                if (response.data.success) {
                    setUser(response.data.user);
                    setSystemStatus(response.data.systemStatus || 'Inactive');
                    setDaysRemaining(response.data.daysRemaining || 0);
                    setHoursRemaining(response.data.hoursRemaining || 0);
                    if (response.data.academicYear) {
                        setAcademicYear(response.data.academicYear.replace('-', ' - '));
                    }

                    // Fetch real clearance progress for the circle
                    // Assuming existing API might return this, or default to 0 for now
                    // Ideally: const statusRes = await axios.get('/student/clearance-status/data');
                    // setProgress(calculatePercentage(statusRes.data));
                    // For now, let's look for it in dashboard data or default to 0
                    if (response.data.progressPercentage) {
                        setProgress(response.data.progressPercentage);
                    }
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Dashboard error:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, [navigate]);

    if (loading) {
        return <Loading />;
    }

    const isAccountActive = user?.status?.toLowerCase() === 'active';
    const isSystemOpen = systemStatus === 'Clearance Open';

    // Progress Circle Component
    const ProgressCircle = ({ percent }: { percent: number }) => {
        const radius = 18;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percent / 100) * circumference;

        return (
            <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle
                        cx="24" cy="24" r={radius}
                        stroke="currentColor" strokeWidth="4" fill="transparent"
                        className="text-indigo-100"
                    />
                    <circle
                        cx="24" cy="24" r={radius}
                        stroke="currentColor" strokeWidth="4" fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className="text-indigo-600 transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                    />
                </svg>
                <span className="absolute text-[10px] font-bold text-indigo-900">{percent}%</span>
            </div>
        );
    };

    return (
        <StudentLayout user={user}>
            <div className="dashboard-container">
                <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4 mb-2">
                    <div className="status-badges-row">
                        <div className={`status-badge-container ${isAccountActive ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                            <p className={`status-label ${isAccountActive ? 'text-blue-600' : 'text-red-600'}`}>Account Status</p>
                            <div className={`status-value-wrapper ${isAccountActive ? 'text-blue-900' : 'text-red-900'}`}>
                                <span className={`status-indicator-dot ${isAccountActive ? 'bg-blue-600' : 'bg-red-600'}`}></span>
                                <span className="truncate">{isAccountActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        <div className="year-badge-container">
                            <p className="status-label text-indigo-600">Academic Year</p>
                            <div className="text-indigo-900 font-bold text-sm md:text-base truncate">{academicYear}</div>
                        </div>
                    </div>
                </div>

                <div className="quick-links-grid">
                    {/* 1. New Request Card (Conditional Disable) */}
                    {isSystemOpen ? (
                        <Link to="/student/clearance-request" className="nav-card relative group">
                            <div className="nav-card-bg-icon group-hover:scale-[3] transition-transform">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <div className="nav-card-icon-wrapper bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                            </div>
                            <h3 className="nav-card-title">New Request</h3>
                            <p className="nav-card-desc">Start new clearance process</p>
                            <div className="nav-card-action-text text-blue-600">Start Now ⟶</div>
                        </Link>
                    ) : (
                        <div className="nav-card bg-gray-50 border-gray-200 cursor-not-allowed opacity-70 grayscale">
                            <div className="nav-card-icon-wrapper bg-gray-100 text-gray-400">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            </div>
                            <h3 className="nav-card-title text-gray-500">System Closed</h3>
                            <p className="nav-card-desc">Requests are currently unavailable</p>
                            <div className="nav-card-action-text text-gray-400">Locked</div>
                        </div>
                    )}

                    {/* 2. My Status Card (With Progress Circle) */}
                    <Link to="/student/clearance-status" className="nav-card relative group">
                        <div className="absolute top-4 right-4 group-hover:scale-110 transition-transform">
                            <ProgressCircle percent={progress} />
                        </div>
                        <div className="nav-card-icon-wrapper bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="nav-card-title">My Status</h3>
                        <p className="nav-card-desc">Track real-time progress</p>
                        <div className="nav-card-action-text text-indigo-600">Check Status ⟶</div>
                    </Link>

                    {/* 3. Notifications */}
                    <Link to="/student/notifications" className="nav-card relative group">
                        <div className="nav-card-bg-icon">
                            <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <div className="nav-card-icon-wrapper bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                        <h3 className="nav-card-title">Notifications</h3>
                        <p className="nav-card-desc">View recent alerts</p>
                        <div className="nav-card-action-text text-emerald-600">View Inbox ⟶</div>
                    </Link>

                    {/* 4. Profile */}
                    <Link to="/student/profile" className="nav-card relative group">
                        <div className="nav-card-bg-icon">
                            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <div className="nav-card-icon-wrapper bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        </div>
                        <h3 className="nav-card-title">My Profile</h3>
                        <p className="nav-card-desc">Manage personal data</p>
                        <div className="nav-card-action-text text-amber-600">Edit Details ⟶</div>
                    </Link>
                </div>

                <div className="info-sections-grid">
                    <div className="important-info-card">
                        <h2 className="section-title">Important Information</h2>
                        <div className="space-y-4">
                            <div className="alert-item bg-amber-50 border-amber-100">
                                <div className="alert-icon-wrapper text-amber-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <div>
                                    <p className="font-black text-amber-900 uppercase tracking-wider text-[10px] md:text-xs mb-1">Final Clearance Requirement</p>
                                    <p className="text-amber-800/80 text-xs md:text-sm font-medium leading-relaxed">All department clearances must be approved before you can receive your final certificate. Check status regularly.</p>
                                </div>
                            </div>
                            <div className="alert-item bg-indigo-50 border-indigo-100">
                                <div className="alert-icon-wrapper text-indigo-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.674a1 1 0 00.922-.606l7-14A1 1 0 0021.337 1H2.663a1 1 0 00-.922 1.394l7 14a1 1 0 00.922.606z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22v-5" /></svg>
                                </div>
                                <div>
                                    <p className="font-black text-indigo-900 uppercase tracking-wider text-[10px] md:text-xs mb-1">System Optimization Tip</p>
                                    <p className="text-indigo-800/80 text-xs md:text-sm font-medium leading-relaxed">Update your profile picture in the Profile section to ensure all information is officially verified.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="system-status-sidebar">
                        <div>
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[2px] md:tracking-[3px] text-indigo-300 mb-6 md:mb-8">System Overview</h3>
                            {/* Updated System Status Logic */}
                            <div className="space-y-4 md:space-y-6">
                                <div>
                                    <p className="sidebar-stat-label">Current Status</p>
                                    {isSystemOpen ? (
                                        <p className="sidebar-stat-value text-emerald-400">ACTIVE</p>
                                    ) : (
                                        <p className="sidebar-stat-value text-red-400">CLOSED</p>
                                    )}
                                </div>
                                <div className="sidebar-stat-divider"></div>
                                <div>
                                    <p className="sidebar-stat-label">
                                        {systemStatus === 'Clearance Scheduled' ? 'Time until Open' :
                                            systemStatus === 'Clearance Open' ? 'Time until Close' : 'System Status'}
                                    </p>
                                    <p className="sidebar-stat-value text-lg">
                                        {systemStatus === 'Clearance Open' || systemStatus === 'Clearance Scheduled' ? (
                                            daysRemaining > 0 || hoursRemaining > 0
                                                ? `${daysRemaining}d ${hoursRemaining}h Remaining`
                                                : 'Starting/Closing Soon'
                                        ) : (
                                            systemStatus === 'Clearance Expired' ? 'Expired' : 'Unavailable'
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Conditional Apply Button */}
                        {isSystemOpen ? (
                            <Link to="/student/clearance-request" className="apply-button-card">
                                Apply Now ⟶
                            </Link>
                        ) : (
                            <div className="mt-8 md:mt-12 bg-indigo-950/50 text-indigo-400 font-black px-6 py-4 rounded-xl text-center cursor-not-allowed border border-indigo-800 uppercase tracking-widest text-xs">
                                Unavailable
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
