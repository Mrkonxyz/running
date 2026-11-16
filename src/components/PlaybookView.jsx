"use client";

import { useState, useEffect } from "react";

function ExerciseGifThumb({ src, alt, onClick, sizeClass = "w-16 h-16" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex-shrink-0 ${sizeClass} rounded-xl overflow-hidden bg-white border border-slate-200 dark:border-slate-700 shadow-xs hover:border-pocariBlue dark:hover:border-sky-400 hover:shadow-md transition cursor-pointer`}
      title="คลิกเพื่อดูท่าออกกำลังกายขนาดใหญ่"
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-full object-contain bg-white"
      />
      <span className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition flex items-end justify-end p-1">
        <span className="opacity-0 group-hover:opacity-100 transition bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
          ขยาย 🔍
        </span>
      </span>
    </button>
  );
}

function StrengthCardGrid({
  id,
  badgeText,
  badgeClass,
  title,
  extraPill,
  rows,
  codeColorClass,
  equipMode,
  onSelectExercise,
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeClass}`}>
            {badgeText}
          </span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5">{title}</h3>
        </div>
        {extraPill && (
          <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg font-semibold border border-emerald-200 dark:border-emerald-800">
            {extraPill}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {rows.map((row) => (
          <div
            key={row.code}
            className="rounded-2xl p-4 bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between gap-3"
          >
            {/* Card Header */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 ${codeColorClass}`}>
                    {row.code}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">{row.muscle}</h4>
                </div>
                {row.targetMuscle && (
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                    {row.targetMuscle}
                  </span>
                )}
              </div>

              <div className="text-right flex-shrink-0 bg-white dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">{row.sets}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{row.rir}</span>
              </div>
            </div>

            {/* Home & Gym Large Thumbnails */}
            <div className={`grid gap-3 ${equipMode === "all" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
              {equipMode !== "gym" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                  {row.homeGif && (
                    <ExerciseGifThumb
                      sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                      src={row.homeGif}
                      alt={row.homeExerciseName || row.home}
                      onClick={() => onSelectExercise({ row, focus: "home" })}
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-pocariBlue dark:text-sky-400 block">
                      🏠 Home Dumbbell
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug mt-0.5">
                      {row.home}
                    </p>
                    {row.homeExerciseName && (
                      <button
                        type="button"
                        onClick={() => onSelectExercise({ row, focus: "home" })}
                        className="text-[10px] font-semibold text-pocariBlue dark:text-sky-400 hover:underline mt-1 inline-block cursor-pointer text-left"
                      >
                        🎞️ {row.homeExerciseName}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {equipMode !== "home" && (
                <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3">
                  {row.gymGif && (
                    <ExerciseGifThumb
                      sizeClass="w-20 h-20 sm:w-24 sm:h-24"
                      src={row.gymGif}
                      alt={row.gymExerciseName || row.gym}
                      onClick={() => onSelectExercise({ row, focus: "gym" })}
                    />
                  )}
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 block">
                      🏢 Commercial Gym
                    </span>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug mt-0.5">
                      {row.gym}
                    </p>
                    {row.gymExerciseName && (
                      <button
                        type="button"
                        onClick={() => onSelectExercise({ row, focus: "gym" })}
                        className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block cursor-pointer text-left"
                      >
                        🎞️ {row.gymExerciseName}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {row.tips && (
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 rounded-lg px-3 py-2 leading-relaxed">
                <b className="text-emerald-800 dark:text-emerald-300">💡 เทคนิค:</b> {row.tips}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function StrengthTable({
  id,
  badgeText,
  badgeClass,
  title,
  extraPill,
  rows,
  codeColorClass,
  equipMode,
  onSelectExercise,
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${badgeClass}`}>
            {badgeText}
          </span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1">{title}</h3>
        </div>
        {extraPill && (
          <span className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-lg font-semibold border border-emerald-200 dark:border-emerald-800">
            {extraPill}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-[13px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
              <th className="py-2.5 px-3 font-bold">รหัส</th>
              <th className="py-2.5 px-3 font-bold">กลุ่มกล้ามเนื้อ</th>
              {equipMode !== "gym" && <th className="py-2.5 px-3 font-bold">🏠 Home Dumbbell (+GIF)</th>}
              {equipMode !== "home" && <th className="py-2.5 px-3 font-bold">🏢 Commercial Gym (+GIF)</th>}
              <th className="py-2.5 px-3 font-bold">เซต × ครั้ง</th>
              <th className="py-2.5 px-3 font-bold">Tempo & RIR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((row) => (
              <tr key={row.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 align-top">
                <td className={`py-3 px-3 font-bold ${codeColorClass}`}>{row.code}</td>
                <td className="py-3 px-3">
                  <span className="font-semibold text-slate-800 dark:text-white block">{row.muscle}</span>
                  {row.targetMuscle && (
                    <span className="text-[10px] text-slate-400 uppercase tracking-wide">{row.targetMuscle}</span>
                  )}
                </td>

                {equipMode !== "gym" && (
                  <td className="py-3 px-3 min-w-[230px]">
                    <div className="flex items-start gap-2.5">
                      {row.homeGif && (
                        <ExerciseGifThumb
                          src={row.homeGif}
                          alt={row.homeExerciseName || row.home}
                          onClick={() => onSelectExercise({ row, focus: "home" })}
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200 leading-snug">{row.home}</p>
                        {row.homeExerciseName && (
                          <button
                            type="button"
                            onClick={() => onSelectExercise({ row, focus: "home" })}
                            className="text-[10px] font-semibold text-pocariBlue dark:text-sky-400 hover:underline mt-1 inline-block cursor-pointer"
                          >
                            🎞️ {row.homeExerciseName}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                )}

                {equipMode !== "home" && (
                  <td className="py-3 px-3 min-w-[230px]">
                    <div className="flex items-start gap-2.5">
                      {row.gymGif && (
                        <ExerciseGifThumb
                          src={row.gymGif}
                          alt={row.gymExerciseName || row.gym}
                          onClick={() => onSelectExercise({ row, focus: "gym" })}
                        />
                      )}
                      <div>
                        <p className="font-medium text-slate-700 dark:text-slate-200 leading-snug">{row.gym}</p>
                        {row.gymExerciseName && (
                          <button
                            type="button"
                            onClick={() => onSelectExercise({ row, focus: "gym" })}
                            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline mt-1 inline-block cursor-pointer"
                          >
                            🎞️ {row.gymExerciseName}
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                )}

                <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{row.sets}</td>
                <td className="py-3 px-3 text-slate-500 dark:text-slate-400">
                  <span className="block">{row.rir}</span>
                  {row.tips && (
                    <button
                      type="button"
                      onClick={() => onSelectExercise({ row, focus: equipMode === "gym" ? "gym" : "home" })}
                      className="text-[10px] text-slate-400 hover:text-pocariBlue dark:hover:text-sky-400 mt-1 inline-block cursor-pointer"
                    >
                      ดูทริค + รูปใหญ่ ➔
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExerciseLightboxModal({ selection, onClose }) {
  useEffect(() => {
    if (!selection) return;
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
  }, [selection, onClose]);

  if (!selection) return null;
  const { row } = selection;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={row.muscle}
      className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-pocariBlue/10 dark:bg-sky-500/20 text-pocariBlue dark:text-sky-400">
                {row.code}
              </span>
              {row.targetMuscle && (
                <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  {row.targetMuscle}
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white mt-1">{row.muscle}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <b>ปริมาณซ้อม:</b> {row.sets} • <b>จังหวะ & ความหนัก:</b> {row.rir}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่าง"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white font-bold text-2xl leading-none px-2 cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {row.homeGif && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold text-pocariBlue dark:text-sky-300 bg-blue-50 dark:bg-sky-950 px-2.5 py-0.5 rounded-full mb-2">
                🏠 Home Dumbbell
              </span>
              <img
                src={row.homeGif}
                alt={row.homeExerciseName || row.home}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain bg-white rounded-xl border border-slate-200 shadow-xs"
              />
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-2.5">{row.home}</p>
              {row.homeExerciseName && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{row.homeExerciseName}</span>
              )}
            </div>
          )}

          {row.gymGif && (
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-700 flex flex-col items-center text-center">
              <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full mb-2">
                🏢 Commercial Gym
              </span>
              <img
                src={row.gymGif}
                alt={row.gymExerciseName || row.gym}
                className="w-52 h-52 sm:w-60 sm:h-60 object-contain bg-white rounded-xl border border-slate-200 shadow-xs"
              />
              <p className="text-xs font-bold text-slate-800 dark:text-white mt-2.5">{row.gym}</p>
              {row.gymExerciseName && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{row.gymExerciseName}</span>
              )}
            </div>
          )}
        </div>

        {row.tips && (
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 text-xs text-emerald-950 dark:text-emerald-200 mb-4 leading-relaxed">
            <b>💡 จุดโฟกัส & เทคนิค:</b> {row.tips}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <a
            href="https://github.com/hasaneyldrm/exercises-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-pocariBlue dark:hover:text-sky-400 transition"
          >
            📦 Dataset: hasaneyldrm/exercises-dataset (GIF Demo) ↗
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

export function PlaybookView({ plan }) {
  const { playbook } = plan;
  const [equipMode, setEquipMode] = useState("all"); // 'all' | 'home' | 'gym'
  const [layoutMode, setLayoutMode] = useState("cards"); // 'cards' | 'table'
  const [selectedExercise, setSelectedExercise] = useState(null);

  const hasStrengthTables = Boolean(playbook?.strengthDayA || playbook?.strengthDayB);

  const jumpLinks = [
    playbook?.strengthDayA && { id: "playbook-str-a", label: "🏋️‍♂️ Strength A" },
    playbook?.strengthDayB && { id: "playbook-str-b", label: "📐 Strength B" },
    playbook?.nutritionMatrix && { id: "playbook-nutrition", label: "🥗 โภชนาการ" },
    playbook?.hrZones && { id: "playbook-zones", label: "⌚ โซนหัวใจ & กฎเหล็ก" },
  ].filter(Boolean);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="space-y-6">
      {/* Quick Section Jump Bar */}
      {jumpLinks.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider">ข้ามไปหมวด:</span>
          {jumpLinks.map((lnk) => (
            <button
              key={lnk.id}
              type="button"
              onClick={() => scrollToSection(lnk.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-pocariBlue hover:text-white transition cursor-pointer"
            >
              {lnk.label}
            </button>
          ))}
        </div>
      )}

      {/* Overview Cards */}
      {playbook?.overviewCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {playbook.overviewCards.map((card, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">{card.title}</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {card.items.map((item, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-pocariBlue dark:text-sky-400 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Mode & Layout Filter Toolbar */}
      {hasStrengthTables && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white block">
              🎞️ ตารางท่าเวทพร้อมภาพ Animation สาธิต (exercises-dataset)
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              คลิกที่รูป GIF ท่าไหนก็ได้เพื่อดูภาพใหญ่เทียบ Home Dumbbell vs Commercial Gym พร้อมเทคนิค
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Layout Switcher: Card View vs Table View */}
            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: "cards", label: "🃏 การ์ดภาพใหญ่" },
                { id: "table", label: "📋 ตารางเปรียบเทียบ" },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLayoutMode(l.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    layoutMode === l.id
                      ? "bg-white dark:bg-slate-900 text-pocariBlue dark:text-sky-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>

            {/* Equipment Mode */}
            <div className="flex flex-wrap gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: "all", label: "ทั้งหมด" },
                { id: "home", label: "🏠 Home DB" },
                { id: "gym", label: "🏢 Gym" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setEquipMode(m.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    equipMode === m.id
                      ? "bg-white dark:bg-slate-900 text-pocariBlue dark:text-sky-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strength Day A */}
      {playbook?.strengthDayA &&
        (layoutMode === "cards" ? (
          <StrengthCardGrid
            id="playbook-str-a"
            badgeText={plan.id === "pst34-2026" ? "พุธ • PST34 Strength" : "พุธ • 55–60 นาที"}
            badgeClass="text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60"
            title={
              plan.id === "pst34-2026"
                ? "🏋️‍♂️ Strength Day (PST34): เวทขาต้านลงเขา + ช่วงบนรับเป้น้ำ"
                : "🏋️‍♂️ Strength Day A: Lower Knee Armor + Upper Push/Pull Thickness"
            }
            extraPill={plan.id === "pst34-2026" ? null : "🧪 ก่อนซ้อม 30–60m: Collagen 15g + Vit C"}
            rows={playbook.strengthDayA}
            codeColorClass="text-purple-700 dark:text-purple-400"
            equipMode={equipMode}
            onSelectExercise={setSelectedExercise}
          />
        ) : (
          <StrengthTable
            id="playbook-str-a"
            badgeText={plan.id === "pst34-2026" ? "พุธ • PST34 Strength" : "พุธ • 55–60 นาที"}
            badgeClass="text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60"
            title={
              plan.id === "pst34-2026"
                ? "🏋️‍♂️ Strength Day (PST34): เวทขาต้านลงเขา + ช่วงบนรับเป้น้ำ"
                : "🏋️‍♂️ Strength Day A: Lower Knee Armor + Upper Push/Pull Thickness"
            }
            extraPill={plan.id === "pst34-2026" ? null : "🧪 ก่อนซ้อม 30–60m: Collagen 15g + Vit C"}
            rows={playbook.strengthDayA}
            codeColorClass="text-purple-700 dark:text-purple-400"
            equipMode={equipMode}
            onSelectExercise={setSelectedExercise}
          />
        ))}

      {/* Strength Day B */}
      {playbook?.strengthDayB &&
        (layoutMode === "cards" ? (
          <StrengthCardGrid
            id="playbook-str-b"
            badgeText="อาทิตย์ • 50–60 นาที"
            badgeClass="text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60"
            title="📐 Strength Day B: Upper Body V-Taper + Glutes & Core"
            rows={playbook.strengthDayB}
            codeColorClass="text-indigo-700 dark:text-indigo-400"
            equipMode={equipMode}
            onSelectExercise={setSelectedExercise}
          />
        ) : (
          <StrengthTable
            id="playbook-str-b"
            badgeText="อาทิตย์ • 50–60 นาที"
            badgeClass="text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60"
            title="📐 Strength Day B: Upper Body V-Taper + Glutes & Core"
            rows={playbook.strengthDayB}
            codeColorClass="text-indigo-700 dark:text-indigo-400"
            equipMode={equipMode}
            onSelectExercise={setSelectedExercise}
          />
        ))}

      {/* Nutrition Matrix & HR Zones */}
      {(playbook?.nutritionMatrix || playbook?.hrZones) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {playbook.nutritionMatrix && (
            <section
              id="playbook-nutrition"
              className="scroll-mt-20 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">
                🥗 ตารางพลังงาน & สารอาหารตามประเภทวัน
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                      <th className="py-2 px-2.5 font-bold">โหมด</th>
                      <th className="py-2 px-2.5 font-bold">วัน</th>
                      <th className="py-2 px-2.5 font-bold">kcal</th>
                      <th className="py-2 px-2.5 font-bold">P / C / F</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {playbook.nutritionMatrix.map((n, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-2.5 font-semibold text-slate-800 dark:text-slate-200">{n.mode}</td>
                        <td className="py-2 px-2.5 text-slate-500 dark:text-slate-400">{n.days}</td>
                        <td className="py-2 px-2.5 font-bold text-pocariBlue dark:text-sky-400 whitespace-nowrap">{n.kcal}</td>
                        <td className="py-2 px-2.5 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {n.protein} / {n.carbs} / {n.fat}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {playbook.hrZones && (
            <section
              id="playbook-zones"
              className="scroll-mt-20 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
            >
              <h3 className="text-base font-bold text-slate-800 dark:text-white mb-3">
                ⌚ โซนหัวใจจริง (%HRR Karvonen | RHR 45 / Max 196)
              </h3>
              <div className="space-y-2.5">
                {playbook.hrZones.map((z, i) => (
                  <div
                    key={i}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700/70 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-800 dark:text-white">{z.zone}</span>
                      <span className="text-slate-400 ml-2">({z.hrr})</span>
                    </div>
                    <div className="font-bold text-pocariBlue dark:text-sky-400">{z.bpm}</div>
                    <div className="text-slate-600 dark:text-slate-300 sm:text-right">{z.role}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Special Rules */}
      {playbook?.specialRules && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {playbook.specialRules.map((rule, i) => (
            <div key={i} className="bg-slate-900 dark:bg-slate-900/90 text-white rounded-2xl p-5 shadow-sm border border-slate-800">
              <h4 className="text-sm font-bold text-pocariLight mb-2">{rule.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{rule.desc}</p>
            </div>
          ))}
        </div>
      )}

      <ExerciseLightboxModal
        selection={selectedExercise}
        onClose={() => setSelectedExercise(null)}
      />
    </div>
  );
}
