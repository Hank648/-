'use client';

import { useState } from 'react';
import { CheckCircle, Heart, Droplets } from 'lucide-react';
import { getBPStatus, getBSStatus } from '../lib/utils';

const QUICK_TAGS = ['頭暈', '吃完大餐', '剛運動完', '忘記吃藥', '睡眠不足', '情緒不佳'];

export default function RecordForm({ onSave }) {
  const [tab, setTab] = useState('bp');
  const [datetime, setDatetime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [systolic, setSystolic] = useState('');
  const [diastolic, setDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [sugar, setSugar] = useState('');
  const [mealStatus, setMealStatus] = useState('空腹');
  const [tags, setTags] = useState([]);
  const [note, setNote] = useState('');
  const [saved, setSaved] = useState(false);
  const [hint, setHint] = useState(null);

  const toggleTag = (t) => {
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let record;

    if (tab === 'bp') {
      const sys = parseInt(systolic, 10);
      const dia = parseInt(diastolic, 10);
      const hr = heartRate ? parseInt(heartRate, 10) : null;
      if (!sys || !dia) return;
      record = {
        id: `bp-${Date.now()}`,
        type: 'bp',
        datetime: new Date(datetime).toISOString(),
        systolic: sys,
        diastolic: dia,
        heartRate: hr,
        tags,
        note,
      };
      setHint(getBPStatus(sys, dia));
    } else {
      const val = parseInt(sugar, 10);
      if (!val) return;
      record = {
        id: `bs-${Date.now()}`,
        type: 'bs',
        datetime: new Date(datetime).toISOString(),
        value: val,
        mealStatus,
        tags,
        note,
      };
      setHint(getBSStatus(val, mealStatus));
    }

    onSave(record);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setSugar('');
      setTags([]);
      setNote('');
      setHint(null);
    }, 1800);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          type="button"
          onClick={() => setTab('bp')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-lg font-semibold transition ${
            tab === 'bp' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Heart size={22} /> 血壓
        </button>
        <button
          type="button"
          onClick={() => setTab('bs')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-lg font-semibold transition ${
            tab === 'bs' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          <Droplets size={22} /> 血糖
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* DateTime */}
        <div>
          <label className="block text-base font-medium text-slate-600 mb-1">時間</label>
          <input
            type="datetime-local"
            value={datetime}
            onChange={(e) => setDatetime(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg bg-white"
          />
        </div>

        {tab === 'bp' ? (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-base font-medium text-slate-600 mb-1">收縮壓</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="120"
                value={systolic}
                onChange={(e) => setSystolic(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-xl text-center font-semibold"
                required
              />
              <p className="text-sm text-slate-400 text-center mt-1">mmHg</p>
            </div>
            <div>
              <label className="block text-base font-medium text-slate-600 mb-1">舒張壓</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="80"
                value={diastolic}
                onChange={(e) => setDiastolic(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-xl text-center font-semibold"
                required
              />
              <p className="text-sm text-slate-400 text-center mt-1">mmHg</p>
            </div>
            <div>
              <label className="block text-base font-medium text-slate-600 mb-1">心率</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="72"
                value={heartRate}
                onChange={(e) => setHeartRate(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-3 py-3 text-xl text-center font-semibold"
              />
              <p className="text-sm text-slate-400 text-center mt-1">bpm</p>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-base font-medium text-slate-600 mb-1">血糖數值</label>
              <input
                type="number"
                inputMode="numeric"
                placeholder="100"
                value={sugar}
                onChange={(e) => setSugar(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-2xl text-center font-semibold"
                required
              />
              <p className="text-sm text-slate-400 text-center mt-1">mg/dL</p>
            </div>
            <div>
              <label className="block text-base font-medium text-slate-600 mb-2">用餐狀態</label>
              <div className="grid grid-cols-2 gap-2">
                {['空腹', '飯後2小時', '睡前', '隨機'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMealStatus(m)}
                    className={`py-3 rounded-xl text-base font-medium border-2 transition ${
                      mealStatus === m
                        ? 'border-sky-500 bg-sky-50 text-sky-800'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Quick tags */}
        <div>
          <label className="block text-base font-medium text-slate-600 mb-2">快速備註（可多選）</label>
          <div className="flex flex-wrap gap-2">
            {QUICK_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => toggleTag(t)}
                className={`px-4 py-2 rounded-full text-base border transition ${
                  tags.includes(t)
                    ? 'bg-indigo-100 border-indigo-400 text-indigo-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-base font-medium text-slate-600 mb-1">其他備註</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="可選填"
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-lg"
          />
        </div>

        {/* Hint */}
        {hint && (
          <div className={`rounded-xl border px-4 py-3 text-lg font-medium ${hint.color}`}>
            這次數值：{hint.label}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={saved}
          className={`w-full py-4 rounded-2xl text-xl font-bold transition flex items-center justify-center gap-2 ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800 text-white active:bg-slate-700'
          }`}
        >
          {saved ? (
            <>
              <CheckCircle size={24} /> 紀錄成功！
            </>
          ) : (
            '儲存紀錄'
          )}
        </button>
      </form>
    </div>
  );
}
