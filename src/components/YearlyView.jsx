import { useState } from "react";
import { YEARLY_DATA } from "../data/plans";

export function YearlyView({ onJumpToPlan }) {
  const [selectedYear, setSelectedYear] = useState(2026);
  const yearData = YEARLY_DATA[selectedYear];
  const maxHours = Math.max(...yearData.months.map((m) => m.hours), 24);

  const statusStyles = {
    pre: "bg-slate-100 border-slate-200 text-slate-700",
    pst34: "bg-blue-50/70 border-blue-200 text-slate-800 hover:border-pocariBlue",
    hybrid: "bg-emerald-50/70 border-emerald-200 text-slate-800 hover:border-treadmillGreen",
    lifestyle: "bg-indigo-50/70 border-indigo-200 text-slate-800 hover:border-indigo-500",
  };

  const tagColors = {
    Start: "bg-blue-100 text-blue-700",
    Peak: "bg-amber-100 text-amber-800",
    Race: "bg-rose-100 text-rose-700",
    Gate: "bg-sky-100 text-sky-700",
    "Phase 1": "bg-emerald-100 text-emerald-700",
    "Phase 2": "bg-indigo-100 text-indigo-700",
    Reset: "bg-purple-100 text-purple-700",
    Checkpoint: "bg-teal-100 text-teal-700",
    Target: "bg-amber-100 text-amber-800",
    Lifestyle: "bg-slate-100 text-slate-700",
  };

  return (
    <div className="space-y-6">
      {/* Year Switcher Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-pocariBlue bg-blue-50 px-2.5 py-0.5 rounded-full">
            Annual Training Roadmap
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mt-1.5">
            📆 ภาพรวมรายปี {yearData.yearBE} ({yearData.yearCE})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{yearData.headline}</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
          {[2026, 2027].map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                selectedYear === yr
                  ? "bg-white text-pocariBlue shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
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
          <div key={i} className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <span className="text-[11px] text-slate-400 font-semibold block uppercase">{m.label}</span>
            <span className="text-lg sm:text-xl font-bold text-slate-800 mt-1 block">{m.value}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">{m.sub}</span>
          </div>
        ))}
      </div>

      {/* 12-Month Grid */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-800">🗓️ ไทม์ไลน์ 12 เดือน (คลิกที่เดือนเพื่อเปิดแผนซ้อม)</h3>
          <div className="flex flex-wrap gap-3 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pocariBlue"></span> PST34 Trail</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-treadmillGreen"></span> Hybrid Physique</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span> Lifestyle Maintenance</span>
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
                  <span className="text-sm font-bold text-slate-900">{m.month} {yearData.yearBE}</span>
                  <span className="text-[11px] font-semibold text-slate-500">~{m.hours} ชม./เดือน</span>
                </div>
                <p className="text-xs font-bold text-slate-800">{m.label}</p>
                <p className="text-[11px] text-slate-600 mt-1 leading-snug">{m.detail}</p>
              </div>
              {/* Volume bar */}
              <div className="mt-3">
                <div className="w-full h-1.5 bg-white/80 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      m.status === "pst34"
                        ? "bg-pocariBlue"
                        : m.status === "hybrid"
                          ? "bg-treadmillGreen"
                          : m.status === "lifestyle"
                            ? "bg-indigo-500"
                            : "bg-slate-300"
                    }`}
                    style={{ width: `${Math.round((m.hours / maxHours) * 100)}%` }}
                  />
                </div>
                {m.planId && (
                  <span className="text-[10px] font-semibold text-pocariBlue mt-1.5 inline-block">
                    เปิดสัปดาห์ที่ {m.week} ➔
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Milestones */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-4">🚩 หมุดหมายสำคัญประจำปี {yearData.yearBE}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {yearData.milestones.map((ms, i) => (
            <div
              key={i}
              onClick={() => onJumpToPlan(ms.planId, ms.week)}
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 cursor-pointer transition"
            >
              <div>
                <span className="text-[11px] font-bold text-slate-400 block">{ms.date}</span>
                <p className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5">{ms.title}</p>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${tagColors[ms.tag] || "bg-slate-200 text-slate-700"}`}>
                {ms.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
