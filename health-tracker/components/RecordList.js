'use client';

import { formatDateTime, getBPStatus, getBSStatus } from '../lib/utils';
import { Trash2 } from 'lucide-react';

export default function RecordList({ records, onDelete }) {
  const sorted = [...records].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 text-lg">
        還沒有任何紀錄
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sorted.slice(0, 50).map((r) => {
        const status = r.type === 'bp'
          ? getBPStatus(r.systolic, r.diastolic)
          : getBSStatus(r.value, r.mealStatus);

        return (
          <div
            key={r.id}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-start gap-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-sm font-medium px-2 py-0.5 rounded ${
                  r.type === 'bp' ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                }`}>
                  {r.type === 'bp' ? '血壓' : '血糖'}
                </span>
                <span className={`text-sm px-2 py-0.5 rounded border ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-xl font-bold text-slate-800">
                {r.type === 'bp'
                  ? `${r.systolic} / ${r.diastolic}${r.heartRate ? ` · 心率 ${r.heartRate}` : ''}`
                  : `${r.value} mg/dL（${r.mealStatus}）`}
              </p>
              <p className="text-base text-slate-500 mt-0.5">{formatDateTime(r.datetime)}</p>
              {(r.tags?.length > 0 || r.note) && (
                <p className="text-sm text-slate-400 mt-1">
                  {[...(r.tags || []), r.note].filter(Boolean).join(' · ')}
                </p>
              )}
            </div>
            <button
              onClick={() => {
                if (confirm('確定要刪除這筆紀錄嗎？')) onDelete(r.id);
              }}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              aria-label="刪除"
            >
              <Trash2 size={20} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
