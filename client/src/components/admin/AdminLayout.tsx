import React, { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Toaster } from 'react-hot-toast';
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
        { name: 'Audit Logs', path: '/admin/system/audit-logs', icon: '📋', roles: ['system_admin', 'registrar_admin', 'super_admin'] },
        { name: 'Change Password', path: '/admin/change-password', icon: '🔐', roles: ['system_admin', 'super_admin', 'library_admin', 'cafeteria_admin', 'dormitory_admin', 'department_admin', 'registrar_admin'] },
    ];

    const filteredMenu = menuItems.filter(item =>
        item.roles.includes(user?.role) || user?.role === 'super_admin'
    );

    return (
        <div className="min-h-screen bg-gray-100 flex font-sans relative admin-panel">
            {/* Mobile Overlay */}
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
                    {filteredMenu.map(item => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsSidebarOpen(false)}
                            className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${location.pathname === item.path
                                ? 'bg-indigo-700 text-white shadow-lg'
                                : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
                                }`}
                        >
                            <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span className="font-medium">{item.name}</span>
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
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
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
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 truncate max-w-[150px] md:max-w-none">
                            {menuItems.find(m => m.path === location.pathname)?.name || 'Admin Panel'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs md:text-sm font-bold text-gray-900 truncate max-w-[100px]">{user?.full_name || user?.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black opacity-60">{user?.role?.replace('_', ' ')}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border-2 border-indigo-50 shadow-sm overflow-hidden shrink-0">
                            {(user?.name?.[0] || 'A').toUpperCase()}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-gray-50/50">
                    {children}
                </div>
            </main>
            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'font-bold text-sm',
                    style: {
                        background: '#333',
                        color: '#fff',
                        borderRadius: '16px',
                        padding: '16px',
                    },
                    success: {
                        style: {
                            background: '#10B981',
                        },
                        iconTheme: {
                            primary: 'white',
                            secondary: '#10B981',
                        },
                    },
                    error: {
                        style: {
                            background: '#EF4444',
                        },
                        iconTheme: {
                            primary: 'white',
                            secondary: '#EF4444',
                        },
                    },
                }}
            />
        </div>
    );
};

export default AdminLayout;
