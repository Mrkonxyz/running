"use client";

import { getPlanById } from "../data/plans";
import { getPrimaryExerciseDisplay, resolveStrengthRowsForWeek } from "../lib/schedule-utils.js";

function DatasetExerciseCard({ row, inline = false, onExpand }) {
  const { option, exerciseName, gif } = getPrimaryExerciseDisplay(row);

  return (
    <div className="bg-zinc-50/90 dark:bg-zinc-800/50 p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 space-y-2.5">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#1d4ed8]/10 dark:bg-blue-500/20 text-[#1d4ed8] dark:text-blue-400 mr-1.5">
            {row.code}
          </span>
          <b className="text-xs sm:text-[13px] text-zinc-900 dark:text-zinc-50">{row.muscle}</b>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[11px] font-bold text-zinc-800 dark:text-zinc-100 block">{row.sets}</span>
          <span className="text-[10px] text-zinc-500 dark:text-zinc-400">{row.rir}</span>
        </div>
      </div>

      {(gif || option) && (
        inline ? (
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3.5 bg-white dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200/80 dark:border-zinc-800">
            {gif && (
              <img
                src={gif}
                alt={exerciseName || option || row.muscle}
                loading="lazy"
                className="w-40 h-40 sm:w-36 sm:h-36 rounded-lg object-contain bg-white border border-zinc-100 flex-shrink-0"
              />
            )}
            <div className="min-w-0 w-full text-center sm:text-left sm:pt-1 space-y-1">
              <p className="text-xs sm:text-[13px] font-semibold text-zinc-900 dark:text-zinc-100 leading-snug">
                {option}
              </p>
              {exerciseName && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block">
                  {exerciseName}
                </span>
              )}
              {row.tips && (
                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 leading-relaxed pt-1.5 text-left">
                  <b className="text-zinc-800 dark:text-zinc-100">Technique Cue:</b> {row.tips}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div
            onClick={() => gif && onExpand?.(row)}
            className={`flex items-center gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700 transition ${
              gif ? "hover:border-pocariBlue dark:hover:border-sky-400 cursor-pointer" : ""
            }`}
          >
            {gif && (
              <img
                src={gif}
                alt={exerciseName || option || row.muscle}
                loading="lazy"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-contain bg-white border border-slate-100 flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">{option}</p>
              {exerciseName && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-1 truncate">
                  {exerciseName}
                </span>
              )}
            </div>
          </div>
        )
      )}

      {(!inline || (!gif && !option)) && row.tips && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          <b className="text-slate-700 dark:text-slate-200">Technique Cue:</b> {row.tips}
        </p>
      )}
    </div>
  );
}

function StrengthGuideSection({ rows, inline = false, expandedRow, setExpandedRow, banner }) {
  const expandedDisplay = !inline ? getPrimaryExerciseDisplay(expandedRow) : null;

  return (
    <div className="space-y-3">
      {banner}

      <div className="flex items-center justify-between gap-2 bg-zinc-100 dark:bg-zinc-800/80 px-3 py-2 rounded-lg">
        <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-300">
          {inline
            ? `รายการท่าฝึก (${rows.length} ท่า)`
            : `รายการท่าฝึก (${rows.length} ท่า • แตะที่รูปเพื่อขยาย)`}
        </span>
      </div>

      {/* Expanded Preview Banner (modal mode only) */}
      {!inline && expandedRow && expandedDisplay?.gif && (
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 space-y-3 border border-slate-700">
          <div className="flex justify-between items-center gap-2">
            <span className="text-xs font-bold text-pocariLight">
              {expandedRow.code} • {expandedRow.muscle} ({expandedRow.sets})
            </span>
            <button
              type="button"
              onClick={() => setExpandedRow?.(null)}
              className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-0.5 rounded-lg cursor-pointer"
            >
              ย่อลง
            </button>
          </div>
          <div className="bg-white/10 rounded-xl p-3 flex flex-col items-center text-center">
            <img
              src={expandedDisplay.gif}
              alt={expandedDisplay.exerciseName || expandedDisplay.option}
              className="w-48 h-48 sm:w-56 sm:h-56 object-contain bg-white rounded-lg"
            />
            {expandedDisplay.option && (
              <p className="text-xs font-semibold text-white mt-2">{expandedDisplay.option}</p>
            )}
            {expandedDisplay.exerciseName && (
              <span className="text-[11px] text-slate-300 mt-0.5">{expandedDisplay.exerciseName}</span>
            )}
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="space-y-2.5">
        {rows.map((row, idx) => (
          <DatasetExerciseCard
            key={row.code || idx}
            row={row}
            inline={inline}
            onExpand={(r) => setExpandedRow?.(expandedRow?.code === r.code ? null : r)}
          />
        ))}
      </div>
    </div>
  );
}

export function buildWorkoutGuideContent({
  type,
  weekNum,
  dayKey = null,
  planId,
  plan: propPlan,
  weeklyData,
  inline = false,
  isNextDayPreview = false,
  expandedRow = null,
  setExpandedRow = null,
}) {
  if (!type) return null;

  const wObj = (weeklyData || []).find((d) => d.week === weekNum);
  const plan = propPlan || getPlanById(planId);
  const defaultPlaybook = getPlanById("hybrid-2026")?.playbook;
  const activePlaybook = plan?.playbook || defaultPlaybook;
  const isPhase0 = wObj?.phase === "recovery";
  const isPst34 = planId === "pst34-2026";

  const strDayKey =
    dayKey ||
    (wObj?.days ? Object.keys(wObj.days).find((k) => wObj.days[k]?.type === "strength_a") : null) ||
    "wed";
  const recDayKey =
    dayKey ||
    (wObj?.days ? Object.keys(wObj.days).find((k) => wObj.days[k]?.type === "strength_b") : null) ||
    "sun";

  let labelTxt = "";
  let titleTxt = "";
  let bodyHTML = null;
  let hasGifs = false;

  if (isPst34 && wObj) {
    const pstStrengthRows = resolveStrengthRowsForWeek(wObj, strDayKey, plan?.playbook?.strengthDayA || []);
    if (type === "str" && pstStrengthRows.length > 0) {
      labelTxt = "พุธ • Lower & Upper Strength (PST34)";
      titleTxt = "เวทเข่าเฟิร์ม + ช่วงบนรับเป้น้ำ (พร้อม GIF สาธิต)";
      hasGifs = true;
      bodyHTML = (
        <StrengthGuideSection
          rows={pstStrengthRows}
          inline={inline}
          expandedRow={expandedRow}
          setExpandedRow={setExpandedRow}
          banner={
            inline && !isNextDayPreview ? null : (
              <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <b>เป้าหมายสัปดาห์ที่ {weekNum}:</b> {wObj.wedDetail}
              </p>
            )
          }
        />
      );
    } else {
      // In inline mode for active PST34 non-strength days, the day card already displays
      // the session detail & nutrition note, so skip rendering a duplicate card.
      if (inline && !isNextDayPreview) {
        return null;
      }
      const mapInfo = {
        easy: { lbl: "อังคาร • Easy Road", ttl: "Easy Road Zone 2 (136–150 bpm)", det: wObj.tueDetail },
        inc: { lbl: "พฤหัสบดี • Treadmill Incline 12%", ttl: "ซ้อมปีนเขาจำลองบนลู่วิ่ง", det: wObj.thuDetail },
        long: { lbl: "เสาร์ • Long Run / Race Day", ttl: wObj.satTarget, det: wObj.satDetail },
        rec: { lbl: "อาทิตย์ • Active Recovery", ttl: "จ๊อกเบา / ยืดเหยียด & Core", det: wObj.sunDetail },
      };
      const info = mapInfo[type] || mapInfo.easy;
      labelTxt = info.lbl;
      titleTxt = info.ttl;
      bodyHTML = (
        <div className="space-y-3 text-xs">
          <p className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed">
            <b>รายละเอียดเซสชั่น (Week {weekNum}):</b><br />{info.det}
          </p>
          {wObj.nutritionNote && (
            <p className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
              <b>โภชนาการสนาม:</b> {wObj.nutritionNote}
            </p>
          )}
        </div>
      );
    }
  } else if (type === "easy") {
    labelTxt = "อังคาร • Chill Z2 Cardio";
    titleTxt = "Chill Z2 Easy Run (Zero Pace Pressure)";
    bodyHTML = (
      <div className="space-y-3">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          <b>วัตถุประสงค์:</b> เผาผลาญไขมันสูงสุด (FatMax) และรักษาฐานความอึดโดยไม่ทำลายกล้ามเนื้อ (Zero Interference Effect)
        </p>
        <div className="text-xs text-zinc-700 dark:text-zinc-200 bg-blue-50/50 dark:bg-sky-950/30 p-3.5 rounded-xl border border-blue-100 dark:border-sky-800/60 space-y-1.5">
          {(!inline || isNextDayPreview) && wObj?.tueTarget && (
            <p><b>เป้าหมายสัปดาห์นี้:</b> <span className="font-bold text-pocariBlue dark:text-sky-400">{wObj.tueTarget}</span></p>
          )}
          <p>• <b>โซนหัวใจหลัก:</b> True Zone 2 (<b>136 – 150 bpm</b> | เน้น FatMax 136–146 bpm)</p>
          <p>• <b>ความเร็ว &amp; ความชัน:</b> ไม่ต้องสนเพซ (7:15–8:30 /km ได้หมด) ลู่ตั้งชัน <b>0.5%</b> หรือวิ่งทางราบสวนสาธารณะ</p>
          <p>• <b>รอบขา:</b> ก้าวสั้นนุ่มลงใต้สะโพก รอบขาธรรมชาติ <b>168–174 spm</b> เพื่อถนอมหน้าเข่า</p>
        </div>
        <div className="text-xs text-zinc-600 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-800/60">
          <b>โภชนาการวันอังคาร (Cardio Fuel):</b> <b>2,050–2,150 kcal</b> | โปรตีน 150–170g | คาร์บปานกลาง 185–215g
        </div>
      </div>
    );
  } else if (type === "str") {
    labelTxt = "พุธ • Strength Day A (55–60 นาที)";
    titleTxt = "Lower Knee Armor + Upper Push/Pull Thickness";
    hasGifs = true;
    const strengthARows = resolveStrengthRowsForWeek(wObj, strDayKey, activePlaybook?.strengthDayA || []);
    bodyHTML = (
      <StrengthGuideSection
        rows={strengthARows}
        inline={inline}
        expandedRow={expandedRow}
        setExpandedRow={setExpandedRow}
        banner={
          <div className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <b>ก่อนซ้อม 30–60 นาที:</b> ทาน <b>Collagen Peptides 15g + Vitamin C 50–100mg</b> (และเช้าวันพุธอย่าลืมชั่ง Fitdays ท้องว่าง!)
          </div>
        }
      />
    );
  } else if (type === "inc") {
    labelTxt = isPhase0 ? "พฤหัสบดี • Flat Cardio ONLY" : "พฤหัสบดี • Steep Incline Mastery";
    titleTxt = isPhase0 ? "Phase 0 Flat Walk / Spin (งดเดินชัน >5%)" : "เดินชัน 8–12% ปั้นก้น-น่อง & Fat Burn";
    bodyHTML = (
      <div className="space-y-3">
        {isPhase0 ? (
          <div className="text-xs text-sky-900 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/40 p-3.5 rounded-xl border border-sky-200 dark:border-sky-800 space-y-1.5">
            <p><b>กฎเหล็ก Phase 0 (15–29 พ.ย.):</b> <b>ห้ามเดินชันเกิน 5%</b> จนกว่าหน้าเข่าจะนิ่งที่ 0/10 สนิท</p>
            <p>• <b>วิธีปฏิบัติ:</b> เดินลู่ทางราบ (0%) หรือปั่นจักรยาน Spinning <b>40–45 นาที</b> โซน 1–2 (121–138 bpm)</p>
          </div>
        ) : (
          <div className="space-y-2.5 text-xs">
            <p className="text-zinc-500 dark:text-zinc-400">
              <b>วัตถุประสงค์:</b> กระตุ้นก้น (Glutes) น่อง และเผาไขมันด้วยแรงกระแทกต่ำ รักษาความสดของขา
            </p>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-zinc-800 dark:text-emerald-100">
              <p><b>1. Warm-up (10 นาที):</b> วิ่ง Chill Z2 ทางราบ 0.5%</p>
              <p><b>2. Main Set (25–35 นาที):</b> เดินชัน <b>{wObj?.phase === "phase1" ? "8–10%" : "8–12%"}</b> ความเร็ว <b>4.5–5.5 km/h</b> คุมหัวใจ <b>Z2–Low Z3 (130–152 bpm)</b></p>
              <p><b>3. Cooldown (5–10 นาที):</b> ปรับชัน 0% จ๊อกหรือเดินช้าสบายๆ</p>
            </div>
            <div className="bg-red-50/70 dark:bg-red-950/40 p-3 rounded-xl border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
              <b>ข้อควรระวัง — ห้ามจับราวลู่วิ่ง!</b> แกว่งแขนตามธรรมชาติและดันส้นเท้า เพื่อบังคับให้ก้นและแกนกลางทำงานเต็มที่
            </div>
          </div>
        )}
      </div>
    );
  } else if (type === "long") {
    labelTxt = "เสาร์ • Weekend Cardio";
    titleTxt = "Chill Z2 Long Run (60–90m) หรือ เตะฟุตบอล";
    bodyHTML = (
      <div className="space-y-3 text-xs">
        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5 text-zinc-800 dark:text-amber-100">
          <p><b>ตัวเลือกหลัก — Chill Z2 Long Run ({wObj?.satTarget}):</b></p>
          <p>• วิ่งชิลในสวนสาธารณะ <b>ไม่ต้องสะพายเป้น้ำ</b> เพซคุยสบายตลอดทาง</p>
          <p>• คุมหัวใจ <b>True Zone 2 (136–150 bpm)</b> เผา ~650–950 kcal ไม่พังขาสำหรับเวทวันอาทิตย์</p>
        </div>
        <div className="bg-zinc-900 dark:bg-zinc-950 text-white p-3.5 rounded-xl border border-zinc-700 space-y-1.5">
          <p className="font-bold text-treadmillGreen">Clean Football Swap Rule (เมื่อมีนัดเตะบอล):</p>
          <p>• <b>ตัด Long Run วันเสาร์ออก 100%</b> ใช้แมตช์ฟุตบอลแทนเลย</p>
          <p>• วอร์มเข่า-สะโพก <b>5–8 นาที</b> ก่อนลงสนาม (Leg Swings + World&apos;s Greatest Stretch + Clamshell)</p>
          <p>• <b>วันอาทิตย์ (Strength B):</b> เล่น Upper V-Taper + Core ปกติ แต่ <b>ตัดท่า Hip Thrust/Glute Bridge ออก</b></p>
        </div>
      </div>
    );
  } else if (type === "rec") {
    labelTxt = "อาทิตย์ • Strength Day B (50–60 นาที)";
    titleTxt = "Upper Body V-Taper + Glutes & Core";
    hasGifs = true;
    const strengthBRows = resolveStrengthRowsForWeek(wObj, recDayKey, activePlaybook?.strengthDayB || []);
    bodyHTML = (
      <StrengthGuideSection
        rows={strengthBRows}
        inline={inline}
        expandedRow={expandedRow}
        setExpandedRow={setExpandedRow}
        banner={
          <p className="text-xs text-zinc-600 dark:text-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <b>วัตถุประสงค์:</b> ปั้นกรอบ V-Taper เต็มระบบ (อกบน, ปีกหลัง, ไหล่ข้าง-หลัง, แขนหน้า-หลัง) ควบคู่ก้นและแกนกลาง (จันทร์พัก 100%)
          </p>
        }
      />
    );
  }

  return { labelTxt, titleTxt, bodyHTML, hasGifs };
}

export function WorkoutGuideInlineCard({
  type,
  weekNum,
  dayKey = null,
  planId,
  plan,
  weeklyData,
  isNextDayPreview = false,
  nextDayLabel = "",
}) {
  const guide = buildWorkoutGuideContent({
    type,
    weekNum,
    dayKey,
    planId,
    plan,
    weeklyData,
    inline: true,
    isNextDayPreview,
  });

  if (!guide) return null;

  return (
    <div
      aria-label={isNextDayPreview ? "เตรียมตัวสำหรับวันถัดไป" : "รายละเอียดและท่าซ้อม"}
      className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3.5"
    >
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          {isNextDayPreview ? (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25">
              เตรียมตัวสำหรับวันถัดไป
            </span>
          ) : (
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-md bg-[#1d4ed8]/10 dark:bg-blue-500/15 text-[#1d4ed8] dark:text-blue-400">
              รายละเอียด &amp; ท่าซ้อม
            </span>
          )}
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            {isNextDayPreview && nextDayLabel ? nextDayLabel : guide.labelTxt}
          </span>
        </div>
        <h3 className="text-base sm:text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {guide.titleTxt}
        </h3>
      </div>

      <div>{guide.bodyHTML}</div>

      {guide.hasGifs && (
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <a
            href="https://github.com/hasaneyldrm/exercises-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-zinc-400 hover:text-[#1d4ed8] dark:hover:text-blue-400 transition"
          >
            ภาพสาธิตจาก exercises-dataset ↗
          </a>
        </div>
      )}
    </div>
  );
}
