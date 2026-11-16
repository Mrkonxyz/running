"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CloseIcon,
  FlameIcon,
  SearchIcon,
  TrophyIcon,
} from "./Icons.jsx";

import { countPlanProgress } from "../lib/schedule-utils.js";

function getPlanProgressStats(plan, allProgress) {
  return countPlanProgress(plan, allProgress?.[plan.id] || {});
}

export function PlanSwitcher({
  plans,
  selectedPlanId,
  activePlan,
  allProgress,
  onSelectPlan,
  isYearlyView = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => searchInputRef.current?.focus(), 40);
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onPointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const filteredPlans = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return plans;
    return plans.filter(
      (p) =>
        p.shortName?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.periodLabel?.toLowerCase().includes(q)
    );
  }, [plans, query]);

  const activePlansGroup = filteredPlans.filter((p) => p.status !== "completed");
  const completedPlansGroup = filteredPlans.filter((p) => p.status === "completed");
  const currentStats = getPlanProgressStats(activePlan, allProgress);

  const handleChoose = (planId) => {
    onSelectPlan(planId);
    setOpen(false);
    setQuery("");
  };

  const renderGroup = (groupTitle, items) => {
    if (items.length === 0) return null;
    return (
      <div className="space-y-1">
        <div className="px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {groupTitle} ({items.length})
        </div>
        {items.map((p) => {
          const isSelected = p.id === selectedPlanId && !isYearlyView;
          const stats = getPlanProgressStats(p, allProgress);
          const isCompletedPlan = p.status === "completed";

          return (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => handleChoose(p.id)}
              className={`w-full min-h-[48px] text-left px-2.5 py-2 rounded-lg transition cursor-pointer flex items-center justify-between gap-2.5 ${
                isSelected
                  ? "bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-zinc-950 dark:text-white border border-[#1d4ed8]/30 dark:border-blue-500/40"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800/80 text-zinc-800 dark:text-zinc-200 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? "bg-[#1d4ed8] text-white"
                      : isCompletedPlan
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                      : "bg-blue-50 dark:bg-blue-950/60 text-[#1d4ed8] dark:text-blue-400"
                  }`}
                >
                  {isCompletedPlan ? <TrophyIcon className="w-4 h-4" /> : <FlameIcon className="w-4 h-4" />}
                </span>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold truncate">{p.shortName}</span>
                    {p.source === "mcp" && (
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[#1d4ed8]/10 text-[#1d4ed8] dark:bg-blue-500/20 dark:text-blue-300">
                        AI
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {p.periodLabel || `${p.weeks?.length || 0} สัปดาห์`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tabular-nums">
                  {stats.percent}%
                </span>
                <span className="w-4 flex items-center justify-center">
                  {isSelected && <CheckIcon className="w-4 h-4 text-[#1d4ed8] dark:text-blue-400" />}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="relative w-full md:w-auto">
      {/* Compact Combobox Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="เลือกแผนซ้อม"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full md:w-auto min-h-[40px] md:min-h-[36px] px-3 py-1.5 rounded-lg bg-zinc-100/90 dark:bg-zinc-900 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2.5 transition cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          {activePlan.status === "completed" ? (
            <TrophyIcon className="w-4 h-4 text-zinc-500 dark:text-zinc-400 flex-shrink-0" />
          ) : (
            <FlameIcon className="w-4 h-4 text-[#1d4ed8] dark:text-blue-400 flex-shrink-0" />
          )}
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[160px] sm:max-w-[200px]">
            {activePlan.shortName}
          </span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 tabular-nums">
            {plans.length} แผน
          </span>
        </span>

        <span className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 flex-shrink-0">
          <span className="md:hidden tabular-nums">{currentStats.percent}%</span>
          <ChevronsUpDownIcon className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* Dropdown Popover (Desktop) + Bottom Sheet (Mobile) */}
      {open && (
        <>
          {/* Mobile backdrop */}
          <div
            className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 md:hidden"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            role="listbox"
            aria-label="รายการแผนซ้อมทั้งหมด"
            className="fixed md:absolute inset-x-0 bottom-0 md:inset-x-auto md:bottom-auto md:top-full md:left-0 md:mt-1.5 z-50 w-full md:w-[340px] bg-white dark:bg-zinc-900 rounded-t-2xl md:rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))] md:pb-2"
          >
            {/* Mobile Sheet Header */}
            <div className="flex items-center justify-between px-4 pt-3.5 pb-2 md:hidden border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                เลือกแผนซ้อม ({plans.length})
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="ปิดรายการแผนซ้อม"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Instant Search Input */}
            <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-800">
              <div className="relative">
                <SearchIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="ค้นหาแผนซ้อม..."
                  aria-label="ค้นหาแผนซ้อม"
                  className="w-full h-9 pl-8 pr-3 rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:border-[#1d4ed8]"
                />
              </div>
            </div>

            {/* Grouped Scrollable List */}
            <div className="max-h-[55vh] md:max-h-[340px] overflow-y-auto p-2 space-y-3">
              {filteredPlans.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  ไม่พบแผนซ้อมที่ตรงกับ &ldquo;{query}&rdquo;
                </p>
              ) : (
                <>
                  {renderGroup("กำลังซ้อม", activePlansGroup)}
                  {renderGroup("จบภารกิจแล้ว", completedPlansGroup)}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
