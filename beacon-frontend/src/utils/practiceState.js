const DEFAULT_STATE = {
  currentSession: null,
  bookmarks: [],
  history: [],
  documents: [],
};

export function loadPracticeState() {
  if (typeof window === 'undefined') return { ...DEFAULT_STATE };
  try {
    const raw = localStorage.getItem('practiceState');
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function savePracticeState(state) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('practiceState', JSON.stringify(state));
}

export function updatePracticeState(updater) {
  const prev = loadPracticeState();
  const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
  savePracticeState(next);
  return next;
}
