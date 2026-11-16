"use client";

function getWeekRangeLabel(wNum, startDateStr) {
  const startDate = new Date(startDateStr);
  const start = new Date(startDate);
  start.setDate(startDate.getDate() + (wNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString("th-TH", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("th-TH", { month: "short", day: "numeric" })}`;
}

export function WeekCard({
  week,
  planId,
  progressState,
  onToggleDay,
  onToggleWeekAll,
  onOpenGuide,
  startDateStr,
  isCurrentWeek,
  todayDayType,
}) {
  const rangeLabel = getWeekRangeLabel(week.week, startDateStr);

  let cardSurface = "bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800";
  let badgeStyle = "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300";
  if (week.isRecovery) {
    cardSurface = "bg-sky-50/40 dark:bg-sky-950/25 border-sky-200 dark:border-sky-800/70";
    badgeStyle = "bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300";
  } else if (week.isEasy) {
    cardSurface = "bg-emerald-50/35 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/70";
    badgeStyle = "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300";
  } else if (week.isPeak) {
    cardSurface = "bg-amber-50/45 dark:bg-amber-950/25 border-amber-300 dark:border-amber-700/70";
    badgeStyle = "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300";
  } else if (week.isRace || week.isGoal) {
    cardSurface =
      "bg-indigo-50/45 dark:bg-indigo-950/30 border-indigo-300 dark:border-indigo-700/80 ring-2 ring-indigo-500/15";
    badgeStyle = "bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300";
  }

  const isHybrid = planId === "hybrid-2026";

  const days = [
    {
      type: "easy",
      label: "อังคาร",
      title: isHybrid ? "Chill Z2 Run" : "Easy Road",
      target: week.tueTarget,
      detail: week.tueDetail,
      accent: "border-t-pocariBlue text-pocariBlue dark:text-sky-400",
    },
    {
      type: "str",
      label: "พุธ",
      title: isHybrid ? "Strength A" : "Strength",
      target: week.wedTarget,
      detail: week.wedDetail,
      accent: "border-t-purple-500 text-purple-700 dark:text-purple-400",
    },
    {
      type: "inc",
      label: "พฤหัสบดี",
      title: isHybrid ? (week.isRecovery ? "Flat Cardio" : "Steep Incline") : "Treadmill",
      target: week.thuTarget,
      detail: week.thuDetail,
      accent: "border-t-treadmillGreen text-emerald-700 dark:text-emerald-400",
    },
    {
      type: "long",
      label: "เสาร์",
      title: isHybrid ? "Long Run / ⚽" : "Long Run",
      target: week.satTarget,
      detail: week.satDetail,
      accent: "border-t-amber-500 text-amber-700 dark:text-amber-400",
    },
    {
      type: "rec",
      label: "อาทิตย์",
      title: isHybrid ? "Strength B" : "Recovery",
      target: week.sunTarget,
      detail: week.sunDetail,
      accent: "border-t-indigo-500 text-indigo-700 dark:text-indigo-400",
    },
  ];

  const completedInWeek = days.filter((d) => progressState[`W${week.week}-${d.type}`]).length;
  const allWeekDone = completedInWeek === days.length;
  const weekPercent = Math.round((completedInWeek / days.length) * 100);

  return (
    <div className={`${cardSurface} rounded-2xl p-5 sm:p-6 border shadow-sm transition hover:shadow-md`}>
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
              {completedInWeek}/5
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
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
              allWeekDone
                ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 hover:text-emerald-700"
            }`}
          >
            {allWeekDone ? "✓ ครบสัปดาห์ (ล้าง)" : "เช็กทั้งสัปดาห์"}
          </button>

          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${badgeStyle}`}>
            {week.phaseLabel}
          </span>
        </div>
      </div>

      {/* Focus & Nutrition */}
      <div className="bg-white/90 dark:bg-slate-800/70 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/80 mb-4 space-y-1.5">
        <p className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 leading-relaxed">
          <span className="font-bold text-slate-900 dark:text-white">🎯 โฟกัสสัปดาห์นี้:</span> {week.focus}
        </p>
        {week.nutritionNote && (
          <p className="text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            🥗 {week.nutritionNote}
          </p>
        )}
      </div>

      {/* 5 Active Training Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3">
        {days.map((day) => {
          const key = `W${week.week}-${day.type}`;
          const isChecked = !!progressState[key];
          const isTodayCard = isCurrentWeek && todayDayType === day.type;

          return (
            <div
              key={day.type}
              className={`rounded-xl border border-t-4 p-3 flex flex-col justify-between transition ${day.accent} ${
                isTodayCard
                  ? "ring-2 ring-pocariBlue dark:ring-sky-400 shadow-sm"
                  : ""
              } ${
                isChecked
                  ? "bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/70"
                  : "bg-slate-50/80 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/80"
              }`}
            >
              <div>
                <div className="flex justify-between items-center gap-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {day.label}
                    </span>
                    {isTodayCard && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-pocariBlue text-white">
                        วันนี้
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggleDay(key)}
                    aria-pressed={isChecked}
                    aria-label={`${day.label} ${day.title}: ${isChecked ? "เสร็จแล้ว" : "ยังไม่เสร็จ"}`}
                    className={`min-h-[28px] px-2 py-0.5 rounded-lg text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                      isChecked
                        ? "bg-treadmillGreen text-white border-treadmillGreen"
                        : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-treadmillGreen"
                    }`}
                  >
                    <span aria-hidden="true">{isChecked ? "✓" : "○"}</span>
                    <span>{isChecked ? "เสร็จ" : "ติ๊ก"}</span>
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-800 dark:text-white">{day.title}</p>
                <p className={`text-[11px] font-semibold mt-0.5 ${day.accent.split(" ").slice(1).join(" ")}`}>
                  {day.target}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 leading-snug line-clamp-2">
                  {day.detail}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onOpenGuide(day.type, week.week)}
                className="mt-2.5 w-full text-left text-[11px] font-semibold text-pocariBlue dark:text-sky-400 hover:underline pt-2 border-t border-slate-200/60 dark:border-slate-700/60 cursor-pointer"
              >
                ดูท่าซ้อม & GIF ➔
              </button>
            </div>
          );
        })}
      </div>

      {/* Rest Days Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800">
        <div
          className={`px-3 py-1.5 rounded-lg border ${
            isCurrentWeek && new Date().getDay() === 1
              ? "bg-blue-50 dark:bg-sky-950/50 border-pocariBlue/40 dark:border-sky-500/50"
              : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800"
          }`}
        >
          <span className="font-bold text-slate-700 dark:text-slate-200">จันทร์:</span> {week.monRest}
        </div>
        <div
          className={`px-3 py-1.5 rounded-lg border ${
            isCurrentWeek && new Date().getDay() === 5
              ? "bg-blue-50 dark:bg-sky-950/50 border-pocariBlue/40 dark:border-sky-500/50"
              : "bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800"
          }`}
        >
          <span className="font-bold text-slate-700 dark:text-slate-200">ศุกร์:</span> {week.friRest}
        </div>
      </div>
    </div>
  );
}
