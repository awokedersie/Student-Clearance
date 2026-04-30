import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFeedback } from '../../context/FeedbackContext';
import AdminLayout from './AdminLayout';

import { SkeletonTable } from '../common/Skeleton';
import ConfirmModal from '../common/ConfirmModal';

interface Student {
    student_id: string;
    name: string;
    last_name: string;
    email: string;
    department: string;
    username: string;
    status: string;
    year: string;
    semester: string;
    profile_picture?: string;
    phone: string;
    clearance_status?: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface ApiResponse {
    success: boolean;
    user: any;
    students: Student[];
    departments: string[];
    pagination?: Pagination;
    edit_student?: Student;
    message?: string;
}

const ManageStudents: React.FC = () => {
    const { showToast, showConfirm } = useFeedback();
    const [students, setStudents] = useState<Student[]>([]);
    const [departments, setDepartments] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Pagination & Search State
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);

    const [showForm, setShowForm] = useState(false);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        isDangerous: false,
        onConfirm: () => { },
    });

    const [formData, setFormData] = useState({
        student_id: '',
        name: '',
        last_name: '',
        username: '',
        email: '',
        department: '',
        phone: '',
        year: '',
        semester: '',
        password: '',
        status: 'active'
    });
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

    const fetchData = async (page = 1, searchTerm = search, deptFilter = departmentFilter) => {
        setLoading(true);
        try {
            const response = await axios.get<ApiResponse>(`/admin/system/manage-students/data`, {
                params: {
                    search: searchTerm,
                    department: deptFilter,
                    page: page,

                    limit: limit
                }
            });

            if (response.data.success) {
                setStudents(response.data.students || []);
                setDepartments(response.data.departments || []);
                setCurrentUser(response.data.user);

                if (response.data.pagination) {
                    setTotalPages(response.data.pagination.totalPages);
                    setCurrentPage(response.data.pagination.page);
                }

                if (response.data.edit_student) {
                    setEditStudent(response.data.edit_student);
                    setFormData({ ...formData, ...response.data.edit_student, password: '' });
                    setShowForm(true);
                }
            } else {
                navigate('/admin/login');
            }
        } catch (error: any) {
            console.error('Error fetching students:', error);
            if (error.response?.status === 401) {
                navigate('/admin/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const location = useLocation();

    useEffect(() => {
        fetchData(currentPage, search, departmentFilter);
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add') {
            setShowForm(true);
        }
    }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetchData(currentPage, search, departmentFilter);
    }, [currentPage, limit]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchData(1, search, departmentFilter);
    };

    // --- Action Handlers ---

    const executeToggleStatus = async (studentId: string) => {
        try {
            await axios.post(`/admin/system/manage-students/toggle-status`, { studentId });
            showToast('Student status updated', 'success');
            fetchData(currentPage, search);
        } catch (error) {
            showToast('Failed to update status', 'error');
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleToggleStatus = (studentId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Change Status?',
            message: 'Are you sure you want to toggle the active status for this student?',
            isDangerous: false,
            onConfirm: () => executeToggleStatus(studentId)
        });
    };

    const executeDelete = async (studentId: string) => {
        try {
            const response = await axios.post(`/admin/system/manage-students/delete`, { studentId });
            if (response.data.success) {
                showToast('Student deleted successfully', 'success');
                fetchData(currentPage, search);
            }
        } catch (error) {
            showToast('Failed to delete student', 'error');
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleDelete = (studentId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Student',
            message: 'This action cannot be undone. Are you surely you want to permanently delete this student?',
            isDangerous: true,
            onConfirm: () => executeDelete(studentId)
        });
    };

    const executeBulkAction = async (action: string) => {
        try {
            await axios.post('/admin/system/manage-students/bulk-actions', {
                bulk_action: action,
                selected_students: selectedStudents
            });
            showToast(`Bulk ${action} applied successfully`, 'success');
            setSelectedStudents([]);
            fetchData(currentPage, search);
        } catch (error) {
            showToast('Bulk action failed', 'error');
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    };

    const handleResetPassword = async (studentId: string) => {
        const confirmed = await showConfirm(
            'Reset Password',
            'Are you sure you want to reset this student\'s password? A temporary password will be emailed to them.'
        );

        if (!confirmed) return;

        try {
            const response = await axios.post('/admin/system/manage-students/reset-password', { student_id: studentId });
            if (response.data.success) {
                showToast(response.data.message || 'Password reset successfully', 'success');
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Failed to reset password', 'error');
        }
    };

    const handleBulkAction = (action: string) => {
        if (selectedStudents.length === 0) return;
        setConfirmModal({
            isOpen: true,
            title: 'Confirm Bulk Action',
            message: `Are you sure you want to apply "${action}" to ${selectedStudents.length} selected students?`,
            isDangerous: action === 'delete',
            onConfirm: () => executeBulkAction(action)
        });
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        const url = editStudent
            ? '/admin/system/manage-students/update'
            : '/admin/system/manage-students/add';

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });
        if (profilePicture) data.append('profile_picture', profilePicture);

        try {
            const response = await axios.post(url, data);
            if (response.data.success) {
                showToast(response.data.message || 'Student saved successfully', 'success');
                setShowForm(false);
                setEditStudent(null);
                setProfilePicture(null);
                setFormData({
                    student_id: '', name: '', last_name: '', username: '', email: '',
                    department: '', phone: '', year: '', semester: '',
                    password: '', status: 'active'
                });
                fetchData(currentPage, search);
            }
        } catch (error: any) {
            showToast(error.response?.data?.message || 'Submission failed', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (student: Student) => {
        setEditStudent(student);
        setFormData({
            ...formData,
            ...student,
            password: '',
        });
        setShowForm(true);
    };

    if (loading && students.length === 0) return <SkeletonTable />;

    return (
        <AdminLayout user={currentUser}>
            <div className="p-8 space-y-6">
                {/* Actions Header */}
                <div className="mgmt-action-bar">
                    <div className="flex items-center gap-4 w-full xl:w-auto flex-wrap">
                        <button
                            onClick={() => {
                                setEditStudent(null);
                                setFormData({
                                    student_id: '', name: '', last_name: '', username: '', email: '',
                                    department: '', phone: '', year: '', semester: '',
                                    password: '', status: 'active'
                                });
                                setShowForm(true);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
                        >
                            <span>➕</span> Add Student
                        </button>

                        {selectedStudents.length > 0 && (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                                <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 italic">
                                    {selectedStudents.length} selected
                                </span>
                                <select
                                    onChange={(e) => handleBulkAction(e.target.value)}
                                    className="bg-gray-900 text-white text-xs font-bold px-4 py-3 rounded-2xl border-none outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                                >
                                    <option value="">Bulk Actions</option>
                                    <option value="activate">Activate</option>
                                    <option value="deactivate">Deactivate</option>
                                    <option value="delete">Delete</option>
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 w-full xl:w-auto">
                        <select
                            value={departmentFilter}
                            onChange={(e) => {
                                setDepartmentFilter(e.target.value);
                                setCurrentPage(1);
                                fetchData(1, search, e.target.value);
                            }}
                            className="bg-white border-2 border-transparent focus:border-indigo-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all shadow-sm max-w-[200px]"
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept, index) => (
                                <option key={index} value={dept}>{dept}</option>
                            ))}
                        </select>
                        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                            <input
                                type="text"
                                placeholder="Search by ID or Name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="mgmt-search-input w-full"
                            />
                            <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-2xl transition-colors">
                                🔍
                            </button>
                        </form>
                    </div>
                </div>

                {/* Main Table */}
                <div className="admin-table-wrapper">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-5 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedStudents(students.map(s => s.student_id));
                                                else setSelectedStudents([]);
                                            }}
                                            checked={selectedStudents.length === students.length && students.length > 0}
                                            className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="admin-table-th">Student</th>
                                    <th className="admin-table-th">Department & Year</th>
                                    <th className="admin-table-th">Status</th>
                                    <th className="admin-table-th">Clearance Status</th>
                                    <th className="admin-table-th text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {students.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="text-6xl mb-4">📭</div>
                                            <h3 className="text-xl font-bold text-gray-300">No students found</h3>
                                        </td>
                                    </tr>
                                ) : (
                                    students.map((student) => (
                                        <tr key={student.student_id} className="admin-table-row">
                                            <td className="admin-table-td text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student.student_id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) setSelectedStudents([...selectedStudents, student.student_id]);
                                                        else setSelectedStudents(selectedStudents.filter(id => id !== student.student_id));
                                                    }}
                                                    className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="admin-table-td">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        {student.profile_picture ? (
                                                            <img src={`/${student.profile_picture}`} alt={student.name} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100" />
                                                        ) : (
                                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-400 font-bold border-2 border-dashed border-indigo-100 italic">
                                                                {student.name[0]}
                                                            </div>
                                                        )}
                                                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${student.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{student.name} {student.last_name}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{student.student_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="admin-table-td">
                                                <p className="text-sm font-bold text-gray-700">{student.department}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-black opacity-60">Year {student.year} • Sem {student.semester}</p>
                                                </div>
                                            </td>
                                            <td className="admin-table-td">
                                                <button
                                                    onClick={() => handleToggleStatus(student.student_id)}
                                                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${student.status === 'active'
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100'
                                                        : 'bg-red-50 text-red-600 border border-red-100 hover:bg-red-100'
                                                        }`}
                                                >
                                                    {student.status}
                                                </button>
                                            </td>
                                            <td className="admin-table-td">
                                                {student.clearance_status ? (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        student.clearance_status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                                        student.clearance_status === 'rejected' ? 'bg-red-50 text-red-600 border border-red-100' :
                                                        'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        {student.clearance_status}
                                                    </span>
                                                ) : (
                                                    <span className="px-3 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 text-[10px] font-black uppercase tracking-widest">Not Started</span>
                                                )}
                                            </td>
                                            <td className="admin-table-td text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {/* Reset Password */}
                                                    <div className="relative group/tip">
                                                        <button
                                                            onClick={() => handleResetPassword(student.student_id)}
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

                                                    {/* Edit Student */}
                                                    <div className="relative group/tip">
                                                        <button
                                                            onClick={() => handleEditClick(student)}
                                                            className="w-9 h-9 flex items-center justify-center bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-sm hover:shadow-blue-200 hover:shadow-md hover:scale-110 active:scale-95"
                                                            aria-label="Edit Student"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
                                                            </svg>
                                                        </button>
                                                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-xl">
                                                            Edit Student
                                                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                                                        </span>
                                                    </div>

                                                    {/* Delete Student */}
                                                    <div className="relative group/tip">
                                                        <button
                                                            onClick={() => handleDelete(student.student_id)}
                                                            className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-200 hover:shadow-md hover:scale-110 active:scale-95"
                                                            aria-label="Delete Student"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                            </svg>
                                                        </button>
                                                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg whitespace-nowrap opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 shadow-xl">
                                                            Delete Student
                                                            <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {students.length > 0 && (
                        <div className="p-6 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                <span>Rows per page:</span>
                                <select
                                    value={limit}
                                    onChange={(e) => {
                                        setLimit(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page
                                    }}
                                    className="bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={20}>20</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    ◀ Prev
                                </button>

                                <span className="text-sm font-bold text-gray-700">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    disabled={currentPage >= totalPages}
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    className="p-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Next ▶
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Add/Edit Modal */}
                {showForm && (
                    <div className="mgmt-modal-overlay">
                        <div className="absolute inset-0" onClick={() => setShowForm(false)}></div>
                        <div className="mgmt-modal-card">
                            <div className="mgmt-modal-header bg-gradient-to-tr from-indigo-600 to-indigo-800">
                                <div>
                                    <h3 className="text-2xl font-black">{editStudent ? 'Update' : 'Add New'} Student</h3>
                                    <p className="text-indigo-100/60 text-sm font-medium italic mt-1">Fill in the student details below</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="mgmt-modal-form">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Student ID</label>
                                        <input
                                            required={!!editStudent}
                                            value={editStudent ? formData.student_id : ''}
                                            placeholder={editStudent ? "" : "Automatically assigned on save"}
                                            readOnly
                                            className="mgmt-modal-input text-gray-500 font-medium italic cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">First Name</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => {
                                                const value = e.target.value;
                                                const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                                                setFormData({ ...formData, name: capitalized });
                                            }}
                                            className="mgmt-modal-input focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Last Name</label>
                                        <input
                                            required
                                            value={formData.last_name}
                                            onChange={e => {
                                                const value = e.target.value;
                                                const capitalized = value.charAt(0).toUpperCase() + value.slice(1);
                                                setFormData({ ...formData, last_name: capitalized });
                                            }}
                                            className="mgmt-modal-input focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                                        <input
                                            type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="mgmt-modal-input focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                                        <input
                                            required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="mgmt-modal-input focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Department</label>
                                        <select
                                            required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            className="mgmt-modal-input focus:ring-indigo-500 appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Year</label>
                                        <select
                                            required value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}
                                            className="mgmt-modal-input focus:ring-indigo-500 appearance-none"
                                        >
                                            <option value="">Select Year</option>
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Semester</label>
                                        <select
                                            required value={formData.semester} onChange={e => setFormData({ ...formData, semester: e.target.value })}
                                            className="mgmt-modal-input focus:ring-indigo-500 appearance-none"
                                        >
                                            <option value="">Select Semester</option>
                                            <option value="1">1st Semester</option>
                                            <option value="2">2nd Semester</option>
                                        </select>
                                    </div>
                                    {!editStudent && (
                                        <>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Username</label>
                                                <input
                                                    required={!editStudent}
                                                    value={formData.username}
                                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                                    className="mgmt-modal-input focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
                                                <input
                                                    type="password"
                                                    placeholder="Minimum 8 characters"
                                                    required={!editStudent}
                                                    value={formData.password}
                                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                    className="mgmt-modal-input focus:ring-indigo-500"
                                                />
                                            </div>
                                        </>
                                    )}
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Profile Photo (Max 2MB)</label>
                                        <input
                                            type="file" onChange={e => setProfilePicture(e.target.files?.[0] || null)}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-3 rounded-2xl focus:outline-none text-xs"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 shrink-0">
                                    <button
                                        type="submit" disabled={submitting}
                                        className="mgmt-modal-btn-submit from-indigo-600 to-indigo-800 shadow-indigo-200"
                                    >
                                        {submitting ? '♻️ Processing...' : editStudent ? '💾 Update Profile' : '🚀 Create Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Confirm Modal */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    isDangerous={confirmModal.isDangerous}
                    onConfirm={confirmModal.onConfirm}
                    onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                />
            </div>
        </AdminLayout>
    );
};

export default ManageStudents;
