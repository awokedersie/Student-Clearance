import React, { useState, useEffect } from 'react';
import axios from 'axios';
import StudentLayout from './StudentLayout';

const About: React.FC = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await axios.get('/current-user');
                if (response.data.success && response.data.user) {
                    setUser(response.data.user);
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };
        fetchUser();
    }, []);

    return (
        <StudentLayout user={user}>
            <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500">
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-10 sm:p-16 text-center">
                    <div className="w-24 h-24 bg-indigo-50 rounded-[40px] flex items-center justify-center text-5xl mx-auto mb-8 shadow-sm border border-indigo-100">
                        🏫
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase mb-4">DBU Clearance System</h1>
                    <p className="text-indigo-600 font-bold uppercase tracking-[4px] text-xs mb-8">Official Institutional Portal</p>
                    <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mb-10"></div>
                    <p className="text-gray-600 text-lg font-medium leading-relaxed italic max-w-2xl mx-auto">
                        A centralized platform designed to streamline the university clearance process for Debre Berhan University students and staff.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 px-4">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Our Mission</h3>
                        <p className="text-gray-900 font-bold text-xl leading-tight">Digital transformation for academic transparency.</p>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed">
                            We aim to eliminate bureaucratic delays by providing a real-time tracking system for all department clearances, ensuring a smooth transition for graduating and transferring students.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">System Protocol</h3>
                        <p className="text-gray-900 font-bold text-xl leading-tight">Automated Departmental Syncing.</p>
                        <p className="text-gray-500 font-medium text-sm leading-relaxed">
                            The system connects Library, Cafeteria, Dormitory, and Administrative offices into a single unified stream, allowing for instant approval and notification dispatch.
                        </p>
                    </div>
                </div>

                <div className="bg-gray-900 rounded-[40px] p-12 text-center text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 text-8xl opacity-10 grayscale group-hover:grayscale-0 transition-all">🛡️</div>
                    <h2 className="text-sm font-black uppercase tracking-[6px] text-indigo-400 mb-6">Security & Integrity</h2>
                    <p className="text-gray-400 font-medium text-lg max-w-2xl mx-auto italic leading-relaxed">
                        Built with institutional-grade security protocols to ensure that all clearance records are tamper-proof and officially verified by departmental heads.
                    </p>
                    <div className="mt-12 text-[10px] font-black text-white/40 uppercase tracking-[4px]">
                        © 2024 DEBRE BERHAN UNIVERSITY :: ALL RIGHTS RESERVED
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default About;
