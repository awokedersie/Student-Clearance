import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const steps = [
    {
        number: '01',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        ),
        title: 'Login as Student',
        desc: 'Access the portal with your university-issued credentials.',
        color: 'from-indigo-500 to-blue-500',
        glow: 'rgba(99,102,241,0.3)',
    },
    {
        number: '02',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
        ),
        title: 'Submit Clearance Request',
        desc: 'One click sends requests to all required departments simultaneously.',
        color: 'from-violet-500 to-purple-500',
        glow: 'rgba(139,92,246,0.3)',
    },
    {
        number: '03',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
        ),
        title: 'Track & Get Cleared',
        desc: 'Monitor real-time approvals per department. Download your certificate when fully cleared.',
        color: 'from-emerald-500 to-teal-500',
        glow: 'rgba(16,185,129,0.3)',
    },
];

const stats = [
    { value: '6', label: 'Departments', sub: 'All in one workflow' },
    { value: '100%', label: 'Paperless', sub: 'Zero physical forms' },
    { value: '24/7', label: 'Accessible', sub: 'From anywhere' },
    { value: 'Real-time', label: 'Tracking', sub: 'Live status updates' },
];

const LandingPage: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        document.title = 'DBU Student Clearance System';
        const t = setTimeout(() => setVisible(true), 60);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#1a1060] to-[#0d1b4b] text-white overflow-x-hidden font-['Outfit',sans-serif]">

            {/* ── Decorative blobs ── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-200px] left-[-200px] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-100px] right-[-100px] w-[500px] h-[500px] bg-blue-500/15 rounded-full blur-[100px]" />
                <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-violet-600/10 rounded-full blur-[80px]" />
            </div>

            {/* ── Navbar ── */}
            <nav className="flex items-center justify-between px-6 md:px-16 py-5 border-b border-white/5 backdrop-blur-md sticky top-0 z-50 bg-black/10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
                        <img src="/logo.png" alt="DBU" className="w-full h-full object-contain p-1" />
                    </div>
                    <div>
                        <p className="font-black text-sm tracking-tight leading-none">DBU Clearance</p>
                        <p className="text-[10px] text-indigo-300/70 font-light tracking-widest uppercase leading-none mt-0.5">Debre Berhan University</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to="/admin/login"
                        className="hidden sm:block text-white/60 hover:text-white text-sm font-semibold transition-colors px-4 py-2 rounded-xl hover:bg-white/5"
                    >
                        Staff Login
                    </Link>
                    <Link
                        to="/login"
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 uppercase tracking-widest"
                    >
                        Student Login
                    </Link>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section className={`px-6 md:px-16 pt-24 pb-20 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-5 py-2 text-indigo-300 text-[11px] font-black uppercase tracking-[0.25em] mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Digital Clearance Portal
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
                    Clearance Done{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
                        Digitally.
                    </span>
                </h1>

                <p className="mt-6 text-white/50 text-base md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
                    The official student clearance management system of Debre Berhan University — fast, trackable, and fully paperless.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        to="/login"
                        className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-1 uppercase tracking-widest text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                        </svg>
                        Student Login
                    </Link>
                    <Link
                        to="/admin/login"
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold px-8 py-4 rounded-2xl transition-all uppercase tracking-widest text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        Staff / Admin
                    </Link>
                </div>

                {/* Scroll cue */}
                <div className="mt-16 flex flex-col items-center gap-2 text-white/20 animate-bounce">
                    <span className="text-[10px] uppercase tracking-widest font-black">Scroll</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                </div>
            </section>

            {/* ── Stats bar ── */}
            <section className="px-6 md:px-16 py-10 border-y border-white/5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
                    {stats.map((s, i) => (
                        <div key={i} className="space-y-1">
                            <p className="text-2xl md:text-3xl font-black text-white">{s.value}</p>
                            <p className="text-indigo-300 font-black text-xs uppercase tracking-widest">{s.label}</p>
                            <p className="text-white/30 text-[11px]">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── How it works ── */}
            <section className="px-6 md:px-16 py-24">
                <div className="text-center mb-16">
                    <p className="text-indigo-400 font-black text-[11px] uppercase tracking-[0.3em] mb-3">Simple 3-Step Process</p>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight">How It Works</h2>
                    <p className="text-white/40 mt-3 text-base max-w-md mx-auto">Complete your university clearance in minutes, not weeks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] rounded-[32px] p-8 transition-all duration-500 hover:-translate-y-2"
                            style={{ boxShadow: `0 0 0 1px rgba(255,255,255,0.04)` }}
                        >
                            {/* Glow on hover */}
                            <div
                                className="absolute inset-0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{ boxShadow: `0 20px 60px -10px ${step.glow}` }}
                            />

                            {/* Step number */}
                            <span className="text-[10px] font-black text-white/20 tracking-[0.3em] uppercase mb-4 block">{step.number}</span>

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-6 shadow-lg`}>
                                {step.icon}
                            </div>

                            <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed font-medium">{step.desc}</p>

                            {/* Connector arrow (not on last) */}
                            {i < steps.length - 1 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 -translate-y-1/2 z-10 text-white/20">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                    </svg>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Departments covered ── */}
            <section className="px-6 md:px-16 py-16 border-t border-white/5">
                <p className="text-center text-white/30 text-[11px] font-black uppercase tracking-[0.3em] mb-8">Departments Covered</p>
                <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
                    {['Library', 'Cafeteria', 'Dormitory', 'Department', 'Registrar', 'Protector'].map((dept) => (
                        <span
                            key={dept}
                            className="px-5 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-white/60 text-xs font-black uppercase tracking-widest hover:bg-white/[0.08] hover:text-white transition-all"
                        >
                            {dept}
                        </span>
                    ))}
                </div>
            </section>

            {/* ── CTA Banner ── */}
            <section className="px-6 md:px-16 py-20">
                <div className="max-w-3xl mx-auto bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 rounded-[40px] p-10 md:p-14 text-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-2xl pointer-events-none" />
                    <div className="relative z-10">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-4">Ready to get cleared?</h2>
                        <p className="text-white/50 mb-8 font-medium">Log in with your student credentials to begin the clearance process.</p>
                        <Link
                            to="/login"
                            className="inline-flex items-center gap-3 bg-white text-indigo-900 hover:bg-indigo-50 font-black px-10 py-4 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 uppercase tracking-widest text-sm"
                        >
                            Get Started
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="border-t border-white/5 px-6 md:px-16 py-8 flex flex-col md:flex-row justify-between items-center gap-4 text-white/25 text-xs">
                <p className="font-bold">© {new Date().getFullYear()} Debre Berhan University — Student Clearance System</p>
                <div className="flex items-center gap-6">
                    <Link to="/login" className="hover:text-white/60 transition-colors font-bold uppercase tracking-widest">Student</Link>
                    <Link to="/admin/login" className="hover:text-white/60 transition-colors font-bold uppercase tracking-widest">Staff</Link>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
