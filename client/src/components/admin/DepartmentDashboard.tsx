import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from './AdminLayout';

interface ClearanceRecord {
    id: number;
    student_id: string;
    student_name: string;
    department: string;
    status: string;
    reason: string;
    updated_at: string;
    is_locked?: boolean | number;
    can_approve?: boolean | number;
    can_reject?: boolean | number;
    locked_by_dept?: string | null;
}

const DepartmentDashboard: React.FC = () => {
    const { deptName } = useParams<{ deptName: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [selectedItems, setSelectedItems] = useState<{ id: number, studentId: string }[]>([]);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [bulkDropdownOpen, setBulkDropdownOpen] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const showMessage = (message: string, type: 'success' | 'error' = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 5000);
    };

    const apiPath = location.pathname; // e.g. /admin/departments/library

    const fetchData = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${apiPath}/data?search=${searchTerm}&status=${statusFilter}`);
            if (response.data.success) {
                setData(response.data);
                setSelectedItems([]); // Clear selection on refresh
            } else {
                navigate('/admin/login');
            }
        } catch (error: any) {
            console.error('Error fetching department data:', error);
            if (error.response?.status === 401) {
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [apiPath, statusFilter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!(event.target as Element).closest('.dropdown-container') && !(event.target as Element).closest('.bulk-dropdown-container')) {
                setActiveDropdown(null);
                setBulkDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUpdateStatus = async (studentId: string, requestId: number, status: string, reason: string = '') => {
        setSubmitting(true);
        try {
            // Send both formats to be compatible with different route handlers
            const response = await axios.post(`${apiPath}`, {
                request_id: requestId,
                student_id: studentId,
                action_type: status === 'approved' ? 'approve' : 'reject',
                approve: status === 'approved',
                reject: status === 'rejected',
                reject_reason: reason,
                bulk_action: null
            });

            if (response.data.success) {
                showMessage(response.data.message || 'Updated successfully!', 'success');
            } else {
                showMessage(response.data.message || 'Action failed', 'error');
            }
            fetchData();
        } catch (error: any) {
            console.error('Status update failed:', error);
            const errorMsg = error.response?.data?.message || 'Status update failed. Please try again.';
            showMessage(errorMsg, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleBulkAction = async (status: 'approved' | 'rejected') => {
        if (selectedItems.length === 0) {
            alert('Please select at least one student!');
            return;
        }

        let reason = '';
        if (status === 'rejected') {
            const inputReason = prompt('Reason for bulk rejection:');
            if (!inputReason) return;
            reason = inputReason;
        } else {
            if (!confirm(`Are you sure you want to approve ${selectedItems.length} student(s)?`)) return;
        }

        setSubmitting(true);
        try {
            const response = await axios.post(`${apiPath}`, {
                bulk_action: status === 'approved' ? 'approve' : 'reject',
                selected_requests: selectedItems.map(item => item.id), // For departments
                selected_students: selectedItems.map(item => item.studentId), // For registrar
                bulk_reject_reason: reason
            });

            if (response.data.success) {
                const msg = response.data.message || (response.data.messages && response.data.messages.map((m: any) => m.text || m.msg).join('\n')) || 'Bulk action completed successfully!';
                showMessage(msg, 'success');
                setSelectedItems([]);
                fetchData();
            } else {
                const msg = response.data.message || (response.data.messages && response.data.messages.map((m: any) => m.text || m.msg).join('\n')) || 'Bulk action failed';
                showMessage(msg, 'error');
            }
        } catch (error: any) {
            console.error('Bulk action failed:', error);
            showMessage(error.response?.data?.message || 'Bulk action failed. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const toggleSelection = (id: number, studentId: string) => {
        setSelectedItems(prev => {
            const isSelected = prev.some(item => item.studentId === studentId);
            if (isSelected) {
                return prev.filter(item => item.studentId !== studentId);
            } else {
                return [...prev, { id, studentId }];
            }
        });
    };

    const toggleSelectAll = (requests: any[]) => {
        // Only select non-locked requests
        const selectableRequests = requests.filter(req => !req.is_locked);

        if (selectedItems.length === selectableRequests.length && selectableRequests.length > 0) {
            setSelectedItems([]);
        } else {
            setSelectedItems(selectableRequests.map(req => ({ id: req.id, studentId: req.student_id })));
        }
    };

    if (loading && !data) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="p-20 text-center">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 font-black uppercase tracking-widest text-[10px]">Synchronising Dashboard Data...</p>
            </div>
        </div>
    );

    const { user, all_requests = [], stats = {} } = data || {};
    const isRegistrar = location.pathname.includes('registrar');
    const isProtector = location.pathname.includes('protector');

    const formatDeptName = (path: string, userDept: string) => {
        if (path.includes('registrar')) return "Registrar's Office";
        if (path.includes('protector')) return "Personal Protector";
        if (path.includes('library')) return "University Library";
        if (path.includes('cafeteria')) return "Cafeteria Service";
        if (path.includes('dormitory')) return "Dormitory Service";
        if (userDept) return userDept.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        return "Department Board";
    };

    return (
        <AdminLayout user={user}>
            <div className="dept-dashboard-layout">
                {/* Modern Inline Notification Banner */}
                {notification && (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className={`notification-banner ${notification.type === 'success'
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                            : 'bg-rose-50 border-rose-100 text-rose-800'
                            }`}>
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-inner ${notification.type === 'success' ? 'bg-emerald-100' : 'bg-rose-100'
                                }`}>
                                {notification.type === 'success' ? '✅' : '🚨'}
                            </div>
                            <div className="flex flex-col flex-1">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50 mb-0.5">
                                    {notification.type === 'success' ? 'System Success' : 'System Error'}
                                </p>
                                <p className="text-sm font-bold tracking-tight">{notification.message}</p>
                            </div>
                            <button
                                onClick={() => setNotification(null)}
                                className="hover:opacity-50 transition-opacity p-2 text-current"
                            >✕</button>
                        </div>
                    </div>
                )}
                {/* Header Section */}
                <div className="dept-header-info">
                    <div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mb-2 px-1">Administrative Dashboard</p>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter">
                            {formatDeptName(location.pathname, user?.department)}
                        </h1>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">System Online</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="dept-stats-grid">
                    {isProtector ? (
                        <div className="bg-white p-8 rounded-[35px] shadow-sm border border-gray-100 flex items-center gap-6 col-span-1 md:col-span-4">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shadow-inner">👨‍🎓</div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Students Cleared for Exit</p>
                                <p className="text-3xl font-black text-gray-900">{stats.total || 0}</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="dept-stat-pill">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📄</div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Total</p>
                                    <p className="text-2xl font-black text-gray-900">{stats.total || 0}</p>
                                </div>
                            </div>
                            <div className="dept-stat-pill">
                                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">✅</div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Approved</p>
                                    <p className="text-2xl font-black text-emerald-600">{stats.approved || stats.cleared || 0}</p>
                                </div>
                            </div>
                            <div className="dept-stat-pill">
                                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">⏳</div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Pending</p>
                                    <p className="text-2xl font-black text-amber-600">{stats.pending || 0}</p>
                                </div>
                            </div>
                            <div className="dept-stat-pill">
                                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🚫</div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Rejected</p>
                                    <p className="text-2xl font-black text-rose-600">{stats.rejected || 0}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Filters & Bulk Actions */}
                <div className="filter-controls-card">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                            {!isProtector && selectedItems.length > 0 && (
                                <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                    <div className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-black text-xs shadow-lg shadow-indigo-200">
                                        {selectedItems.length}
                                    </div>
                                    <div className="relative bulk-dropdown-container">
                                        <button
                                            onClick={() => setBulkDropdownOpen(!bulkDropdownOpen)}
                                            disabled={submitting}
                                            className={`action-pill-btn ${bulkDropdownOpen
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-white text-gray-900 border border-gray-200 hover:border-indigo-400'
                                                }`}
                                        >
                                            Actions
                                            <span className={`transition-transform duration-200 ${bulkDropdownOpen ? 'rotate-180' : ''}`}>▾</span>
                                        </button>

                                        {bulkDropdownOpen && (
                                            <div className="dropdown-menu-premium">
                                                <button
                                                    onClick={() => {
                                                        handleBulkAction('approved');
                                                        setBulkDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-emerald-50 text-emerald-600 transition-colors"
                                                >
                                                    <span className="text-sm">✅</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Approve Selected</span>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        handleBulkAction('rejected');
                                                        setBulkDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-rose-50 text-rose-600 transition-colors"
                                                >
                                                    <span className="text-sm">✕</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Reject Selected</span>
                                                </button>
                                                <div className="h-px bg-gray-100 my-1 mx-4"></div>
                                                <button
                                                    onClick={() => {
                                                        setSelectedItems([]);
                                                        setBulkDropdownOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gray-50 text-gray-500 transition-colors"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                                    </svg>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Cancel</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!isProtector && (
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="bg-white border-2 border-transparent focus:border-indigo-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all shadow-sm"
                                >
                                    <option value="">Status: All</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            )}
                        </div>

                        <form onSubmit={(e) => { e.preventDefault(); fetchData(); }} className="flex gap-2 w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Search by Student ID Or Name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 md:w-64 bg-white border-2 border-transparent focus:border-indigo-500 px-6 py-3 rounded-2xl text-xs outline-none transition-all shadow-sm font-medium"
                            />
                            <button type="submit" className="bg-gray-900 hover:bg-black text-white p-3.5 rounded-2xl transition-all shadow-lg shadow-gray-200">
                                🔍
                            </button>
                        </form>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="admin-table-wrapper">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100/50">
                                <tr>
                                    {!isProtector && (
                                        <th className="p-6 w-10">
                                            <input
                                                type="checkbox"
                                                checked={all_requests.length > 0 && selectedItems.length === all_requests.length}
                                                onChange={() => toggleSelectAll(all_requests)}
                                                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                            />
                                        </th>
                                    )}
                                    <th className="admin-table-th">Student Info</th>
                                    <th className="admin-table-th">Clearance Status</th>
                                    <th className="admin-table-th">Last Update</th>
                                    {!isProtector && (
                                        <th className="admin-table-th text-right">Review Action</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {all_requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={isProtector ? 3 : 5} className="p-20 text-center italic text-gray-400">No clearance requests found for these filters.</td>
                                    </tr>
                                ) : (
                                    all_requests.map((req: any) => (
                                        <tr key={req.student_id} className={`admin-table-row ${selectedItems.some(item => item.studentId === req.student_id) ? 'bg-indigo-50/30' : ''}`}>
                                            {!isProtector && (
                                                <td className="admin-table-td">
                                                    {!req.is_locked && (
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.some(item => item.studentId === req.student_id)}
                                                            onChange={() => toggleSelection(req.id, req.student_id)}
                                                            className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                                                        />
                                                    )}
                                                </td>
                                            )}
                                            <td className="admin-table-td">
                                                <p className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{req.student_name}</p>
                                                <p className="text-xs font-mono text-gray-400 mt-1">{req.student_id}</p>
                                            </td>
                                            <td className="admin-table-td">
                                                <div className="flex flex-col gap-1">
                                                    <div className={`status-pill-premium ${req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                                            'bg-amber-50 text-amber-600 border-amber-100'
                                                        }`}>
                                                        <span className={`w-2 h-2 rounded-full ${req.status === 'approved' ? 'bg-emerald-400' :
                                                            req.status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'
                                                            }`}></span>
                                                        {req.status}
                                                    </div>
                                                    {req.is_locked && (
                                                        <div className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-indigo-400 px-2 py-0.5 bg-indigo-50/50 rounded-md border border-indigo-100/50 self-start mt-1">
                                                            <span>🔒</span>
                                                            Stage Finalized
                                                        </div>
                                                    )}
                                                    {!req.is_locked && !req.can_approve && req.status === 'pending' && (
                                                        <div className="inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-amber-500 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-100 self-start mt-1">
                                                            <span>⏳</span> Waiting for Previous Stages
                                                        </div>
                                                    )}
                                                </div>
                                                {req.reason && <p className="text-[10px] text-gray-400 italic mt-2 leading-relaxed max-w-xs">{req.reason}</p>}
                                            </td>
                                            <td className="admin-table-td">
                                                <p className="text-xs text-gray-500 font-medium">
                                                    {req.updated_at ? new Date(req.updated_at).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                </p>
                                                <p className="text-[10px] text-gray-300 font-bold uppercase mt-1">
                                                    {req.updated_at ? new Date(req.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                                </p>
                                            </td>
                                            {!isProtector && (
                                                <td className="admin-table-td text-right relative">
                                                    <div className="flex justify-end">
                                                        {!!req.is_locked ? (
                                                            <div className="inline-flex items-center gap-2 px-6 py-2 rounded-xl bg-gray-50 border border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                                                                🔒 Stage Finalized
                                                            </div>
                                                        ) : (
                                                            <div className="relative dropdown-container">
                                                                <button
                                                                    disabled={submitting}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveDropdown(activeDropdown === req.student_id ? null : req.student_id);
                                                                    }}
                                                                    className={`action-pill-btn ${activeDropdown === req.student_id
                                                                        ? 'bg-gray-900 text-white shadow-lg'
                                                                        : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-400 hover:text-indigo-600 shadow-sm'
                                                                        }`}
                                                                >
                                                                    Actions
                                                                    <span className={`transition-transform duration-200 ${activeDropdown === req.student_id ? 'rotate-180' : ''}`}>▾</span>
                                                                </button>

                                                                {activeDropdown === req.student_id && (
                                                                    <div
                                                                        className="dropdown-menu-premium right-0"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            disabled={submitting || !req.can_approve}
                                                                            onClick={() => {
                                                                                handleUpdateStatus(req.student_id, req.id, 'approved');
                                                                                setActiveDropdown(null);
                                                                            }}
                                                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-emerald-50 text-emerald-600 transition-colors disabled:opacity-30"
                                                                        >
                                                                            <span className="text-lg">✅</span>
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">Approve</span>
                                                                        </button>
                                                                        <button
                                                                            disabled={submitting || !req.can_reject}
                                                                            onClick={() => {
                                                                                const reason = prompt('Reason for rejection:');
                                                                                if (reason) {
                                                                                    handleUpdateStatus(req.student_id, req.id, 'rejected', reason);
                                                                                }
                                                                                setActiveDropdown(null);
                                                                            }}
                                                                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-rose-50 text-rose-600 transition-colors disabled:opacity-30"
                                                                        >
                                                                            <span className="text-lg">✕</span>
                                                                            <span className="text-[10px] font-black uppercase tracking-widest">Reject</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default DepartmentDashboard;
