import { useEffect, useState } from 'react';
import { Practice } from '../services/api';

let cachedBookmarkIds = null;
let inflight = null;

const normalizeId = (id) => (id ? String(id) : '');

export const fetchBookmarkIds = async () => {
  if (cachedBookmarkIds) return cachedBookmarkIds;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const token = localStorage.getItem('beacon_token');
      if (!token) {
        cachedBookmarkIds = new Set();
        return cachedBookmarkIds;
      }
      const res = await Practice.getBookmarks();
      const payload = res?.data;
      const items = Array.isArray(payload)
        ? payload
        : (payload?.bookmarks || payload?.items || []);
      const ids = new Set(
        (items || [])
          .map((q) => normalizeId(q?.id || q?.question_id))
          .filter(Boolean)
      );
      cachedBookmarkIds = ids;
      return ids;
    } catch (_) {
      cachedBookmarkIds = new Set();
      return cachedBookmarkIds;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
};

export const updateBookmarkCache = (questionId, isBookmarked) => {
  const id = normalizeId(questionId);
  if (!id) return;
  if (!cachedBookmarkIds) cachedBookmarkIds = new Set();
  if (isBookmarked) cachedBookmarkIds.add(id);
  else cachedBookmarkIds.delete(id);
};

export const useBookmarkIds = () => {
  const [bookmarkIds, setBookmarkIds] = useState(() => {
    return cachedBookmarkIds ? new Set(cachedBookmarkIds) : new Set();
  });

  useEffect(() => {
    let mounted = true;
    fetchBookmarkIds().then((ids) => {
      if (!mounted) return;
      setBookmarkIds(new Set(ids));
    });
    return () => {
      mounted = false;
    };
  }, []);

  const updateBookmarkId = (questionId, isBookmarked) => {
    const id = normalizeId(questionId);
    if (!id) return;
    setBookmarkIds((prev) => {
      const next = new Set(prev);
      if (isBookmarked) next.add(id);
      else next.delete(id);
      return next;
    });
    updateBookmarkCache(id, isBookmarked);
  };

  return { bookmarkIds, updateBookmarkId };
};
