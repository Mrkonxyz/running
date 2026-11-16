export const APP_TIMEZONE = "Asia/Bangkok";

export const DAYS_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const LEGACY_TO_DAY_KEY = {
  easy: "tue",
  str: "wed",
  inc: "thu",
  long: "sat",
  rec: "sun",
};

export const DAY_KEY_TO_LEGACY = {
  tue: "easy",
  wed: "str",
  thu: "inc",
  sat: "long",
  sun: "rec",
};

export const JS_DAY_TO_KEY = {
  0: "sun",
  1: "mon",
  2: "tue",
  3: "wed",
  4: "thu",
  5: "fri",
  6: "sat",
};

export const DAY_META = {
  mon: { label: "วันจันทร์", short: "จ", offset: 0 },
  tue: { label: "วันอังคาร", short: "อ", offset: 1 },
  wed: { label: "วันพุธ", short: "พ", offset: 2 },
  thu: { label: "วันพฤหัสบดี", short: "พฤ", offset: 3 },
  fri: { label: "วันศุกร์", short: "ศ", offset: 4 },
  sat: { label: "วันเสาร์", short: "ส", offset: 5 },
  sun: { label: "วันอาทิตย์", short: "อา", offset: 6 },
};

export const VALID_SESSION_TYPES = [
  "rest",
  "chill_z2_run",
  "incline_walk",
  "strength_a",
  "strength_b",
  "football",
  "football_swap",
  "long_run",
  "recovery",
  "custom",
];

export function resolveDayKey(input) {
  const raw = String(input || "").trim().toLowerCase();
  if (DAYS_ORDER.includes(raw)) return raw;
  if (LEGACY_TO_DAY_KEY[raw]) return LEGACY_TO_DAY_KEY[raw];
  return null;
}

export function getBangkokDateStr(dateObj = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dateObj);
}

export function parseYmdUtc(ymd) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || "").trim());
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

export function formatUtcYmd(utcDate) {
  return utcDate.toISOString().slice(0, 10);
}

export function addDaysToYmd(ymd, offsetDays = 0) {
  const base = parseYmdUtc(ymd);
  if (!base) return null;
  base.setUTCDate(base.getUTCDate() + Number(offsetDays || 0));
  return formatUtcYmd(base);
}

export function resolveTargetDate(dateInput = null, offsetDays = 0) {
  const todayStr = getBangkokDateStr(new Date());
  const baseStr = dateInput && /^\d{4}-\d{2}-\d{2}$/.test(String(dateInput).trim())
    ? String(dateInput).trim()
    : todayStr;
  const resolvedDate = addDaysToYmd(baseStr, offsetDays) || todayStr;
  const utc = parseYmdUtc(resolvedDate);
  const jsDay = utc ? utc.getUTCDay() : new Date().getDay();
  const dayKey = JS_DAY_TO_KEY[jsDay] || "mon";
  return {
    todayDate: todayStr,
    date: resolvedDate,
    timezone: APP_TIMEZONE,
    jsDay,
    dayKey,
  };
}

export function resolveWeekAndDayForDate(plan, dateInput = null, offsetDays = 0) {
  const dateInfo = resolveTargetDate(dateInput, offsetDays);
  const startUtc = parseYmdUtc(plan?.startDateStr) || parseYmdUtc(dateInfo.todayDate);
  const targetUtc = parseYmdUtc(dateInfo.date);
  const diffDays = Math.floor((targetUtc - startUtc) / (1000 * 60 * 60 * 24));
  const rawWeek = Math.floor(diffDays / 7) + 1;
  const weeksCount = Array.isArray(plan?.weeks) ? plan.weeks.length : 1;
  const clampedWeek = Math.min(Math.max(rawWeek, 1), Math.max(weeksCount, 1));
  return {
    ...dateInfo,
    rawWeek,
    week: clampedWeek,
    outOfRange: rawWeek < 1 || rawWeek > weeksCount,
  };
}

export function mapPlaybookRowToExercise(row) {
  if (!row) return null;
  const setsStr = String(row.sets || "");
  const parts = setsStr.split("×").map((s) => s.trim());
  return {
    code: row.code,
    name: row.muscle || row.homeExerciseName || row.gymExerciseName || row.code,
    sets: Number.parseInt(parts[0], 10) || 3,
    repRange: parts[1] || "8–12",
    targetRir: row.rir || "1–2 RIR",
    tempo: row.tempo || null,
    restSec: row.restSec || 90,
    homeOption: row.home || "",
    gymOption: row.gym || "",
    homeExerciseName: row.homeExerciseName || "",
    gymExerciseName: row.gymExerciseName || "",
    homeGif: row.homeGif || "",
    gymGif: row.gymGif || "",
    rehabStage: row.rehabStage || null,
    tips: row.tips || "",
  };
}

function parseDurationHint(text) {
  const m = /(\d+)\s*[-–]?\s*(\d+)?\s*m\b/i.exec(String(text || ""));
  if (!m) return null;
  return Number.parseInt(m[2] || m[1], 10) || null;
}

export function buildStructuredDay(weekObj, dayKey, plan = null) {
  const planId = plan?.id || "";
  const isPst34 = planId === "pst34-2026";
  const explicit = weekObj?.days && weekObj.days[dayKey] && typeof weekObj.days[dayKey] === "object"
    ? weekObj.days[dayKey]
    : null;

  let defaultType = "rest";
  let defaultTarget = "วันพัก";
  let defaultDetail = "";
  let defaultExercises = [];

  if (dayKey === "mon") {
    defaultType = "rest";
    defaultTarget = "Rest & Recovery";
    defaultDetail = weekObj?.monRest || "พักเต็มวัน";
  } else if (dayKey === "tue") {
    defaultType = "chill_z2_run";
    defaultTarget = weekObj?.tueTarget || "Easy Cardio";
    defaultDetail = weekObj?.tueDetail || "";
  } else if (dayKey === "wed") {
    defaultType = "strength_a";
    defaultTarget = weekObj?.wedTarget || "Strength Day A";
    defaultDetail = weekObj?.wedDetail || "";
    if (Array.isArray(plan?.playbook?.strengthDayA)) {
      defaultExercises = plan.playbook.strengthDayA.map(mapPlaybookRowToExercise).filter(Boolean);
    }
  } else if (dayKey === "thu") {
    defaultType = weekObj?.isRecovery ? "chill_z2_run" : "incline_walk";
    defaultTarget = weekObj?.thuTarget || "Incline Walk / Cardio";
    defaultDetail = weekObj?.thuDetail || "";
  } else if (dayKey === "fri") {
    defaultType = "rest";
    defaultTarget = "Rest & Mobility";
    defaultDetail = weekObj?.friRest || "พักฟื้นร่างกาย";
  } else if (dayKey === "sat") {
    defaultType = "long_run";
    defaultTarget = weekObj?.satTarget || "Long Run";
    defaultDetail = weekObj?.satDetail || "";
  } else if (dayKey === "sun") {
    defaultType = isPst34 ? "recovery" : "strength_b";
    defaultTarget = weekObj?.sunTarget || (isPst34 ? "Active Recovery" : "Strength Day B");
    defaultDetail = weekObj?.sunDetail || "";
    if (!isPst34 && Array.isArray(plan?.playbook?.strengthDayB)) {
      defaultExercises = plan.playbook.strengthDayB.map(mapPlaybookRowToExercise).filter(Boolean);
    }
  }

  const target = explicit?.target !== undefined ? String(explicit.target) : String(defaultTarget);
  const detail = explicit?.detail !== undefined ? String(explicit.detail) : String(defaultDetail);
  const type = String(explicit?.type || explicit?.sessionType || defaultType);
  const durationMin = explicit?.durationMin !== undefined && explicit?.durationMin !== null
    ? Number(explicit.durationMin)
    : parseDurationHint(target) ?? parseDurationHint(detail);
  const exercises = Array.isArray(explicit?.exercises)
    ? explicit.exercises
    : defaultExercises;

  return {
    dayKey,
    label: explicit?.label || DAY_META[dayKey]?.label || dayKey,
    shortLabel: DAY_META[dayKey]?.short || dayKey,
    type,
    isRest: type === "rest",
    target,
    detail,
    durationMin: durationMin || null,
    exercises,
  };
}

export function buildWeekDaysMap(weekObj, plan = null) {
  const days = {};
  for (const key of DAYS_ORDER) {
    days[key] = buildStructuredDay(weekObj, key, plan);
  }
  return days;
}

export function getCanonicalProgressKey(weekNum, dayInput) {
  const dayKey = resolveDayKey(dayInput);
  if (!dayKey) return null;
  return `W${Number(weekNum)}-${dayKey}`;
}

export function getSessionCompletion(progressMap = {}, executionLogs = {}, weekNum, dayInput) {
  const dayKey = resolveDayKey(dayInput);
  if (!dayKey) return { completed: false, progressKey: null, log: null };
  const canonicalKey = `W${Number(weekNum)}-${dayKey}`;
  const legacyKey = DAY_KEY_TO_LEGACY[dayKey] ? `W${Number(weekNum)}-${DAY_KEY_TO_LEGACY[dayKey]}` : null;

  const completed =
    progressMap[canonicalKey] !== undefined
      ? Boolean(progressMap[canonicalKey])
      : legacyKey
      ? Boolean(progressMap[legacyKey])
      : false;

  const log =
    executionLogs?.[canonicalKey] ||
    (legacyKey ? executionLogs?.[legacyKey] : null) ||
    null;

  return {
    completed,
    progressKey: canonicalKey,
    legacyKey,
    log,
  };
}

/**
 * Count completed workouts in a plan while avoiding double-counting legacy vs canonical keys
 * and including mon/fri if configured as non-rest active days.
 */
export function countPlanProgress(plan, progressMap = {}) {
  const weeks = Array.isArray(plan?.weeks) ? plan.weeks : [];
  let completed = 0;
  let total = 0;
  for (const w of weeks) {
    const days = buildWeekDaysMap(w, plan);
    for (const dayKey of DAYS_ORDER) {
      const d = days[dayKey];
      const legacyKey = DAY_KEY_TO_LEGACY[dayKey];
      const canonicalDone = Boolean(progressMap[`W${w.week}-${dayKey}`]);
      const legacyDone = legacyKey ? Boolean(progressMap[`W${w.week}-${legacyKey}`]) : false;
      const done = canonicalDone || legacyDone;

      if (!d.isRest) {
        total += 1;
        if (done) completed += 1;
      } else if (done) {
        // If user explicitly marked a rest day completed, count cleanly
        total += 1;
        completed += 1;
      }
    }
  }
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}
