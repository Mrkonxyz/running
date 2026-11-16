"use client";

import { useState, useEffect } from "react";
import { getPlanById } from "../data/plans";

function DatasetExerciseCard({ row, equipView, onExpand }) {
  const showHome = equipView === "both" || equipView === "home";
  const showGym = equipView === "both" || equipView === "gym";

  return (
    <div className="bg-slate-50/80 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-pocariBlue/10 dark:bg-sky-500/20 text-pocariBlue dark:text-sky-400 mr-1.5">
            {row.code}
          </span>
          <b className="text-xs sm:text-[13px] text-slate-800 dark:text-white">{row.muscle}</b>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 block">{row.sets}</span>
          <span className="text-[10px] text-slate-400">{row.rir}</span>
        </div>
      </div>

      <div className={`grid gap-2 ${showHome && showGym ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {showHome && row.homeGif && (
          <div
            onClick={() => onExpand(row)}
            className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:border-pocariBlue dark:hover:border-sky-400 cursor-pointer transition"
          >
            <img
              src={row.homeGif}
              alt={row.homeExerciseName || row.home}
              loading="lazy"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-contain bg-white border border-slate-100 flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-pocariBlue dark:text-sky-400 block">🏠 Home DB</span>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-snug">{row.home}</p>
              {row.homeExerciseName && (
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{row.homeExerciseName}</span>
              )}
            </div>
          </div>
        )}

        {showGym && row.gymGif && (
          <div
            onClick={() => onExpand(row)}
            className="flex items-center gap-2.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-700 hover:border-indigo-500 cursor-pointer transition"
          >
            <img
              src={row.gymGif}
              alt={row.gymExerciseName || row.gym}
              loading="lazy"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-contain bg-white border border-slate-100 flex-shrink-0"
            />
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">🏢 Commercial Gym</span>
              <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-100 leading-snug">{row.gym}</p>
              {row.gymExerciseName && (
                <span className="text-[10px] text-slate-400 block mt-0.5 truncate">{row.gymExerciseName}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {row.tips && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
          <b className="text-slate-700 dark:text-slate-200">💡 ทริค:</b> {row.tips}
        </p>
      )}
    </div>
  );
}

function StrengthModalSection({ rows, equipView, setEquipView, expandedRow, setExpandedRow, banner }) {
  return (
    <div className="space-y-3">
      {banner}

      {/* Equipment Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl">
        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 px-2">
          🎞️ ตัวอย่างท่าจาก exercises-dataset (คลิกที่รูปเพื่อขยาย)
        </span>
        <div className="flex gap-1">
          {[
            { id: "home", label: "🏠 Home DB" },
            { id: "gym", label: "🏢 Gym" },
            { id: "both", label: "เทียบ 2 แบบ" },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setEquipView(opt.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                equipView === opt.id
                  ? "bg-white dark:bg-slate-900 text-pocariBlue dark:text-sky-400 shadow-xs"
                  : "text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Expanded Preview Banner */}
      {expandedRow && (
        <div className="bg-slate-900 dark:bg-slate-950 text-white rounded-2xl p-4 space-y-3 border border-slate-700">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-pocariLight">
              🔍 {expandedRow.code} • {expandedRow.muscle} ({expandedRow.sets})
            </span>
            <button
              type="button"
              onClick={() => setExpandedRow(null)}
              className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-0.5 rounded-lg cursor-pointer"
            >
              ย่อลง ✕
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {expandedRow.homeGif && (
              <div className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-sky-300 mb-1.5">🏠 Home Dumbbell</span>
                <img
                  src={expandedRow.homeGif}
                  alt={expandedRow.homeExerciseName || expandedRow.home}
                  className="w-44 h-44 object-contain bg-white rounded-lg"
                />
                <span className="text-[11px] font-semibold mt-1.5">{expandedRow.homeExerciseName}</span>
              </div>
            )}
            {expandedRow.gymGif && (
              <div className="bg-white/10 rounded-xl p-2.5 flex flex-col items-center text-center">
                <span className="text-[10px] font-bold text-indigo-300 mb-1.5">🏢 Commercial Gym</span>
                <img
                  src={expandedRow.gymGif}
                  alt={expandedRow.gymExerciseName || expandedRow.gym}
                  className="w-44 h-44 object-contain bg-white rounded-lg"
                />
                <span className="text-[11px] font-semibold mt-1.5">{expandedRow.gymExerciseName}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Exercise Cards */}
      <div className="space-y-2.5">
        {rows.map((row) => (
          <DatasetExerciseCard
            key={row.code}
            row={row}
            equipView={equipView}
            onExpand={(r) => setExpandedRow(expandedRow?.code === r.code ? null : r)}
          />
        ))}
      </div>
    </div>
  );
}

export function GuideModal({ type, weekNum, planId, onClose, weeklyData }) {
  const [equipView, setEquipView] = useState("both");
  const [expandedRow, setExpandedRow] = useState(null);

  useEffect(() => {
    if (!type) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [type, onClose]);

  if (!type) return null;

  const wObj = weeklyData.find((d) => d.week === weekNum);
  const plan = getPlanById(planId);
  const isPhase0 = wObj?.phase === "recovery";
  const isPst34 = planId === "pst34-2026";

  let labelTxt = "";
  let titleTxt = "";
  let bodyHTML = null;

  if (isPst34 && wObj) {
    if (type === "str" && plan.playbook?.strengthDayA) {
      labelTxt = "พุธ • Lower & Upper Strength (PST34)";
      titleTxt = "เวทเข่าเฟิร์ม + ช่วงบนรับเป้น้ำ (พร้อม GIF สาธิต)";
      bodyHTML = (
        <StrengthModalSection
          rows={plan.playbook.strengthDayA}
          equipView={equipView}
          setEquipView={setEquipView}
          expandedRow={expandedRow}
          setExpandedRow={setExpandedRow}
          banner={
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <b>🎯 เป้าหมายเซสชั่น (Week {weekNum}):</b> {wObj.wedDetail}
            </p>
          }
        />
      );
    } else {
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
            <b>📋 รายละเอียดเซสชั่น (Week {weekNum}):</b><br />{info.det}
          </p>
          <p className="text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
            <b>🥤 โภชนาการสนาม:</b> {wObj.nutritionNote}
          </p>
        </div>
      );
    }
  } else if (type === "easy") {
    labelTxt = "อังคาร • Chill Z2 Cardio";
    titleTxt = "Chill Z2 Easy Run (Zero Pace Pressure)";
    bodyHTML = (
      <div className="space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          <b>🎯 วัตถุประสงค์:</b> เผาผลาญไขมันสูงสุด (FatMax) และรักษาฐานความอึดโดยไม่ทำลายกล้ามเนื้อ (Zero Interference Effect)
        </p>
        <div className="text-xs text-slate-700 dark:text-slate-200 bg-blue-50/50 dark:bg-sky-950/30 p-3 rounded-xl border border-blue-100 dark:border-sky-800/60 space-y-1.5">
          <p><b>📋 เป้าหมายสัปดาห์นี้:</b> <span className="font-bold text-pocariBlue dark:text-sky-400">{wObj?.tueTarget}</span></p>
          <p>• <b>โซนหัวใจหลัก:</b> True Zone 2 (<b>136 – 150 bpm</b> | เน้น FatMax 136–146 bpm)</p>
          <p>• <b>ความเร็ว & ความชัน:</b> ไม่ต้องสนเพซ (7:15–8:30 /km ได้หมด) ลู่ตั้งชัน <b>0.5%</b> หรือวิ่งทางราบสวนสาธารณะ</p>
          <p>• <b>รอบขา:</b> ก้าวสั้นนุ่มลงใต้สะโพก รอบขาธรรมชาติ <b>168–174 spm</b> เพื่อถนอมหน้าเข่า</p>
        </div>
        <div className="text-xs text-slate-600 dark:text-amber-200 bg-amber-50/50 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-100 dark:border-amber-800/60">
          <b>🥗 โภชนาการวันอังคาร (Cardio Fuel):</b> <b>2,050–2,150 kcal</b> | โปรตีน 150–170g | คาร์บปานกลาง 185–215g
        </div>
      </div>
    );
  } else if (type === "str") {
    labelTxt = "พุธ • Strength Day A (55–60 นาที)";
    titleTxt = "Lower Knee Armor + Upper Push/Pull Thickness";
    bodyHTML = (
      <StrengthModalSection
        rows={plan.playbook?.strengthDayA || []}
        equipView={equipView}
        setEquipView={setEquipView}
        expandedRow={expandedRow}
        setExpandedRow={setExpandedRow}
        banner={
          <div className="text-xs text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <b>🧪 ก่อนซ้อม 30–60 นาที:</b> ทาน <b>Collagen Peptides 15g + Vitamin C 50–100mg</b> (และเช้าวันพุธอย่าลืมชั่ง Fitdays ท้องว่าง!)
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
          <div className="text-xs text-sky-900 dark:text-sky-200 bg-sky-50 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800 space-y-1.5">
            <p><b>🚫 กฎเหล็ก Phase 0 (15–29 พ.ย.):</b> <b>ห้ามเดินชันเกิน 5%</b> จนกว่าหน้าเข่าจะนิ่งที่ 0/10 สนิท</p>
            <p>• <b>วิธีปฏิบัติ:</b> เดินลู่ทางราบ (0%) หรือปั่นจักรยาน Spinning <b>40–45 นาที</b> โซน 1–2 (121–138 bpm)</p>
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            <p className="text-slate-500 dark:text-slate-400">
              <b>🎯 วัตถุประสงค์:</b> กระตุ้นก้น (Glutes) น่อง และเผาไขมันด้วยแรงกระแทกต่ำ รักษาความสดของขา
            </p>
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-slate-800 dark:text-emerald-100">
              <p><b>1. Warm-up (10 นาที):</b> วิ่ง Chill Z2 ทางราบ 0.5%</p>
              <p><b>2. Main Set (25–35 นาที):</b> เดินชัน <b>{wObj?.phase === "phase1" ? "8–10%" : "8–12%"}</b> ความเร็ว <b>4.5–5.5 km/h</b> คุมหัวใจ <b>Z2–Low Z3 (130–152 bpm)</b></p>
              <p><b>3. Cooldown (5–10 นาที):</b> ปรับชัน 0% จ๊อกหรือเดินช้าสบายๆ</p>
            </div>
            <div className="bg-red-50/70 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200">
              <b>⚠️ ห้ามจับราวลู่วิ่ง!</b> แกว่งแขนตามธรรมชาติและดันส้นเท้า เพื่อบังคับให้ก้นและแกนกลางทำงานเต็มที่
            </div>
          </div>
        )}
      </div>
    );
  } else if (type === "long") {
    labelTxt = "เสาร์ • Weekend Cardio";
    titleTxt = "Chill Z2 Long Run (60–90m) หรือ ⚽ เตะฟุตบอล";
    bodyHTML = (
      <div className="space-y-3 text-xs">
        <div className="bg-amber-50/70 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1.5 text-slate-800 dark:text-amber-100">
          <p><b>🏃‍♂️ ตัวเลือกหลัก — Chill Z2 Long Run ({wObj?.satTarget}):</b></p>
          <p>• วิ่งชิลในสวนสาธารณะ <b>ไม่ต้องสะพายเป้น้ำ</b> เพซคุยสบายตลอดทาง</p>
          <p>• คุมหัวใจ <b>True Zone 2 (136–150 bpm)</b> เผา ~650–950 kcal ไม่พังขาสำหรับเวทวันอาทิตย์</p>
        </div>
        <div className="bg-slate-800 dark:bg-slate-950 text-white p-3 rounded-xl border border-slate-700 space-y-1.5">
          <p className="font-bold text-treadmillGreen">⚽ Clean Football Swap Rule (เมื่อมีนัดเตะบอล):</p>
          <p>• <b>ตัด Long Run วันเสาร์ออก 100%</b> ใช้แมตช์ฟุตบอลแทนเลย</p>
          <p>• วอร์มเข่า-สะโพก <b>5–8 นาที</b> ก่อนลงสนาม (Leg Swings + World&apos;s Greatest Stretch + Clamshell)</p>
          <p>• <b>วันอาทิตย์ (Strength B):</b> เล่น Upper V-Taper + Core ปกติ แต่ <b>ตัดท่า Hip Thrust/Glute Bridge ออก</b></p>
        </div>
      </div>
    );
  } else if (type === "rec") {
    labelTxt = "อาทิตย์ • Strength Day B (50–60 นาที)";
    titleTxt = "Upper Body V-Taper + Glutes & Core";
    bodyHTML = (
      <StrengthModalSection
        rows={plan.playbook?.strengthDayB || []}
        equipView={equipView}
        setEquipView={setEquipView}
        expandedRow={expandedRow}
        setExpandedRow={setExpandedRow}
        banner={
          <p className="text-xs text-slate-600 dark:text-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <b>🎯 วัตถุประสงค์:</b> ปั้นกรอบ V-Taper เต็มระบบ (อกบน, ปีกหลัง, ไหล่ข้าง-หลัง, แขนหน้า-หลัง) ควบคู่ก้นและแกนกลาง (จันทร์พัก 100%)
          </p>
        }
      />
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titleTxt}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-pocariBlue dark:text-sky-400 bg-blue-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-full">
              {labelTxt}
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5">{titleTxt}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold text-xl px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>
        <div>{bodyHTML}</div>
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <a
            href="https://github.com/hasaneyldrm/exercises-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-slate-400 hover:text-pocariBlue dark:hover:text-sky-400 transition"
          >
            Media: hasaneyldrm/exercises-dataset ↗
          </a>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition cursor-pointer"
          >
            ปิดหน้าต่าง (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
