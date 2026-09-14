"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  ComposedChart,
  ScatterChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from "recharts";
import {
  Activity,
  Droplet,
  TrendingUp,
  Stethoscope,
  Share2,
  Printer,
  Check,
  AlertCircle,
  Award,
  Plus,
  Minus,
  X,
  Clock,
} from "lucide-react";

/* =========================================================================
   資料層說明
   這個版本已經改用瀏覽器的 localStorage 保存資料，所以使用者關閉分頁、
   重新整理，甚至關機後再打開，紀錄都還會在（僅保存在「同一支手機、
   同一個瀏覽器」）。如果之後需要讓家人在不同手機上看到同一份資料，
   就要把下方標記【資料層】的地方換成後端資料庫（例如 Supabase）。
   ========================================================================= */
const STORAGE_KEY = "health-tracker-readings";

const NOTE_TAGS = ["頭暈", "吃完大餐", "剛運動完", "忘記吃藥", "睡眠不足", "心情緊張"];
const MEAL_STATUSES = ["空腹", "飯後2小時", "睡前", "隨機"];
const MEAL_COLORS = {
  空腹: "#0f766e",
  "飯後2小時": "#b45309",
  睡前: "#334155",
  隨機: "#7c3aed",
};
const WEEKDAYS = ["日", "一", "二", "三", "四", "五", "六"];

function pad(n) {
  return String(n).padStart(2, "0");
}
function toLocalInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}
function formatMD(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function formatMDHM(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatFullRow(dateStr) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

/* ---------------------- 醫學參考區間（僅供參考，非診斷） ---------------------- */
function evaluateBP(sys, dia) {
  if (sys >= 140 || dia >= 90) return { level: "high", label: "偏高，建議留意並與醫師討論" };
  if (sys >= 130 || dia >= 85) return { level: "caution", label: "略高，建議持續觀察" };
  if (sys < 90 || dia < 60) return { level: "low", label: "偏低，留意是否有頭暈狀況" };
  return { level: "normal", label: "數值正常，狀態穩定" };
}
function evaluateGlucose(value, meal) {
  let normalMax = 139;
  let cautionMax = 199;
  if (meal === "空腹") {
    normalMax = 99;
    cautionMax = 125;
  } else if (meal === "飯後2小時") {
    normalMax = 139;
    cautionMax = 199;
  } else if (meal === "睡前") {
    normalMax = 150;
    cautionMax = 180;
  }
  if (value < 70) return { level: "low", label: "偏低，留意是否有冒冷汗、手抖" };
  if (value <= normalMax) return { level: "normal", label: "數值正常，狀態穩定" };
  if (value <= cautionMax) return { level: "caution", label: "略高，建議持續觀察" };
  return { level: "high", label: "偏高，建議留意並與醫師討論" };
}
const STATUS_STYLE = {
  normal: { badge: "bg-emerald-50 text-emerald-800 border-emerald-300", dot: "bg-emerald-500" },
  caution: { badge: "bg-amber-50 text-amber-800 border-amber-300", dot: "bg-amber-500" },
  high: { badge: "bg-amber-100 text-amber-900 border-amber-400", dot: "bg-amber-600" },
  low: { badge: "bg-sky-50 text-sky-800 border-sky-300", dot: "bg-sky-500" },
};

/* ---------------------- 示範資料產生器（初次載入用） ---------------------- */
function generateDemoData() {
  const readings = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let id = 1;
  for (let i = 13; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const drift = i <= 3 ? 12 : 0; // 讓最近幾天血壓稍微偏高，示範看診摘要的重點提醒

    const sysAM = Math.round(122 + drift + (Math.random() * 14 - 7));
    const diaAM = Math.round(78 + drift * 0.5 + (Math.random() * 10 - 5));
    const hrAM = Math.round(70 + (Math.random() * 12 - 6));
    const amTime = new Date(day);
    amTime.setHours(7, 20 + Math.round(Math.random() * 25));
    readings.push({
      id: id++,
      type: "bp",
      date: amTime.toISOString(),
      systolic: sysAM,
      diastolic: diaAM,
      heartRate: hrAM,
      note: "",
    });

    if (Math.random() > 0.15) {
      const sysPM = Math.round(126 + (Math.random() * 16 - 8));
      const diaPM = Math.round(80 + (Math.random() * 10 - 5));
      const hrPM = Math.round(74 + (Math.random() * 12 - 6));
      const pmTime = new Date(day);
      pmTime.setHours(19, Math.round(Math.random() * 40));
      readings.push({
        id: id++,
        type: "bp",
        date: pmTime.toISOString(),
        systolic: sysPM,
        diastolic: diaPM,
        heartRate: hrPM,
        note: Math.random() > 0.85 ? "吃完大餐" : "",
      });
    }

    if (Math.random() > 0.1) {
      const fasting = Math.round(96 + (Math.random() * 22 - 8));
      const fTime = new Date(day);
      fTime.setHours(6, 45 + Math.round(Math.random() * 20));
      readings.push({
        id: id++,
        type: "glucose",
        date: fTime.toISOString(),
        glucose: fasting,
        mealStatus: "空腹",
        note: "",
      });
    }
    if (Math.random() > 0.4) {
      const pp = Math.round(128 + (Math.random() * 40 - 10));
      const ppTime = new Date(day);
      ppTime.setHours(13, 20 + Math.round(Math.random() * 30));
      readings.push({
        id: id++,
        type: "glucose",
        date: ppTime.toISOString(),
        glucose: pp,
        mealStatus: "飯後2小時",
        note: Math.random() > 0.8 ? "剛運動完" : "",
      });
    }
    if (Math.random() > 0.92) {
      readings[readings.length - 1].note =
        (readings[readings.length - 1].note ? readings[readings.length - 1].note + "、" : "") + "忘記吃藥";
    }
  }
  return readings.sort((a, b) => new Date(a.date) - new Date(b.date));
}

/* ---------------------- 共用元件：數字加減輸入 ---------------------- */
function NumberStepper({ label, value, onChange, unit, step = 1, min = 0, max = 999 }) {
  return (
    <div>
      <label className="block text-base font-medium text-stone-600 mb-2">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`減少${label}`}
          onClick={() => onChange(Math.max(min, value - step))}
          className="w-12 h-12 shrink-0 rounded-full bg-stone-100 border-2 border-stone-300 text-stone-700 active:bg-stone-200 flex items-center justify-center"
        >
          <Minus className="w-5 h-5" strokeWidth={3} />
        </button>
        <div className="flex-1 flex items-baseline justify-center gap-1 bg-white border-2 border-stone-300 rounded-2xl py-3">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-20 text-center text-3xl font-bold text-stone-900 bg-transparent outline-none"
          />
          <span className="text-base text-stone-500">{unit}</span>
        </div>
        <button
          type="button"
          aria-label={`增加${label}`}
          onClick={() => onChange(Math.min(max, value + step))}
          className="w-12 h-12 shrink-0 rounded-full bg-stone-100 border-2 border-stone-300 text-stone-700 active:bg-stone-200 flex items-center justify-center"
        >
          <Plus className="w-5 h-5" strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}

/* ========================================================================= */

export default function HealthTracker() {
  const [readings, setReadings] = useState(() => {
    // 【資料層】啟動時優先讀取瀏覽器裡已保存的資料，沒有的話才用 14 天示範資料
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        /* 讀取失敗就退回示範資料 */
      }
    }
    return generateDemoData();
  });

  useEffect(() => {
    // 【資料層】每次資料變動就自動存回瀏覽器，使用者不需要手動按「儲存」
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
      } catch (e) {
        /* 儲存失敗（例如瀏覽器隱私模式）時，資料僅保留在本次使用期間 */
      }
    }
  }, [readings]);
  const [activeTab, setActiveTab] = useState("record");
  const [doctorMode, setDoctorMode] = useState(false);

  const [recordType, setRecordType] = useState("bp");
  const [sys, setSys] = useState(120);
  const [dia, setDia] = useState(80);
  const [hr, setHr] = useState(72);
  const [glucoseVal, setGlucoseVal] = useState(100);
  const [mealStatus, setMealStatus] = useState("空腹");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateTime, setDateTime] = useState(() => toLocalInputValue(new Date()));
  const [feedback, setFeedback] = useState(null);

  const [trendType, setTrendType] = useState("bp");
  const [trendRange, setTrendRange] = useState(30);

  const [shareText, setShareText] = useState(null);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const toggleTag = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleSubmit = () => {
    const isoDate = new Date(dateTime).toISOString();
    const note = selectedTags.join("、");
    let newReading;
    let status;

    if (recordType === "bp") {
      const implausible = sys < 60 || sys > 260 || dia < 30 || dia > 160 || hr < 30 || hr > 220;
      status = evaluateBP(sys, dia);
      newReading = { id: Date.now(), type: "bp", date: isoDate, systolic: sys, diastolic: dia, heartRate: hr, note };
      setFeedback({
        level: status.level,
        title: implausible ? "已記錄，但數值範圍較不常見" : "紀錄成功",
        message: `血壓 ${sys}/${dia} mmHg・心率 ${hr} bpm — ${status.label}`,
      });
    } else {
      const implausible = glucoseVal < 20 || glucoseVal > 600;
      status = evaluateGlucose(glucoseVal, mealStatus);
      newReading = {
        id: Date.now(),
        type: "glucose",
        date: isoDate,
        glucose: glucoseVal,
        mealStatus,
        note,
      };
      setFeedback({
        level: status.level,
        title: implausible ? "已記錄，但數值範圍較不常見" : "紀錄成功",
        message: `血糖（${mealStatus}）${glucoseVal} mg/dL — ${status.label}`,
      });
    }

    setReadings((prev) => [...prev, newReading].sort((a, b) => new Date(a.date) - new Date(b.date))); // 【資料層】
    setSelectedTags([]);
    setDateTime(toLocalInputValue(new Date()));
  };

  /* ---------------------- 連續記錄天數 ---------------------- */
  const streak = useMemo(() => {
    const daySet = new Set(readings.map((r) => new Date(r.date).toDateString()));
    let count = 0;
    const cursor = new Date();
    if (!daySet.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
    while (daySet.has(cursor.toDateString())) {
      count++;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }, [readings]);

  /* ---------------------- 趨勢資料 ---------------------- */
  const trendData = useMemo(() => {
    const cutoff = Date.now() - trendRange * 24 * 3600 * 1000;
    return readings
      .filter((r) => r.type === trendType && new Date(r.date).getTime() >= cutoff)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [readings, trendType, trendRange]);

  const bpChartData = useMemo(
    () =>
      trendData.map((r) => ({
        label: formatMD(r.date),
        full: formatMDHM(r.date),
        ts: new Date(r.date).getTime(),
        systolic: r.systolic,
        diastolic: r.diastolic,
      })),
    [trendData]
  );
  const glucoseChartData = useMemo(
    () =>
      trendData.map((r) => ({
        ts: new Date(r.date).getTime(),
        full: formatMDHM(r.date),
        value: r.glucose,
        meal: r.mealStatus,
      })),
    [trendData]
  );
  const tickInterval = Math.max(0, Math.ceil(bpChartData.length / 6) - 1);

  const bpStats = useMemo(() => {
    if (!trendData.length || trendType !== "bp") return null;
    const sysVals = trendData.map((d) => d.systolic);
    const diaVals = trendData.map((d) => d.diastolic);
    const avgSys = Math.round(sysVals.reduce((a, b) => a + b, 0) / sysVals.length);
    const avgDia = Math.round(diaVals.reduce((a, b) => a + b, 0) / diaVals.length);
    const onTarget = trendData.filter((d) => d.systolic < 130 && d.diastolic < 85).length;
    return {
      avgSys,
      avgDia,
      maxSys: Math.max(...sysVals),
      minSys: Math.min(...sysVals),
      rate: Math.round((onTarget / trendData.length) * 100),
    };
  }, [trendData, trendType]);

  const glucoseStats = useMemo(() => {
    if (!trendData.length || trendType !== "glucose") return null;
    const vals = trendData.map((d) => d.glucose);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    const onTarget = trendData.filter((d) => evaluateGlucose(d.glucose, d.mealStatus).level === "normal").length;
    return {
      avg,
      max: Math.max(...vals),
      min: Math.min(...vals),
      rate: Math.round((onTarget / trendData.length) * 100),
    };
  }, [trendData, trendType]);

  /* ---------------------- 看診模式資料 ---------------------- */
  const last14 = useMemo(() => {
    const cutoff = Date.now() - 14 * 24 * 3600 * 1000;
    return readings.filter((r) => new Date(r.date).getTime() >= cutoff).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [readings]);
  const bpLast14 = last14.filter((r) => r.type === "bp");
  const glucoseLast14 = last14.filter((r) => r.type === "glucose");

  const insights = useMemo(() => {
    const list = [];
    if (bpLast14.length) {
      const avgSys = Math.round(bpLast14.reduce((a, r) => a + r.systolic, 0) / bpLast14.length);
      const avgDia = Math.round(bpLast14.reduce((a, r) => a + r.diastolic, 0) / bpLast14.length);
      const morning = bpLast14.filter((r) => new Date(r.date).getHours() < 12);
      if (morning.length) {
        const morningAvgSys = Math.round(morning.reduce((a, r) => a + r.systolic, 0) / morning.length);
        if (morningAvgSys >= 135) {
          list.push({ level: "caution", text: `近兩週晨間收縮壓偏高，平均為 ${morningAvgSys} mmHg，建議與醫師討論` });
        } else {
          list.push({ level: "normal", text: `近兩週血壓大致穩定，平均為 ${avgSys}/${avgDia} mmHg` });
        }
      }
    }
    if (glucoseLast14.length) {
      const fasting = glucoseLast14.filter((r) => r.mealStatus === "空腹");
      if (fasting.length) {
        const avgFasting = Math.round(fasting.reduce((a, r) => a + r.glucose, 0) / fasting.length);
        if (avgFasting <= 100) {
          list.push({ level: "normal", text: `空腹血糖控制良好，平均 ${avgFasting} mg/dL` });
        } else {
          list.push({ level: "caution", text: `空腹血糖平均為 ${avgFasting} mg/dL，略高於建議範圍` });
        }
      }
    }
    const forgetCount = last14.filter((r) => r.note && r.note.includes("忘記吃藥")).length;
    if (forgetCount > 0) {
      list.push({ level: "caution", text: `近兩週有 ${forgetCount} 次記錄提到忘記服藥，建議留意用藥規律性` });
    }
    return list;
  }, [bpLast14, glucoseLast14, last14]);

  /* ---------------------- 分享 ---------------------- */
  function buildShareText() {
    const latestBP = [...readings].filter((r) => r.type === "bp").sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const latestGlucose = [...readings]
      .filter((r) => r.type === "glucose")
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
    const lines = ["今日健康記錄分享 📋"];
    if (latestBP) {
      const ev = evaluateBP(latestBP.systolic, latestBP.diastolic);
      const mood = ev.level === "normal" ? "數值很穩定！" : "建議多留意～";
      lines.push(`血壓：${latestBP.systolic}/${latestBP.diastolic} mmHg，心跳 ${latestBP.heartRate}，${mood}`);
    }
    if (latestGlucose) {
      lines.push(`血糖（${latestGlucose.mealStatus}）：${latestGlucose.glucose} mg/dL`);
    }
    return lines.join("\n");
  }
  function openShare() {
    setShareText(buildShareText());
  }
  async function copyShareText() {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      if (textareaRef.current) {
        textareaRef.current.select();
        try {
          document.execCommand("copy");
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (e2) {
          /* 靜默失敗，使用者仍可手動選取文字複製 */
        }
      }
    }
  }
  function openLine() {
    try {
      window.open(`https://line.me/R/msg/text/?${encodeURIComponent(shareText)}`, "_blank");
    } catch (e) {
      /* 沙盒環境可能封鎖跳窗，使用者可改用複製文字 */
    }
  }

  const TABS = [
    { key: "record", label: "記錄", icon: Activity },
    { key: "trends", label: "趨勢", icon: TrendingUp },
    { key: "doctor", label: "看診摘要", icon: Stethoscope },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-area { padding: 0 !important; }
          body { background: white !important; }
        }
      `}</style>

      {/* Header */}
      <header className="no-print sticky top-0 z-20 bg-teal-800 text-white px-4 py-4 shadow-sm">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold leading-tight">健康記錄</h1>
            {streak > 0 && (
              <p className="flex items-center gap-1 text-sm text-teal-100 mt-0.5">
                <Award className="w-4 h-4" />
                連續記錄 {streak} 天{streak >= 7 ? "！血壓控制小達人" : ""}
              </p>
            )}
          </div>
          <button
            onClick={() => setDoctorMode((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-base font-semibold shrink-0 ${
              doctorMode ? "bg-white text-teal-800 border-white" : "bg-teal-700 text-white border-teal-500"
            }`}
          >
            <Stethoscope className="w-5 h-5" />
            {doctorMode ? "看診模式中" : "看診模式"}
          </button>
        </div>
      </header>

      <main className="print-area max-w-xl mx-auto px-4 pb-28 pt-5">
        {doctorMode ? (
          <DoctorView
            last14={last14}
            insights={insights}
            onPrint={() => window.print()}
            onShare={openShare}
          />
        ) : activeTab === "record" ? (
          <RecordView
            recordType={recordType}
            setRecordType={setRecordType}
            sys={sys}
            setSys={setSys}
            dia={dia}
            setDia={setDia}
            hr={hr}
            setHr={setHr}
            glucoseVal={glucoseVal}
            setGlucoseVal={setGlucoseVal}
            mealStatus={mealStatus}
            setMealStatus={setMealStatus}
            selectedTags={selectedTags}
            toggleTag={toggleTag}
            dateTime={dateTime}
            setDateTime={setDateTime}
            onSubmit={handleSubmit}
            feedback={feedback}
            onDismissFeedback={() => setFeedback(null)}
          />
        ) : activeTab === "trends" ? (
          <TrendsView
            trendType={trendType}
            setTrendType={setTrendType}
            trendRange={trendRange}
            setTrendRange={setTrendRange}
            bpChartData={bpChartData}
            glucoseChartData={glucoseChartData}
            tickInterval={tickInterval}
            bpStats={bpStats}
            glucoseStats={glucoseStats}
          />
        ) : null}
      </main>

      {/* Bottom nav */}
      {!doctorMode && (
        <nav className="no-print fixed bottom-0 left-0 right-0 bg-white border-t-2 border-stone-200 z-20">
          <div className="max-w-xl mx-auto grid grid-cols-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex flex-col items-center justify-center gap-1 py-3 min-h-[64px] ${
                    active ? "text-teal-700" : "text-stone-400"
                  }`}
                >
                  <Icon className="w-6 h-6" strokeWidth={active ? 2.5 : 2} />
                  <span className={`text-sm ${active ? "font-bold" : "font-medium"}`}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Share modal */}
      {shareText !== null && (
        <div className="no-print fixed inset-0 z-30 bg-stone-900/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Share2 className="w-5 h-5 text-teal-700" />
                分享今日摘要
              </h3>
              <button onClick={() => setShareText(null)} aria-label="關閉" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100">
                <X className="w-6 h-6 text-stone-500" />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              readOnly
              value={shareText}
              className="w-full h-32 text-lg border-2 border-stone-300 rounded-xl p-3 resize-none bg-stone-50"
            />
            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                onClick={copyShareText}
                className="py-3 rounded-2xl border-2 border-teal-700 text-teal-800 font-semibold text-lg flex items-center justify-center gap-2"
              >
                {copied ? <Check className="w-5 h-5" /> : null}
                {copied ? "已複製" : "複製文字"}
              </button>
              <button
                onClick={openLine}
                className="py-3 rounded-2xl bg-teal-700 text-white font-semibold text-lg"
              >
                開啟 LINE 分享
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* 快速紀錄頁 */
function RecordView(props) {
  const {
    recordType, setRecordType, sys, setSys, dia, setDia, hr, setHr,
    glucoseVal, setGlucoseVal, mealStatus, setMealStatus,
    selectedTags, toggleTag, dateTime, setDateTime, onSubmit, feedback, onDismissFeedback,
  } = props;

  return (
    <div className="space-y-5">
      {/* 類別切換 */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setRecordType("bp")}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 text-lg font-semibold ${
            recordType === "bp" ? "bg-teal-700 border-teal-700 text-white" : "bg-white border-stone-300 text-stone-600"
          }`}
        >
          <Activity className="w-5 h-5" /> 血壓
        </button>
        <button
          onClick={() => setRecordType("glucose")}
          className={`flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 text-lg font-semibold ${
            recordType === "glucose" ? "bg-teal-700 border-teal-700 text-white" : "bg-white border-stone-300 text-stone-600"
          }`}
        >
          <Droplet className="w-5 h-5" /> 血糖
        </button>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-5">
        {/* 時間 */}
        <div>
          <label className="flex items-center gap-1.5 text-base font-medium text-stone-600 mb-2">
            <Clock className="w-4 h-4" /> 測量時間
          </label>
          <input
            type="datetime-local"
            value={dateTime}
            onChange={(e) => setDateTime(e.target.value)}
            className="w-full text-lg border-2 border-stone-300 rounded-2xl px-4 py-3 bg-white"
          />
        </div>

        {recordType === "bp" ? (
          <div className="space-y-5">
            <NumberStepper label="收縮壓" value={sys} onChange={setSys} unit="mmHg" min={60} max={260} />
            <NumberStepper label="舒張壓" value={dia} onChange={setDia} unit="mmHg" min={30} max={160} />
            <NumberStepper label="心率" value={hr} onChange={setHr} unit="bpm" min={30} max={220} />
          </div>
        ) : (
          <div className="space-y-5">
            <NumberStepper label="血糖" value={glucoseVal} onChange={setGlucoseVal} unit="mg/dL" step={5} min={20} max={600} />
            <div>
              <label className="block text-base font-medium text-stone-600 mb-2">用餐狀態</label>
              <div className="grid grid-cols-2 gap-3">
                {MEAL_STATUSES.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMealStatus(m)}
                    className={`py-3 rounded-2xl border-2 text-base font-semibold ${
                      mealStatus === m ? "bg-teal-700 border-teal-700 text-white" : "bg-white border-stone-300 text-stone-600"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 快速備註 */}
        <div>
          <label className="block text-base font-medium text-stone-600 mb-2">快速備註（可複選）</label>
          <div className="flex flex-wrap gap-2">
            {NOTE_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2.5 rounded-full border-2 text-base font-medium ${
                  selectedTags.includes(tag)
                    ? "bg-amber-100 border-amber-400 text-amber-900"
                    : "bg-white border-stone-300 text-stone-600"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onSubmit}
          className="w-full py-4 rounded-2xl bg-teal-700 text-white text-xl font-bold flex items-center justify-center gap-2 active:bg-teal-800"
        >
          <Check className="w-6 h-6" /> 儲存紀錄
        </button>
      </div>

      {feedback && (
        <div className={`border-2 rounded-2xl p-5 ${STATUS_STYLE[feedback.level].badge}`}>
          <div className="flex items-start gap-3">
            <span className={`w-3 h-3 rounded-full mt-2 shrink-0 ${STATUS_STYLE[feedback.level].dot}`} />
            <div className="flex-1">
              <p className="text-lg font-bold">{feedback.title}</p>
              <p className="text-base mt-1">{feedback.message}</p>
            </div>
          </div>
          <button
            onClick={onDismissFeedback}
            className="w-full mt-4 py-3 rounded-2xl bg-white border-2 border-current text-lg font-semibold"
          >
            好，我知道了
          </button>
        </div>
      )}
    </div>
  );
}

/* ========================================================================= */
/* 趨勢視覺化頁 */
function TrendsView(props) {
  const { trendType, setTrendType, trendRange, setTrendRange, bpChartData, glucoseChartData, tickInterval, bpStats, glucoseStats } = props;
  const data = trendType === "bp" ? bpChartData : glucoseChartData;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setTrendType("bp")}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-lg font-semibold ${
            trendType === "bp" ? "bg-teal-700 border-teal-700 text-white" : "bg-white border-stone-300 text-stone-600"
          }`}
        >
          <Activity className="w-5 h-5" /> 血壓
        </button>
        <button
          onClick={() => setTrendType("glucose")}
          className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-lg font-semibold ${
            trendType === "glucose" ? "bg-teal-700 border-teal-700 text-white" : "bg-white border-stone-300 text-stone-600"
          }`}
        >
          <Droplet className="w-5 h-5" /> 血糖
        </button>
      </div>

      <div className="flex gap-2">
        {[7, 30, 90].map((r) => (
          <button
            key={r}
            onClick={() => setTrendRange(r)}
            className={`flex-1 py-2.5 rounded-full border-2 text-base font-semibold ${
              trendRange === r ? "bg-stone-800 border-stone-800 text-white" : "bg-white border-stone-300 text-stone-600"
            }`}
          >
            {r} 天
          </button>
        ))}
      </div>

      {data.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500 text-lg">
          這段期間還沒有紀錄
        </div>
      ) : (
        <>
          {/* 統計卡片 */}
          <div className="grid grid-cols-2 gap-3">
            {trendType === "bp" && bpStats ? (
              <>
                <StatCard label={`近${trendRange}天平均血壓`} value={`${bpStats.avgSys}/${bpStats.avgDia}`} unit="mmHg" accent="teal" />
                <StatCard label="達標率" value={`${bpStats.rate}`} unit="%" accent="emerald" />
                <StatCard label="最高收縮壓" value={bpStats.maxSys} unit="mmHg" accent="amber" />
                <StatCard label="最低收縮壓" value={bpStats.minSys} unit="mmHg" accent="sky" />
              </>
            ) : glucoseStats ? (
              <>
                <StatCard label={`近${trendRange}天平均血糖`} value={glucoseStats.avg} unit="mg/dL" accent="teal" />
                <StatCard label="達標率" value={`${glucoseStats.rate}`} unit="%" accent="emerald" />
                <StatCard label="最高血糖" value={glucoseStats.max} unit="mg/dL" accent="amber" />
                <StatCard label="最低血糖" value={glucoseStats.min} unit="mg/dL" accent="sky" />
              </>
            ) : null}
          </div>

          {/* 圖表 */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <h3 className="text-lg font-bold mb-3">{trendType === "bp" ? "血壓走勢" : "血糖走勢"}</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                {trendType === "bp" ? (
                  <ComposedChart data={bpChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <ReferenceArea y1={80} y2={120} fill="#ecfdf5" fillOpacity={0.7} />
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="label" interval={tickInterval} tick={{ fontSize: 12, fill: "#78716c" }} />
                    <YAxis domain={[50, 180]} tick={{ fontSize: 12, fill: "#78716c" }} />
                    <ReferenceLine y={140} stroke="#b45309" strokeDasharray="4 4" label={{ value: "140", position: "right", fontSize: 11, fill: "#b45309" }} />
                    <Tooltip labelFormatter={(_, p) => (p && p[0] ? p[0].payload.full : "")} />
                    <Legend />
                    <Line type="monotone" dataKey="systolic" name="收縮壓" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="diastolic" name="舒張壓" stroke="#94a3b8" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                ) : (
                  <ScatterChart margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                    <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} tickFormatter={(v) => formatMD(new Date(v))} tick={{ fontSize: 12, fill: "#78716c" }} />
                    <YAxis dataKey="value" domain={[40, 260]} tick={{ fontSize: 12, fill: "#78716c" }} />
                    <ReferenceLine y={100} stroke="#0f766e" strokeDasharray="4 4" label={{ value: "空腹上限 100", position: "right", fontSize: 10, fill: "#0f766e" }} />
                    <ReferenceLine y={140} stroke="#b45309" strokeDasharray="4 4" label={{ value: "飯後上限 140", position: "right", fontSize: 10, fill: "#b45309" }} />
                    <Tooltip
                      formatter={(value, name, p) => [`${value} mg/dL`, p.payload.meal]}
                      labelFormatter={(_, p) => (p && p[0] ? p[0].payload.full : "")}
                    />
                    <Legend payload={MEAL_STATUSES.map((m) => ({ value: m, type: "circle", color: MEAL_COLORS[m] }))} />
                    {MEAL_STATUSES.map((m) => (
                      <Scatter key={m} name={m} data={glucoseChartData.filter((d) => d.meal === m)} fill={MEAL_COLORS[m]} />
                    ))}
                  </ScatterChart>
                )}
              </ResponsiveContainer>
            </div>
            <p className="text-sm text-stone-400 mt-2">
              {trendType === "bp" ? "淡綠色區塊為理想血壓範圍（收縮壓 80–120 mmHg）" : "血糖建議上限依用餐狀態不同，僅供參考，實際請依醫囑判斷"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, unit, accent }) {
  const accentClass = { teal: "border-teal-600", emerald: "border-emerald-600", amber: "border-amber-600", sky: "border-sky-600" }[accent];
  return (
    <div className={`bg-white border border-stone-200 border-l-4 ${accentClass} rounded-2xl p-4`}>
      <p className="text-sm text-stone-500">{label}</p>
      <p className="text-3xl font-bold mt-1">
        {value}
        <span className="text-base font-medium text-stone-400 ml-1">{unit}</span>
      </p>
    </div>
  );
}

/* ========================================================================= */
/* 看診模式 */
function DoctorView({ last14, insights, onPrint, onShare }) {
  return (
    <div className="space-y-5">
      <div className="no-print flex gap-3">
        <button
          onClick={onPrint}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-stone-800 text-white text-lg font-semibold"
        >
          <Printer className="w-5 h-5" /> 列印 / 匯出
        </button>
        <button
          onClick={onShare}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-teal-700 text-teal-800 text-lg font-semibold"
        >
          <Share2 className="w-5 h-5" /> 分享給家人
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">醫師重點摘要（近 14 天）</h2>
        {insights.length === 0 ? (
          <p className="text-stone-500 text-lg">目前資料不足，尚無法產生摘要</p>
        ) : (
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <div key={i} className={`border-2 rounded-2xl p-4 flex items-start gap-3 ${STATUS_STYLE[ins.level].badge}`}>
                <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="text-lg">{ins.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold mb-3">近 14 天數值總覽</h2>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-100 text-stone-600 text-sm">
                <th className="px-3 py-2.5 font-semibold">時間</th>
                <th className="px-3 py-2.5 font-semibold">項目</th>
                <th className="px-3 py-2.5 font-semibold">數值</th>
                <th className="px-3 py-2.5 font-semibold">備註</th>
              </tr>
            </thead>
            <tbody>
              {last14.map((r) => {
                const status = r.type === "bp" ? evaluateBP(r.systolic, r.diastolic) : evaluateGlucose(r.glucose, r.mealStatus);
                const abnormal = status.level === "high" || status.level === "caution" || status.level === "low";
                return (
                  <tr key={r.id} className="border-t border-stone-100 text-base">
                    <td className="px-3 py-2.5 whitespace-nowrap text-stone-500 text-sm">{formatFullRow(r.date)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      {r.type === "bp" ? "血壓" : `血糖（${r.mealStatus}）`}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                      <span className="inline-flex items-center gap-1.5">
                        {abnormal && <AlertCircle className="w-4 h-4 text-amber-600" />}
                        {r.type === "bp" ? `${r.systolic}/${r.diastolic} mmHg・${r.heartRate} bpm` : `${r.glucose} mg/dL`}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-stone-500 text-sm">{r.note || "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
