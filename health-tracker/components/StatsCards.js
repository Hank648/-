'use client';

import { calcStats } from '../lib/utils';

export default function StatsCards({ records }) {
  const bp = calcStats(records, 'bp', 30);
  const bs = calcStats(records, 'bs', 30);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-700 mb-3">近 30 天血壓</h3>
        {bp ? (
          <div className="space-y-2 text-base">
            <p>平均：<span className="text-2xl font-bold text-rose-600">{bp.avgSys}/{bp.avgDia}</span> mmHg</p>
            <p>最高收縮壓：{bp.maxSys}　最低：{bp.minSys}</p>
            <p>達標率（&lt;130/85）：<span className="font-bold text-emerald-600">{bp.rate}%</span></p>
            <p className="text-slate-400">共 {bp.count} 筆</p>
          </div>
        ) : (
          <p className="text-slate-400">尚無資料</p>
        )}
      </div>
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
        <h3 className="text-lg font-bold text-slate-700 mb-3">近 30 天血糖</h3>
        {bs ? (
          <div className="space-y-2 text-base">
            <p>平均：<span className="text-2xl font-bold text-sky-600">{bs.avg}</span> mg/dL</p>
            <p>最高：{bs.max}　最低：{bs.min}</p>
            <p className="text-slate-400">共 {bs.count} 筆</p>
          </div>
        ) : (
          <p className="text-slate-400">尚無資料</p>
        )}
      </div>
    </div>
  );
}
