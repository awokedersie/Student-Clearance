import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">Initialising Analytics...</p>
            </div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-red-500 font-bold">Failed to load system data</div>;

    const { stats, user } = data;

    // Prepare chart data
    const studentData = [
        { name: 'Active', value: stats.active_students, color: '#10b981' },
        { name: 'Inactive', value: stats.inactive_students, color: '#ef4444' }
    ];

    const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

    const deptChartData = stats.department_stats?.reduce((acc: any[], curr: any) => {
        if (curr.target_department === 'finance') return acc;

        // Capitalize name (e.g. 'library' -> 'Library')
        const deptName = curr.target_department.charAt(0).toUpperCase() + curr.target_department.slice(1);

        let dept = acc.find(d => d.name === deptName);
        if (!dept) {
            dept = { name: deptName, approved: 0, rejected: 0, pending: 0 };
            acc.push(dept);
        }
        dept[curr.status] = parseInt(curr.count);
        return acc;
    }, []) || [];

    const statCards = [
        { title: 'Total Students', value: stats.total_students, sub: `${stats.active_students} Active`, icon: '🎓', color: 'indigo' },
        { title: 'Final Approvals', value: stats.approved_students, sub: 'Cleared', icon: '✅', color: 'emerald' },
        { title: 'Staff Users', value: stats.total_admins, sub: 'Administrators', icon: '💼', color: 'blue' },
    ];

    return (
        <AdminLayout user={user}>
            <div className="admin-dashboard-layout">
                {/* Header Section */}
                <div className="admin-dashboard-header">
                    <div>
                        <h1 className="admin-dashboard-title">System Overview</h1>
                        <p className="admin-dashboard-subtitle">Real-time clearance analytics & performance tracking</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => window.location.reload()} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="admin-stat-grid">
                    {statCards.map((card, i) => (
                        <div key={i} className="admin-stat-card">
                            <div className="relative z-10">
                                <span className="text-2xl mb-4 block">{card.icon}</span>
                                <h3 className="admin-stat-label">{card.title}</h3>
                                <div className="admin-stat-value">{card.value}</div>
                                <p className="text-xs font-bold text-gray-500 mt-1">{card.sub}</p>
                            </div>
                            <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${card.color}-50 rounded-full group-hover:scale-110 transition-transform`}></div>
                        </div>
                    ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Analytics Chart */}
                    <div className="lg:col-span-2 admin-chart-card">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="admin-chart-label">Departmental Progress</h3>
                            <div className="flex gap-4 text-[10px] font-bold">
                                <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-emerald-500"></i> Approved</span>
                                <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-amber-500"></i> Pending</span>
                                <span className="flex items-center gap-1.5"><i className="w-2 h-2 rounded-full bg-rose-500"></i> Rejected</span>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={deptChartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} textAnchor="middle" />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                                    <Tooltip
                                        cursor={{ fill: '#f8fafc' }}
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', padding: '12px' }}
                                    />
                                    <Bar dataKey="approved" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="pending" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={20} />
                                    <Bar dataKey="rejected" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Student Status Pie */}
                    <div className="admin-chart-card flex flex-col items-center">
                        <h3 className="admin-chart-label mb-8 w-full">Student Health</h3>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={studentData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {studentData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="mt-4 text-center">
                            <p className="text-2xl font-black text-gray-900">{((stats.active_students / stats.total_students) * 100).toFixed(1)}%</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Active Enrollment</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Controls */}
                <div className="admin-control-card">
                    <div className="relative z-10 max-w-lg text-center md:text-left">
                        <h2 className="text-3xl font-black mb-2 tracking-tight">Quick System Control</h2>
                        <p className="text-indigo-200 font-medium">Manage student registrations, department settings, and overall clearance availability from here.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 relative z-10">
                        <button
                            onClick={() => navigate('/admin/system/manage-students')}
                            className="admin-control-btn"
                        >
                            Manage Students
                        </button>
                        <button
                            onClick={() => navigate('/admin/clearance-settings')}
                            className="admin-control-btn-secondary"
                        >
                            System Config
                        </button>
                    </div>
                    {/* Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default SystemDashboard;
