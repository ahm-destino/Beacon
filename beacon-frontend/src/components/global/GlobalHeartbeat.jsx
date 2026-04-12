import React, { useEffect } from 'react';
import { Users, isLoggedIn } from '../../services/api';

/**
 * GlobalHeartbeat
 * Syncs the user's last_seen status with the backend every 60 seconds.
 */
export default function GlobalHeartbeat() {
  useEffect(() => {
    // Initial heartbeat
    const trigger = async () => {
      if (isLoggedIn()) {
        try {
          await Users.heartbeat();
        } catch (e) {
          // Silent fail for heartbeat
        }
      }
    };

    trigger();
    const interval = setInterval(trigger, 60000); // Once a minute

    return () => clearInterval(interval);
  }, []);

  return null; // Side-effect only component
}
