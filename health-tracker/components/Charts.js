'use client';

import { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, ReferenceArea, Scatter, ComposedChart
} from 'recharts';
import { formatDate } from '../lib/utils';

export default function Charts({ records }) {
  const [range, setRange] = useState(30);
  const [chartType, setChartType] = useState('bp');

  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return records
      .filter(r => r.type === chartType && new Date(r.datetime) >= cutoff)
      .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  }, [records, range, chartType]);

  const bpData = useMemo(() => {
    return filtered.map(r => ({
      date: formatDate(r.datetime),
      full: r.datetime,
      sys: r.systolic,
      dia: r.diastolic,
      hr: r.heartRate,
    }));
  }, [filtered]);

  const bsData = useMemo(() => {
    return filtered.map(r => ({
      date: formatDate(r.datetime),
      full: r.datetime,
      value: r.value,
      meal: r.mealStatus,
      color: r.mealStatus === '空腹' ? '#0ea5e9' : r.mealStatus === '飯後2小時' ? '#f97316' : '#8b5cf6',
    }));
  }, [filtered]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setChartType('bp')}
          className={`flex-1 py-3 rounded-xl text-lg font-semibold ${
            chartType === 'bp' ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          血壓走勢
        </button>
        <button
          onClick={() => setChartType('bs')}
          className={`flex-1 py-3 rounded-xl text-lg font-semibold ${
            chartType === 'bs' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          血糖走勢
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setRange(d)}
            className={`flex-1 py-2.5 rounded-xl text-base font-medium ${
              range === d ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {d} 天
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-slate-400 py-12 text-lg">這段期間還沒有紀錄</p>
      ) : chartType === 'bp' ? (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bpData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[50, 180]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ fontSize: 14, borderRadius: 8 }}
                formatter={(value, name) => [value, name === 'sys' ? '收縮壓' : name === 'dia' ? '舒張壓' : '心率']}
              />
              <ReferenceArea y1={90} y2={130} fill="#d1fae5" fillOpacity={0.35} />
              <ReferenceLine y={120} stroke="#10b981" strokeDasharray="4 4" />
              <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="sys" stroke="#e11d48" strokeWidth={2.5} dot={{ r: 4 }} name="sys" />
              <Line type="monotone" dataKey="dia" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4 }} name="dia" />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-6 mt-2 text-sm text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-rose-500" /> 收縮壓</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-blue-500" /> 舒張壓</span>
            <span className="text-emerald-600">綠區 = 建議範圍</span>
          </div>
        </div>
      ) : (
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={bsData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis domain={[50, 250]} tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ fontSize: 14, borderRadius: 8 }}
                formatter={(value) => [value, '血糖']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.meal || ''}
              />
              <ReferenceArea y1={70} y2={100} fill="#d1fae5" fillOpacity={0.35} />
              <ReferenceLine y={100} stroke="#10b981" strokeDasharray="4 4" />
              <ReferenceLine y={140} stroke="#f59e0b" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-sm text-slate-500">
            <span className="text-emerald-600">綠區 ≈ 空腹正常</span>
            <span className="text-amber-600">黃線 = 飯後注意</span>
          </div>
        </div>
      )}
    </div>
  );
}
