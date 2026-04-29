import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useFeedback } from '../../context/FeedbackContext';

const WARNING_TIME_MS = 14 * 60 * 1000; // 14 minutes
const LOGOUT_TIME_MS = 15 * 60 * 1000; // 15 minutes

const SessionTimeout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast, showConfirm } = useFeedback();
    const warningRef = useRef<NodeJS.Timeout | null>(null);
    const logoutRef = useRef<NodeJS.Timeout | null>(null);
    const [showWarning, setShowWarning] = React.useState(false);

    // List of routes where timeout should NOT trigger (like login pages)
    const publicRoutes = ['/login', '/admin/login', '/forgot-password', '/'];

    const handleLogout = async () => {
        const isAdmin = location.pathname.startsWith('/admin');
        const logoutUrl = isAdmin ? '/admin/logout' : '/logout';
        const loginUrl = isAdmin ? '/admin/login' : '/login';

        try {
            await axios.get(logoutUrl);
        } catch (error) {
            console.error('Logout error on session timeout:', error);
        }

        showToast('Your session has expired due to inactivity.', 'info');
        navigate(loginUrl);
    };

    const resetTimeout = () => {
        if (warningRef.current) clearTimeout(warningRef.current);
        if (logoutRef.current) clearTimeout(logoutRef.current);

        // Only start timeout on protected routes
        if (!publicRoutes.includes(location.pathname)) {
            // Set warning timeout
            warningRef.current = setTimeout(() => {
                setShowWarning(true);
            }, WARNING_TIME_MS);

            // Set actual logout timeout
            logoutRef.current = setTimeout(() => {
                setShowWarning(false);
                handleLogout();
            }, LOGOUT_TIME_MS);
        }
    };

    const extendSession = async () => {
        setShowWarning(false);
        try {
            // Optional: Ping server to extend session backend too
            await axios.get('/student/ping').catch(() => {});
        } catch(e) {}
        resetTimeout();
    };

    useEffect(() => {
        // Reset timeout on mount and location change
        resetTimeout();

        // Events that indicate user is active
        const events = ['mousemove', 'keydown', 'click', 'scroll'];

        const activityHandler = () => {
            // Debounce the reset to avoid performance issues
            // Only reset if we're not currently showing the warning
            if (!showWarning) {
                resetTimeout();
            }
        };

        events.forEach(event => {
            window.addEventListener(event, activityHandler);
        });

        return () => {
            if (warningRef.current) clearTimeout(warningRef.current);
            if (logoutRef.current) clearTimeout(logoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, activityHandler);
            });
        };
    }, [location.pathname, showWarning]);

    if (!showWarning) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-sm rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center mb-4">
                        <span className="text-3xl">⏳</span>
                    </div>
                    <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Session Expiring</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">
                        Your session will expire in 1 minute due to inactivity. Do you want to stay logged in?
                    </p>
                </div>
                
                <div className="p-4 bg-gray-50/50 flex gap-3 border-t border-gray-100">
                    <button 
                        onClick={handleLogout}
                        className="flex-1 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                    >
                        Log Out
                    </button>
                    <button 
                        onClick={extendSession}
                        className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:-translate-y-0.5"
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionTimeout;
