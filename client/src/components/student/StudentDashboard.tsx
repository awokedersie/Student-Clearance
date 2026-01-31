import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';

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
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await axios.get('/student/dashboard/data');
                if (response.data.success) {
                    setUser(response.data.user);
                    setSystemStatus(response.data.systemStatus || 'Inactive');
                    setDaysRemaining(response.data.daysRemaining || 0);
                    if (response.data.academicYear) {
                        setAcademicYear(response.data.academicYear.replace('-', ' - '));
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
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading Dashboard...</p>
                </div>
            </div>
        );
    }

    const isAccountActive = user?.status?.toLowerCase() === 'active';

    return (
        <StudentLayout user={user}>
            <div className="dashboard-container">
                <div className="welcome-card">
                    <div className="w-full xl:w-auto">
                        <h1 className="welcome-title">
                            Welcome, <span className="welcome-name-gradient">{user?.name} {user?.lastName || user?.last_name}</span>
                        </h1>
                        <p className="welcome-desc">
                            The centralized DBU clearance system is currently operational. You can track, manage, and request institutional clearances from this interface.
                        </p>
                    </div>
                    <div className="status-badges-row">
                        <div className={`status-badge-container ${isAccountActive ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                            <p className={`status-label ${isAccountActive ? 'text-blue-600' : 'text-red-600'}`}>Status</p>
                            <div className={`status-value-wrapper ${isAccountActive ? 'text-blue-900' : 'text-red-900'}`}>
                                <span className={`status-indicator-dot ${isAccountActive ? 'bg-blue-600' : 'bg-red-600'}`}></span>
                                <span className="truncate">{isAccountActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        <div className="year-badge-container">
                            <p className="status-label text-indigo-600">Year</p>
                            <div className="text-indigo-900 font-bold text-sm md:text-base truncate">{academicYear}</div>
                        </div>
                    </div>
                </div>

                <div className="quick-links-grid">
                    {[
                        {
                            to: "/student/clearance-request",
                            icon: (
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                            ),
                            title: "New Request",
                            desc: "Start new clearance",
                            color: "blue"
                        },
                        {
                            to: "/student/clearance-status",
                            icon: (
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ),
                            title: "My Status",
                            desc: "Track real-time progress",
                            color: "indigo"
                        },
                        {
                            to: "/student/notifications",
                            icon: (
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                            ),
                            title: "Notifications",
                            desc: "View recent alerts",
                            color: "emerald"
                        },
                        {
                            to: "/student/profile",
                            icon: (
                                <svg className="w-6 h-6 md:w-8 md:h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            ),
                            title: "My Profile",
                            desc: "Manage personal data",
                            color: "amber"
                        },
                    ].map((item, idx) => (
                        <Link
                            key={idx}
                            to={item.to}
                            className="nav-card"
                        >
                            <div className="nav-card-bg-icon">
                                {item.icon}
                            </div>
                            <div className="nav-card-icon-wrapper">
                                {item.icon}
                            </div>
                            <h3 className="nav-card-title">{item.title}</h3>
                            <p className="nav-card-desc">{item.desc}</p>
                            <div className="nav-card-action-text">
                                Open Section ⟶
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="info-sections-grid">
                    <div className="important-info-card">
                        <h2 className="section-title">Important Information</h2>
                        <div className="space-y-4">
                            <div className="alert-item bg-amber-50 border-amber-100">
                                <div className="alert-icon-wrapper text-amber-600">
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-black text-amber-900 uppercase tracking-wider text-[10px] md:text-xs mb-1">Final Clearance Requirement</p>
                                    <p className="text-amber-800/80 text-xs md:text-sm font-medium leading-relaxed">All department clearances must be approved before you can receive your final certificate. Check status regularly.</p>
                                </div>
                            </div>
                            <div className="alert-item bg-indigo-50 border-indigo-100">
                                <div className="alert-icon-wrapper text-indigo-600">
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.674a1 1 0 00.922-.606l7-14A1 1 0 0021.337 1H2.663a1 1 0 00-.922 1.394l7 14a1 1 0 00.922.606z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 22v-5" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-black text-indigo-900 uppercase tracking-wider text-[10px] md:text-xs mb-1">System Optimization Tip</p>
                                    <p className="text-indigo-800/80 text-xs md:text-sm font-medium leading-relaxed">Update your profile picture and contact details in the Profile section to ensure all information is officially verified.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="system-status-sidebar">
                        <div>
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[2px] md:tracking-[3px] text-indigo-300 mb-6 md:mb-8">System Status</h3>
                            <div className="space-y-4 md:space-y-6">
                                <div>
                                    <p className="sidebar-stat-label">Current Period</p>
                                    <p className="sidebar-stat-value">{systemStatus}</p>
                                </div>
                                <div className="sidebar-stat-divider"></div>
                                <div>
                                    <p className="sidebar-stat-label">Time until Close</p>
                                    <p className="sidebar-stat-value">
                                        {daysRemaining > 0 ? `${daysRemaining} Days Remaining` : 'Closing Soon'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link to="/student/clearance-request" className="apply-button-card">
                            Apply Now ⟶
                        </Link>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
