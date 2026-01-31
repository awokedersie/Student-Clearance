import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from './StudentLayout';

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#fcfdfe]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

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
                                You haven't submitted any clearance requests for the current academic year yet.
                            </p>
                            <Link
                                to="/student/clearance-request"
                                className="mt-8 inline-block bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/20"
                            >
                                Submit Request Now
                            </Link>
                        </div>
                    ) : (
                        <div className="w-full">
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="status-table">
                                    <thead>
                                        <tr className="bg-gray-50/50">
                                            <th className="status-th">Department</th>
                                            <th className="status-th">Request Date</th>
                                            <th className="status-th text-center">Status</th>
                                            <th className="status-th">Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {data?.clearances.map((c: any, i: number) => (
                                            <tr key={i} className="status-row">
                                                <td className="status-td">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                                        <span className="font-black text-gray-900 uppercase tracking-tight">{c.type}</span>
                                                    </div>
                                                </td>
                                                <td className="status-td text-sm font-medium text-gray-500">
                                                    {c.requestDate}
                                                </td>
                                                <td className="status-td">
                                                    <div className="flex justify-center">
                                                        <span className={`status-pill-base ${c.status === 'approved' ? 'status-pill-approved' :
                                                            c.status === 'rejected' ? 'status-pill-rejected' :
                                                                'status-pill-pending'
                                                            }`}>
                                                            {c.status}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="status-td">
                                                    {c.status === 'rejected' ? (
                                                        <div className="rejection-note">
                                                            {c.rejectReason}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 font-medium italic">---</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden divide-y divide-gray-100">
                                {data?.clearances.map((c: any, i: number) => (
                                    <div key={i} className="p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
                                                <span className="font-black text-gray-900 uppercase tracking-tight text-sm">{c.type}</span>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border ${c.status === 'approved' ? 'status-pill-approved' :
                                                c.status === 'rejected' ? 'status-pill-rejected' :
                                                    'status-pill-pending'
                                                }`}>
                                                {c.status}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                            <span>Requested</span>
                                            <span>{c.requestDate}</span>
                                        </div>
                                        {c.status === 'rejected' && (
                                            <div className="rejection-note max-w-none">
                                                <p className="text-[9px] uppercase tracking-widest opacity-60 mb-1">Reason for Rejection</p>
                                                {c.rejectReason}
                                            </div>
                                        )}
                                    </div>
                                ))}
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
