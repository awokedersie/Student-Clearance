import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';

const StudentProfile: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<any>(null);
    const [photo, setPhoto] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const navigate = useNavigate();

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        last_name: '',
        email: '',
        phone: '',
        department: '',
        year: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await axios.get('/student/profile/data');
                if (response.data.success) {
                    const student = response.data.student;
                    setUser(student);
                    setFormData({
                        name: student.name || '',
                        last_name: student.last_name || '',
                        email: student.email || '',
                        phone: student.phone || '',
                        department: student.department || '',
                        year: student.year?.toString() || ''
                    });
                    if (student.profile_photo) {
                        const photoPath = student.profile_photo.startsWith('/') || student.profile_photo.startsWith('http')
                            ? student.profile_photo
                            : `/${student.profile_photo}`;
                        setPreview(photoPath);
                    }
                } else {
                    navigate('/login');
                }
            } catch (error) {
                console.error('Fetch error:', error);
                navigate('/login');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [navigate]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
            if (!allowedTypes.includes(file.type)) {
                setMessage({
                    type: 'error',
                    text: 'Only JPG and PNG images are allowed'
                });
                e.target.value = ''; // Reset input
                return;
            }

            // Validate file size (300KB = 300 * 1024 bytes)
            const maxSize = 300 * 1024; // 300KB in bytes
            if (file.size > maxSize) {
                setMessage({
                    type: 'error',
                    text: `Image size must be less than 300KB. Your image is ${(file.size / 1024).toFixed(0)}KB`
                });
                e.target.value = ''; // Reset input
                return;
            }

            // Clear any previous error messages
            setMessage(null);

            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setMessage(null);

        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });
        if (photo) {
            data.append('profile_photo', photo);
        }

        try {
            const response = await axios.post('/student/profile', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setMessage({
                type: response.data.success ? 'success' : 'error',
                text: response.data.message
            });

            if (response.data.success) {
                if (response.data.photoPath) {
                    setPreview(response.data.photoPath);
                    setUser((prev: any) => ({ ...prev, profile_photo: response.data.photoPath, profile_picture: response.data.photoPath.startsWith('/') ? response.data.photoPath.substring(1) : response.data.photoPath }));
                }
                // Refresh other data if needed, or just update from formData
                setUser((prev: any) => ({
                    ...prev,
                    ...formData
                }));
            }
        } catch (error: any) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Update failed'
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <StudentLayout user={user}>
            <div className="max-w-5xl mx-auto animate-in fade-in duration-500">
                <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Photo Upload */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center">
                            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-6">Profile Photo</h3>
                            <div className="relative inline-block group">
                                <div className="w-40 h-40 rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center shadow-inner">
                                    {preview ? (
                                        <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl grayscale opacity-30">👤</span>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white cursor-pointer shadow-lg hover:bg-indigo-700 transition-all hover:scale-110">
                                    <span>📷</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                                </label>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-6 leading-relaxed px-4">
                                JPG or PNG only • Max 300KB
                            </p>
                        </div>

                        <div className="bg-indigo-900 rounded-3xl p-8 text-white">
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">Account ID</p>
                            <div className="text-2xl font-black italic tracking-tighter mb-4">{user?.student_id}</div>
                            <div className="h-px bg-white/10 mb-4"></div>
                            <p className="text-indigo-300 text-xs font-medium">This ID is unique to your profile and used for all institutional clearance procedures.</p>
                        </div>
                    </div>

                    {/* Right: Personal Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-10">
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-8">Personal Records</h3>

                            {message && (
                                <div className={`p-4 rounded-xl mb-8 font-bold flex items-center gap-3 animate-in zoom-in-95 ${message.type === 'success' ? 'bg-emerald-500 text-white shadow-lg' : 'bg-red-500 text-white shadow-lg'}`}>
                                    <span>{message.type === 'success' ? '✓' : '✕'}</span>
                                    {message.text}
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-6 py-4 text-gray-700 font-bold cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-6 py-4 text-gray-700 font-bold cursor-not-allowed"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Email Terminal</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-6 py-4 text-gray-700 font-bold cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Communications Port (Phone)</label>
                                    <input
                                        type="text"
                                        value={formData.phone}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-6 py-4 text-gray-700 font-bold cursor-not-allowed"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Department</label>
                                    <input
                                        type="text"
                                        value={formData.department}
                                        disabled
                                        className="w-full bg-gray-50 border border-gray-300 rounded-2xl px-6 py-4 text-gray-700 font-bold cursor-not-allowed"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !photo}
                                className="mt-10 w-full bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-[24px] font-black transition-all shadow-xl shadow-indigo-600/20 uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Uploading Photo...
                                    </>
                                ) : (
                                    <>Update Profile Photo ⟶</>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
