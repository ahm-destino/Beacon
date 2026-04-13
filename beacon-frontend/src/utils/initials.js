/**
 * Safely extracts initials from a full name string.
 * Handled edge cases: null, undefined, non-strings, multiple spaces.
 */
export const getInitials = (name, fallback = 'ST') => {
  if (!name || typeof name !== 'string') return fallback;
  
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  
  return `${first}${second}`.toUpperCase() || fallback;
};
