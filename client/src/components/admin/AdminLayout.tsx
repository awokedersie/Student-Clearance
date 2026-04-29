import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

import '../../styles/admin.css';

interface AdminLayoutProps {
    children: ReactNode;
    user: any;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

    const handleLogout = async () => {
        try {
            await axios.get('/admin/logout');
            navigate('/admin/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/admin/login');
        }
    };

    const isAdmin = user?.role === 'system_admin' || user?.role === 'super_admin';

    const menuItems = [
        { name: 'Dashboard', path: '/admin/system/dashboard', icon: '📊', roles: ['system_admin', 'super_admin'] },
        { name: 'Manage Students', path: '/admin/system/manage-students', icon: '👨‍🎓', roles: ['system_admin', 'super_admin'] },
        { name: 'Manage Admins', path: '/admin/system/manage-admins', icon: '👨‍💼', roles: ['system_admin', 'super_admin'] },
        { name: 'Clearance Settings', path: '/admin/clearance-settings', icon: '⚙️', roles: ['system_admin', 'super_admin'] },
        { name: 'Library', path: '/admin/departments/library', icon: '📚', roles: ['library_admin', 'super_admin'] },
        { name: 'Cafeteria', path: '/admin/departments/cafeteria', icon: '🍴', roles: ['cafeteria_admin', 'super_admin'] },
        { name: 'Dormitory', path: '/admin/departments/dormitory', icon: '🏠', roles: ['dormitory_admin', 'super_admin'] },
        { name: 'Department', path: '/admin/departments/department', icon: '🏢', roles: ['department_admin', 'super_admin'] },
        { name: 'Registrar', path: '/admin/registrar/dashboard', icon: '📝', roles: ['registrar_admin', 'super_admin'] },
        { name: 'Protector', path: '/admin/departments/protector', icon: '🛡️', roles: ['personal_protector', 'super_admin'] },
        { name: 'Audit Logs', path: '/admin/system/audit-logs', icon: '📋', roles: ['system_admin', 'super_admin'] },
        { name: 'Change Password', path: '/admin/change-password', icon: '🔐', roles: ['system_admin', 'super_admin', 'library_admin', 'cafeteria_admin', 'dormitory_admin', 'department_admin', 'registrar_admin', 'personal_protector'] },
    ];

    const filteredMenu = menuItems.filter(item =>
        item.roles.includes(user?.role) || user?.role === 'super_admin'
    );

    return (
        <div className="admin-layout-container admin-panel">
            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-all"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
                <div className="admin-sidebar-header">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-xl p-1 shadow-lg shadow-black/30 flex items-center justify-center overflow-hidden border border-white/10 shrink-0">
                            <img src="/logo.png" className="w-full h-full object-contain" alt="DBU Logo" />
                        </div>
                        <div className="flex flex-col leading-tight">
                            <span className="text-base font-black tracking-tight">DBU <span className="text-indigo-400 font-light italic">Clearance</span></span>
                            <span className="text-indigo-400 font-light italic text-[10px] tracking-widest uppercase">Admin Panel</span>
                        </div>
                    </div>
                    <button
                        className="lg:hidden text-indigo-300 hover:text-white"
                        onClick={() => setIsSidebarOpen(false)}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <nav className="admin-nav">
                    {filteredMenu.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`admin-nav-item ${location.pathname === item.path ? 'admin-nav-item-active' : ''}`}
                        >
                            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    ))}
                </nav>

                <div className="admin-logout-container">
                    <button
                        onClick={handleLogout}
                        className="admin-logout-btn"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                        </svg> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main-view">
                <header className="admin-topbar">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                            onClick={() => setIsSidebarOpen(true)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <h2 className="admin-topbar-title">
                            {menuItems.find(m => m.path === location.pathname)?.name || 'Admin Panel'}
                        </h2>
                    </div>

                    <div className="admin-topbar-profile">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[140px] md:max-w-none">{user?.full_name || user?.name}</p>
                            <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">{user?.role?.replace(/_/g, ' ')}</p>
                        </div>
                        <div className="admin-avatar-small">
                            {(user?.name?.[0] || 'A').toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="admin-content-area">
                    {children}
                </div>
            </main>

        </div>
    );
};

export default AdminLayout;
