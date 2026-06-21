import React from 'react';

export function getWeekRangeLabel(wNum, startDateStr) {
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
  if (week.isEasy) bgStyle = "bg-emerald-50/30 border-emerald-300";
  else if (week.isPeak) bgStyle = "bg-amber-50/40 border-amber-400 font-semibold";
  else if (week.isRace) bgStyle = "bg-blue-50/50 border-pocariBlue ring-2 ring-pocariBlue/20";

  const longRunText = week.isRace ? "RACE DAY: 34 KM" : `Zone 2 ถนน - ${Math.floor(week.minutes / 60) > 0 ? Math.floor(week.minutes / 60) + ' ชม. ' : ''}${week.minutes % 60} นาที`;

  const days = [
    { type: 'easy', label: 'อังคาร (เย็น)', title: 'Easy Road', target: 'Zone 2 - 60 น.', color: 'text-pocariBlue' },
    { type: 'str', label: 'พุธ (เย็น)', title: 'Strength', target: 'เวทเข่า + บน', color: 'text-purple-600' },
    { type: 'inc', label: 'พฤหัสบดี', title: 'Treadmill', target: 'ชัน 12% - 60 น.', color: 'text-treadmillGreen' },
    { type: 'long', label: 'เสาร์ (เย็น)', title: 'Long Run', target: longRunText, color: 'text-amber-500' },
    { type: 'rec', label: 'อาทิตย์', title: 'Recovery', target: 'จ๊อก/เวท - 45 น.', color: 'text-emerald-500' }
  ];

  return (
    <div className={`${bgStyle} rounded-2xl p-5 border-l-4 shadow-sm relative transition hover:shadow-md border-l-pocariBlue`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
        <div>
          <span className="text-[10px] text-gray-400 font-bold tracking-wider block">WEEK {week.week} ({rangeLabel})</span>
          <h3 className="text-base font-bold mt-0.5 text-slate-800">
            {week.isRace ? '🏁 วันลุยศึกเชียงใหม่ PST34' : week.isEasy ? '🌿 สัปดาห์ผ่อนฟื้นคืนสภาพ' : week.isPeak ? '⭐ สัปดาห์ระยะทางสูงสุด (Peak Volume)' : `แผนสะสมพลังงานสัปดาห์ที่ ${week.week}`}
          </h3>
        </div>
        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-500 font-bold capitalize">{week.phase}</span>
      </div>
      <p className="text-xs text-gray-500 bg-white/70 p-2 rounded-lg border border-gray-100 mb-4">
        <b>โฟกัส:</b> {week.focus}
      </p>
      
      {/* 5-day columns layout: grid-cols-2 on mobile, grid-cols-5 on sm screen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {days.map((day) => {
          const key = `W${week.week}-${day.type}`;
          const isChecked = !!progressState[key];
          
          return (
            <div 
              key={day.type}
              onClick={() => onOpenGuide(day.type, week.week)}
              className="bg-gray-50 hover:bg-gray-100 p-2.5 rounded-xl border border-gray-100 flex flex-col justify-between cursor-pointer transition"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-gray-400">{day.label}</span>
                  <input 
                    type="checkbox" 
                    checked={isChecked}
                    onChange={(e) => onCheckChange(e, key)}
                    onClick={(e) => e.stopPropagation()} // Prevent opening modal when checking box
                    className="rounded text-pocariBlue focus:ring-pocariBlue w-3.5 h-3.5"
                  />
                </div>
                <p className="text-xs font-bold text-slate-700 mt-1">{day.title}</p>
                <p className={`text-[10px] ${day.color} font-medium`}>{day.target}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
