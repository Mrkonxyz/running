"use client";

import { useState } from "react";
import { YEARLY_DATA } from "../data/plans";

export function YearlyView({ onJumpToPlan }) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const yearData = YEARLY_DATA[selectedYear];
  const maxHours = Math.max(...yearData.months.map((m) => m.hours), 24);

  const statusStyles = {
    pre: "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
    pst34:
      "bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/70 text-slate-800 dark:text-slate-100 hover:border-pocariBlue dark:hover:border-sky-400",
    hybrid:
      "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70 text-slate-800 dark:text-slate-100 hover:border-treadmillGreen dark:hover:border-emerald-400",
    lifestyle:
      "bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/70 text-slate-800 dark:text-slate-100 hover:border-indigo-500 dark:hover:border-indigo-400",
  };

  const tagColors = {
    Start: "bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300",
    Peak: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300",
    Race: "bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300",
    Gate: "bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300",
    "Phase 1": "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300",
    "Phase 2": "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300",
    Reset: "bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300",
    Checkpoint: "bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300",
    Target: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300",
    Lifestyle: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
  };

  return (
    <div className="space-y-6">
      {/* Year Switcher Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pocariBlue dark:text-sky-400 bg-blue-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
            Annual Training Roadmap
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-white mt-1.5">
            📆 ภาพรวมรายปี {yearData.yearBE} ({yearData.yearCE})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">{yearData.headline}</p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {[2026, 2027].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => setSelectedYear(yr)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                selectedYear === yr
                  ? "bg-white dark:bg-slate-900 text-pocariBlue dark:text-sky-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              ปี {yr + 543} ({yr})
            </button>
          ))}
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {yearData.summaryMetrics.map((m, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">{m.label}</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mt-1 block">{m.value}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* 12-Month Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-800 dark:text-white">
            🗓️ ไทม์ไลน์ 12 เดือน (คลิกที่เดือนเพื่อเปิดแผนซ้อม)
          </h3>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pocariBlue"></span> PST34 Trail
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-treadmillGreen"></span> Hybrid Physique
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Lifestyle Maintenance
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {yearData.months.map((m, i) => (
            <div
              key={i}
              onClick={() => m.planId && onJumpToPlan(m.planId, m.week || 1)}
              className={`rounded-xl p-4 border transition flex flex-col justify-between ${statusStyles[m.status]} ${
                m.planId ? "cursor-pointer hover:shadow-sm" : "opacity-80"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {m.month} {yearData.yearBE}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    ~{m.hours} ชม./เดือน
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{m.label}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">{m.detail}</p>
              </div>
              <div className="mt-3">
                <div className="w-full h-1.5 bg-white/80 dark:bg-slate-950/60 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.status === "pst34"
                        ? "bg-pocariBlue"
                        : m.status === "hybrid"
                          ? "bg-treadmillGreen"
                          : m.status === "lifestyle"
                            ? "bg-indigo-500"
                            : "bg-slate-400"
                    }`}
                    style={{ width: `${Math.round((m.hours / maxHours) * 100)}%` }}
                  />
                </div>
                {m.planId && (
                  <span className="text-[10px] font-semibold text-pocariBlue dark:text-sky-400 mt-1.5 inline-block">
                    เปิดสัปดาห์ที่ {m.week} ➔
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Milestones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 dark:text-white mb-4">
          🚩 หมุดหมายสำคัญประจำปี {yearData.yearBE}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {yearData.milestones.map((ms, i) => (
            <div
              key={i}
              onClick={() => onJumpToPlan(ms.planId, ms.week)}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/70 dark:border-slate-700/70 cursor-pointer transition"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">{ms.date}</span>
                <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-0.5">{ms.title}</p>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  tagColors[ms.tag] || "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {ms.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
