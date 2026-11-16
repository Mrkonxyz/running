function getWeekRangeLabel(wNum, startDateStr) {
  const startDate = new Date(startDateStr);
  const start = new Date(startDate);
  start.setDate(startDate.getDate() + (wNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}`;
}

export function WeekCard({ week, planId, progressState, onCheckChange, onOpenGuide, startDateStr, isCurrentWeek }) {
  const rangeLabel = getWeekRangeLabel(week.week, startDateStr);

  let cardSurface = "bg-white border-slate-200/90";
  let badgeStyle = "bg-slate-100 text-slate-600";
  if (week.isRecovery) {
    cardSurface = "bg-sky-50/40 border-sky-200";
    badgeStyle = "bg-sky-100 text-sky-700";
  } else if (week.isEasy) {
    cardSurface = "bg-emerald-50/35 border-emerald-200";
    badgeStyle = "bg-emerald-100 text-emerald-700";
  } else if (week.isPeak) {
    cardSurface = "bg-amber-50/45 border-amber-300";
    badgeStyle = "bg-amber-100 text-amber-800";
  } else if (week.isRace || week.isGoal) {
    cardSurface = "bg-indigo-50/45 border-indigo-300 ring-2 ring-indigo-500/15";
    badgeStyle = "bg-indigo-100 text-indigo-700";
  }

  const isHybrid = planId === "hybrid-2026";

  const days = [
    {
      type: "easy",
      label: "อังคาร",
      title: isHybrid ? "Chill Z2 Run" : "Easy Road",
      target: week.tueTarget,
      detail: week.tueDetail,
      accent: "border-t-pocariBlue text-pocariBlue",
    },
    {
      type: "str",
      label: "พุธ",
      title: isHybrid ? "Strength A" : "Strength",
      target: week.wedTarget,
      detail: week.wedDetail,
      accent: "border-t-purple-500 text-purple-700",
    },
    {
      type: "inc",
      label: "พฤหัสบดี",
      title: isHybrid ? (week.isRecovery ? "Flat Cardio" : "Steep Incline") : "Treadmill",
      target: week.thuTarget,
      detail: week.thuDetail,
      accent: "border-t-treadmillGreen text-emerald-700",
    },
    {
      type: "long",
      label: "เสาร์",
      title: isHybrid ? "Long Run / ⚽" : "Long Run",
      target: week.satTarget,
      detail: week.satDetail,
      accent: "border-t-amber-500 text-amber-700",
    },
    {
      type: "rec",
      label: "อาทิตย์",
      title: isHybrid ? "Strength B" : "Recovery",
      target: week.sunTarget,
      detail: week.sunDetail,
      accent: "border-t-indigo-500 text-indigo-700",
    },
  ];

  const completedInWeek = days.filter((d) => progressState[`W${week.week}-${d.type}`]).length;

  return (
    <div className={`${cardSurface} rounded-2xl p-5 sm:p-6 border shadow-sm transition hover:shadow-md`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-bold tracking-wider uppercase">
              WEEK {week.week} • {rangeLabel}
            </span>
            {isCurrentWeek && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-pocariBlue text-white">
                สัปดาห์ปัจจุบัน
              </span>
            )}
          </div>
          <h3 className="text-base sm:text-lg font-bold mt-1 text-slate-800">{week.title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2.5 py-1 rounded-lg border border-slate-200/80">
            {completedInWeek}/5 เสร็จสิ้น
          </span>
          <span className={`text-[11px] px-2.5 py-1 rounded-lg font-bold ${badgeStyle}`}>
            {week.phaseLabel}
          </span>
        </div>
      </div>

      {/* Focus & Nutrition */}
      <div className="bg-white/90 rounded-xl p-3 border border-slate-200/70 mb-4 space-y-1.5">
        <p className="text-xs sm:text-[13px] text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">🎯 โฟกัสสัปดาห์นี้:</span> {week.focus}
        </p>
        {week.nutritionNote && (
          <p className="text-[11px] sm:text-xs text-emerald-700 font-medium">
            🥗 {week.nutritionNote}
          </p>
        )}
      </div>

      {/* 5 Active Training Days */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 mb-3">
        {days.map((day) => {
          const key = `W${week.week}-${day.type}`;
          const isChecked = !!progressState[key];

          return (
            <div
              key={day.type}
              onClick={() => onOpenGuide(day.type, week.week)}
              className={`rounded-xl border border-t-4 p-3 flex flex-col justify-between cursor-pointer transition group ${day.accent} ${
                isChecked
                  ? "bg-emerald-50/75 border-emerald-200"
                  : "bg-slate-50/80 hover:bg-white border-slate-200/80 hover:shadow-sm"
              }`}
            >
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    {day.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onCheckChange(e, key)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded text-pocariBlue focus:ring-pocariBlue w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-xs font-bold text-slate-800">{day.title}</p>
                <p className={`text-[11px] font-semibold mt-0.5 ${day.accent.split(" ")[1]}`}>
                  {day.target}
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5 leading-snug line-clamp-2">
                  {day.detail}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 group-hover:text-pocariBlue font-medium mt-2 inline-block">
                ดูวิธีซ้อมละเอียด ➔
              </span>
            </div>
          );
        })}
      </div>

      {/* Rest Days Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
        <div className="bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-200/50">
          <span className="font-bold text-slate-700">จันทร์:</span> {week.monRest}
        </div>
        <div className="bg-slate-50/80 px-3 py-1.5 rounded-lg border border-slate-200/50">
          <span className="font-bold text-slate-700">ศุกร์:</span> {week.friRest}
        </div>
      </div>
    </div>
  );
}
