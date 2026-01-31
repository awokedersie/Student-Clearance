import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

interface Admin {
    id: number;
    name: string;
    last_name: string;
    username: string;
    email: string;
    phone: string;
    role: string;
    department_name?: string;
}

const ManageAdmins: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editAdmin, setEditAdmin] = useState<Admin | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        last_name: '',
        username: '',
        email: '',
        phone: '',
        role: '',
        department_name: '',
        password: ''
    });

    const fetchData = async (searchTerm = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`/admin/system/manage-admins/data?search=${searchTerm}`);
            if (response.data.success) {
                setData(response.data);
                if (response.data.edit_admin) {
                    setEditAdmin(response.data.edit_admin);
                    setFormData({ ...response.data.edit_admin, password: '' });
                    setShowForm(true);
                }
            } else {
                navigate('/admin/login');
            }
        } catch (error: any) {
            console.error('Error fetching admins:', error);
            if (error.response?.status === 401) {
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const url = editAdmin
            ? `/admin/system/manage-admins/update/${editAdmin.id}`
            : '/admin/system/manage-admins/add';

        try {
            const response = await axios.post(url, formData);
            if (response.data.success) {
                alert(response.data.message || 'Admin saved successfully');
                setShowForm(false);
                setEditAdmin(null);
                setFormData({
                    name: '', last_name: '', username: '', email: '',
                    phone: '', role: '', department_name: '', password: ''
                });
                fetchData(search);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('DELETE this admin account?')) return;
        try {
            const response = await axios.get(`/admin/system/manage-admins/delete/${id}`);
            if (response.data.success) {
                fetchData(search);
            }
        } catch (error) {
            alert('Failed to delete admin');
        }
    };

    if (loading && !data) return <div className="p-8 text-center text-gray-500 font-medium">Loading Admins...</div>;

    const { admins = [], departments = [], user } = data || {};

    return (
        <AdminLayout user={user}>
            <div className="p-8 space-y-6">
                <div className="mgmt-action-bar">
                    <button
                        onClick={() => {
                            setEditAdmin(null);
                            setFormData({
                                name: '', last_name: '', username: '', email: '',
                                phone: '', role: '', department_name: '', password: ''
                            });
                            setShowForm(true);
                        }}
                        className="mgmt-btn-add"
                    >
                        <span>➕</span> Add Admin
                    </button>

                    <form onSubmit={(e) => { e.preventDefault(); fetchData(search); }} className="flex gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search by ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="mgmt-search-input"
                        />
                        <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-2xl transition-colors">
                            🔍
                        </button>
                    </form>
                </div>

                <div className="admin-table-wrapper">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="admin-table-th">Admin Name</th>
                                    <th className="admin-table-th">Role & Dept</th>
                                    <th className="admin-table-th">Contact</th>
                                    <th className="admin-table-th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {admins.map((admin: Admin) => (
                                    <tr key={admin.id} className="admin-table-row">
                                        <td className="admin-table-td">
                                            <p className="font-bold text-gray-900 group-hover:text-purple-600 transition-colors">{admin.name} {admin.last_name}</p>
                                            <p className="text-xs text-gray-500 font-mono">@{admin.username}</p>
                                        </td>
                                        <td className="admin-table-td">
                                            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 text-gray-600 border border-gray-200">
                                                {admin.role.replace('_', ' ')}
                                            </span>
                                            {admin.department_name && (
                                                <p className="text-xs text-indigo-600 font-bold mt-1 italic">{admin.department_name}</p>
                                            )}
                                        </td>
                                        <td className="admin-table-td">
                                            <p className="text-sm text-gray-600">{admin.email}</p>
                                            <p className="text-xs text-gray-400 italic">{admin.phone}</p>
                                        </td>
                                        <td className="admin-table-td text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditAdmin(admin);
                                                        setFormData({ ...admin, department_name: admin.department_name || '', password: '' });
                                                        setShowForm(true);
                                                    }}
                                                    className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
                                                >✏️</button>
                                                <button onClick={() => handleDelete(admin.id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="mgmt-modal-overlay">
                        <div className="absolute inset-0" onClick={() => setShowForm(false)}></div>
                        <div className="mgmt-modal-card">
                            <div className="mgmt-modal-header">
                                <div>
                                    <h3 className="text-2xl font-black">{editAdmin ? 'Update' : 'Add New'} Admin</h3>
                                </div>
                                <button onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="mgmt-modal-form">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">First Name</label>
                                        <input
                                            required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="mgmt-modal-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Last Name</label>
                                        <input
                                            required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="mgmt-modal-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Role</label>
                                        <select
                                            required value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}
                                            className="mgmt-modal-input appearance-none"
                                        >
                                            <option value="">Select Role</option>
                                            <option value="system_admin">System Admin</option>
                                            <option value="registrar_admin">Registrar Admin</option>
                                            <option value="department_admin">Department Admin</option>
                                            <option value="cafeteria_admin">Cafeteria Admin</option>
                                            <option value="library_admin">Library Admin</option>
                                            <option value="dormitory_admin">Dormitory Admin</option>
                                            <option value="personal_protector">Personal Protector</option>
                                        </select>
                                    </div>
                                    {formData.role === 'department_admin' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Department</label>
                                            <select
                                                required value={formData.department_name} onChange={e => setFormData({ ...formData, department_name: e.target.value })}
                                                className="mgmt-modal-input appearance-none"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Username</label>
                                        <input
                                            required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            className="mgmt-modal-input"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                                        <input
                                            type="password" placeholder={editAdmin ? "Leave blank to keep current" : "Minimum 8 characters"}
                                            value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                            className="mgmt-modal-input"
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit" disabled={submitting}
                                    className="mgmt-modal-btn-submit"
                                >
                                    {submitting ? 'Processing...' : editAdmin ? 'Update Admin' : 'Create Admin'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ManageAdmins;
