import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useFeedback } from '../../context/FeedbackContext';

const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const SessionTimeout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useFeedback();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Only start timeout on protected routes
        if (!publicRoutes.includes(location.pathname)) {
            timeoutRef.current = setTimeout(() => {
                handleLogout();
            }, TIMEOUT_MS);
        }
    };

    useEffect(() => {
        // Reset timeout on mount and location change
        resetTimeout();

        // Events that indicate user is active
        const events = ['mousemove', 'keydown', 'click', 'scroll'];

        const activityHandler = () => {
            // Debounce the reset to avoid performance issues
            // Only reset if it's been more than a second since the last reset
            resetTimeout();
        };

        events.forEach(event => {
            window.addEventListener(event, activityHandler);
        });

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                window.removeEventListener(event, activityHandler);
            });
        };
    }, [location.pathname]);

    return null; // This component doesn't render anything
};

export default SessionTimeout;
