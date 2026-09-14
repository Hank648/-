const STORAGE_KEY = 'health-tracker-records';

export function loadRecords() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveRecords(records) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function generateDemoData() {
  const records = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(8, 0, 0, 0);

    // Morning BP
    const sys = 118 + Math.floor(Math.random() * 30) + (i % 3 === 0 ? 15 : 0);
    const dia = 72 + Math.floor(Math.random() * 18) + (i % 4 === 0 ? 8 : 0);
    const hr = 68 + Math.floor(Math.random() * 20);

    records.push({
      id: `demo-bp-${i}-am`,
      type: 'bp',
      datetime: d.toISOString(),
      systolic: sys,
      diastolic: dia,
      heartRate: hr,
      note: i % 5 === 0 ? '頭暈' : '',
      tags: i % 5 === 0 ? ['頭暈'] : [],
    });

    // Evening BP occasionally
    if (i % 2 === 0) {
      const d2 = new Date(d);
      d2.setHours(20, 30, 0, 0);
      records.push({
        id: `demo-bp-${i}-pm`,
        type: 'bp',
        datetime: d2.toISOString(),
        systolic: sys - 5 + Math.floor(Math.random() * 12),
        diastolic: dia - 3 + Math.floor(Math.random() * 10),
        heartRate: hr - 4 + Math.floor(Math.random() * 10),
        note: '',
        tags: [],
      });
    }

    // Blood sugar
    const mealTypes = ['空腹', '飯後2小時', '睡前', '隨機'];
    const meal = mealTypes[i % 4];
    let sugar = 95 + Math.floor(Math.random() * 40);
    if (meal === '飯後2小時') sugar += 30 + Math.floor(Math.random() * 40);
    if (i % 6 === 0) sugar += 25;

    const d3 = new Date(d);
    d3.setHours(meal === '空腹' ? 7 : meal === '飯後2小時' ? 14 : meal === '睡前' ? 22 : 11, 0, 0, 0);

    records.push({
      id: `demo-bs-${i}`,
      type: 'bs',
      datetime: d3.toISOString(),
      value: sugar,
      mealStatus: meal,
      note: i % 7 === 0 ? '吃完大餐' : '',
      tags: i % 7 === 0 ? ['吃完大餐'] : [],
    });
  }

  return records.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
}

export function ensureDemoData() {
  const existing = loadRecords();
  if (existing.length === 0) {
    const demo = generateDemoData();
    saveRecords(demo);
    return demo;
  }
  return existing;
}
