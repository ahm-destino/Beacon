/**
 * Time Utility for Beacon
 * Standardizes time formatting across the app and handles UTC offsets.
 */

/**
 * Parses an ISO string or Date object and returns a human-readable "time ago" string.
 * Handles potential future-dated timestamps (clock skew) gracefully.
 * Ensuring we treat all incoming timestamps as UTC.
 */
export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  
  let date;
  try {
    date = new Date(dateInput);
  } catch (e) {
    return '';
  }

  if (isNaN(date.getTime())) return '';

  const now = new Date();
  // Ensure we are comparing UTC to UTC if needed, but Date objects are generally absolute
  const diffInSeconds = Math.floor((now - date) / 1000);

  // Handle clock skew (future dates)
  if (diffInSeconds < 0) return 'Just now';
  
  if (diffInSeconds < 60) return 'Just now';
  
  const minutes = Math.floor(diffInSeconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  
  return date.toLocaleDateString();
};

/**
 * Returns a short timestamp (e.g., "12:30 PM")
 */
export const formatShortTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
