import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Link, useNavigate } from 'react-router-dom';

const SystemDashboard: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/admin/system/dashboard/data');
                if (response.data.success) {
                    setData(response.data);
                } else {
                    navigate('/admin/login');
                }
            } catch (error: any) {
                console.error('Error fetching system stats:', error);
                if (error.response?.status === 401) {
                    navigate('/admin/login');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [navigate]);

    if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Initialising System Dashboard...</div>;
    if (!data) return <div className="p-8 text-center text-red-500 font-bold">Failed to load system data</div>;

    const { stats, user } = data;

    const cards = [
        { title: 'Total Students', value: stats.total_students, icon: '👨‍🎓', color: 'from-blue-500 to-indigo-600', link: '/admin/system/manage-students' },
        { title: 'Total Staff', value: stats.total_admins, icon: '👨‍💼', color: 'from-purple-500 to-pink-600', link: '/admin/system/manage-admins' },
        { title: 'Active Requests', value: '42', icon: '📝', color: 'from-orange-400 to-red-500', link: '/admin/clearance-settings' },
        { title: 'System Status', value: 'ACTIVE', icon: '⚡', color: 'from-emerald-400 to-teal-600', link: '/admin/clearance-settings' },
    ];

    return (
        <AdminLayout user={user}>
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {cards.map((card, i) => (
                        <Link
                            key={i}
                            to={card.link}
                            className={`relative overflow-hidden p-6 rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 group`}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-4xl group-hover:scale-110 transition-transform">{card.icon}</span>
                                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </div>
                                </div>
                                <h3 className="text-white/80 font-bold uppercase tracking-widest text-[10px] mb-1">{card.title}</h3>
                                <div className="text-3xl font-black text-white">{card.value}</div>
                            </div>
                        </Link>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
                            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">🚀</span>
                            Quick Management Control
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button className="p-4 flex items-center gap-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl border border-gray-100 transition-colors text-left group">
                                <span className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">➕</span>
                                <div>
                                    <p className="font-bold text-gray-800">Add New Student</p>
                                    <p className="text-xs text-gray-500">Register a new profile</p>
                                </div>
                            </button>
                            <button className="p-4 flex items-center gap-4 bg-gray-50 hover:bg-emerald-50 rounded-2xl border border-gray-100 transition-colors text-left group">
                                <span className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">⚙️</span>
                                <div>
                                    <p className="font-bold text-gray-800">Clearance Status</p>
                                    <p className="text-xs text-gray-500">Enable/Disable System</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="bg-indigo-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <span className="text-9xl font-black">!</span>
                        </div>
                        <h3 className="text-lg font-black mb-4 relative z-10">System Alerts</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
                                <p className="text-xs font-bold text-indigo-300 uppercase mb-1">Backup Status</p>
                                <p className="text-sm">Database backup completed successfully 2h ago.</p>
                            </div>
                            <div className="p-4 bg-red-500/20 rounded-2xl border border-red-500/10">
                                <p className="text-xs font-bold text-red-300 uppercase mb-1">Server Note</p>
                                <p className="text-sm">Maintenance scheduled for Saturday 2:00 AM.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SystemDashboard;
