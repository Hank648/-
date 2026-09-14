'use client';

import { useState, useEffect } from 'react';
import { Stethoscope, Home, BarChart3, List, Award, Share2 } from 'lucide-react';
import RecordForm from '../components/RecordForm';
import Charts from '../components/Charts';
import StatsCards from '../components/StatsCards';
import DoctorMode from '../components/DoctorMode';
import RecordList from '../components/RecordList';
import { loadRecords, saveRecords } from '../lib/storage';
import { getStreak, formatDateTime } from '../lib/utils';

export default function HomePage() {
  const [records, setRecords] = useState([]);
  const [tab, setTab] = useState('record'); // record | chart | list | doctor
  const [doctorMode, setDoctorMode] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // 一開始空白，讓使用者自己慢慢累積紀錄
    const data = loadRecords();
    setRecords(data);
    setReady(true);
  }, []);

  const handleSave = (record) => {
    const next = [record, ...records];
    setRecords(next);
    saveRecords(next);
  };

  const handleDelete = (id) => {
    const next = records.filter(r => r.id !== id);
    setRecords(next);
    saveRecords(next);
  };

  const streak = getStreak(records);

  const handleQuickShare = async () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const todayRecords = records.filter(r => {
      const d = new Date(r.datetime);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayStr;
    });

    let text = '【今日健康紀錄】\n';
    if (todayRecords.length === 0) {
      text += '今天還沒有紀錄喔！';
    } else {
      todayRecords.forEach(r => {
        if (r.type === 'bp') {
          text += `血壓：${r.systolic}/${r.diastolic}${r.heartRate ? `，心率 ${r.heartRate}` : ''}\n`;
        } else {
          text += `血糖：${r.value}（${r.mealStatus}）\n`;
        }
      });
      text += '數據已記錄，繼續保持！';
    }

    if (navigator.share) {
      try {
        await navigator.share({ title: '今日健康紀錄', text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('已複製到剪貼簿，可貼到 LINE');
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg text-slate-500">
        載入中…
      </div>
    );
  }

  // Doctor mode takes over the whole view
  if (doctorMode) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between print:hidden">
          <h1 className="text-xl font-bold text-slate-800">看診模式</h1>
          <button
            onClick={() => setDoctorMode(false)}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-base font-medium"
          >
            關閉
          </button>
        </header>
        <main className="max-w-2xl mx-auto p-4">
          <DoctorMode records={records} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">健康紀錄</h1>
            <p className="text-sm text-slate-500">血壓 · 血糖追蹤</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickShare}
              className="p-2.5 rounded-xl bg-green-50 text-green-700"
              title="分享今日摘要"
            >
              <Share2 size={22} />
            </button>
            <button
              onClick={() => setDoctorMode(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-base font-medium"
            >
              <Stethoscope size={20} />
              看診模式
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-5">
        {/* Streak badge */}
        {streak >= 3 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <Award className="text-amber-500 shrink-0" size={28} />
            <div>
              <p className="text-lg font-bold text-amber-800">連續記錄 {streak} 天！</p>
              <p className="text-sm text-amber-700">
                {streak >= 7 ? '血壓控制小達人 👍' : '繼續保持，很棒！'}
              </p>
            </div>
          </div>
        )}

        {/* Content by tab */}
        {tab === 'record' && (
          <>
            <RecordForm onSave={handleSave} />
            <StatsCards records={records} />
          </>
        )}

        {tab === 'chart' && (
          <>
            <Charts records={records} />
            <StatsCards records={records} />
          </>
        )}

        {tab === 'list' && (
          <RecordList records={records} onDelete={handleDelete} />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 safe-area-pb">
        <div className="max-w-2xl mx-auto flex">
          {[
            { id: 'record', icon: Home, label: '紀錄' },
            { id: 'chart', icon: BarChart3, label: '走勢' },
            { id: 'list', icon: List, label: '歷史' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center py-3 gap-0.5 ${
                tab === id ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              <Icon size={24} strokeWidth={tab === id ? 2.5 : 2} />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
