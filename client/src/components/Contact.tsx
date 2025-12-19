import React, { useState } from 'react';
import StudentLayout from './StudentLayout';
import axios from 'axios';

const Contact: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('/current-user');
                if (response.data.success && response.data.user) {
                    setUser(response.data.user);
                    // Pre-fill form if user is logged in
                    setFormData(prev => ({
                        ...prev,
                        name: `${response.data.user.name} ${response.data.user.last_name}`,
                        email: response.data.user.email || ''
                    }));
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };
        fetchUser();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setStatus(null);

        try {
            await axios.post('/admin/contact', formData);
            setStatus({ type: 'success', msg: 'Message sent successfully! We will get back to you soon.' });
            // Clear message but keep name/email if logged in
            setFormData(prev => ({ ...prev, message: '' }));
        } catch (error) {
            setStatus({ type: 'error', msg: 'Failed to send message. Please try again later.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <StudentLayout user={user}>
            <div className="max-w-6xl mx-auto py-12 px-4 animate-in fade-in duration-700">
                <div className="grid md:grid-cols-2 gap-16 items-start">
                    <div className="space-y-8 mt-10">
                        <div>
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-[4px]">Get In Touch</span>
                            <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase mt-4 leading-none">Contact<br /><span className="text-gray-300">Administration</span></h1>
                            <div className="h-1.5 w-24 bg-indigo-600 rounded-full mt-8"></div>
                        </div>

                        <p className="text-gray-500 font-medium text-lg leading-relaxed italic">
                            Have questions or facing technical issues with the clearance system? Our team is here to assist you.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-105">
                                <span className="text-3xl">📍</span>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Office Location</p>
                                    <p className="font-bold text-gray-900">Registrar Building, Room 204</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-105">
                                <span className="text-3xl">📞</span>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Phone Line</p>
                                    <p className="font-bold text-gray-900">+251 939 013 630</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-transform hover:scale-105">
                                <span className="text-3xl">✉️</span>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Support Email</p>
                                    <p className="font-bold text-gray-900">support@dbu.edu.et</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-900 rounded-[50px] p-10 sm:p-14 shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-12 text-9xl opacity-10 group-hover:opacity-20 transition-all pointer-events-none">📤</div>

                        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                            {status && (
                                <div className={`p-4 rounded-2xl text-sm font-bold ${status.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/20 text-red-400 border border-red-500/20'}`}>
                                    {status.msg}
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] px-2">Your Full Name</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="Aman Baye"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] px-2">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                                    placeholder="aman@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[3px] px-2">Message</label>
                                <textarea
                                    required
                                    rows={5}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Describe your inquiry..."
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-700 text-white font-black uppercase tracking-[4px] py-6 rounded-3xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98] mt-4"
                            >
                                {submitting ? 'Sending Request...' : 'Dispatch Message'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default Contact;
