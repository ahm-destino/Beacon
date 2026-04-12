import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Auth, clearToken } from '../../services/api';

/**
 * InactivityGuard - Monitors user activity and logs out after a specified period of inactivity.
 * Threshold: 30 minutes (1800000 ms)
 */
const INACTIVITY_THRESHOLD = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export default function InactivityGuard({ children }) {
  const navigate = useNavigate();
  const lastActiveRef = useRef(Date.now());

  const handleActivity = () => {
    lastActiveRef.current = Date.now();
    localStorage.setItem('beacon_last_active', lastActiveRef.current.toString());
  };

  const logout = () => {
    console.log('Inactivity timeout reached. Logging out...');
    Auth.logout().catch(() => {}); // Silent fail
    clearToken();
    localStorage.removeItem('beacon_last_active');
    navigate('/auth/signin', { state: { expired: true, reason: 'inactivity' } });
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    
    // Add listeners
    events.forEach(event => window.addEventListener(event, handleActivity));

    // Initial value
    const saved = localStorage.getItem('beacon_last_active');
    if (saved) {
      lastActiveRef.current = parseInt(saved);
    } else {
      handleActivity();
    }

    // Interval check
    const intervalId = setInterval(() => {
      const now = Date.now();
      const diff = now - lastActiveRef.current;
      
      if (diff >= INACTIVITY_THRESHOLD) {
        logout();
      }
    }, CHECK_INTERVAL);

    return () => {
      // Cleanup
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearInterval(intervalId);
    };
  }, [navigate]);

  return <>{children}</>;
}
