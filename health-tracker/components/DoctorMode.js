'use client';

import { useMemo } from 'react';
import { formatDateTime, getBPStatus, getBSStatus, calcStats } from '../lib/utils';
import { Printer, Share2, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const RANGE_DAYS = 90; // 看診用，抓近三個月的紀錄

export default function DoctorMode({ records }) {
  const recent = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - RANGE_DAYS);
    return records
      .filter(r => new Date(r.datetime) >= cutoff)
      .sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
  }, [records]);

  const bpStats = calcStats(records, 'bp', RANGE_DAYS);
  const bsStats = calcStats(records, 'bs', RANGE_DAYS);

  const summary = useMemo(() => {
    const lines = [];
    if (bpStats) {
      if (bpStats.avgSys >= 140) lines.push(`近三個月收縮壓偏高（平均 ${bpStats.avgSys}）`);
      else if (bpStats.avgSys >= 130) lines.push(`近三個月收縮壓略高（平均 ${bpStats.avgSys}）`);
      else lines.push(`近三個月血壓控制尚可（平均 ${bpStats.avgSys}/${bpStats.avgDia}）`);
      lines.push(`血壓達標率 ${bpStats.rate}%（共 ${bpStats.count} 筆）`);
    }
    if (bsStats) {
      if (bsStats.avg >= 140) lines.push(`近三個月血糖平均偏高（${bsStats.avg} mg/dL）`);
      else lines.push(`近三個月血糖平均 ${bsStats.avg} mg/dL`);
    }
    return lines;
  }, [bpStats, bsStats]);

  const handleExportExcel = () => {
    const rows = recent.map((r) => {
      if (r.type === 'bp') {
        return {
          日期時間: formatDateTime(r.datetime),
          類型: '血壓',
          收縮壓: r.systolic,
          舒張壓: r.diastolic,
          心率: r.heartRate || '',
          用餐狀態: '',
          血糖數值: '',
          狀態: getBPStatus(r.systolic, r.diastolic).label,
          備註: [...(r.tags || []), r.note].filter(Boolean).join('、'),
        };
      }
      return {
        日期時間: formatDateTime(r.datetime),
        類型: '血糖',
        收縮壓: '',
        舒張壓: '',
        心率: '',
        用餐狀態: r.mealStatus,
        血糖數值: r.value,
        狀態: getBSStatus(r.value, r.mealStatus).label,
        備註: [...(r.tags || []), r.note].filter(Boolean).join('、'),
      };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    ws['!cols'] = [
      { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
      { wch: 8 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 16 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '健康紀錄');
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `健康紀錄_${dateStr}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const text = [
      '【健康紀錄看診摘要】',
      ...summary,
      '',
      '最近紀錄：',
      ...recent.slice(0, 8).map(r => {
        if (r.type === 'bp') return `${formatDateTime(r.datetime)} 血壓 ${r.systolic}/${r.diastolic}${r.heartRate ? ` 心率${r.heartRate}` : ''}`;
        return `${formatDateTime(r.datetime)} 血糖 ${r.value}（${r.mealStatus}）`;
      }),
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: '健康紀錄摘要', text });
      } catch {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('已複製到剪貼簿，可直接貼到 LINE');
    }
  };

  return (
    <div className="space-y-5 print:p-4">
      {/* Summary card */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
        <h2 className="text-xl font-bold text-indigo-900 mb-3">醫生重點摘要（近 90 天）</h2>
        <ul className="space-y-2 text-lg text-indigo-800">
          {summary.length > 0 ? summary.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span>•</span>
              <span>{s}</span>
            </li>
          )) : (
            <li className="text-slate-500">尚無足夠資料</li>
          )}
        </ul>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-white text-lg font-semibold"
        >
          <Printer size={20} /> 列印 / 存 PDF
        </button>
        <button
          onClick={handleShare}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-green-600 text-white text-lg font-semibold"
        >
          <Share2 size={20} /> 分享文字
        </button>
        <button
          onClick={handleExportExcel}
          className="col-span-2 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white text-lg font-semibold"
        >
          <Download size={20} /> 匯出 Excel（近 90 天）
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-100 border-b border-slate-200">
          <h3 className="text-lg font-bold text-slate-700">最近 90 天紀錄（倒序）</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-3 py-3 font-medium">時間</th>
                <th className="px-3 py-3 font-medium">類型</th>
                <th className="px-3 py-3 font-medium">數值</th>
                <th className="px-3 py-3 font-medium">狀態</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => {
                const status = r.type === 'bp'
                  ? getBPStatus(r.systolic, r.diastolic)
                  : getBSStatus(r.value, r.mealStatus);
                return (
                  <tr key={r.id} className="border-t border-slate-100">
                    <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(r.datetime)}</td>
                    <td className="px-3 py-3">{r.type === 'bp' ? '血壓' : '血糖'}</td>
                    <td className="px-3 py-3 font-semibold">
                      {r.type === 'bp'
                        ? `${r.systolic}/${r.diastolic}${r.heartRate ? ` · ${r.heartRate}` : ''}`
                        : `${r.value}（${r.mealStatus}）`}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2 py-1 rounded-lg text-sm border ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-3 py-8 text-center text-slate-400">尚無紀錄</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
