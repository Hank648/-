export function formatDateTime(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}`;
}

export function formatDate(iso) {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}/${day}`;
}

export function getBPStatus(sys, dia) {
  if (sys >= 140 || dia >= 90) return { level: 'high', label: '偏高', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (sys >= 130 || dia >= 85) return { level: 'warn', label: '注意', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
  if (sys < 90 || dia < 60) return { level: 'low', label: '偏低', color: 'bg-blue-50 text-blue-800 border-blue-200' };
  return { level: 'normal', label: '正常', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

export function getBSStatus(value, mealStatus) {
  if (mealStatus === '空腹') {
    if (value >= 126) return { level: 'high', label: '偏高', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    if (value >= 100) return { level: 'warn', label: '注意', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
    if (value < 70) return { level: 'low', label: '偏低', color: 'bg-blue-50 text-blue-800 border-blue-200' };
    return { level: 'normal', label: '正常', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
  }
  // 飯後 / 其他
  if (value >= 200) return { level: 'high', label: '偏高', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (value >= 140) return { level: 'warn', label: '注意', color: 'bg-yellow-50 text-yellow-800 border-yellow-200' };
  if (value < 70) return { level: 'low', label: '偏低', color: 'bg-blue-50 text-blue-800 border-blue-200' };
  return { level: 'normal', label: '正常', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
}

export function calcStats(records, type, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = records.filter(r => r.type === type && new Date(r.datetime) >= cutoff);

  if (filtered.length === 0) return null;

  if (type === 'bp') {
    const sys = filtered.map(r => r.systolic);
    const dia = filtered.map(r => r.diastolic);
    const avgSys = Math.round(sys.reduce((a, b) => a + b, 0) / sys.length);
    const avgDia = Math.round(dia.reduce((a, b) => a + b, 0) / dia.length);
    const maxSys = Math.max(...sys);
    const minSys = Math.min(...sys);
    const normalCount = filtered.filter(r => r.systolic < 130 && r.diastolic < 85).length;
    const rate = Math.round((normalCount / filtered.length) * 100);
    return { avgSys, avgDia, maxSys, minSys, rate, count: filtered.length };
  }

  if (type === 'bs') {
    const vals = filtered.map(r => r.value);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const max = Math.max(...vals);
    const min = Math.min(...vals);
    return { avg, max, min, count: filtered.length };
  }

  return null;
}

export function getStreak(records) {
  if (records.length === 0) return 0;
  const days = new Set();
  records.forEach(r => {
    const d = new Date(r.datetime);
    days.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
  });
  const sorted = Array.from(days).sort().reverse();
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const check = new Date(today);
    check.setDate(check.getDate() - i);
    const key = `${check.getFullYear()}-${check.getMonth()}-${check.getDate()}`;
    if (sorted.includes(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}
