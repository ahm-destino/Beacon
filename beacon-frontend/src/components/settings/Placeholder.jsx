import React from 'react';
export default function Placeholder({ title }) {
  return (
    <div className="min-h-screen bg-[#F0F9FF] dark:bg-[#080C14] p-5">
      <h1 className="text-xl font-bold">{title}</h1>
      <p>This is a placeholder for the {title} screen.</p>
    </div>
  );
}
