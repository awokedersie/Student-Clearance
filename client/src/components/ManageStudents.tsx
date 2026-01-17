import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';

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
}

const ManageStudents: React.FC = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editStudent, setEditStudent] = useState<Student | null>(null);
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
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

    const fetchData = async (searchTerm = '') => {
        setLoading(true);
        try {
            const response = await axios.get(`/admin/system/manage-students/data?search=${searchTerm}`);
            if (response.data.success) {
                setData(response.data);
                if (response.data.edit_student) {
                    setEditStudent(response.data.edit_student);
                    setFormData(response.data.edit_student);
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
        fetchData();

        // Auto-open form if quick-action is triggered from dashboard
        const params = new URLSearchParams(location.search);
        if (params.get('action') === 'add') {
            setShowForm(true);
        }
    }, [location.search]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData(search);
    };

    const handleToggleStatus = async (studentId: string) => {
        if (!confirm('Toggle status for this student?')) return;
        try {
            await axios.get(`/admin/system/manage-students/toggle-status/${encodeURIComponent(studentId)}`);
            fetchData(search);
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (studentId: string) => {
        if (!confirm('DELETE this student? This cannot be undone.')) return;
        try {
            const response = await axios.get(`/admin/system/manage-students/delete/${encodeURIComponent(studentId)}`);
            if (response.data.success) {
                fetchData(search);
            }
        } catch (error) {
            alert('Failed to delete student');
        }
    };

    const handleBulkAction = async (action: string) => {
        if (selectedStudents.length === 0) return;
        if (!confirm(`Apply ${action} to ${selectedStudents.length} students?`)) return;

        try {
            await axios.post('/admin/system/manage-students/bulk-actions', {
                bulk_action: action,
                selected_students: selectedStudents
            });
            setSelectedStudents([]);
            fetchData(search);
        } catch (error) {
            alert('Bulk action failed');
        }
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
                alert(response.data.message || 'Student saved successfully');
                setShowForm(false);
                setEditStudent(null);
                setProfilePicture(null);
                setFormData({
                    student_id: '', name: '', last_name: '', username: '', email: '',
                    department: '', phone: '', year: '', semester: '',
                    password: '', status: 'active'
                });
                fetchData(search);
            }
        } catch (error: any) {
            alert(error.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditClick = (student: Student) => {
        setEditStudent(student);
        setFormData({
            ...student,
            password: '', // Don't fill password
        });
        setShowForm(true);
    };

    if (loading && !data) return <div className="p-8 text-center text-gray-500 font-medium">Loading Students...</div>;

    const { students = [], departments = [], user } = data || {};

    return (
        <AdminLayout user={user}>
            <div className="p-8 space-y-6">
                {/* Actions Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 w-full md:w-auto">
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

                    <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search by ID or Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="flex-1 md:w-64 bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                        />
                        <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-2xl transition-colors">
                            🔍
                        </button>
                    </form>
                </div>

                {/* Main Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="p-5 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) setSelectedStudents(students.map((s: any) => s.student_id));
                                                else setSelectedStudents([]);
                                            }}
                                            checked={selectedStudents.length === students.length && students.length > 0}
                                            className="w-5 h-5 rounded-lg border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Student</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Department & Year</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                                    <th className="p-5 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
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
                                    students.map((student: Student) => (
                                        <tr key={student.student_id} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="p-5 text-center">
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
                                            <td className="p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        {student.profile_picture ? (
                                                            <img src={`/${student.profile_picture}`} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-gray-100" />
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
                                            <td className="p-5">
                                                <p className="text-sm font-bold text-gray-700">{student.department}</p>
                                                <p className="text-xs text-gray-500 uppercase tracking-wider font-black opacity-60">Year {student.year} • Sem {student.semester}</p>
                                            </td>
                                            <td className="p-5">
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
                                            <td className="p-5 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleEditClick(student)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors">✏️</button>
                                                    <button onClick={() => handleDelete(student.student_id)} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors">🗑️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Add/Edit Modal */}
                {showForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setShowForm(false)}></div>
                        <div className="relative bg-white w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in fade-in duration-300 flex flex-col max-h-[90vh]">
                            <div className="bg-gradient-to-tr from-indigo-600 to-indigo-800 p-8 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h3 className="text-2xl font-black">{editStudent ? 'Update' : 'Add New'} Student</h3>
                                    <p className="text-indigo-100/60 text-sm font-medium italic mt-1">Fill in the student details below</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors">✕</button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Student ID</label>
                                        <input
                                            required={!!editStudent}
                                            value={editStudent ? formData.student_id : ''}
                                            placeholder={editStudent ? "" : "Automatically assigned on save"}
                                            readOnly
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl text-gray-500 font-medium italic cursor-not-allowed outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">First Name</label>
                                        <input
                                            required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Last Name</label>
                                        <input
                                            required value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                                        <input
                                            type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                                        <input
                                            required value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Department</label>
                                        <select
                                            required value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Year</label>
                                        <select
                                            required value={formData.year} onChange={e => setFormData({ ...formData, year: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                                            className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
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
                                                    className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                                    className="w-full bg-gray-50 border border-gray-100 px-5 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                                        className="w-full bg-gradient-to-r from-indigo-600 to-indigo-800 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-200 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        {submitting ? '♻️ Processing...' : editStudent ? '💾 Update Profile' : '🚀 Create Student'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default ManageStudents;
