function getWeekRangeLabel(wNum, startDateStr) {
  const startDate = new Date(startDateStr);
  const start = new Date(startDate);
  start.setDate(startDate.getDate() + (wNum - 1) * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return `${start.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}`;
}

export function WeekCard({ week, progressState, onCheckChange, onOpenGuide, startDateStr }) {
  const rangeLabel = getWeekRangeLabel(week.week, startDateStr);

  let bgStyle = "bg-white border-gray-200";
  let borderLeftColor = "border-l-pocariBlue";
  if (week.isRecovery) {
    bgStyle = "bg-sky-50/40 border-sky-300";
    borderLeftColor = "border-l-pocariLight";
  } else if (week.isEasy) {
    bgStyle = "bg-emerald-50/30 border-emerald-300";
    borderLeftColor = "border-l-treadmillGreen";
  } else if (week.isPeak) {
    bgStyle = "bg-amber-50/40 border-amber-400";
    borderLeftColor = "border-l-amber-500";
  } else if (week.isGoal) {
    bgStyle = "bg-blue-50/50 border-pocariBlue ring-2 ring-pocariBlue/20";
    borderLeftColor = "border-l-pocariBlue";
  }

  const days = [
    { type: 'easy', label: 'อังคาร (Office)', title: 'Chill Z2 Run', target: week.tueTarget, color: 'text-pocariBlue' },
    { type: 'str', label: 'พุธ (Office)', title: 'Strength A', target: week.wedTarget, color: 'text-purple-600' },
    { type: 'inc', label: 'พฤหัสบดี (Office)', title: week.isRecovery ? 'Flat Cardio' : 'Steep Incline', target: week.thuTarget, color: 'text-treadmillGreen' },
    { type: 'long', label: 'เสาร์ (Weekend)', title: 'Long Run / ⚽', target: week.satTarget, color: 'text-amber-600' },
    { type: 'rec', label: 'อาทิตย์ (Weekend)', title: 'Strength B', target: week.sunTarget, color: 'text-indigo-600' }
  ];

  return (
    <div className={`${bgStyle} rounded-2xl p-5 border-l-4 shadow-sm relative transition hover:shadow-md ${borderLeftColor}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <span className="text-[10px] text-gray-400 font-bold tracking-wider block">
            WEEK {week.week} ({rangeLabel}) • 1 ACTIVITY / DAY
          </span>
          <h3 className="text-base font-bold mt-0.5 text-slate-800">
            {week.title}
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
            {week.phaseLabel}
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-600 bg-white/80 p-2.5 rounded-lg border border-gray-100 mb-3 leading-relaxed">
        <b>โฟกัส:</b> {week.focus}
      </p>

      <div className="flex items-center justify-between text-[10px] text-gray-400 mb-3 px-1">
        <span>🛌 <b>จ. & ศ.:</b> Rest + Active NEAT (8,000+ ก้าว | Fat-Burn 1,850–2,000 kcal)</span>
      </div>

      {/* 5-day columns layout */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {days.map((day) => {
          const key = `W${week.week}-${day.type}`;
          const isChecked = !!progressState[key];

          return (
            <div
              key={day.type}
              onClick={() => onOpenGuide(day.type, week.week)}
              className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition ${
                isChecked
                  ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-50'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-100'
              }`}
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-400">{day.label}</span>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => onCheckChange(e, key)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded text-pocariBlue focus:ring-pocariBlue w-3.5 h-3.5 cursor-pointer"
                  />
                </div>
                <p className="text-xs font-bold text-slate-700 mt-1">{day.title}</p>
                <p className={`text-[10px] ${day.color} font-medium mt-0.5`}>{day.target}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
