import { useState, useEffect, useMemo } from "react";
import { PLANS, getPlanById } from "./data/plans";
import { WeekCard } from "./components/WeekCard";
import { GuideModal } from "./components/GuideModal";
import { PlaybookView } from "./components/PlaybookView";
import { YearlyView } from "./components/YearlyView";
import "./App.css";

function getCurrentWeekForPlan(plan) {
  const startDateObj = new Date(plan.startDateStr);
  const today = new Date();
  const diffTime = today - startDateObj;
  if (diffTime < 0) return 1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentW = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(currentW, 1), plan.weeks.length);
}

export default function App() {
  const [selectedPlanId, setSelectedPlanId] = useState("hybrid-2026");
  const [viewMode, setViewMode] = useState("schedule"); // 'schedule' | 'playbook' | 'yearly'
  const [modalGuide, setModalGuide] = useState(null);

  const activePlan = getPlanById(selectedPlanId);
  const currentWeek = getCurrentWeekForPlan(activePlan);

  const [activeFilter, setActiveFilter] = useState(() => currentWeek);

  // Load progress state per plan from localStorage
  const [allProgress, setAllProgress] = useState(() => {
    const initial = {};
    PLANS.forEach((p) => {
      try {
        const saved = localStorage.getItem(p.storageKey);
        initial[p.id] = saved ? JSON.parse(saved) : {};
      } catch {
        initial[p.id] = {};
      }
    });
    return initial;
  });

  const progressState = useMemo(
    () => allProgress[activePlan.id] || {},
    [allProgress, activePlan.id]
  );

  useEffect(() => {
    try {
      localStorage.setItem(activePlan.storageKey, JSON.stringify(progressState));
    } catch {
      // ignore storage errors
    }
  }, [activePlan.storageKey, progressState]);

  const handleSelectPlan = (planId) => {
    const nextPlan = getPlanById(planId);
    setSelectedPlanId(planId);
    setActiveFilter(nextPlan.status === "completed" ? "all" : getCurrentWeekForPlan(nextPlan));
    if (viewMode === "yearly") setViewMode("schedule");
  };

  const handleJumpToPlan = (planId, weekNum) => {
    setSelectedPlanId(planId);
    setActiveFilter(weekNum || 1);
    setViewMode("schedule");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCheckChange = (e, key) => {
    const checked = e.target.checked;
    setAllProgress((prev) => ({
      ...prev,
      [activePlan.id]: {
        ...(prev[activePlan.id] || {}),
        [key]: checked,
      },
    }));
  };

  const resetProgress = () => {
    if (confirm(`ต้องการรีเซ็ตความคืบหน้าของแผน "${activePlan.shortName}" ทั้งหมดใช่หรือไม่?`)) {
      setAllProgress((prev) => ({
        ...prev,
        [activePlan.id]: {},
      }));
    }
  };

  const totalWorkouts = activePlan.weeks.length * 5;
  let completedCount = 0;
  activePlan.weeks.forEach((w) => {
    ["easy", "str", "inc", "long", "rec"].forEach((t) => {
      if (progressState[`W${w.week}-${t}`]) completedCount++;
    });
  });
  const percent = totalWorkouts > 0 ? Math.round((completedCount / totalWorkouts) * 100) : 0;

  let filteredWeeks = [];
  if (activeFilter === "all") {
    filteredWeeks = activePlan.weeks;
  } else if (typeof activeFilter === "string") {
    filteredWeeks = activePlan.weeks.filter((w) => w.phase === activeFilter);
  } else if (typeof activeFilter === "number") {
    filteredWeeks = activePlan.weeks.filter((w) => w.week === activeFilter);
  }

  return (
    <div className="text-mountainDark antialiased min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Glass Navigation */}
      <nav className="bg-slate-900/95 backdrop-blur-md text-white shadow-md sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Brand + Plan Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">⚡</span>
              <div>
                <span className="font-bold text-sm sm:text-base tracking-wide block leading-tight">
                  Korn Training Hub
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Multi-Plan & Annual Tracker
                </span>
              </div>
            </div>

            {/* Plan Switcher Pills */}
            <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-xl">
              {PLANS.map((p) => {
                const isSelected = p.id === selectedPlanId && viewMode !== "yearly";
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPlan(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{p.status === "active" ? "🔥" : "🏆"}</span>
                    <span>{p.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-white/10">
              {[
                { id: "schedule", label: "📅 ตารางรายสัปดาห์" },
                { id: "playbook", label: "📖 คู่มือละเอียด" },
                { id: "yearly", label: "📆 ภาพรวมรายปี" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                    viewMode === tab.id
                      ? "bg-pocariBlue text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Dynamic Hero Banner (for Schedule & Playbook) */}
      {viewMode !== "yearly" && (
        <header className={`bg-gradient-to-r ${activePlan.theme.heroGradient} text-white py-7 sm:py-9 px-4 shadow-inner`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${activePlan.theme.accentBadge} text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                  {activePlan.statusLabel}
                </span>
                <span className="bg-white/15 text-white/90 text-[11px] font-medium px-3 py-1 rounded-full">
                  🗓️ {activePlan.periodLabel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-3">{activePlan.title}</h1>
              <p className="text-white/85 mt-2 text-xs sm:text-sm max-w-2xl leading-relaxed">
                {activePlan.subtitle}
              </p>
            </div>

            {/* Progress Ring + Reset */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/15 w-full md:w-auto justify-between md:justify-start">
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-white/20"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${activePlan.theme.ringColor} transition-all duration-500`}
                      strokeWidth="3.5"
                      strokeDasharray={`${percent}, 100`}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-bold text-xs">
                    {percent}%
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/70 uppercase font-medium">ความสำเร็จแผนนี้</p>
                  <p className="text-sm sm:text-base font-bold">
                    {completedCount} / {totalWorkouts} เซสชั่น
                  </p>
                </div>
              </div>
              <button
                onClick={resetProgress}
                className="text-[11px] bg-white/10 hover:bg-red-500/80 text-white/90 hover:text-white font-medium py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                title="รีเซ็ตความคืบหน้าของแผนนี้"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7 flex-grow w-full">
        {viewMode === "yearly" ? (
          <YearlyView onJumpToPlan={handleJumpToPlan} />
        ) : (
          <>
            {/* 4 Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
              {activePlan.metrics.map((m, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border border-slate-200/80">
                  <span className="text-[11px] text-slate-400 font-semibold block uppercase mb-1">
                    {m.label}
                  </span>
                  <span className={`text-lg sm:text-xl font-bold ${m.color}`}>{m.value}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{m.sub}</span>
                </div>
              ))}
            </div>

            {viewMode === "playbook" ? (
              <PlaybookView plan={activePlan} />
            ) : (
              <>
                {/* Phase & Week Filter Toolbar */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                  <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
                    <button
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeFilter === "all"
                          ? "bg-pocariBlue text-white shadow-sm"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      ทุกสัปดาห์ ({activePlan.weeks.length}W)
                    </button>
                    {activePlan.phases.map((ph) => (
                      <button
                        key={ph.id}
                        onClick={() => setActiveFilter(ph.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          activeFilter === ph.id
                            ? "bg-pocariBlue text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {ph.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <button
                      onClick={() => setActiveFilter(currentWeek)}
                      className="text-xs font-semibold text-pocariBlue bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap"
                    >
                      📍 สัปดาห์ปัจจุบัน (W{currentWeek})
                    </button>
                    <select
                      id="weekSelect"
                      value={typeof activeFilter === "number" ? activeFilter : ""}
                      onChange={(e) => setActiveFilter(e.target.value ? parseInt(e.target.value, 10) : "all")}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-lg focus:ring-pocariBlue focus:border-pocariBlue block p-2 font-medium cursor-pointer"
                    >
                      <option value="" disabled hidden>เลือกสัปดาห์</option>
                      {activePlan.weeks.map((w) => (
                        <option key={w.week} value={w.week}>
                          สัปดาห์ที่ {w.week} {w.week === currentWeek ? "(ปัจจุบัน)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Weeks Grid (Full Width for High Readability) */}
                <div className="space-y-5">
                  {filteredWeeks.map((w) => (
                    <WeekCard
                      key={`${activePlan.id}-w${w.week}`}
                      week={w}
                      planId={activePlan.id}
                      progressState={progressState}
                      onCheckChange={handleCheckChange}
                      onOpenGuide={(type, weekNum) => setModalGuide({ type, weekNum })}
                      startDateStr={activePlan.startDateStr}
                      isCurrentWeek={activePlan.status === "active" && w.week === currentWeek}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-400">
        Korn Training Hub • Powered by Hybrid Physique & PST34 Strategy • Deployed on GCP Cloud Run (Bangkok)
      </footer>

      {modalGuide && (
        <GuideModal
          type={modalGuide.type}
          weekNum={modalGuide.weekNum}
          planId={activePlan.id}
          onClose={() => setModalGuide(null)}
          weeklyData={activePlan.weeks}
        />
      )}
    </div>
  );
}
