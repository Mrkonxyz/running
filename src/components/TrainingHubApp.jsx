"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { PLANS, getPlanById } from "../data/plans/index.js";
import { WeekCard } from "./WeekCard.jsx";
import { GuideModal } from "./GuideModal.jsx";
import { PlaybookView } from "./PlaybookView.jsx";
import { YearlyView } from "./YearlyView.jsx";
import { LoginModal } from "./LoginModal.jsx";

function getCurrentWeekForPlan(plan) {
  const startDateObj = new Date(plan.startDateStr);
  const today = new Date();
  const diffTime = today - startDateObj;
  if (diffTime < 0) return 1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentW = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(currentW, 1), plan.weeks.length);
}

const JS_DAY_TO_TYPE = {
  0: "rec",
  1: null,
  2: "easy",
  3: "str",
  4: "inc",
  5: null,
  6: "long",
};

const subscribeHydrated = () => () => {};

function useIsHydrated() {
  return useSyncExternalStore(
    subscribeHydrated,
    () => true,
    () => false
  );
}

function readStoredColorScheme() {
  if (typeof window === "undefined") return null;
  try {
    const val = localStorage.getItem("color-scheme");
    return val === "light" || val === "dark" ? val : null;
  } catch {
    return null;
  }
}

export function TrainingHubApp({
  initialUser = null,
  initialSession = null,
  initialProgressByPlan = {},
}) {
  const [selectedPlanId, setSelectedPlanId] = useState("hybrid-2026");
  const [viewMode, setViewMode] = useState("schedule"); // 'schedule' | 'playbook' | 'yearly'
  const [modalGuide, setModalGuide] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  // Auth & MongoDB sync state
  const [user, setUser] = useState(initialUser);
  const [session, setSession] = useState(initialSession);
  const [syncStatus, setSyncStatus] = useState(initialUser ? "synced" : "local"); // 'local' | 'syncing' | 'synced' | 'error'
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [sessionToast, setSessionToast] = useState("");

  const isHydrated = useIsHydrated();
  const [themeOverride, setThemeOverride] = useState(null);
  const [systemDark, setSystemDark] = useState(false);

  const effectiveOverride = isHydrated ? (themeOverride ?? readStoredColorScheme()) : null;
  const effectiveSystemDark = isHydrated
    ? systemDark || (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    : false;
  const isDarkRendered = effectiveOverride ? effectiveOverride === "dark" : effectiveSystemDark;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", handleMediaChange);

    const handleStorageChange = (e) => {
      if (e.key === "color-scheme") {
        setThemeOverride(e.newValue === "light" || e.newValue === "dark" ? e.newValue : null);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mq.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = effectiveOverride ?? "light dark";
    }
    document.documentElement.classList.toggle("dark", isDarkRendered);
  }, [isHydrated, effectiveOverride, isDarkRendered]);

  const handleToggleTheme = () => {
    const currentSysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const currentIsDark = document.documentElement.classList.contains("dark");
    const target = currentIsDark ? "light" : "dark";
    const systemScheme = currentSysDark ? "dark" : "light";

    if (target === systemScheme) {
      try {
        localStorage.removeItem("color-scheme");
      } catch {
        // ignore storage errors
      }
      setThemeOverride(null);
    } else {
      try {
        localStorage.setItem("color-scheme", target);
      } catch {
        // ignore storage errors
      }
      setThemeOverride(target);
    }
    document.documentElement.classList.toggle("dark", target === "dark");
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = target === systemScheme ? "light dark" : target;
    }
  };

  const activePlan = getPlanById(selectedPlanId);
  const currentWeek = getCurrentWeekForPlan(activePlan);
  const [activeFilter, setActiveFilter] = useState(() => currentWeek);

  const [allProgress, setAllProgress] = useState(() => {
    const initial = {};
    PLANS.forEach((p) => {
      if (initialProgressByPlan && initialProgressByPlan[p.id]) {
        initial[p.id] = initialProgressByPlan[p.id];
      } else if (!initialUser && typeof window !== "undefined") {
        try {
          const saved = localStorage.getItem(p.storageKey);
          initial[p.id] = saved ? JSON.parse(saved) : {};
        } catch {
          initial[p.id] = {};
        }
      } else {
        initial[p.id] = {};
      }
    });
    return initial;
  });

  // Verify session + pull latest MongoDB progress on client mount
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        if (data.authenticated && data.user) {
          setUser(data.user);
          setSession(data.session);
          setSyncStatus("synced");
          const pRes = await fetch("/api/progress", { cache: "no-store" });
          if (pRes.ok) {
            const pData = await pRes.json();
            if (active && pData.ok && pData.progressByPlan) {
              setAllProgress((prev) => ({
                ...prev,
                ...pData.progressByPlan,
              }));
            }
          }
        } else {
          // Ensure localStorage cache is loaded if unauthenticated after mount
          const localData = {};
          PLANS.forEach((p) => {
            try {
              const saved = localStorage.getItem(p.storageKey);
              localData[p.id] = saved ? JSON.parse(saved) : {};
            } catch {
              localData[p.id] = {};
            }
          });
          setAllProgress(localData);
        }
      } catch {
        // Offline / local fallback
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const progressState = useMemo(
    () => allProgress[activePlan.id] || {},
    [allProgress, activePlan.id]
  );

  // Save to localStorage as instant offline cache
  useEffect(() => {
    try {
      localStorage.setItem(activePlan.storageKey, JSON.stringify(progressState));
    } catch {
      // ignore storage errors
    }
  }, [activePlan.storageKey, progressState]);

  const syncPlanProgressToMongo = useCallback(
    async (planId, nextPlanProgress) => {
      if (!user) return;
      setSyncStatus("syncing");
      try {
        const res = await fetch("/api/progress", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ planId, completedDays: nextPlanProgress }),
        });
        if (res.status === 401) {
          setUser(null);
          setSession(null);
          setSyncStatus("local");
          return;
        }
        setSyncStatus(res.ok ? "synced" : "error");
      } catch {
        setSyncStatus("error");
      }
    },
    [user]
  );

  const showToast = (msg) => {
    setSessionToast(msg);
    setTimeout(() => {
      setSessionToast((prev) => (prev === msg ? "" : prev));
    }, 3500);
  };

  const handleLoginSuccess = async (loginData) => {
    setUser(loginData.user);
    setSession(loginData.session);
    setSyncStatus("syncing");
    showToast(`เข้าสู่ระบบแล้ว: ${loginData.user.email}`);
    try {
      const pRes = await fetch("/api/progress", { cache: "no-store" });
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.ok && pData.progressByPlan) {
          setAllProgress((prev) => {
            const merged = { ...prev };
            PLANS.forEach((p) => {
              const dbMap = pData.progressByPlan[p.id];
              if (dbMap && Object.keys(dbMap).length > 0) {
                merged[p.id] = dbMap;
              }
            });
            return merged;
          });
          setSyncStatus("synced");
          return;
        }
      }
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUser(data.user);
        setSession(data.session);
        showToast("ต่ออายุ Session + หมุน Refresh Token สำเร็จ 🔄");
      } else {
        setUser(null);
        setSession(null);
        setSyncStatus("local");
        showToast("Session หมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
    } catch {
      showToast("ไม่สามารถต่ออายุ Token ได้");
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setSession(null);
    setSyncStatus("local");
    showToast("ออกจากระบบและยกเลิก Session แล้ว");
  };

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

  const handleToggleDay = (key, explicitValue) => {
    const currentPlanProgress = allProgress[activePlan.id] || {};
    const nextVal = typeof explicitValue === "boolean" ? explicitValue : !currentPlanProgress[key];
    const nextPlanProgress = {
      ...currentPlanProgress,
      [key]: nextVal,
    };
    setAllProgress((prev) => ({
      ...prev,
      [activePlan.id]: nextPlanProgress,
    }));
    syncPlanProgressToMongo(activePlan.id, nextPlanProgress);
  };

  const handleToggleWeekAll = (weekNum, markComplete) => {
    const currentPlanProgress = { ...(allProgress[activePlan.id] || {}) };
    ["easy", "str", "inc", "long", "rec"].forEach((t) => {
      currentPlanProgress[`W${weekNum}-${t}`] = markComplete;
    });
    setAllProgress((prev) => ({
      ...prev,
      [activePlan.id]: currentPlanProgress,
    }));
    syncPlanProgressToMongo(activePlan.id, currentPlanProgress);
  };

  const resetProgress = () => {
    if (confirm(`ต้องการรีเซ็ตความคืบหน้าของแผน "${activePlan.shortName}" ทั้งหมดใช่หรือไม่?`)) {
      setAllProgress((prev) => ({
        ...prev,
        [activePlan.id]: {},
      }));
      syncPlanProgressToMongo(activePlan.id, {});
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

  const now = new Date();
  const jsDay = now.getDay();
  const todayDayType = JS_DAY_TO_TYPE[jsDay] ?? null;
  const todayThaiLabel = now.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const todayWeekObj = activePlan.weeks.find((w) => w.week === currentWeek) || activePlan.weeks[0];

  const getTodayPrescription = () => {
    if (!todayWeekObj) return null;
    if (jsDay === 1) {
      return {
        isRest: true,
        label: "วันจันทร์ • Rest & Active NEAT",
        title: "วันพักกล้ามเนื้อ",
        detail: todayWeekObj.monRest,
      };
    }
    if (jsDay === 5) {
      return {
        isRest: true,
        label: "วันศุกร์ • Rest & Mobility",
        title: "วันพักเตรียมความสด",
        detail: todayWeekObj.friRest,
      };
    }
    const map = {
      easy: { label: "วันอังคาร • Cardio Day", title: todayWeekObj.tueTarget, detail: todayWeekObj.tueDetail },
      str: { label: "วันพุธ • Strength Day A", title: todayWeekObj.wedTarget, detail: todayWeekObj.wedDetail },
      inc: { label: "วันพฤหัสบดี • Cardio / Incline", title: todayWeekObj.thuTarget, detail: todayWeekObj.thuDetail },
      long: { label: "วันเสาร์ • Weekend Cardio", title: todayWeekObj.satTarget, detail: todayWeekObj.satDetail },
      rec: { label: "วันอาทิตย์ • Strength Day B", title: todayWeekObj.sunTarget, detail: todayWeekObj.sunDetail },
    };
    return { isRest: false, type: todayDayType, ...(map[todayDayType] || map.easy) };
  };

  const todaySpotlight = activePlan.status === "active" ? getTodayPrescription() : null;
  const todayKey = todayDayType ? `W${currentWeek}-${todayDayType}` : null;
  const isTodayCompleted = todayKey ? !!progressState[todayKey] : false;

  return (
    <div className="text-slate-900 dark:text-slate-100 antialiased min-h-screen bg-[#f8fafc] dark:bg-slate-950 flex flex-col transition-colors duration-200">
      {/* Compact Sticky Top Navigation */}
      <nav className="bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md text-white shadow-md sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Brand + Plan Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚡</span>
              <span className="font-bold text-sm sm:text-base tracking-wide leading-tight">
                Korn Training Hub
              </span>
            </div>

            <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl">
              {PLANS.map((p) => {
                const isSelected = p.id === selectedPlanId && viewMode !== "yearly";
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPlan(p.id)}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? "bg-white text-slate-900 shadow"
                        : "text-slate-300 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span aria-hidden="true">{p.status === "active" ? "🔥" : "🏆"}</span>
                    <span>{p.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* View Tabs + User Session Pill + Dark Mode Toggle */}
          <div className="flex flex-wrap items-center gap-2 ml-auto">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-white/10">
              {[
                { id: "schedule", label: "📅 ตารางซ้อม" },
                { id: "playbook", label: "📖 คู่มือ & ท่าเวท" },
                { id: "yearly", label: "📆 รายปี" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setViewMode(tab.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer whitespace-nowrap ${
                    viewMode === tab.id
                      ? "bg-pocariBlue text-white shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Session Status Pill */}
            {user ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-400/30 px-2.5 py-1 rounded-xl text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" aria-hidden="true" />
                <span className="font-semibold text-emerald-200 max-w-[130px] sm:max-w-[180px] truncate" title={user.email}>
                  {user.email}
                </span>
                <span className="text-[10px] text-emerald-300/80 hidden md:inline">
                  ({syncStatus === "syncing" ? "Syncing..." : syncStatus === "error" ? "Sync err" : "DB"})
                </span>
                <button
                  type="button"
                  onClick={handleRefreshToken}
                  disabled={refreshingToken}
                  title="ทดสอบหมุน Refresh Token + ต่ออายุ Session"
                  className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white cursor-pointer"
                >
                  {refreshingToken ? "..." : "🔄"}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-2 py-0.5 rounded bg-rose-500/80 hover:bg-rose-500 text-[10px] font-bold text-white cursor-pointer"
                >
                  ออก
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-treadmillGreen hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition cursor-pointer whitespace-nowrap"
              >
                <span aria-hidden="true">🔑</span>
                <span>Sign In</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="สลับโหมดสี สว่าง หรือ มืด"
              title="สลับโหมดสว่าง / มืด"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold border border-white/15 transition cursor-pointer whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-1.5 dark:hidden">
                <span aria-hidden="true">🌙</span>
                <span className="hidden sm:inline">มืด</span>
              </span>
              <span className="hidden dark:inline-flex items-center gap-1.5">
                <span aria-hidden="true">☀️</span>
                <span className="hidden sm:inline">สว่าง</span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Non-blocking Toast */}
      {sessionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-white/15"
        >
          {sessionToast}
        </div>
      )}

      {/* Dynamic Hero Banner */}
      {viewMode !== "yearly" && (
        <header className={`bg-gradient-to-r ${activePlan.theme.heroGradient} text-white py-6 sm:py-8 px-4 shadow-inner`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${activePlan.theme.accentBadge} text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                  {activePlan.statusLabel}
                </span>
                <span className="bg-white/15 text-white/95 text-[11px] font-medium px-3 py-1 rounded-full">
                  🗓️ {activePlan.periodLabel}
                </span>
                {user && session?.lastRefreshedAt && (
                  <span className="bg-emerald-500/20 border border-emerald-300/30 text-emerald-100 text-[10px] font-medium px-2.5 py-0.5 rounded-full">
                    🟢 MongoDB Synced ({user.displayName})
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mt-2.5">{activePlan.title}</h1>
              <p className="text-white/85 mt-1.5 text-xs sm:text-sm max-w-2xl leading-relaxed">
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
                  <p className="text-[10px] text-white/75 uppercase font-medium">ความสำเร็จแผนนี้</p>
                  <p className="text-sm sm:text-base font-bold">
                    {completedCount} / {totalWorkouts} เซสชั่น
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={resetProgress}
                className="text-[11px] bg-white/15 hover:bg-red-500 text-white font-medium py-1.5 px-2.5 rounded-lg transition cursor-pointer"
                title="รีเซ็ตความคืบหน้าของแผนนี้"
              >
                รีเซ็ต
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7 flex-grow w-full">
        {/* Compact Login Prompt Banner when not signed in */}
        {!user && (
          <div className="mb-5 bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs sm:text-sm">
              <span className="font-bold text-slate-800 dark:text-white">
                🔐 ยังไม่ได้เข้าสู่ระบบ MongoDB (<code className="font-mono text-pocariBlue dark:text-sky-400">running</code>)
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                ตอนนี้ประวัติถูกบันทึกชั่วคราวบนเครื่องเท่านั้น — เข้าสู่ระบบด้วยอีเมลเพื่อสร้าง Session + Refresh Token และซิงค์ข้อมูลข้ามอุปกรณ์
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLoginModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-treadmillGreen hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition cursor-pointer whitespace-nowrap self-start sm:self-center"
            >
              🔑 เข้าสู่ระบบด้วยอีเมล
            </button>
          </div>
        )}

        {viewMode === "yearly" ? (
          <YearlyView onJumpToPlan={handleJumpToPlan} />
        ) : (
          <>
            {/* 4 Key Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
              {activePlan.metrics.map((m, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800"
                >
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block uppercase mb-1">
                    {m.label}
                  </span>
                  <span className={`text-lg sm:text-xl font-bold ${m.color} dark:brightness-125`}>{m.value}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">{m.sub}</span>
                </div>
              ))}
            </div>

            {viewMode === "playbook" ? (
              <PlaybookView plan={activePlan} />
            ) : (
              <>
                {/* Today's Spotlight Banner */}
                {todaySpotlight && (
                  <section
                    aria-label="โปรแกรมซ้อมวันนี้"
                    className="mb-6 bg-gradient-to-br from-blue-50 via-white to-emerald-50/70 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950/50 rounded-2xl p-5 border-2 border-pocariBlue/25 dark:border-sky-500/40 shadow-sm"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pocariBlue text-white">
                            📌 วันนี้ซ้อมอะไร?
                          </span>
                          <span suppressHydrationWarning className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {todayThaiLabel} • Week {currentWeek}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                          {todaySpotlight.label}:{" "}
                          <span className="text-pocariBlue dark:text-sky-400">{todaySpotlight.title}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {todaySpotlight.detail}
                        </p>
                        {todayWeekObj?.nutritionNote && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            🥗 {todayWeekObj.nutritionNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 flex-shrink-0">
                        {todaySpotlight.isRest ? (
                          <button
                            type="button"
                            onClick={() => setModalGuide({ type: "str", weekNum: currentWeek })}
                            className="px-4 py-2.5 rounded-xl bg-pocariBlue hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                          >
                            🏋️‍♂️ เตรียมดูตาราง Strength Day A ล่วงหน้า
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setModalGuide({ type: todaySpotlight.type, weekNum: currentWeek })}
                              className="px-4 py-2.5 rounded-xl bg-pocariBlue hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                            >
                              📖 ดูท่าซ้อม & GIF วันนี้
                            </button>
                            <button
                              type="button"
                              onClick={() => todayKey && handleToggleDay(todayKey)}
                              aria-pressed={isTodayCompleted}
                              className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer ${
                                isTodayCompleted
                                  ? "bg-treadmillGreen text-white border-treadmillGreen shadow-sm"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-treadmillGreen"
                              }`}
                            >
                              {isTodayCompleted ? "✅ ซ้อมเสร็จแล้ววันนี้!" : "⬜ บันทึกว่าซ้อมเสร็จแล้ว"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Phase & Week Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                  <div className="flex flex-wrap gap-1.5 w-full lg:w-auto">
                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                        activeFilter === "all"
                          ? "bg-pocariBlue text-white shadow-sm"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      ทุกสัปดาห์ ({activePlan.weeks.length}W)
                    </button>
                    {activePlan.phases.map((ph) => (
                      <button
                        key={ph.id}
                        type="button"
                        onClick={() => setActiveFilter(ph.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          activeFilter === ph.id
                            ? "bg-pocariBlue text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {ph.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveFilter(currentWeek)}
                      className="text-xs font-semibold text-pocariBlue dark:text-sky-400 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap"
                    >
                      📍 สัปดาห์ปัจจุบัน (W{currentWeek})
                    </button>
                    <select
                      id="weekSelect"
                      value={typeof activeFilter === "number" ? activeFilter : ""}
                      onChange={(e) => setActiveFilter(e.target.value ? parseInt(e.target.value, 10) : "all")}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm rounded-lg focus:ring-pocariBlue focus:border-pocariBlue block p-2 font-medium cursor-pointer"
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

                {/* Weeks Grid */}
                <div className="space-y-5">
                  {filteredWeeks.map((w) => (
                    <WeekCard
                      key={`${activePlan.id}-w${w.week}`}
                      week={w}
                      planId={activePlan.id}
                      progressState={progressState}
                      onToggleDay={handleToggleDay}
                      onToggleWeekAll={handleToggleWeekAll}
                      onOpenGuide={(type, weekNum) => setModalGuide({ type, weekNum })}
                      startDateStr={activePlan.startDateStr}
                      isCurrentWeek={activePlan.status === "active" && w.week === currentWeek}
                      todayDayType={activePlan.status === "active" && w.week === currentWeek ? todayDayType : null}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-4 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
        Korn Training Hub • Next.js Full-Stack Monolith + MongoDB (<code className="font-mono">running</code>) • Session ID:{" "}
        <span className="font-mono">{session?.sessionId ? session.sessionId.slice(0, 8) : "guest"}</span>
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

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
