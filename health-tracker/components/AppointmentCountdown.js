'use client';

import { useState, useEffect } from 'react';
import { CalendarClock, Pencil, X } from 'lucide-react';
import { loadAppointment, saveAppointment, clearAppointment } from '../lib/storage';

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / (1000 * 60 * 60 * 24));
}

function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${d.getMonth() + 1}月${d.getDate()}日（週${weekdays[d.getDay()]}）`;
}

export default function AppointmentCountdown() {
  const [date, setDate] = useState(null);
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadAppointment();
    setDate(saved);
    setInput(saved || '');
    setReady(true);
  }, []);

  if (!ready) return null;

  const handleSave = () => {
    if (!input) return;
    saveAppointment(input);
    setDate(input);
    setEditing(false);
  };

  const handleClear = () => {
    clearAppointment();
    setDate(null);
    setInput('');
    setEditing(false);
  };

  // 尚未設定，或正在編輯
  if (editing || !date) {
    return (
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
        <p className="text-lg font-bold text-indigo-900 flex items-center gap-2">
          <CalendarClock size={22} /> 設定下次回診日期
        </p>
        <div className="flex gap-2">
          <input
            type="date"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 text-lg border border-indigo-300 rounded-xl px-3 py-2.5 bg-white"
          />
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-lg font-semibold shrink-0"
          >
            儲存
          </button>
        </div>
        {date && (
          <button
            onClick={() => setEditing(false)}
            className="text-base text-indigo-600 font-medium underline"
          >
            取消
          </button>
        )}
      </div>
    );
  }

  const d = daysUntil(date);
  const dateLabel = formatDateLabel(date);

  let mainText, subText, colorClass;
  if (d > 0) {
    mainText = `距離回診還有 ${d} 天`;
    subText = `回診日期：${dateLabel}`;
    colorClass = 'bg-indigo-50 border-indigo-200 text-indigo-900';
  } else if (d === 0) {
    mainText = '今天就是回診日！';
    subText = '別忘了帶健保卡、藥袋、這份紀錄';
    colorClass = 'bg-amber-50 border-amber-300 text-amber-900';
  } else {
    mainText = '回診日期已過';
    subText = '記得更新下一次的回診日期';
    colorClass = 'bg-slate-100 border-slate-300 text-slate-600';
  }

  return (
    <div className={`border rounded-2xl p-4 flex items-center justify-between gap-3 ${colorClass}`}>
      <div>
        <p className="text-xl font-bold">{mainText}</p>
        <p className="text-base mt-0.5">{subText}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-2.5 rounded-xl bg-white/70"
          title="修改回診日期"
        >
          <Pencil size={20} />
        </button>
        <button
          onClick={handleClear}
          className="p-2.5 rounded-xl bg-white/70"
          title="清除回診日期"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
}
