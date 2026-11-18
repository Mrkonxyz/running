"use client";

import { CheckIcon, ChevronRightIcon, LockIcon } from "./Icons.jsx";
import {
  DAYS_ORDER,
  DAY_KEY_TO_LEGACY,
  JS_DAY_TO_KEY,
  buildWeekDaysMap,
  getSessionCompletion,
  resolveDayKey,
} from "../lib/schedule-utils.js";

function getWeekRangeLabel(wNum, startDateStr) {
  const startDate = new Date(startDateStr);
  const start = new Date(startDate);
  start.setDate(startDate.getDate() + (wNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("th-TH", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("th-TH", { month: "short", day: "numeric" })}`;
}

function getSessionPresentation(type, week, isHybrid) {
  switch (type) {
    case "chill_z2_run":
    case "easy":
      return {
        guideType: "easy",
        title: isHybrid ? "Chill Z2 Run" : "Easy Road",
        accent: "border-t-pocariBlue text-pocariBlue dark:text-sky-400",
      };
    case "strength_a":
    case "str":
      return {
        guideType: "str",
        title: isHybrid ? "Strength A" : "Strength",
        accent: "border-t-purple-500 text-purple-700 dark:text-purple-400",
      };
    case "incline_walk":
    case "inc":
      return {
        guideType: "inc",
        title: isHybrid ? (week.isRecovery ? "Flat Cardio" : "Steep Incline") : "Treadmill",
        accent: "border-t-treadmillGreen text-emerald-700 dark:text-emerald-400",
      };
    case "long_run":
    case "long":
      return {
        guideType: "long",
        title: isHybrid ? "Long Run / Football" : "Long Run",
        accent: "border-t-amber-500 text-amber-700 dark:text-amber-400",
      };
    case "football":
      return {
        guideType: "long",
        title: "Football Match",
        accent: "border-t-amber-500 text-amber-700 dark:text-amber-400",
      };
    case "strength_b":
    case "recovery":
    case "rec":
    default:
      return {
        guideType: "rec",
        title: isHybrid ? "Strength B" : "Recovery",
        accent: "border-t-indigo-500 text-indigo-700 dark:text-indigo-400",
      };
  }
}

export function WeekCard({
  week,
  plan = null,
  planId,
  progressState,
  executionLogs = {},
  onToggleDay,
  onToggleWeekAll,
  onOpenGuide,
  startDateStr,
  isCurrentWeek,
  todayDayType,
  isAuthenticated = true,
}) {
  const rangeLabel = getWeekRangeLabel(week.week, startDateStr);

  let cardSurface = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
  let badgeStyle = "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300";
  if (week.isRecovery) {
    cardSurface = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
    badgeStyle = "bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-[#1d4ed8] dark:text-blue-400";
  } else if (week.isEasy) {
    cardSurface = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
    badgeStyle = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300";
  } else if (week.isPeak) {
    cardSurface = "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800";
    badgeStyle = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300";
  } else if (week.isRace || week.isGoal) {
    cardSurface = "bg-white dark:bg-zinc-900 border-[#1d4ed8]/40 dark:border-blue-500/50";
    badgeStyle = "bg-[#1d4ed8] text-white";
  }

  const isHybrid = planId === "hybrid-2026";
  const todayKeyResolved = resolveDayKey(todayDayType);
  const weekDaysMap = buildWeekDaysMap(week, plan || { id: planId });

  const allEntries = DAYS_ORDER.map((dayKey) => {
    const dayObj = weekDaysMap[dayKey];
    const presentation = getSessionPresentation(dayObj.type, week, isHybrid);
    const comp = getSessionCompletion(progressState, executionLogs, week.week, dayKey);
    return {
      ...dayObj,
      ...presentation,
      labelShort: dayObj.label.replace("วัน", ""),
      progressKey: comp.progressKey,
      legacyKey: comp.legacyKey,
      isChecked: comp.completed,
      executionLog: comp.log,
      legacyType: DAY_KEY_TO_LEGACY[dayKey] || null,
    };
  });

  const activeDays = allEntries.filter((d) => !d.isRest);
  const restDays = allEntries.filter((d) => d.isRest);

  const completedInWeek = activeDays.filter((d) => d.isChecked).length;
  const totalInWeek = activeDays.length || 1;
  const allWeekDone = activeDays.length > 0 && completedInWeek === activeDays.length;
  const weekPercent = Math.round((completedInWeek / totalInWeek) * 100);
  const gridColsClass = activeDays.length === 5 ? "lg:grid-cols-5" : activeDays.length <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  const currentJsDayKey = JS_DAY_TO_KEY[new Date().getDay()];

  return (
    <div className={`${cardSurface} rounded-2xl p-4 sm:p-6 border shadow-sm transition hover:shadow-md`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold tracking-wider uppercase">
              WEEK {week.week} • {rangeLabel}
            </span>
            {isCurrentWeek && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pocariBlue text-white">
                สัปดาห์ปัจจุบัน
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold mt-1 text-slate-800 dark:text-white">{week.title}</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {completedInWeek}/{activeDays.length}
            </span>
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-treadmillGreen transition-all duration-300"
                style={{ width: `${weekPercent}%` }}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => onToggleWeekAll(week.week, !allWeekDone)}
            className={`min-h-[36px] sm:min-h-0 text-[11px] font-semibold px-3 sm:px-2.5 py-1.5 sm:py-1 rounded-lg border transition cursor-pointer inline-flex items-center gap-1.5 ${
              allWeekDone
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700"
            }`}
          >
            {!isAuthenticated ? (
              <>
                <LockIcon className="w-3 h-3" />
                <span>Login เพื่อติ๊ก</span>
              </>
            ) : allWeekDone ? (
              <>
                <CheckIcon className="w-3 h-3" />
                <span>ครบสัปดาห์ (ล้าง)</span>
              </>
            ) : (
              <span>เช็กทั้งสัปดาห์</span>
            )}
          </button>

          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${badgeStyle}`}>
            {week.phaseLabel}
          </span>
        </div>
      </div>

      {/* Focus & Nutrition */}
      <div className="bg-white/90 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/80 mb-4 space-y-1.5">
        <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">โฟกัสสัปดาห์นี้:</span> {week.focus}
        </p>
        {week.nutritionNote && (
          <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <span className="font-semibold">Nutrition:</span> {week.nutritionNote}
          </p>
        )}
      </div>

      {/* Active Training Days */}
      {activeDays.length > 0 && (
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${gridColsClass} gap-2.5 mb-3`}>
          {activeDays.map((day) => {
            const isTodayCard = isCurrentWeek && todayKeyResolved === day.dayKey;

            return (
              <div
                key={day.dayKey}
                className={`rounded-xl border border-t-4 p-3 flex flex-col justify-between transition ${day.accent} ${
                  isTodayCard ? "ring-2 ring-pocariBlue dark:ring-sky-400 shadow-sm" : ""
                } ${
                  day.isChecked
                    ? "bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70"
                    : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80"
                }`}
              >
                <div>
                  <div className="flex justify-between items-center gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {day.labelShort}
                      </span>
                      {isTodayCard && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pocariBlue text-white">
                          วันนี้
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onToggleDay(day.progressKey)}
                      aria-pressed={day.isChecked}
                      aria-label={`${day.labelShort} ${day.title}: ${day.isChecked ? "เสร็จแล้ว" : "ยังไม่เสร็จ"}`}
                      className={`min-h-[36px] sm:min-h-[28px] px-3 sm:px-2 py-1 sm:py-0.5 rounded-lg text-[11px] sm:text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                        day.isChecked
                          ? "bg-treadmillGreen text-white border-treadmillGreen"
                          : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-treadmillGreen"
                      }`}
                    >
                      {!isAuthenticated ? (
                        <LockIcon className="w-3 h-3" />
                      ) : day.isChecked ? (
                        <CheckIcon className="w-3 h-3" />
                      ) : (
                        <span className="w-2.5 h-2.5 rounded-full border border-current inline-block" aria-hidden="true" />
                      )}
                      <span>{!isAuthenticated ? "ติ๊ก" : day.isChecked ? "เสร็จ" : "ติ๊ก"}</span>
                    </button>
                  </div>

                  <p className="text-xs font-bold text-slate-800 dark:text-white">{day.title}</p>
                  <p className={`text-[11px] font-semibold mt-0.5 ${day.accent.split(" ").slice(1).join(" ")}`}>
                    {day.target}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug line-clamp-2">
                    {day.detail}
                  </p>
                  {day.executionLog && (day.executionLog.actualDurationMin || day.executionLog.distanceKm || day.executionLog.rpe) && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {day.executionLog.distanceKm !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100/80 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 font-medium">
                          {day.executionLog.distanceKm} km
                        </span>
                      )}
                      {day.executionLog.actualDurationMin !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium">
                          {day.executionLog.actualDurationMin}m
                        </span>
                      )}
                      {day.executionLog.rpe !== undefined && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100/80 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-medium">
                          RPE {day.executionLog.rpe}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenGuide(day.guideType, week.week, day.dayKey)}
                  className="mt-2.5 w-full min-h-[38px] sm:min-h-0 flex items-center justify-between text-left text-xs sm:text-[11px] font-semibold text-pocariBlue dark:text-sky-400 hover:underline pt-2 border-t border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
                >
                  <span>ดูท่าซ้อม &amp; GIF</span>
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Rest Days Strip */}
      {restDays.length > 0 && (
        <div className={`grid grid-cols-1 ${restDays.length > 1 ? "sm:grid-cols-2" : ""} gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800`}>
          {restDays.map((rd) => {
            const isTodayRest = isCurrentWeek && currentJsDayKey === rd.dayKey;
            return (
              <div
                key={rd.dayKey}
                className={`px-3 py-1.5 rounded-lg border ${
                  isTodayRest
                    ? "bg-blue-50 dark:bg-sky-950/50 border-pocariBlue/40 dark:border-sky-500/50"
                    : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800"
                }`}
              >
                <span className="font-bold text-slate-700 dark:text-slate-200">{rd.labelShort}:</span>{" "}
                {rd.detail || rd.target}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
