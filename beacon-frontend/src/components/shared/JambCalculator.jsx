import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function JambCalculator({ onClose }) {
  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForNew, setWaitingForNew] = useState(false);

  const handleNum = (num) => {
    if (display === 'Error') {
      setDisplay(String(num));
      return;
    }
    if (waitingForNew) {
      setDisplay(String(num));
      setWaitingForNew(false);
    } else {
      setDisplay(display === '0' ? String(num) : display + num);
    }
  };

  const handleDot = () => {
    if (waitingForNew) {
      setDisplay('0.');
      setWaitingForNew(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const calculate = (a, b, op) => {
    const n1 = parseFloat(a);
    const n2 = parseFloat(b);
    if (op === '+') return n1 + n2;
    if (op === '-') return n1 - n2;
    if (op === '×') return n1 * n2;
    if (op === '÷') return n2 === 0 ? 'Error' : n1 / n2;
    return n2;
  };

  const handleOp = (op) => {
    if (display === 'Error') return;
    if (operator && !waitingForNew) {
      const result = String(calculate(previous, display, operator));
      setDisplay(result);
      setPrevious(result);
    } else {
      setPrevious(display);
    }
    setOperator(op);
    setWaitingForNew(true);
  };

  const handleEqual = () => {
    if (!operator || waitingForNew || display === 'Error') return;
    setDisplay(String(calculate(previous, display, operator)));
    setOperator(null);
    setPrevious(null);
    setWaitingForNew(true);
  };

  const handleSqrt = () => {
    if (display === 'Error') return;
    const val = parseFloat(display);
    setDisplay(val < 0 ? 'Error' : String(Math.sqrt(val)));
    setWaitingForNew(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevious(null);
    setOperator(null);
    setWaitingForNew(false);
  };

  return (
    <div className="fixed top-20 right-4 sm:right-10 z-[60] w-64 bg-[#e2e8f0] dark:bg-[#1E293B] rounded-lg shadow-2xl border-2 border-slate-300 dark:border-slate-700 animate-in fade-in slide-in-from-top-4">
      {/* Header */}
      <div className="flex items-center justify-between p-2 pb-1 border-b border-slate-300 dark:border-slate-700 cursor-move rounded-t-lg bg-slate-200 dark:bg-slate-800">
        <span className="font-bold text-xs uppercase tracking-widest text-slate-500 pl-1">Calculator</span>
        <button onClick={onClose} className="p-1 rounded bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>

      {/* Screen */}
      <div className="p-3">
        <div className="bg-[#94a3b8] dark:bg-[#0f172a] rounded p-2 mb-3 text-right overflow-hidden shadow-inner border border-slate-400 dark:border-slate-900">
          <div className="font-mono text-2xl font-black text-slate-900 dark:text-sky-400 truncate">
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2">
          {/* Row 1 */}
          <button onClick={handleClear} className="col-span-2 p-2 rounded bg-red-400 text-white font-bold shadow hover:bg-red-500 active:translate-y-px">C</button>
          <button onClick={handleSqrt} className="p-2 rounded bg-slate-300 dark:bg-slate-600 font-bold shadow hover:bg-slate-400 dark:hover:bg-slate-500 active:translate-y-px text-slate-800 dark:text-white">√</button>
          <button onClick={() => handleOp('÷')} className="p-2 rounded bg-sky-600 text-white font-bold shadow hover:bg-sky-700 active:translate-y-px">÷</button>
          
          {/* Row 2 */}
          <button onClick={() => handleNum(7)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">7</button>
          <button onClick={() => handleNum(8)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">8</button>
          <button onClick={() => handleNum(9)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">9</button>
          <button onClick={() => handleOp('×')} className="p-2 rounded bg-sky-600 text-white font-bold shadow hover:bg-sky-700 active:translate-y-px">×</button>

          {/* Row 3 */}
          <button onClick={() => handleNum(4)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">4</button>
          <button onClick={() => handleNum(5)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">5</button>
          <button onClick={() => handleNum(6)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">6</button>
          <button onClick={() => handleOp('-')} className="p-2 rounded bg-sky-600 text-white font-bold shadow hover:bg-sky-700 active:translate-y-px">-</button>

          {/* Row 4 */}
          <button onClick={() => handleNum(1)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">1</button>
          <button onClick={() => handleNum(2)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">2</button>
          <button onClick={() => handleNum(3)} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">3</button>
          <button onClick={() => handleOp('+')} className="p-2 rounded bg-sky-600 text-white font-bold shadow hover:bg-sky-700 active:translate-y-px">+</button>

          {/* Row 5 */}
          <button onClick={() => handleNum(0)} className="col-span-2 p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">0</button>
          <button onClick={handleDot} className="p-2 rounded bg-white dark:bg-slate-700 font-bold shadow hover:bg-slate-100 dark:hover:bg-slate-600 active:translate-y-px text-slate-800 dark:text-white">.</button>
          <button onClick={handleEqual} className="p-2 rounded bg-emerald-600 text-white font-black shadow hover:bg-emerald-700 active:translate-y-px">=</button>
        </div>
      </div>
    </div>
  );
}
