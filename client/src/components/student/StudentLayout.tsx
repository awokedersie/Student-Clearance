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
        <div className="main-content-layout student-portal">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`sidebar-container ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="sidebar-header">
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

                <nav className="sidebar-nav">
                    {menuItems.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`sidebar-item ${location.pathname === item.path ? 'sidebar-item-active' : ''}`}
                        >
                            <span className="sidebar-item-icon">
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

                <div className="sidebar-logout-container">
                    <button
                        onClick={handleLogout}
                        className="sidebar-logout-btn"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="main-view-wrapper">
                {/* Topbar */}
                <header className="topbar-header">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="topbar-title">
                            {menuItems.find(m => m.path === location.pathname)?.name || 'Student Area'}
                        </h2>
                    </div>

                    <div className="topbar-actions">
                        {/* Notification indicator */}
                        <Link to="/student/notifications" className="notification-link">
                            <span>🔔</span>
                            {unreadNotifications > 0 && (
                                <span className="notification-dot">
                                    {unreadNotifications}
                                </span>
                            )}
                        </Link>

                        <div className="hidden md:block w-px h-8 bg-gray-200"></div>

                        <div className="topbar-profile">
                            <div className="text-right hidden sm:block">
                                <p className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[100px]">{user?.name} {user?.last_name}</p>
                                <p className="text-[10px] md:text-xs text-blue-600 font-mono font-medium">{user?.student_id}</p>
                            </div>
                            <div className="profile-avatar-small">
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
                <div className="page-content-area">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default StudentLayout;
