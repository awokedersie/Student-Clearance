import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';

// ── Data ──────────────────────────────────────────────────────────────────────

const navLinks = [
    { label: 'Home', href: '#home' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Departments', href: '#departments' },
    { label: 'Contact', href: '#contact' },
];

const steps = [
    {
        number: '01',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
        ),
        title: 'Login as Student',
        desc: 'Access the portal with your university-issued student ID and credentials — secure and instant.',
        color: 'from-indigo-500 to-blue-500',
        glow: 'rgba(99,102,241,0.35)',
        badge: 'Step 1',
    },
    {
        number: '02',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
            </svg>
        ),
        title: 'Submit Request',
        desc: 'One click sends your clearance request to all 6 departments simultaneously — no paperwork.',
        color: 'from-violet-500 to-purple-500',
        glow: 'rgba(139,92,246,0.35)',
        badge: 'Step 2',
    },
    {
        number: '03',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
        ),
        title: 'Track & Get Cleared',
        desc: 'Monitor real-time approvals from each department. Download your official certificate when done.',
        color: 'from-emerald-500 to-teal-500',
        glow: 'rgba(16,185,129,0.35)',
        badge: 'Step 3',
    },
];

const stats = [
    { value: '6', label: 'Departments', sub: 'All in one workflow', icon: '🏛️' },
    { value: '100%', label: 'Paperless', sub: 'Zero physical forms', icon: '♻️' },
    { value: '24/7', label: 'Accessible', sub: 'From anywhere', icon: '🌍' },
    { value: 'Live', label: 'Real-time Tracking', sub: 'Instant status updates', icon: '⚡' },
];

const departments = [
    { name: 'Library', icon: '📚', desc: 'Book returns & fines' },
    { name: 'Cafeteria', icon: '🍽️', desc: 'Meal plan settlement' },
    { name: 'Dormitory', icon: '🏠', desc: 'Room clearance' },
    { name: 'Department', icon: '🎓', desc: 'Academic clearance' },
    { name: 'Registrar', icon: '📋', desc: 'Records & documents' },
    { name: 'Protector', icon: '🛡️', desc: 'Security clearance' },
];

const features = [
    {
        icon: '⚡',
        title: 'Instant Processing',
        desc: 'Requests processed across all departments in real-time — no more waiting in queues.',
    },
    {
        icon: '🔒',
        title: 'Secure & Private',
        desc: 'Your data is protected with industry-standard encryption and secure session management.',
    },
    {
        icon: '📱',
        title: 'Works Everywhere',
        desc: 'Fully responsive — use it on your phone, tablet, or computer from anywhere.',
    },
    {
        icon: '📄',
        title: 'Digital Certificate',
        desc: 'Download your official clearance certificate as a PDF once fully approved.',
    },
];

// ── Scroll helper ─────────────────────────────────────────────────────────────
function scrollTo(id: string) {
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── Component ─────────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
    const [visible, setVisible] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.title = 'DBU Student Clearance System';
        const t = setTimeout(() => setVisible(true), 60);

        const onScroll = () => {
            setScrolled(window.scrollY > 20);
            // Highlight active nav section
            const sections = ['home', 'how-it-works', 'departments', 'contact'];
            for (const id of sections.reverse()) {
                const el = document.getElementById(id);
                if (el && window.scrollY >= el.offsetTop - 120) {
                    setActiveSection(id);
                    break;
                }
            }
        };

        const onClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };

        window.addEventListener('scroll', onScroll);
        document.addEventListener('mousedown', onClickOutside);
        return () => {
            clearTimeout(t);
            window.removeEventListener('scroll', onScroll);
            document.removeEventListener('mousedown', onClickOutside);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0a0818] via-[#110d2e] to-[#0d1b4b] text-white overflow-x-hidden" style={{ fontFamily: "'Outfit', 'Inter', sans-serif" }}>

            {/* ── Decorative blobs ── */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
                <div className="absolute top-[-180px] left-[-150px] w-[700px] h-[700px] bg-indigo-700/20 rounded-full blur-[140px]" />
                <div className="absolute bottom-[-100px] right-[-100px] w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[120px]" />
                <div className="absolute top-[45%] left-[45%] w-[400px] h-[400px] bg-violet-700/10 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[10%] w-[200px] h-[200px] bg-cyan-500/8 rounded-full blur-[80px]" />
            </div>

            {/* ══════════════════════════════════════════
                NAVBAR
            ══════════════════════════════════════════ */}
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                    scrolled
                        ? 'bg-[#0a0818]/90 backdrop-blur-xl border-b border-white/[0.08] shadow-2xl shadow-black/40'
                        : 'bg-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-5 md:px-10 py-4 flex items-center justify-between gap-6">

                    {/* Logo */}
                    <button
                        onClick={() => scrollTo('#home')}
                        className="flex items-center gap-3 group shrink-0"
                    >
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/40 border border-indigo-400/30 group-hover:scale-105 transition-transform">
                            <img src="/logo.png" alt="DBU" className="w-full h-full object-contain p-1.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        </div>
                        <div className="text-left">
                            <p className="font-black text-sm tracking-tight leading-none text-white">DBU Clearance</p>
                            <p className="text-[9px] text-indigo-300/60 font-light tracking-[0.2em] uppercase leading-none mt-1">Debre Berhan University</p>
                        </div>
                    </button>

                    {/* Desktop nav links */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(link => (
                            <button
                                key={link.label}
                                onClick={() => scrollTo(link.href)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                    activeSection === link.href.replace('#', '')
                                        ? 'text-white bg-white/10'
                                        : 'text-white/50 hover:text-white hover:bg-white/[0.06]'
                                }`}
                            >
                                {link.label}
                            </button>
                        ))}
                    </div>

                    {/* CTA buttons */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                        <Link
                            to="/admin/login"
                            className="text-white/50 hover:text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-white/[0.06] transition-all"
                        >
                            Admin
                        </Link>
                        <Link
                            to="/login"
                            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xs px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 uppercase tracking-widest"
                        >
                            Student Login
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <div className="md:hidden" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen(o => !o)}
                            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                            )}
                        </button>

                        {/* Mobile dropdown */}
                        {menuOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 mx-4 bg-[#131026]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                                <div className="p-4 space-y-1">
                                    {navLinks.map(link => (
                                        <button
                                            key={link.label}
                                            onClick={() => { scrollTo(link.href); setMenuOpen(false); }}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/[0.08] transition-all"
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                    <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
                                        <Link
                                            to="/admin/login"
                                            onClick={() => setMenuOpen(false)}
                                            className="text-center px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:text-white hover:bg-white/[0.06] transition-all"
                                        >
                                            Admin Login
                                        </Link>
                                        <Link
                                            to="/login"
                                            onClick={() => setMenuOpen(false)}
                                            className="text-center bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-xs px-4 py-3 rounded-xl uppercase tracking-widest"
                                        >
                                            Student Login
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════
                HERO
            ══════════════════════════════════════════ */}
            <section id="home" className={`px-5 md:px-16 pt-36 pb-24 text-center transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-5 py-2 text-indigo-300 text-[11px] font-black uppercase tracking-[0.25em] mb-8">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Official Digital Clearance Portal
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.05] max-w-4xl mx-auto">
                    Student Clearance,{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-cyan-400">
                        Done Digitally.
                    </span>
                </h1>

                <p className="mt-6 text-white/50 text-base md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                    The official clearance management system of <strong className="text-white/70">Debre Berhan University</strong> —
                    fast, trackable, and fully paperless. No queues. No lost forms.
                </p>

                {/* CTAs */}
                <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <Link
                        to="/login"
                        className="group flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black px-8 py-4 rounded-2xl shadow-2xl shadow-indigo-600/30 transition-all hover:-translate-y-1 hover:shadow-indigo-500/40 uppercase tracking-widest text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                        </svg>
                        Get Started — Student
                    </Link>
                    <button
                        onClick={() => scrollTo('#how-it-works')}
                        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white font-bold px-8 py-4 rounded-2xl transition-all uppercase tracking-widest text-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
                        </svg>
                        How It Works
                    </button>
                </div>

                {/* Scroll cue */}
                <div className="mt-16 flex flex-col items-center gap-2 text-white/20 animate-bounce">
                    <span className="text-[10px] uppercase tracking-widest font-black">Scroll</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
                    </svg>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                STATS BAR
            ══════════════════════════════════════════ */}
            <section className="px-5 md:px-16 py-12 border-y border-white/[0.06]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
                    {stats.map((s, i) => (
                        <div key={i} className="text-center group">
                            <div className="text-3xl mb-2">{s.icon}</div>
                            <p className="text-2xl md:text-3xl font-black text-white">{s.value}</p>
                            <p className="text-indigo-300 font-black text-xs uppercase tracking-widest mt-1">{s.label}</p>
                            <p className="text-white/30 text-[11px] mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                HOW IT WORKS
            ══════════════════════════════════════════ */}
            <section id="how-it-works" className="px-5 md:px-16 py-28">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 text-[11px] font-black uppercase tracking-[0.25em] mb-4">
                        Simple Process
                    </div>
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight">How It Works</h2>
                    <p className="text-white/40 mt-4 text-base max-w-md mx-auto leading-relaxed">Complete your university clearance in minutes, not weeks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto relative">
                    {/* Connecting line (desktop) */}
                    <div className="hidden md:block absolute top-[88px] left-[33%] right-[33%] h-px bg-gradient-to-r from-indigo-500/30 via-violet-500/30 to-emerald-500/30" />

                    {steps.map((step, i) => (
                        <div
                            key={i}
                            className="group relative bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.07] hover:border-white/[0.14] rounded-[28px] p-8 transition-all duration-500 hover:-translate-y-2"
                        >
                            {/* Glow on hover */}
                            <div
                                className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                style={{ boxShadow: `0 24px 60px -10px ${step.glow}` }}
                            />

                            {/* Badge */}
                            <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-6">
                                {step.badge}
                            </span>

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-lg`}>
                                {step.icon}
                            </div>

                            <h3 className="text-xl font-black text-white mb-3">{step.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed font-medium">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                FEATURES
            ══════════════════════════════════════════ */}
            <section className="px-5 md:px-16 py-20 border-t border-white/[0.06]">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 text-cyan-300 text-[11px] font-black uppercase tracking-[0.25em] mb-4">
                        Why Use It
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">Built for Students</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
                    {features.map((f, i) => (
                        <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300 group">
                            <div className="text-3xl mb-4 group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                            <h3 className="font-black text-white text-base mb-2">{f.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                DEPARTMENTS
            ══════════════════════════════════════════ */}
            <section id="departments" className="px-5 md:px-16 py-24 border-t border-white/[0.06]">
                <div className="text-center mb-14">
                    <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 text-emerald-300 text-[11px] font-black uppercase tracking-[0.25em] mb-4">
                        Coverage
                    </div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tight">6 Departments, One Request</h2>
                    <p className="text-white/40 mt-4 text-base max-w-md mx-auto">Your clearance request reaches all departments at once — no manual follow-up needed.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                    {departments.map((dept) => (
                        <div
                            key={dept.name}
                            className="group bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 text-center hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-300">{dept.icon}</div>
                            <p className="text-white font-black text-sm">{dept.name}</p>
                            <p className="text-white/30 text-[11px] mt-1 leading-tight">{dept.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ══════════════════════════════════════════
                CTA BANNER
            ══════════════════════════════════════════ */}
            <section className="px-5 md:px-16 py-20">
                <div className="max-w-4xl mx-auto relative overflow-hidden rounded-[40px] border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 via-violet-600/15 to-blue-600/20 p-10 md:p-16 text-center">
                    {/* Glow decorations */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-500/20 rounded-full -mr-36 -mt-36 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/15 rounded-full -ml-28 -mb-28 blur-2xl pointer-events-none" />

                    <div className="relative z-10">
                        <div className="text-5xl mb-6">🎓</div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-5">Ready to get cleared?</h2>
                        <p className="text-white/50 mb-8 font-medium max-w-lg mx-auto text-base md:text-lg">Log in with your student credentials and complete the entire clearance process — online, fast, and paperless.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                to="/login"
                                className="inline-flex items-center justify-center gap-3 bg-white text-indigo-900 hover:bg-indigo-50 font-black px-10 py-4 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 uppercase tracking-widest text-sm"
                            >
                                Start Now
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                </svg>
                            </Link>
                            <Link
                                to="/admin/login"
                                className="inline-flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl transition-all text-sm"
                            >
                                Admin Portal
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════
                FOOTER
            ══════════════════════════════════════════ */}
            <footer id="contact" className="border-t border-white/[0.06] mt-8">
                <div className="px-5 md:px-16 py-16 max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

                    {/* Brand */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
                                <img src="/logo.png" alt="DBU" className="w-full h-full object-contain p-1.5" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            </div>
                            <div>
                                <p className="font-black text-sm tracking-tight leading-none text-white">DBU Clearance System</p>
                                <p className="text-[10px] text-indigo-300/60 font-light tracking-[0.2em] uppercase leading-none mt-1">Debre Berhan University</p>
                            </div>
                        </div>
                        <p className="text-white/40 text-sm leading-relaxed max-w-sm">
                            The official digital clearance management system of Debre Berhan University.
                            Streamlining student clearance — fast, transparent, and fully paperless.
                        </p>
                        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-emerald-300 text-[11px] font-black uppercase tracking-widest">System Online</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-5">
                        <p className="text-white font-black text-xs uppercase tracking-[0.2em]">Quick Links</p>
                        <ul className="space-y-3">
                            {[
                                { label: 'Home', action: () => scrollTo('#home') },
                                { label: 'How It Works', action: () => scrollTo('#how-it-works') },
                                { label: 'Departments', action: () => scrollTo('#departments') },
                                { label: 'Student Login', href: '/login' },
                                { label: 'Admin Login', href: '/admin/login' },
                            ].map(link => (
                                <li key={link.label}>
                                    {link.href ? (
                                        <Link
                                            to={link.href}
                                            className="text-white/40 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-2 group"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400 transition-colors" />
                                            {link.label}
                                        </Link>
                                    ) : (
                                        <button
                                            onClick={link.action}
                                            className="text-white/40 hover:text-indigo-300 text-sm font-medium transition-colors flex items-center gap-2 group"
                                        >
                                            <span className="w-1 h-1 rounded-full bg-indigo-500/50 group-hover:bg-indigo-400 transition-colors" />
                                            {link.label}
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-5">
                        <p className="text-white font-black text-xs uppercase tracking-[0.2em]">Contact</p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <span className="text-lg shrink-0 mt-0.5">📍</span>
                                <span className="text-white/40 text-sm leading-relaxed">Debre Berhan University,<br />Debre Berhan, Ethiopia</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-lg shrink-0">✉️</span>
                                <a href="mailto:registrar@dbu.edu.et" className="text-white/40 hover:text-indigo-300 text-sm transition-colors">registrar@dbu.edu.et</a>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-lg shrink-0">📞</span>
                                <span className="text-white/40 text-sm">+251 11 166 06 00</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <span className="text-lg shrink-0">🌐</span>
                                <a href="https://dbu.edu.et" target="_blank" rel="noreferrer" className="text-white/40 hover:text-indigo-300 text-sm transition-colors">dbu.edu.et</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/[0.05] px-5 md:px-16 py-6 max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-white/20 text-xs font-medium">
                        © {new Date().getFullYear()} Debre Berhan University. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-white/20 text-xs">
                        <span className="hover:text-white/40 transition-colors cursor-pointer">Privacy Policy</span>
                        <span className="hover:text-white/40 transition-colors cursor-pointer">Terms of Use</span>
                        <span className="hover:text-white/40 transition-colors cursor-pointer">Help & Support</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
