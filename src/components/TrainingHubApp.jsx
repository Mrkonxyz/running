"use client";

import { useState, useEffect, useMemo, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PLANS } from "../data/plans/index.js";
import { WeekCard } from "./WeekCard.jsx";
import { GuideModal } from "./GuideModal.jsx";
import { PlaybookView } from "./PlaybookView.jsx";
import { YearlyView } from "./YearlyView.jsx";
import { LoginModal } from "./LoginModal.jsx";
import { MCPConnectModal } from "./MCPConnectModal.jsx";
import { PlanSwitcher } from "./PlanSwitcher.jsx";
import {
  DAYS_ORDER,
  DAY_KEY_TO_LEGACY,
  JS_DAY_TO_KEY,
  buildStructuredDay,
  countPlanProgress,
  getSessionCompletion,
  resolveDayKey,
} from "../lib/schedule-utils.js";
import {
  BarChartIcon,
  BookOpenIcon,
  BrandMark,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DumbbellIcon,
  FlameIcon,
  LockIcon,
  MoonIcon,
  PlugIcon,
  RefreshIcon,
  SunIcon,
  TargetIcon,
  TrophyIcon,
} from "./Icons.jsx";

function getCurrentWeekForPlan(plan) {
  const startDateObj = new Date(plan.startDateStr);
  const today = new Date();
  const diffTime = today - startDateObj;
  if (diffTime < 0) return 1;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const currentW = Math.floor(diffDays / 7) + 1;
  return Math.min(Math.max(currentW, 1), plan.weeks.length);
}

const subscribeHydrated = () => () => {};

function useIsHydrated() {
  return useSyncExternalStore(
    subscribeHydrated,
    () => true,
    () => false
  );
}

function readStoredColorScheme() {
  if (typeof window ==="undefined") return null;
  try {
    const val = localStorage.getItem("color-scheme");
    return val ==="light" || val ==="dark" ? val : null;
  } catch {
    return null;
  }
}

export function TrainingHubApp({
  initialUser = null,
  initialSession = null,
  initialProgressByPlan = {},
  initialExecutionLogsByPlan = {},
  initialPlans = null,
}) {
  const router = useRouter();
  const [plans, setPlans] = useState(() => (initialPlans && initialPlans.length > 0 ? initialPlans : PLANS));
  const [selectedPlanId, setSelectedPlanId] = useState(() =>
    initialPlans && initialPlans.length > 0 ? initialPlans[0].id : PLANS[0].id
  );
  const [viewMode, setViewMode] = useState("schedule"); // 'schedule' | 'playbook' | 'yearly'
  const [modalGuide, setModalGuide] = useState(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [mcpModalOpen, setMcpModalOpen] = useState(false);

  // Auth & MongoDB sync state
  const [user, setUser] = useState(initialUser);
  const [session, setSession] = useState(initialSession);
  const [syncStatus, setSyncStatus] = useState(initialUser ? "synced" : "guest"); // 'guest' | 'syncing' | 'synced' | 'error'
  const [refreshingToken, setRefreshingToken] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [sessionToast, setSessionToast] = useState("");

  const isHydrated = useIsHydrated();
  const [themeOverride, setThemeOverride] = useState(null);
  const [systemDark, setSystemDark] = useState(false);

  const effectiveOverride = isHydrated ? (themeOverride ?? readStoredColorScheme()) : null;
  const effectiveSystemDark = isHydrated
    ? systemDark || (typeof window !=="undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)
    : false;
  const isDarkRendered = effectiveOverride ? effectiveOverride ==="dark" : effectiveSystemDark;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", handleMediaChange);

    const handleStorageChange = (e) => {
      if (e.key ==="color-scheme") {
        setThemeOverride(e.newValue ==="light" || e.newValue ==="dark" ? e.newValue : null);
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
    document.documentElement.classList.toggle("dark", target ==="dark");
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.content = target === systemScheme ? "light dark" : target;
    }
  };

  const resolvePlan = useCallback(
    (id) => plans.find((p) => p.id === id) || plans[0],
    [plans]
  );

  const activePlan = resolvePlan(selectedPlanId);
  const currentWeek = getCurrentWeekForPlan(activePlan);
  const [activeFilter, setActiveFilter] = useState(() => currentWeek);
  const [scheduleScope, setScheduleScope] = useState(() =>
    activePlan.status === "completed" ? "all" : "day"
  );
  const [focusedWeek, setFocusedWeek] = useState(() => currentWeek);
  const [focusedDay, setFocusedDay] = useState(() => new Date().getDay());

  const [allProgress, setAllProgress] = useState(() => ({ ...(initialProgressByPlan || {}) }));
  const [allExecutionLogs, setAllExecutionLogs] = useState(() => ({ ...(initialExecutionLogsByPlan || {}) }));

  const syncPlansAndProgress = useCallback(async () => {
    try {
      const [pRes, plansRes] = await Promise.all([
        fetch("/api/progress", { cache: "no-store" }),
        fetch("/api/plans", { cache: "no-store" }),
      ]);
      if (plansRes.ok) {
        const plansData = await plansRes.json();
        if (plansData.ok && Array.isArray(plansData.plans) && plansData.plans.length > 0) {
          setPlans(plansData.plans);
        }
      }
      if (pRes.ok) {
        const pData = await pRes.json();
        if (pData.ok && pData.progressByPlan) {
          setAllProgress(pData.progressByPlan);
        }
        if (pData.ok && pData.executionLogsByPlan) {
          setAllExecutionLogs(pData.executionLogsByPlan);
        }
      }
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }, []);

  // Clean up any legacy localStorage progress keys & verify session on mount
  useEffect(() => {
    PLANS.forEach((p) => {
      try {
        localStorage.removeItem(p.storageKey);
      } catch {
        // ignore
      }
    });

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
          await syncPlansAndProgress();
        } else {
          setUser(null);
          setSession(null);
          setSyncStatus("guest");
          setAllProgress({});
          setPlans(PLANS);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      active = false;
    };
  }, [syncPlansAndProgress]);

  const progressState = useMemo(
    () => (user ? allProgress[activePlan.id] || {} : {}),
    [user, allProgress, activePlan.id]
  );

  const executionLogsState = useMemo(
    () => (user ? allExecutionLogs[activePlan.id] || {} : {}),
    [user, allExecutionLogs, activePlan.id]
  );

  const syncPlanProgressToMongo = useCallback(
    async (planId, nextPlanProgress) => {
      if (!user) return;
      setSyncStatus("syncing");
      try {
        const res = await fetch("/api/progress", {
          method: "PUT",
          headers: {"Content-Type": "application/json" },
          body: JSON.stringify({ planId, completedDays: nextPlanProgress }),
        });
        if (res.status === 401) {
          setUser(null);
          setSession(null);
          setAllProgress({});
          setSyncStatus("guest");
          setLoginModalOpen(true);
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
    await syncPlansAndProgress();
    router.refresh();
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      const res = await fetch("/api/auth/refresh", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.ok) {
        setUser(data.user);
        setSession(data.session);
        await syncPlansAndProgress();
        showToast("ซิงค์ข้อมูลล่าสุดเรียบร้อยแล้ว");
      } else {
        setUser(null);
        setSession(null);
        setAllProgress({});
        setSyncStatus("guest");
        router.refresh();
        showToast("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
      }
    } catch {
      showToast("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    } finally {
      setRefreshingToken(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });
    } catch {
      // ignore
    }
    const defaultPlanId = PLANS[0].id;
    const defaultPlan = PLANS[0];
    const defaultWeek = getCurrentWeekForPlan(defaultPlan);
    setUser(null);
    setSession(null);
    setAllProgress({});
    setPlans(PLANS);
    setSyncStatus("guest");
    setSelectedPlanId(defaultPlanId);
    setViewMode("schedule");
    setScheduleScope(defaultPlan.status === "completed" ? "all" : "day");
    setFocusedWeek(defaultWeek);
    setFocusedDay(new Date().getDay());
    setActiveFilter(defaultWeek);
    setModalGuide(null);
    setLoginModalOpen(false);
    setMcpModalOpen(false);
    router.refresh();
    window.location.replace("/");
  };

  const requireAuthOrPrompt = () => {
    if (user) return true;
    showToast("กรุณาเข้าสู่ระบบด้วยอีเมลก่อนบันทึกความคืบหน้า");
    setLoginModalOpen(true);
    return false;
  };

  const handleSelectPlan = (planId) => {
    const nextPlan = resolvePlan(planId);
    const nextWeek = getCurrentWeekForPlan(nextPlan);
    setSelectedPlanId(planId);
    setActiveFilter(nextPlan.status === "completed" ? "all" : nextWeek);
    setFocusedWeek(nextWeek);
    setFocusedDay(new Date().getDay());
    setScheduleScope(nextPlan.status === "completed" ? "all" : "day");
    if (viewMode === "yearly") setViewMode("schedule");
  };

  const handleJumpToPlan = (planId, weekNum) => {
    setSelectedPlanId(planId);
    setActiveFilter(weekNum || 1);
    setFocusedWeek(weekNum || 1);
    setScheduleScope("all");
    setViewMode("schedule");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleDay = (key, explicitValue) => {
    if (!requireAuthOrPrompt()) return;
    const currentPlanProgress = allProgress[activePlan.id] || {};
    const match = /^W(\d+)-(.+)$/.exec(String(key || ""));
    let nextPlanProgress;
    if (match) {
      const weekNum = Number(match[1]);
      const dayKey = resolveDayKey(match[2]);
      const comp = getSessionCompletion(currentPlanProgress, executionLogsState, weekNum, dayKey);
      const nextVal = typeof explicitValue === "boolean" ? explicitValue : !comp.completed;
      nextPlanProgress = {
        ...currentPlanProgress,
        [comp.progressKey]: nextVal,
      };
      if (comp.legacyKey) {
        nextPlanProgress[comp.legacyKey] = nextVal;
      }
    } else {
      const nextVal = typeof explicitValue === "boolean" ? explicitValue : !currentPlanProgress[key];
      nextPlanProgress = {
        ...currentPlanProgress,
        [key]: nextVal,
      };
    }
    setAllProgress((prev) => ({
      ...prev,
      [activePlan.id]: nextPlanProgress,
    }));
    syncPlanProgressToMongo(activePlan.id, nextPlanProgress);
  };

  const handleToggleWeekAll = (weekNum, markComplete) => {
    if (!requireAuthOrPrompt()) return;
    const currentPlanProgress = { ...(allProgress[activePlan.id] || {}) };
    const weekObj = activePlan.weeks.find((w) => w.week === weekNum);
    if (weekObj) {
      DAYS_ORDER.forEach((dk) => {
        const dayObj = buildStructuredDay(weekObj, dk, activePlan);
        if (!dayObj.isRest) {
          currentPlanProgress[`W${weekNum}-${dk}`] = markComplete;
          if (DAY_KEY_TO_LEGACY[dk]) {
            currentPlanProgress[`W${weekNum}-${DAY_KEY_TO_LEGACY[dk]}`] = markComplete;
          }
        }
      });
    } else {
      ["easy", "str", "inc", "long", "rec"].forEach((t) => {
        currentPlanProgress[`W${weekNum}-${t}`] = markComplete;
      });
    }
    setAllProgress((prev) => ({
      ...prev,
      [activePlan.id]: currentPlanProgress,
    }));
    syncPlanProgressToMongo(activePlan.id, currentPlanProgress);
  };

  const resetProgress = () => {
    if (!requireAuthOrPrompt()) return;
    if (confirm(`ต้องการรีเซ็ตความคืบหน้าของแผน"${activePlan.shortName}" ทั้งหมดใช่หรือไม่?`)) {
      setAllProgress((prev) => ({
        ...prev,
        [activePlan.id]: {},
      }));
      syncPlanProgressToMongo(activePlan.id, {});
    }
  };

  const {
    completed: completedCount,
    total: totalWorkouts,
    percent,
  } = countPlanProgress(activePlan, progressState);

  let filteredWeeks = [];
  if (activeFilter ==="all") {
    filteredWeeks = activePlan.weeks;
  } else if (typeof activeFilter ==="string") {
    filteredWeeks = activePlan.weeks.filter((w) => w.phase === activeFilter);
  } else if (typeof activeFilter ==="number") {
    filteredWeeks = activePlan.weeks.filter((w) => w.week === activeFilter);
  }

  const now = new Date();
  const jsDay = now.getDay();
  const todayThaiLabel = now.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const todayWeekObj = activePlan.weeks.find((w) => w.week === currentWeek) || activePlan.weeks[0];

  const getPrescriptionForWeekDay = (weekObj, dayNum, planId) => {
    if (!weekObj) return null;
    const isHybrid = planId === "hybrid-2026";
    const dayKey = JS_DAY_TO_KEY[dayNum] || "mon";
    const structured = buildStructuredDay(weekObj, dayKey, activePlan);
    const shortMap = { mon: "จ", tue: "อ", wed: "พ", thu: "พฤ", fri: "ศ", sat: "ส", sun: "อา" };
    const dayFullLabel = structured.label || `วัน${shortMap[dayKey]}`;

    const typeMetaMap = {
      chill_z2_run: {
        guideType: "easy",
        shortTitle: isHybrid ? "Z2 Run" : "Easy",
        headline: isHybrid ? "Chill Z2 Run" : "Easy Road",
        accent: "border-t-pocariBlue text-pocariBlue dark:text-sky-400",
      },
      easy: {
        guideType: "easy",
        shortTitle: isHybrid ? "Z2 Run" : "Easy",
        headline: isHybrid ? "Chill Z2 Run" : "Easy Road",
        accent: "border-t-pocariBlue text-pocariBlue dark:text-sky-400",
      },
      strength_a: {
        guideType: "str",
        shortTitle: "เวท A",
        headline: isHybrid ? "Strength Day A" : "Strength",
        accent: "border-t-purple-500 text-purple-700 dark:text-purple-400",
      },
      str: {
        guideType: "str",
        shortTitle: "เวท A",
        headline: isHybrid ? "Strength Day A" : "Strength",
        accent: "border-t-purple-500 text-purple-700 dark:text-purple-400",
      },
      incline_walk: {
        guideType: "inc",
        shortTitle: isHybrid ? (weekObj.isRecovery ? "Cardio" : "เดินชัน") : "Treadmill",
        headline: isHybrid ? (weekObj.isRecovery ? "Flat Cardio" : "Steep Incline") : "Treadmill Incline",
        accent: "border-t-treadmillGreen text-emerald-700 dark:text-emerald-400",
      },
      inc: {
        guideType: "inc",
        shortTitle: isHybrid ? (weekObj.isRecovery ? "Cardio" : "เดินชัน") : "Treadmill",
        headline: isHybrid ? (weekObj.isRecovery ? "Flat Cardio" : "Steep Incline") : "Treadmill Incline",
        accent: "border-t-treadmillGreen text-emerald-700 dark:text-emerald-400",
      },
      long_run: {
        guideType: "long",
        shortTitle: "Long",
        headline: isHybrid ? "Long Run / Football" : "Long Run",
        accent: "border-t-amber-500 text-amber-700 dark:text-amber-400",
      },
      long: {
        guideType: "long",
        shortTitle: "Long",
        headline: isHybrid ? "Long Run / Football" : "Long Run",
        accent: "border-t-amber-500 text-amber-700 dark:text-amber-400",
      },
      football: {
        guideType: "long",
        shortTitle: "บอล",
        headline: "Football Match",
        accent: "border-t-amber-500 text-amber-700 dark:text-amber-400",
      },
      strength_b: {
        guideType: "rec",
        shortTitle: "เวท B",
        headline: "Strength Day B",
        accent: "border-t-indigo-500 text-indigo-700 dark:text-indigo-400",
      },
      recovery: {
        guideType: "rec",
        shortTitle: isHybrid ? "เวท B" : "Recovery",
        headline: isHybrid ? "Strength Day B" : "Recovery",
        accent: "border-t-indigo-500 text-indigo-700 dark:text-indigo-400",
      },
      rec: {
        guideType: "rec",
        shortTitle: isHybrid ? "เวท B" : "Recovery",
        headline: isHybrid ? "Strength Day B" : "Recovery",
        accent: "border-t-indigo-500 text-indigo-700 dark:text-indigo-400",
      },
    };

    if (structured.isRest) {
      return {
        dayNum,
        dayKey,
        short: shortMap[dayKey],
        isRest: true,
        nextGuideType: dayKey === "fri" ? "long" : "str",
        guideType: "str",
        type: "rest",
        label: `${dayFullLabel} • ${structured.target || "Rest & Recovery"}`,
        shortTitle: "วันพัก",
        title: structured.target || "วันพักกล้ามเนื้อ",
        detail: structured.detail || "พักฟื้นร่างกาย",
      };
    }

    const meta = typeMetaMap[structured.type] || typeMetaMap.easy;
    return {
      dayNum,
      dayKey,
      short: shortMap[dayKey],
      isRest: false,
      type: meta.guideType,
      sessionType: structured.type,
      guideType: meta.guideType,
      label: `${dayFullLabel} • ${meta.headline}`,
      shortTitle: meta.shortTitle,
      title: structured.target,
      detail: structured.detail,
      exercises: structured.exercises,
      accent: meta.accent,
    };
  };

  const getDateLabelForWeekDay = (startDateStr, weekNum, dayNum) => {
    const base = new Date(startDateStr);
    const offsetFromMon = dayNum === 0 ? 6 : dayNum - 1;
    const target = new Date(base);
    target.setDate(base.getDate() + (weekNum - 1) * 7 + offsetFromMon);
    return target.toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const todaySpotlight = activePlan.status === "active" ? getPrescriptionForWeekDay(todayWeekObj, jsDay, activePlan.id) : null;
  const todayComp =
    todaySpotlight && !todaySpotlight.isRest
      ? getSessionCompletion(progressState, executionLogsState, currentWeek, todaySpotlight.dayKey)
      : null;
  const todayKey = todayComp?.progressKey || null;
  const isTodayCompleted = Boolean(todayComp?.completed);

  const focusedWeekObj = activePlan.weeks.find((w) => w.week === focusedWeek) || activePlan.weeks[0];
  const focusedPrescription = getPrescriptionForWeekDay(focusedWeekObj, focusedDay, activePlan.id);
  const focusedDateLabel = getDateLabelForWeekDay(activePlan.startDateStr, focusedWeekObj?.week || 1, focusedDay);
  const focusedComp =
    focusedPrescription && !focusedPrescription.isRest
      ? getSessionCompletion(progressState, executionLogsState, focusedWeekObj.week, focusedPrescription.dayKey)
      : null;
  const focusedKey = focusedComp?.progressKey || null;
  const isFocusedCompleted = Boolean(focusedComp?.completed);
  const isViewingToday = activePlan.status ==="active" && focusedWeek === currentWeek && focusedDay === jsDay;
  const WEEK_DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

  if (!user) {
    return (
      <div className="text-zinc-950 dark:text-zinc-50 antialiased min-h-screen bg-[#fafafa] dark:bg-zinc-950 flex flex-col overflow-x-hidden transition-colors duration-200">
        <nav className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md text-zinc-950 dark:text-zinc-50 border-b border-zinc-200 dark:border-zinc-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-[#1d4ed8] flex items-center justify-center text-white shadow-xs flex-shrink-0">
                <BrandMark className="w-4 h-4" />
              </span>
              <span className="font-semibold text-sm sm:text-base tracking-tight truncate">
                Training Hub
              </span>
            </div>
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="สลับโหมดสี สว่าง หรือ มืด"
              className="h-9 px-3 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 shadow-2xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span className="inline-flex items-center gap-1.5 dark:hidden">
                <MoonIcon className="w-3.5 h-3.5" />
                <span>มืด</span>
              </span>
              <span className="hidden dark:inline-flex items-center gap-1.5">
                <SunIcon className="w-3.5 h-3.5" />
                <span>สว่าง</span>
              </span>
            </button>
          </div>
        </nav>

        {sessionToast && (
          <div
            role="status"
            aria-live="polite"
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 bg-zinc-950 dark:bg-zinc-900 text-zinc-50 text-xs font-medium px-4 py-2.5 rounded-lg shadow-lg border border-zinc-800 text-center sm:text-left"
          >
            {sessionToast}
          </div>
        )}

        <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 sm:py-12">
          <div className="max-w-md w-full text-center mb-5 space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1 rounded-md bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-[#1d4ed8] dark:text-blue-400 border border-[#1d4ed8]/20 dark:border-blue-500/30">
              <LockIcon className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบเพื่อใช้งาน</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Training Hub
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              ติดตามโปรแกรมซ้อมรายวัน ดูท่าฝึกที่ถูกต้อง และบันทึกความคืบหน้าของคุณได้จากทุกที่
            </p>
          </div>

          <LoginModal
            isOpen
            inline
            onClose={() => {}}
            onLoginSuccess={handleLoginSuccess}
          />
        </main>

        <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Training Hub • ซิงค์ความคืบหน้าการซ้อมข้ามอุปกรณ์อัตโนมัติ
        </footer>
      </div>
    );
  }

  return (
    <div className="text-zinc-950 dark:text-zinc-50 antialiased min-h-screen bg-[#fafafa] dark:bg-zinc-950 flex flex-col overflow-x-hidden transition-colors duration-200">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[#1d4ed8] focus:text-white focus:text-xs focus:font-medium focus:shadow-lg"
      >
        ข้ามไปยังเนื้อหาหลัก
      </a>
      {/* Mobile-First Compact Sticky Top Navigation (shadcn/ui style) */}
      <nav className="bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md text-zinc-950 dark:text-zinc-50 sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          {/* Brand + Scalable Multi-Plan Combobox Switcher */}
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 w-full md:w-auto">
            {/* Top Row on Mobile: Brand + Session/Theme Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-7 h-7 rounded-lg bg-[#1d4ed8] flex items-center justify-center text-white shadow-2xs flex-shrink-0">
                  <BrandMark className="w-4 h-4" />
                </span>
                <span className="font-semibold text-sm sm:text-base tracking-tight leading-tight truncate">
                  Training Hub
                </span>
              </div>

              {/* Mobile-only right controls; on md+ these sit at the far right */}
              <div className="flex items-center gap-1.5 md:hidden">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMcpModalOpen(true)}
                      aria-label="เชื่อมต่อ MCP"
                      title="Connect MCP"
                      className="min-h-[38px] px-2.5 rounded-lg bg-[#1d4ed8]/10 dark:bg-blue-500/15 hover:bg-[#1d4ed8]/20 text-[#1d4ed8] dark:text-blue-400 border border-[#1d4ed8]/25 dark:border-blue-500/30 text-[11px] font-medium cursor-pointer inline-flex items-center gap-1"
                    >
                      <PlugIcon className="w-3.5 h-3.5" />
                      <span>MCP</span>
                    </button>
                    <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-lg text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 max-w-[72px] truncate" title={user.email}>
                        {user.email.split("@")[0]}
                      </span>
                      <button
                        type="button"
                        onClick={handleRefreshToken}
                        disabled={refreshingToken}
                        aria-label="ซิงค์ข้อมูลล่าสุด"
                        title="ซิงค์ข้อมูลล่าสุด"
                        className="min-h-[30px] px-1.5 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer inline-flex items-center justify-center"
                      >
                        <RefreshIcon className={`w-3.5 h-3.5 ${refreshingToken ? "animate-spin" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="min-h-[30px] px-2 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-red-600 dark:hover:bg-red-600 text-white dark:text-zinc-900 hover:text-white disabled:opacity-60 text-[10px] font-medium cursor-pointer active:scale-95 transition"
                      >
                        {loggingOut ? "..." : "ออก"}
                      </button>
                    </div>
                  </>
                ) : null}

                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label="สลับโหมดสี สว่าง หรือ มืด"
                  className="min-h-[38px] min-w-[38px] flex items-center justify-center px-2 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer"
                >
                  <span className="dark:hidden"><MoonIcon className="w-4 h-4" /></span>
                  <span className="hidden dark:inline"><SunIcon className="w-4 h-4" /></span>
                </button>
              </div>
            </div>

            <span className="hidden md:block h-4 w-px bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />

            <PlanSwitcher
              plans={plans}
              selectedPlanId={selectedPlanId}
              activePlan={activePlan}
              allProgress={allProgress}
              onSelectPlan={handleSelectPlan}
              isYearlyView={viewMode === "yearly"}
            />
          </div>

          {/* Desktop View Tabs + Connect MCP + User Session Pill + Dark Mode Toggle */}
          <div className="hidden md:flex items-center gap-2">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
              {[
                { id: "schedule", label: "ตารางซ้อม", Icon: CalendarIcon },
                { id: "playbook", label: "คู่มือ & ท่าเวท", Icon: BookOpenIcon },
                { id: "yearly", label: "รายปี", Icon: BarChartIcon },
              ].map((tab) => {
                const TabIcon = tab.Icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setViewMode(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                      viewMode === tab.id
                        ? "bg-[#1d4ed8] text-white shadow-xs"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setMcpModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#1d4ed8]/10 dark:bg-blue-500/15 hover:bg-[#1d4ed8]/20 text-[#1d4ed8] dark:text-blue-400 border border-[#1d4ed8]/25 dark:border-blue-500/30 text-xs font-medium transition cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5"
                >
                  <PlugIcon className="w-3.5 h-3.5" />
                  <span>Connect MCP</span>
                </button>

                <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-lg text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                  <span className="font-medium text-zinc-800 dark:text-zinc-200 max-w-[140px] truncate" title={user.email}>
                    {user.email}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 hidden xl:inline">
                    ({syncStatus === "syncing" ? "กำลังบันทึก..." : syncStatus === "error" ? "เชื่อมต่อไม่ได้" : "ซิงค์แล้ว"})
                  </span>
                  <button
                    type="button"
                    onClick={handleRefreshToken}
                    disabled={refreshingToken}
                    aria-label="ซิงค์ข้อมูลล่าสุด"
                    title="ซิงค์ข้อมูลล่าสุด"
                    className="p-1 rounded-md bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer inline-flex items-center"
                  >
                    <RefreshIcon className={`w-3.5 h-3.5 ${refreshingToken ? "animate-spin" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="px-2.5 py-1 rounded-md bg-zinc-900 dark:bg-zinc-100 hover:bg-red-600 dark:hover:bg-red-600 text-white dark:text-zinc-900 hover:text-white disabled:opacity-60 text-[10px] font-medium cursor-pointer active:scale-95 transition"
                  >
                    {loggingOut ? "..." : "ออก"}
                  </button>
                </div>
              </>
            ) : null}

            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label="สลับโหมดสี สว่าง หรือ มืด"
              title="สลับโหมดสว่าง / มืด"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 transition cursor-pointer whitespace-nowrap"
            >
              <span className="inline-flex items-center gap-1.5 dark:hidden">
                <MoonIcon className="w-3.5 h-3.5" />
                <span>มืด</span>
              </span>
              <span className="hidden dark:inline-flex items-center gap-1.5">
                <SunIcon className="w-3.5 h-3.5" />
                <span>สว่าง</span>
              </span>
            </button>
          </div>
        </div>
      </nav>

      {/* Non-blocking Toast (floats above mobile bottom nav) */}
      {sessionToast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-white/15 text-center md:text-left"
        >
          {sessionToast}
        </div>
      )}

      {/* Dynamic Hero Banner: compact in Day Focus mode, full in All/Playbook mode */}
      {viewMode !=="yearly" && (viewMode ==="playbook" || scheduleScope ==="all") && (
        <header className={`bg-gradient-to-r ${activePlan.theme.heroGradient} text-white py-6 sm:py-8 px-4 shadow-inner`}>
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${activePlan.theme.accentBadge} text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
                  {activePlan.statusLabel}
                </span>
                <span className="bg-white/15 text-white/95 text-[11px] font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{activePlan.periodLabel}</span>
                </span>
                {user && session?.lastRefreshedAt && (
                  <span className="bg-emerald-500/20 border border-emerald-300/30 text-emerald-100 text-[10px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                    <span>ซิงค์ข้อมูลแล้ว ({user.displayName})</span>
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
      <main id="main-content" className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-7 pb-6 flex-grow w-full">

        {viewMode ==="yearly" ? (
          <YearlyView onJumpToPlan={handleJumpToPlan} />
        ) : viewMode ==="playbook" ? (
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
            <PlaybookView plan={activePlan} currentWeek={currentWeek} />
          </>
        ) : scheduleScope === "day" ? (
          <div className="max-w-2xl mx-auto space-y-4">
            {/* Compact shadcn Focus Header + Mode Toggle */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-[#1d4ed8] dark:text-blue-400">
                      {activePlan.shortName}
                    </span>
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      เสร็จแล้ว {completedCount}/{totalWorkouts} ครั้ง ({percent}%)
                    </span>
                  </div>
                  <h1 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1 truncate">
                    {activePlan.title}
                  </h1>
                </div>

                <div role="tablist" aria-label="มุมมองตารางซ้อม" className="grid grid-cols-2 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg gap-1 flex-shrink-0 border border-zinc-200/70 dark:border-zinc-700/70">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={true}
                    onClick={() => setScheduleScope("day")}
                    className="min-h-[40px] sm:min-h-[34px] px-3 py-1 rounded-md text-xs font-medium bg-[#1d4ed8] text-white shadow-xs cursor-pointer whitespace-nowrap active:scale-[0.98] transition inline-flex items-center justify-center gap-1.5"
                  >
                    <TargetIcon className="w-3.5 h-3.5" />
                    <span>โฟกัสรายวัน</span>
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={false}
                    onClick={() => setScheduleScope("all")}
                    className="min-h-[40px] sm:min-h-[34px] px-3 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer whitespace-nowrap active:scale-[0.98] transition inline-flex items-center justify-center gap-1.5"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                    <span>ตารางทั้งแผน</span>
                  </button>
                </div>
              </div>

              {/* Minimal progress track */}
              <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1d4ed8] transition-all duration-300 rounded-full"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>

            {/* Week Selector & 7-Day Strip */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-3.5 sm:p-4 shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  disabled={focusedWeek <= 1}
                  onClick={() => setFocusedWeek((w) => Math.max(1, w - 1))}
                  aria-label="สัปดาห์ก่อนหน้า"
                  className="min-h-[44px] sm:min-h-[36px] px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 disabled:opacity-35 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer active:scale-95 transition inline-flex items-center gap-1"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                  <span>W{Math.max(1, focusedWeek - 1)}</span>
                </button>

                <div className="text-center">
                  <span className="text-xs sm:text-sm font-semibold text-zinc-950 dark:text-zinc-50 block">
                    Week {focusedWeekObj.week} / {activePlan.weeks.length}
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    {focusedWeekObj.phaseLabel}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {!isViewingToday && activePlan.status === "active" && (
                    <button
                      type="button"
                      onClick={() => {
                        setFocusedWeek(currentWeek);
                        setFocusedDay(jsDay);
                      }}
                      className="min-h-[44px] sm:min-h-[36px] px-2.5 rounded-lg bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-[#1d4ed8] dark:text-blue-400 text-[11px] font-medium cursor-pointer active:scale-95 transition"
                    >
                      วันนี้
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={focusedWeek >= activePlan.weeks.length}
                    onClick={() => setFocusedWeek((w) => Math.min(activePlan.weeks.length, w + 1))}
                    aria-label="สัปดาห์ถัดไป"
                    className="min-h-[44px] sm:min-h-[36px] px-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 disabled:opacity-35 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer active:scale-95 transition inline-flex items-center gap-1"
                  >
                    <span>W{Math.min(activePlan.weeks.length, focusedWeek + 1)}</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* 7-Day Strip (Mon -> Sun) with Arrow-key navigation */}
              <div
                role="group"
                aria-label="เลือกวันในสัปดาห์"
                onKeyDown={(e) => {
                  const idx = WEEK_DAY_ORDER.indexOf(focusedDay);
                  if (e.key === "ArrowRight") {
                    e.preventDefault();
                    setFocusedDay(WEEK_DAY_ORDER[(idx + 1) % 7]);
                  } else if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    setFocusedDay(WEEK_DAY_ORDER[(idx + 6) % 7]);
                  }
                }}
                className="grid grid-cols-7 gap-1.5"
              >
                {WEEK_DAY_ORDER.map((dNum) => {
                  const info = getPrescriptionForWeekDay(focusedWeekObj, dNum, activePlan.id);
                  const dComp = info && !info.isRest
                    ? getSessionCompletion(progressState, executionLogsState, focusedWeekObj?.week, info.dayKey)
                    : null;
                  const done = Boolean(dComp?.completed);
                  const isSelected = focusedDay === dNum;
                  const isToday = activePlan.status === "active" && focusedWeek === currentWeek && jsDay === dNum;

                  return (
                    <button
                      key={dNum}
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`${info?.label || info?.short}${isToday ? " (วันนี้)" : ""}${done ? " เสร็จแล้ว" : ""}`}
                      onClick={() => setFocusedDay(dNum)}
                      className={`min-h-[54px] rounded-lg p-1 flex flex-col items-center justify-center gap-0.5 border transition active:scale-95 cursor-pointer relative ${
                        isSelected
                          ? "bg-[#1d4ed8] text-white border-[#1d4ed8] shadow-xs"
                          : done
                          ? "bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80"
                          : "bg-zinc-50 dark:bg-zinc-800/50 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      {isToday && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full absolute top-1.5 right-1.5 ${
                            isSelected ? "bg-white" : "bg-[#1d4ed8] dark:bg-blue-400"
                          }`}
                          aria-hidden="true"
                        />
                      )}
                      <span className="text-[11px] font-semibold leading-none">{info?.short}</span>
                      <span
                        className={`text-[10px] leading-tight truncate max-w-full inline-flex items-center justify-center ${
                          isSelected ? "text-blue-100" : "text-zinc-500 dark:text-zinc-400"
                        }`}
                      >
                        {info?.isRest ? "พัก" : done ? <CheckIcon className="w-3 h-3" /> : info?.shortTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Single Focused Day Card */}
            {focusedPrescription && (
              <section
                aria-label="โปรแกรมซ้อมประจำวัน"
                className={`bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-6 border shadow-xs space-y-4 ${
                  isFocusedCompleted
                    ? "border-emerald-500/50 dark:border-emerald-600/60"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[11px] font-medium px-2.5 py-0.5 rounded-md ${
                        isViewingToday
                          ? "bg-[#1d4ed8] text-white"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200"
                      }`}
                    >
                      {isViewingToday ? "TODAY" : `WEEK ${focusedWeekObj.week}`}
                    </span>
                    <span suppressHydrationWarning className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      {focusedDateLabel}
                    </span>
                  </div>
                  {isFocusedCompleted && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckIcon className="w-3 h-3" />
                      <span>เสร็จแล้ว</span>
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-[#1d4ed8] dark:text-blue-400">
                    {focusedPrescription.label}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 mt-1">
                    {focusedPrescription.title}
                  </h2>
                  <p className="text-sm text-zinc-700 dark:text-zinc-200 mt-3 leading-relaxed bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
                    {focusedPrescription.detail}
                  </p>
                </div>

                {/* Week Focus & Nutrition for this day */}
                <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800/30 p-3.5 border border-zinc-200/70 dark:border-zinc-800 space-y-2 text-[13px]">
                  <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed pl-3 border-l-2 border-[#1d4ed8] dark:border-blue-500">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">โฟกัสสัปดาห์ที่ {focusedWeekObj.week}:</span>{" "}
                    {focusedWeekObj.focus}
                  </p>
                  {focusedWeekObj.nutritionNote && (
                    <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed pl-3 border-l-2 border-emerald-500">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-400">Nutrition:</span> {focusedWeekObj.nutritionNote}
                    </p>
                  )}
                </div>

                {/* Primary Day Actions */}
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  {focusedPrescription.isRest ? (
                    <button
                      type="button"
                      onClick={() =>
                        setModalGuide({
                          type: focusedPrescription.nextGuideType || "str",
                          weekNum: focusedWeekObj.week,
                        })
                      }
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-lg bg-[#1d4ed8] hover:bg-[#1e40af] text-white text-sm font-medium shadow-xs transition cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <DumbbellIcon className="w-4 h-4" />
                      <span>เตรียมดูท่าซ้อมวันถัดไป</span>
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => focusedKey && handleToggleDay(focusedKey)}
                        aria-pressed={isFocusedCompleted}
                        className={`w-full sm:flex-1 min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium border transition cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.98] ${
                          isFocusedCompleted
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs"
                            : "bg-[#1d4ed8] hover:bg-[#1e40af] text-white border-[#1d4ed8] shadow-xs"
                        }`}
                      >
                        {isFocusedCompleted ? (
                          <>
                            <CheckIcon className="w-4 h-4" />
                            <span>ซ้อมเสร็จแล้ว (แตะเพื่อยกเลิก)</span>
                          </>
                        ) : (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-current" aria-hidden="true" />
                            <span>บันทึกว่าซ้อมเสร็จแล้ว</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setModalGuide({
                            type: focusedPrescription.type,
                            weekNum: focusedWeekObj.week,
                            dayKey: focusedPrescription.dayKey,
                          })
                        }
                        className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-lg bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 text-sm font-medium transition cursor-pointer inline-flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <BookOpenIcon className="w-4 h-4" />
                        <span>ดูท่าซ้อม &amp; GIF</span>
                      </button>
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        ) : (
          <>
            {/* Mode Switch Back to Day Focus */}
            <div className="flex justify-end mb-4">
              <div className="inline-grid grid-cols-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-lg gap-1">
                <button
                  type="button"
                  onClick={() => setScheduleScope("day")}
                  className="min-h-[34px] px-3 py-1 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white cursor-pointer inline-flex items-center gap-1.5"
                >
                  <TargetIcon className="w-3.5 h-3.5" />
                  <span>โฟกัสรายวัน</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleScope("all")}
                  className="min-h-[34px] px-3 py-1 rounded-md text-xs font-medium bg-[#1d4ed8] text-white shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <CalendarIcon className="w-3.5 h-3.5" />
                  <span>ตารางทั้งแผน</span>
                </button>
              </div>
            </div>

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
                            TODAY
                          </span>
                          <span suppressHydrationWarning className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {todayThaiLabel} • Week {currentWeek}
                          </span>
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                          {todaySpotlight.label}:{" "}
                          <span className="text-[#1d4ed8] dark:text-blue-400">{todaySpotlight.title}</span>
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {todaySpotlight.detail}
                        </p>
                        {todayWeekObj?.nutritionNote && (
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                            <span className="font-bold">Nutrition:</span> {todayWeekObj.nutritionNote}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 flex-shrink-0 w-full lg:w-auto">
                        {todaySpotlight.isRest ? (
                          <button
                            type="button"
                            onClick={() => setModalGuide({ type: "str", weekNum: currentWeek })}
                            className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-pocariBlue hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer inline-flex items-center justify-center gap-2"
                          >
                            <DumbbellIcon className="w-4 h-4" />
                            <span>เตรียมดูตาราง Strength Day A ล่วงหน้า</span>
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                setModalGuide({
                                  type: todaySpotlight.type,
                                  weekNum: currentWeek,
                                  dayKey: todaySpotlight.dayKey,
                                })
                              }
                              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-pocariBlue hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer inline-flex items-center justify-center gap-2"
                            >
                              <BookOpenIcon className="w-4 h-4" />
                              <span>ดูท่าซ้อม &amp; GIF วันนี้</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => todayKey && handleToggleDay(todayKey)}
                              aria-pressed={isTodayCompleted}
                              className={`w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition cursor-pointer inline-flex items-center justify-center gap-2 ${
                                isTodayCompleted
                                  ? "bg-treadmillGreen text-white border-treadmillGreen shadow-sm"
                                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:border-treadmillGreen"
                              }`}
                            >
                              {isTodayCompleted ? (
                                <>
                                  <CheckIcon className="w-4 h-4" />
                                  <span>ซ้อมเสร็จแล้ววันนี้</span>
                                </>
                              ) : (
                                <span>บันทึกว่าซ้อมเสร็จแล้ว</span>
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {/* Phase & Week Filter Toolbar */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-4 shadow-sm border border-slate-200/80 dark:border-slate-800 mb-5 sm:mb-6 flex flex-col lg:flex-row gap-3 sm:gap-4 justify-between items-stretch lg:items-center">
                  <div className="flex flex-nowrap sm:flex-wrap overflow-x-auto gap-1.5 w-full lg:w-auto pb-1 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                        activeFilter ==="all"
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
                        className={`min-h-[36px] sm:min-h-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer whitespace-nowrap flex-shrink-0 ${
                          activeFilter === ph.id
                            ? "bg-pocariBlue text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {ph.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full lg:w-auto sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setActiveFilter(currentWeek)}
                      className="min-h-[40px] sm:min-h-0 text-xs font-semibold text-pocariBlue dark:text-sky-400 bg-blue-50 dark:bg-sky-950/60 hover:bg-blue-100 dark:hover:bg-sky-900/60 px-3 py-2 rounded-lg transition cursor-pointer whitespace-nowrap text-center truncate"
                    >
                      สัปดาห์นี้ (W{currentWeek})
                    </button>
                    <select
                      id="weekSelect"
                      value={typeof activeFilter ==="number" ? activeFilter : ""}
                      onChange={(e) => setActiveFilter(e.target.value ? parseInt(e.target.value, 10) : "all")}
                      className="min-h-[40px] sm:min-h-0 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:text-sm rounded-lg focus:ring-pocariBlue focus:border-pocariBlue block p-2 font-medium cursor-pointer w-full sm:w-auto"
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
                      plan={activePlan}
                      planId={activePlan.id}
                      progressState={progressState}
                      executionLogs={executionLogsState}
                      onToggleDay={handleToggleDay}
                      onToggleWeekAll={handleToggleWeekAll}
                      onOpenGuide={(type, weekNum, dayKey) => setModalGuide({ type, weekNum, dayKey })}
                      startDateStr={activePlan.startDateStr}
                      isCurrentWeek={activePlan.status ==="active" && w.week === currentWeek}
                      todayDayType={activePlan.status ==="active" && w.week === currentWeek ? JS_DAY_TO_KEY[jsDay] : null}
                      isAuthenticated={Boolean(user)}
                    />
                  ))}
                </div>
              </>
            </>
          )}
      </main>

      {/* Footer (extra bottom padding on mobile for fixed bottom nav) */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-4 pb-24 md:pb-4 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Training Hub • ซิงค์ความคืบหน้าการซ้อมข้ามอุปกรณ์อัตโนมัติ
      </footer>

      {/* Mobile Bottom Tab Bar */}
      <nav
        aria-label="เมนูหลักบนมือถือ"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="grid grid-cols-3 gap-1 max-w-md mx-auto">
          {[
            { id: "schedule", Icon: CalendarIcon, label: "ตารางซ้อม" },
            { id: "playbook", Icon: BookOpenIcon, label: "คู่มือ & ท่าเวท" },
            { id: "yearly", Icon: BarChartIcon, label: "รายปี" },
          ].map((tab) => {
            const active = viewMode === tab.id;
            const NavIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setViewMode(tab.id)}
                className={`min-h-[48px] flex flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                  active
                    ? "bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-[#1d4ed8] dark:text-blue-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <NavIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {modalGuide && (
        <GuideModal
          type={modalGuide.type}
          weekNum={modalGuide.weekNum}
          dayKey={modalGuide.dayKey || null}
          planId={activePlan.id}
          plan={activePlan}
          onClose={() => setModalGuide(null)}
          weeklyData={activePlan.weeks}
        />
      )}

      <MCPConnectModal
        isOpen={mcpModalOpen}
        onClose={() => setMcpModalOpen(false)}
        userEmail={user.email}
        onPlansSynced={syncPlansAndProgress}
      />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
