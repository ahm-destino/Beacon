import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SubScreenHeader from '../shared/SubScreenHeader';

export default function VoiceSetup() {
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedTopic, setSelectedTopic] = useState('Algebra');
  const [selectedDifficulty, setSelectedDifficulty] = useState('Normal');
  const [selectedDuration, setSelectedDuration] = useState('15min');
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14]">
      <SubScreenHeader title="Voice Setup" />

      <div className="px-5 pt-6 pb-24 space-y-6">
        <div>
          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Subject</p>
          <div className="flex flex-wrap gap-2">
            {['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'].map(s => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`px-4 py-2 rounded-xl border-2 text-xs font-bold transition-all ${
                  selectedSubject === s ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Topic</p>
          <input
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="w-full bg-white dark:bg-[#0D1525] border border-sky-100 dark:border-sky-900/20 rounded-xl px-4 py-3 text-sm"
          />
        </div>

        <div>
          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Difficulty</p>
          <div className="flex gap-2">
            {['Basic', 'Normal', 'Deep'].map(level => (
              <button
                key={level}
                onClick={() => setSelectedDifficulty(level)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold ${
                  selectedDifficulty === level ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Duration</p>
          <div className="flex gap-2">
            {['15min', '30min', '45min'].map(d => (
              <button
                key={d}
                onClick={() => setSelectedDuration(d)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold ${
                  selectedDuration === d ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="font-[var(--font-syne)] font-bold text-sm text-[#0369A1] dark:text-[#0EA5E9] mb-2">Language</p>
          <div className="flex gap-2">
            {['English', 'Pidgin'].map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold ${
                  selectedLanguage === lang ? 'border-sky-600 bg-sky-600 text-white' : 'border-sky-100 dark:border-sky-900/20 bg-white dark:bg-[#0D1525] text-sky-700 dark:text-sky-400'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate('/ai-tutor/voice/session', {
            state: {
              subject: selectedSubject,
              topic: selectedTopic,
              difficulty: selectedDifficulty,
              duration: selectedDuration,
              language: selectedLanguage,
            },
          })}
          className="w-full py-4 rounded-xl font-[var(--font-syne)] font-black text-lg text-white bg-sky-700 dark:bg-sky-500 hover:bg-sky-800 shadow-[0_12px_32px_rgba(3,105,161,0.35)] active:scale-[0.98] transition-all duration-200"
        >
          Start Voice Session
        </button>
      </div>
    </div>
  );
}
