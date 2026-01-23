import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../../styles/student.css';

interface StudentLayoutProps {
    children: ReactNode;
    user: any;
}

const StudentLayout: React.FC<StudentLayoutProps> = ({ children, user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [unreadNotifications, setUnreadNotifications] = React.useState(0);
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    React.useEffect(() => {
        const fetchUnreadCount = async () => {
            try {
                const response = await axios.get('/student/notifications/unread-count');
                if (response.data.success) {
                    setUnreadNotifications(response.data.count);
                }
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        if (user) {
            if (location.pathname === '/student/notifications' || location.pathname === '/student/profile') {
                setUnreadNotifications(0);
            } else {
                fetchUnreadCount();
            }
        }
    }, [user, location.pathname]);

    const handleLogout = async () => {
        try {
            await axios.get('/logout');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        }
    };

    const menuItems = [
        { name: 'Dashboard', path: '/student/dashboard', icon: '📊' },
        { name: 'Profile', path: '/student/profile', icon: '👤' },
        { name: 'Request Clearance', path: '/student/clearance-request', icon: '📋' },
        { name: 'View Status', path: '/student/clearance-status', icon: '📈' },
        { name: 'Notifications', path: '/student/notifications', icon: '🔔' },
        { name: 'Change Password', path: '/student/change-password', icon: '🔐' },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex font-['Outfit'] text-gray-900 relative student-portal">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-indigo-900 text-white flex-shrink-0 flex flex-col shadow-2xl z-50 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} transition-transform duration-300 ease-in-out`}>
                <div className="p-6 text-2xl font-black tracking-tighter border-b border-indigo-800 flex items-center justify-between">
                    <span>
                        DBU <span className="text-indigo-400 font-light italic">Clearance</span>
                    </span>
                    <button
                        className="lg:hidden text-indigo-300 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                                ? 'bg-indigo-700 text-white shadow-lg'
                                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                                }`}
                        >
                            <span className={`text-xl group-hover:scale-110 transition-transform ${typeof item.icon !== 'string' ? '' : ''}`}>
                                {item.icon}
                            </span>
                            <span className="font-medium">{item.name}</span>
                            {item.name === 'Notifications' && unreadNotifications > 0 && (
                                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                                    {unreadNotifications}
                                </span>
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-indigo-800">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 p-3 text-red-300 hover:bg-red-900/30 hover:text-red-100 rounded-xl transition-all font-medium"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden relative w-full">
                {/* Topbar */}
                <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between items-center z-10 shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight truncate max-w-[250px] md:max-w-none">
                            {menuItems.find(m => m.path === location.pathname)?.name || 'Student Area'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-2 md:gap-6">
                        {/* Notification indicator */}
                        <Link to="/student/notifications" className="relative p-2 text-gray-500 hover:text-[#1a237e] transition-colors group">
                            <span className="text-xl md:text-2xl">🔔</span>
                            {unreadNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 block px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black border-2 border-white animate-pulse">
                                    {unreadNotifications}
                                </span>
                            )}
                        </Link>

                        <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[100px]">{user?.name} {user?.last_name}</p>
                                <p className="text-[10px] md:text-xs text-blue-600 font-mono font-medium">{user?.student_id}</p>
                            </div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#1a237e] font-black text-base md:text-lg overflow-hidden shrink-0">
                                {user?.profile_picture ? (
                                    <img src={`/${user.profile_picture}`} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    user?.name?.[0]?.toUpperCase() || 'S'
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default StudentLayout;
