"use client";

import { useState, useEffect } from "react";
import { CloseIcon } from "./Icons.jsx";
import { buildWorkoutGuideContent } from "./WorkoutGuideContent.jsx";

export function GuideModal({ type, weekNum, dayKey = null, planId, plan: propPlan, onClose, weeklyData }) {
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

  const guide = buildWorkoutGuideContent({
    type,
    weekNum,
    dayKey,
    planId,
    plan: propPlan,
    weeklyData,
    inline: false,
    expandedRow,
    setExpandedRow,
  });

  if (!guide) return null;

  const { labelTxt, titleTxt, bodyHTML } = guide;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titleTxt}
      className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl max-w-2xl w-full p-5 sm:p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90dvh] overflow-y-auto"
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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>
        <div>{bodyHTML}</div>
        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <a
            href="https://github.com/hasaneyldrm/exercises-dataset"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-slate-400 hover:text-pocariBlue dark:hover:text-sky-400 transition"
          >
            ภาพสาธิตจาก exercises-dataset ↗
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
