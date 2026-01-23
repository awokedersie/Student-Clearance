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
            <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                    <div className="w-full xl:w-auto">
                        <h1 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tight leading-none group">
                            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">{user?.name} {user?.lastName || user?.last_name}</span>
                        </h1>
                        <p className="text-gray-500 mt-4 font-medium text-sm md:text-base max-w-xl">
                            The centralized DBU clearance system is currently operational. You can track, manage, and request institutional clearances from this interface.
                        </p>
                    </div>
                    <div className="flex flex-wrap md:flex-nowrap gap-3 md:gap-4 w-full xl:w-auto">
                        <div className={`flex-1 xl:flex-none text-center px-4 md:px-6 py-2 md:py-3 rounded-2xl border ${isAccountActive ? 'bg-blue-50 border-blue-100' : 'bg-red-50 border-red-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isAccountActive ? 'text-blue-600' : 'text-red-600'}`}>Status</p>
                            <div className={`flex items-center justify-center gap-2 font-bold text-sm md:text-base ${isAccountActive ? 'text-blue-900' : 'text-red-900'}`}>
                                <span className={`w-2 h-2 rounded-full animate-pulse shrink-0 ${isAccountActive ? 'bg-blue-600' : 'bg-red-600'}`}></span>
                                <span className="truncate">{isAccountActive ? 'Active' : 'Inactive'}</span>
                            </div>
                        </div>
                        <div className="flex-1 xl:flex-none text-center px-4 md:px-6 py-2 md:py-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                            <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mb-1">Year</p>
                            <div className="text-indigo-900 font-bold text-sm md:text-base truncate">{academicYear}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                            className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-8 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity hidden md:block">
                                <div className="scale-[2.5] transform rotate-12">
                                    {item.icon}
                                </div>
                            </div>
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[16px] md:rounded-[20px] bg-gray-50 flex items-center justify-center mb-4 md:mb-6 group-hover:bg-white transition-colors shadow-inner">
                                {item.icon}
                            </div>
                            <h3 className="text-lg md:text-xl font-black text-gray-900 tracking-tight">{item.title}</h3>
                            <p className="text-gray-500 text-xs md:text-sm mt-2 font-medium leading-relaxed">{item.desc}</p>
                            <div className="mt-4 md:mt-8 flex items-center text-[10px] font-black text-indigo-600 uppercase tracking-[2px] md:tracking-[3px] opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all transform md:translate-y-2 md:group-hover:translate-y-0">
                                Open Section ⟶
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 md:p-8">
                        <h2 className="text-lg md:text-xl font-black text-gray-900 mb-6">Important Information</h2>
                        <div className="space-y-4">
                            <div className="p-4 md:p-6 bg-amber-50 rounded-[24px] md:rounded-[28px] border border-amber-100 flex flex-col sm:flex-row gap-4 md:gap-5 transition-transform hover:scale-[1.01]">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm text-amber-600">
                                    <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-black text-amber-900 uppercase tracking-wider text-[10px] md:text-xs mb-1">Final Clearance Requirement</p>
                                    <p className="text-amber-800/80 text-xs md:text-sm font-medium leading-relaxed">All department clearances must be approved before you can receive your final certificate. Check status regularly.</p>
                                </div>
                            </div>
                            <div className="p-4 md:p-6 bg-indigo-50 rounded-[24px] md:rounded-[28px] border border-indigo-100 flex flex-col sm:flex-row gap-4 md:gap-5 transition-transform hover:scale-[1.01]">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center shadow-sm text-indigo-600">
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

                    <div className="bg-indigo-900 rounded-3xl shadow-xl p-6 md:p-8 text-white flex flex-col justify-between">
                        <div>
                            <h3 className="text-[10px] md:text-xs font-black uppercase tracking-[2px] md:tracking-[3px] text-indigo-300 mb-6 md:mb-8">System Status</h3>
                            <div className="space-y-4 md:space-y-6">
                                <div>
                                    <p className="text-indigo-200 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Current Period</p>
                                    <p className="text-xl md:text-2xl font-black italic">{systemStatus}</p>
                                </div>
                                <div className="h-px bg-white/10"></div>
                                <div>
                                    <p className="text-indigo-200 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1">Time until Close</p>
                                    <p className="text-xl md:text-2xl font-black italic">
                                        {daysRemaining > 0 ? `${daysRemaining} Days Remaining` : 'Closing Soon'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <Link to="/student/clearance-request" className="mt-8 md:mt-12 bg-white text-indigo-900 font-black px-6 py-3 md:py-4 rounded-xl text-center hover:bg-indigo-50 transition-colors uppercase tracking-widest text-[10px] md:text-xs">
                            Apply Now ⟶
                        </Link>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentDashboard;
