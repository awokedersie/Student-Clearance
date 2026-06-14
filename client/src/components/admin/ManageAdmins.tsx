import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

import { SkeletonTable } from '../common/Skeleton';
import { useFeedback } from '../../context/FeedbackContext';

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
    const { showToast, showConfirm } = useFeedback();
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
                showToast(response.data.message || 'Admin saved successfully', 'success');
                setShowForm(false);
                setEditAdmin(null);
                setFormData({
                    name: '', last_name: '', username: '', email: '',
                    phone: '', role: '', department_name: '', password: ''
                });
                fetchData(search);
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Submission failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        const confirmed = await showConfirm('Delete Admin', 'Are you sure you want to DELETE this admin account?');
        if (!confirmed) return;
        try {
            const response = await axios.get(`/admin/system/manage-admins/delete/${id}`);
            if (response.data.success) {
                showToast('Admin deleted successfully', 'success');
                fetchData(search);
            }
        } catch (error) {
            showToast('Failed to delete admin', 'error');
        }
    };

    const handleResetPassword = async (id: number) => {
        const confirmed = await showConfirm(
            'Reset Password',
            'Are you sure you want to reset this admin\'s password? A temporary password will be emailed to them.'
        );
        if (!confirmed) return;
        try {
            const response = await axios.post('/admin/system/manage-admins/reset-password', { admin_id: id });
            if (response.data.success) {
                showToast(response.data.message || 'Password reset successfully', 'success');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to reset password', 'error');
        }
    };

    if (loading && !data) return <SkeletonTable />;

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
                            placeholder="Search by name or ID..."
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
                                            <div className="flex justify-end gap-1.5">
                                                {/* Reset Password */}
                                                <div className="relative group/tip">
                                                    <button
                                                        onClick={() => handleResetPassword(admin.id)}
                                                        className="w-9 h-9 flex items-center justify-center bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm hover:shadow-amber-200 hover:shadow-md hover:scale-110 active:scale-95"
                                                        aria-label="Reset Password"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
                                                        </svg>
                                                    </button>
                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-xl">
                                                        Reset Password
                                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                                                    </span>
                                                </div>

                                                {/* Edit Admin */}
                                                <div className="relative group/tip">
                                                    <button
                                                        onClick={() => {
                                                            setEditAdmin(admin);
                                                            setFormData({ ...admin, department_name: admin.department_name || '', password: '' });
                                                            setShowForm(true);
                                                        }}
                                                        className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm hover:shadow-blue-200 hover:shadow-md hover:scale-110 active:scale-95"
                                                        aria-label="Edit Admin"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                        </svg>
                                                    </button>
                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-xl">
                                                        Edit Admin
                                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                                                    </span>
                                                </div>

                                                {/* Delete Admin */}
                                                <div className="relative group/tip">
                                                    <button
                                                        onClick={() => handleDelete(admin.id)}
                                                        className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-200 hover:shadow-md hover:scale-110 active:scale-95"
                                                        aria-label="Delete Admin"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                        </svg>
                                                    </button>
                                                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-xl">
                                                        Delete Admin
                                                        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                                                    </span>
                                                </div>
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
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                                        <input
                                            type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="mgmt-modal-input"
                                            placeholder="Enter admin email"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                                        <input
                                            required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="mgmt-modal-input"
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Username</label>
                                        <input
                                            required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                                            className="mgmt-modal-input"
                                        />
                                    </div>
                                    {!editAdmin && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                                            <input
                                                type="password" placeholder="Minimum 8 characters"
                                                required
                                                value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="mgmt-modal-input"
                                            />
                                        </div>
                                    )}
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
