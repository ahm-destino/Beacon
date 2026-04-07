import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';
import BookmarkButton from '../shared/BookmarkButton';
import { useBookmarkIds } from '../../utils/bookmarks';

export default function ActiveStudyRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { room, joining, invitedBy } = location.state || {};
  const [sharedQuestions, setSharedQuestions] = useState([]);
  const { bookmarkIds, updateBookmarkId } = useBookmarkIds();

  const shareQuestion = (question) => {
    setSharedQuestions(prev => [...prev, question]);
  };

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title={room?.title || 'Study Room'} />
      <div className="px-5 pt-6 pb-24 space-y-4">
        <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
          <p className="text-sm text-sky-600">{joining ? 'You joined this room.' : 'Room in progress.'}</p>
          {invitedBy && (
            <p className="text-xs text-sky-400 mt-1">Invited by {invitedBy.name}</p>
          )}
        </div>

        <button
          onClick={() => shareQuestion({ id: Date.now(), text: 'Sample shared question' })}
          className="w-full py-3 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 font-[var(--font-syne)] font-bold"
        >
          Share Question
        </button>

        <button
          onClick={() => navigate('/practice/setup/exam-type', { state: { mode: 'practice', roomSession: true, roomId: id } })}
          className="w-full py-3 rounded-xl bg-sky-700 text-white font-[var(--font-syne)] font-bold"
        >
          Practice This Together
        </button>

        <button
          onClick={() => navigate('/community')}
          className="w-full py-3 rounded-xl bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 text-sky-700 font-[var(--font-syne)] font-bold"
        >
          Leave Room
        </button>

        {sharedQuestions.length > 0 && (
          <div className="bg-white dark:bg-[#0D1525] rounded-2xl border border-sky-100 dark:border-sky-900/20 p-4">
            <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Shared Questions</p>
            <div className="space-y-2">
              {sharedQuestions.map(q => {
                const qId = q.question_id || q.id;
                const isUuid = typeof qId === 'string' && qId.includes('-');
                const isBookmarked = isUuid ? bookmarkIds.has(String(qId)) : false;
                return (
                  <div key={q.id} className="flex items-start justify-between gap-2">
                    <p className="text-xs text-sky-600">- {q.text}</p>
                    {isUuid && (
                      <BookmarkButton
                        questionId={qId}
                        initialState={isBookmarked}
                        onChange={(next) => updateBookmarkId(qId, next)}
                        className="w-7 h-7 rounded-lg"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
