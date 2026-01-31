import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from './AdminLayout';

interface AuditLog {
    id: number;
    admin_name: string;
    admin_role: string;
    action: string;
    target_student_id: string | null;
    target_student_name: string | null;
    details: string | null;
    ip_address: string;
    created_at: string;
}

const AuditLogs: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`/admin/system/audit-logs/data?page=${page}`);
            if (response.data.success) {
                setData(response.data);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActionBadge = (action: string) => {
        const colors: { [key: string]: string } = {
            'APPROVE_STUDENT': 'bg-emerald-100 text-emerald-700',
            'REJECT_STUDENT': 'bg-rose-100 text-rose-700',
            'DELETE_STUDENT': 'bg-red-100 text-red-700',
            'ADD_STUDENT': 'bg-blue-100 text-blue-700',
            'UPDATE_STUDENT': 'bg-purple-100 text-purple-700',
            'ADD_ADMIN': 'bg-indigo-100 text-indigo-700',
            'UPDATE_ADMIN': 'bg-violet-100 text-violet-700',
            'DELETE_ADMIN': 'bg-red-100 text-red-700',
            'TOGGLE_STUDENT_STATUS': 'bg-amber-100 text-amber-700'
        };
        return colors[action] || 'bg-gray-100 text-gray-700';
    };

    if (loading && !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="p-20 text-center">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Loading Audit Logs...</p>
                </div>
            </div>
        );
    }

    const { logs = [], user, pagination = { page: 1, limit: 50, total: 0, pages: 1 } } = data || {};

    return (
        <AdminLayout user={user}>
            <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">System Audit Logs</h1>
                        <p className="text-gray-500 font-medium">Immutable history of administrative actions for traceability.</p>
                    </div>
                </div>

                <div className="admin-table-wrapper">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="admin-table-th">Timestamp</th>
                                    <th className="admin-table-th">Admin</th>
                                    <th className="admin-table-th">Action</th>
                                    <th className="admin-table-th">Student ID</th>
                                    <th className="admin-table-th">Details</th>
                                    <th className="admin-table-th">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                            📊 Fetching records...
                                        </td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-20 text-center text-gray-400 italic font-medium">
                                            📭 No logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.map((log: AuditLog) => (
                                        <tr key={log.id} className="admin-table-row">
                                            <td className="admin-table-td text-xs font-bold text-gray-600 font-mono whitespace-nowrap">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="admin-table-td whitespace-nowrap">
                                                <div className="font-bold text-gray-900 text-sm">{log.admin_name}</div>
                                                <div className="text-[10px] text-indigo-500 font-black uppercase tracking-tight">{log.admin_role.replace('_', ' ')}</div>
                                            </td>
                                            <td className="admin-table-td whitespace-nowrap">
                                                <span className={`admin-badge-sm ${getActionBadge(log.action)}`}>
                                                    {log.action.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="admin-table-td whitespace-nowrap">
                                                <span className="text-xs font-mono text-gray-500">
                                                    {log.target_student_id || '-'}
                                                </span>
                                            </td>
                                            <td className="admin-table-td">
                                                <p className="text-xs text-gray-500 font-medium max-w-md line-clamp-2">
                                                    {log.details || '-'}
                                                </p>
                                            </td>
                                            <td className="admin-table-td text-[10px] font-mono font-bold text-gray-400">
                                                {log.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination.pages > 1 && (
                        <div className="admin-pagination-container">
                            <p className="text-xs font-bold text-gray-400">
                                Showing page {pagination.page} of {pagination.pages}
                            </p>
                            <div className="flex gap-2">
                                <button
                                    disabled={pagination.page === 1}
                                    onClick={() => fetchLogs(pagination.page - 1)}
                                    className="admin-btn-pagination"
                                >
                                    Previous
                                </button>
                                <button
                                    disabled={pagination.page === pagination.pages}
                                    onClick={() => fetchLogs(pagination.page + 1)}
                                    className="admin-btn-pagination-active"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default AuditLogs;
