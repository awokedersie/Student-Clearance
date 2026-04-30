import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';
import Loading from '../common/Loading';
import { SkeletonClearanceStatus } from '../common/Skeleton';

const ClearanceStatus: React.FC = () => {
    const [user, setUser] = useState<any>(null);
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get('/student/clearance-status/data');
                if (response.data.success) {
                    setData(response.data);
                    setUser(response.data.user);
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

        fetchData();
    }, [navigate]);

    if (loading) return <SkeletonClearanceStatus />;

    return (
        <StudentLayout user={user}>
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
                <div className="status-card-full">
                    <div className="status-card-header">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900">Clearance Progress</h2>
                            <p className="text-gray-500 text-sm mt-1 font-medium italic">Academic Year: {data?.currentAcademicYear}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Real-time tracking</span>
                        </div>
                    </div>

                    {!data?.hasRequests ? (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">
                                📜
                            </div>
                            <h3 className="text-xl font-black text-gray-900">No requests found</h3>
                            <p className="text-gray-500 mt-2 max-w-sm mx-auto font-medium leading-relaxed">
                                You have not submitted a clearance request for this academic year.
                            </p>
                            {data?.isSystemOpen ? (
                                <Link
                                    to="/student/clearance-request"
                                    className="mt-8 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                                >
                                    Submit Request Now
                                </Link>
                            ) : (
                                <div className="mt-8 inline-flex items-center gap-2 bg-gray-100 text-gray-400 px-8 py-3 rounded-xl font-bold border border-gray-200 cursor-not-allowed">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h120 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                    System Locked
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="px-6 md:px-12 py-10">
                            <div className="relative">
                                {/* Vertical Line Connection */}
                                <div className="absolute left-[15px] md:left-[21px] top-4 bottom-4 w-0.5 bg-gray-100"></div>

                                <div className="space-y-12">
                                    {data?.clearances.map((step: any, i: number) => {
                                        const isApproved = step.status === 'approved';
                                        const isRejected = step.status === 'rejected';
                                        const isPending = step.status === 'pending';
                                        
                                        // Determine node color/icon based on status
                                        let nodeColor = 'bg-gray-200';
                                        let icon = '🕙';
                                        if (isApproved) {
                                            nodeColor = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
                                            icon = '✅';
                                        } else if (isRejected) {
                                            nodeColor = 'bg-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]';
                                            icon = '❌';
                                        } else if (isPending) {
                                            nodeColor = 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] animate-pulse';
                                            icon = '⏳';
                                        }

                                        return (
                                            <div key={i} className="relative flex items-start group">
                                                {/* Status Node */}
                                                <div className={`relative z-10 w-8 h-8 md:w-11 md:h-11 rounded-full flex items-center justify-center text-xs md:text-sm border-4 border-white transition-transform group-hover:scale-110 ${nodeColor}`}>
                                                    <span className="hidden md:block">{icon}</span>
                                                    <div className="md:hidden w-2 h-2 bg-white rounded-full"></div>
                                                </div>

                                                {/* Content Card */}
                                                <div className="ml-6 md:ml-10 flex-1">
                                                    <div className={`p-6 rounded-[24px] border transition-all hover:shadow-md ${
                                                        isApproved ? 'bg-emerald-50/30 border-emerald-100' :
                                                        isRejected ? 'bg-rose-50/30 border-rose-100' :
                                                        isPending ? 'bg-blue-50/30 border-blue-100 ring-2 ring-blue-500/5' :
                                                        'bg-gray-50/30 border-gray-100'
                                                    }`}>
                                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-sm md:text-md font-black text-gray-900 uppercase tracking-widest">{step.type}</h3>
                                                                <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Requested on {step.requestDate}</p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm border ${
                                                                    isApproved ? 'bg-emerald-100 text-emerald-600 border-emerald-200' :
                                                                    isRejected ? 'bg-rose-100 text-rose-600 border-rose-200' :
                                                                    'bg-amber-100 text-amber-600 border-amber-200'
                                                                }`}>
                                                                    {step.status}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {isRejected && step.rejectReason && (
                                                            <div className="mt-4 p-4 bg-rose-500/5 rounded-xl border border-rose-100/50">
                                                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 opacity-70">Rejection Reason</p>
                                                                <p className="text-xs md:text-sm font-medium text-rose-700 italic leading-relaxed">"{step.rejectReason}"</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="info-footer-card">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-blue-100 shrink-0">
                        ℹ️
                    </div>
                    <div>
                        <h4 className="font-black text-blue-900 text-lg">Next Steps</h4>
                        <p className="text-blue-800/70 text-sm font-medium leading-relaxed">Once all departments have approved your clearance, your final status will be updated to "Approved" and you will receive a notification to download your certificate.</p>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default ClearanceStatus;
