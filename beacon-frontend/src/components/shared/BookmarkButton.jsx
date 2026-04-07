import React, { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import { Practice } from '../../services/api';
import { updateBookmarkCache } from '../../utils/bookmarks';

export default function BookmarkButton({
  questionId,
  initialState = false,
  className = '',
  onChange,
}) {
  const [isBookmarked, setIsBookmarked] = useState(Boolean(initialState));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(Boolean(initialState));
  }, [initialState, questionId]);

  const handleToggle = async (e) => {
    if (e?.stopPropagation) e.stopPropagation();
    if (!questionId || loading) return;
    setLoading(true);
    try {
      if (isBookmarked) {
        await Practice.removeBookmark(questionId);
        setIsBookmarked(false);
        updateBookmarkCache(questionId, false);
        onChange && onChange(false);
        toast.success('Bookmark removed');
      } else {
        await Practice.addBookmark(questionId);
        setIsBookmarked(true);
        updateBookmarkCache(questionId, true);
        onChange && onChange(true);
        toast.success('Bookmarked!');
      }
    } catch (_) {
      toast.error('Failed');
    } finally {
      setLoading(false);
    }
  };

  const base =
    'bookmark-btn inline-flex items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-60';
  const active =
    'bg-amber-400 border-amber-500 text-white shadow-lg shadow-amber-500/20';
  const inactive =
    'bg-white dark:bg-[#0D1525] border-sky-100 dark:border-sky-900/20 text-sky-400 dark:text-sky-600';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`${base} ${isBookmarked ? active : inactive} ${className}`}
      aria-pressed={isBookmarked}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
    >
      <Bookmark size={16} className={isBookmarked ? 'fill-current' : ''} />
    </button>
  );
}
