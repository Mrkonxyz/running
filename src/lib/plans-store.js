import { PLANS, getPlanById } from "../data/plans/index.js";
import { getDb } from "./mongodb.js";
import {
  DAYS_ORDER,
  DAY_KEY_TO_LEGACY,
  DAY_META,
  buildStructuredDay,
  resolveDayKey,
} from "./schedule-utils.js";

const DEFAULT_THEME = {
  heroGradient: "from-zinc-950 via-zinc-900 to-[#1d4ed8]",
  accentBadge: "bg-[#1d4ed8] text-white",
  navBg: "bg-zinc-950",
  ringColor: "text-blue-400",
};

function sanitizeSlug(input, fallback = "custom-plan") {
  const cleaned = String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return cleaned || fallback;
}

function normalizeExercises(rawExercises, existingExercises = []) {
  if (!Array.isArray(rawExercises)) return undefined;
  const prevByCode = new Map();
  if (Array.isArray(existingExercises)) {
    for (const prev of existingExercises) {
      if (prev?.code) {
        prevByCode.set(String(prev.code).trim().toUpperCase(), prev);
      }
    }
  }

  return rawExercises
    .filter((ex) => ex && typeof ex === "object")
    .map((ex, idx) => {
      const code = String(ex.code || `E${idx + 1}`).trim();
      const prev = prevByCode.get(code.toUpperCase()) || null;

      let parsedSets = prev?.sets ?? 3;
      let parsedRepRange = prev?.repRange ?? "8–12";
      if (ex.sets !== undefined) {
        if (typeof ex.sets === "number" && Number.isFinite(ex.sets)) {
          parsedSets = ex.sets;
        } else if (typeof ex.sets === "string") {
          const sMatch = /^(\d+)\s*[×xX]\s*(.+)$/.exec(ex.sets.trim());
          if (sMatch) {
            parsedSets = Number.parseInt(sMatch[1], 10);
            if (ex.repRange === undefined && ex.reps === undefined) {
              parsedRepRange = sMatch[2].trim();
            }
          } else if (Number.isFinite(Number(ex.sets))) {
            parsedSets = Number(ex.sets);
          }
        }
      }

      const name =
        ex.name !== undefined
          ? String(ex.name)
          : ex.muscle !== undefined
          ? String(ex.muscle)
          : prev?.name || `Exercise ${idx + 1}`;
      const repRange =
        ex.repRange !== undefined
          ? String(ex.repRange)
          : ex.reps !== undefined
          ? String(ex.reps)
          : String(parsedRepRange);
      const targetRir =
        ex.targetRir !== undefined
          ? String(ex.targetRir)
          : ex.rir !== undefined
          ? String(ex.rir)
          : String(prev?.targetRir || "1–2 RIR");

      const homeOption =
        ex.homeOption !== undefined
          ? String(ex.homeOption)
          : ex.home !== undefined
          ? String(ex.home)
          : String(prev?.homeOption ?? "");
      const gymOption =
        ex.gymOption !== undefined
          ? String(ex.gymOption)
          : ex.gym !== undefined
          ? String(ex.gym)
          : String(prev?.gymOption ?? "");

      return {
        code,
        name,
        ...(ex.targetMuscle !== undefined
          ? { targetMuscle: String(ex.targetMuscle) }
          : prev?.targetMuscle
          ? { targetMuscle: prev.targetMuscle }
          : {}),
        sets: parsedSets,
        repRange,
        targetRir,
        tempo: ex.tempo !== undefined ? (ex.tempo ? String(ex.tempo) : null) : (prev?.tempo ?? null),
        restSec: ex.restSec !== undefined ? Number(ex.restSec) : (prev?.restSec ?? 90),
        homeOption,
        gymOption,
        homeExerciseName:
          ex.homeExerciseName !== undefined
            ? String(ex.homeExerciseName)
            : String(prev?.homeExerciseName ?? ""),
        gymExerciseName:
          ex.gymExerciseName !== undefined
            ? String(ex.gymExerciseName)
            : String(prev?.gymExerciseName ?? ""),
        homeGif:
          ex.homeGif !== undefined ? String(ex.homeGif) : String(prev?.homeGif ?? ""),
        gymGif:
          ex.gymGif !== undefined ? String(ex.gymGif) : String(prev?.gymGif ?? ""),
        rehabStage:
          ex.rehabStage !== undefined
            ? ex.rehabStage
              ? String(ex.rehabStage)
              : null
            : (prev?.rehabStage ?? null),
        ...(ex.progression !== undefined
          ? { progression: String(ex.progression) }
          : prev?.progression
          ? { progression: prev.progression }
          : {}),
        ...(ex.note !== undefined
          ? { note: String(ex.note) }
          : prev?.note
          ? { note: prev.note }
          : {}),
        tips: ex.tips !== undefined ? String(ex.tips) : String(prev?.tips ?? ""),
      };
    });
}

function syncFlatFieldsFromDays(targetWeek, daysMap) {
  const mapPairs = [
    ["tue", "tueTarget", "tueDetail"],
    ["wed", "wedTarget", "wedDetail"],
    ["thu", "thuTarget", "thuDetail"],
    ["sat", "satTarget", "satDetail"],
    ["sun", "sunTarget", "sunDetail"],
  ];

  if (daysMap.mon) {
    targetWeek.monRest = daysMap.mon.detail || daysMap.mon.target || targetWeek.monRest;
  }
  if (daysMap.fri) {
    targetWeek.friRest = daysMap.fri.detail || daysMap.fri.target || targetWeek.friRest;
  }
  for (const [k, tField, dField] of mapPairs) {
    if (daysMap[k]) {
      targetWeek[tField] = daysMap[k].target;
      targetWeek[dField] = daysMap[k].detail;
    }
  }
}

/**
 * Normalizes and merges a week object cleanly with strict partial-update semantics.
 * Preserves UTF-8 emojis/symbols and keeps legacy flat fields in sync with 7-day `days`.
 */
export function normalizeWeek(rawPatch = {}, fallbackNum = 1, baseWeek = null, plan = null) {
  const weekNum =
    rawPatch?.week !== undefined && Number.isInteger(Number(rawPatch.week)) && Number(rawPatch.week) > 0
      ? Number(rawPatch.week)
      : baseWeek?.week || fallbackNum;

  const base = baseWeek || {};

  const merged = {
    week: weekNum,
    phase: rawPatch.phase !== undefined ? String(rawPatch.phase) : String(base.phase || "base"),
    phaseLabel:
      rawPatch.phaseLabel !== undefined
        ? String(rawPatch.phaseLabel)
        : String(base.phaseLabel || `สัปดาห์ที่ ${weekNum}`),
    title:
      rawPatch.title !== undefined
        ? String(rawPatch.title)
        : String(base.title || `Week ${weekNum} Training`),
    tueTarget: rawPatch.tueTarget !== undefined ? String(rawPatch.tueTarget) : String(base.tueTarget || "Easy Cardio 35-45m"),
    tueDetail: rawPatch.tueDetail !== undefined ? String(rawPatch.tueDetail) : String(base.tueDetail || "วิ่งหรือคาร์ดิโอโซน 2 สบายๆ"),
    wedTarget: rawPatch.wedTarget !== undefined ? String(rawPatch.wedTarget) : String(base.wedTarget || "Strength Day A 45m"),
    wedDetail: rawPatch.wedDetail !== undefined ? String(rawPatch.wedDetail) : String(base.wedDetail || "เวทเทรนนิ่งช่วงบนและแกนกลาง"),
    thuTarget: rawPatch.thuTarget !== undefined ? String(rawPatch.thuTarget) : String(base.thuTarget || "Incline Walk / Cardio 40m"),
    thuDetail: rawPatch.thuDetail !== undefined ? String(rawPatch.thuDetail) : String(base.thuDetail || "เดินชันหรือปั่นจักรยานโซน 2"),
    satTarget: rawPatch.satTarget !== undefined ? String(rawPatch.satTarget) : String(base.satTarget || "Long Session 60m"),
    satDetail: rawPatch.satDetail !== undefined ? String(rawPatch.satDetail) : String(base.satDetail || "ฝึกความอึดระยะยาวโซน 2"),
    sunTarget: rawPatch.sunTarget !== undefined ? String(rawPatch.sunTarget) : String(base.sunTarget || "Strength Day B / Recovery"),
    sunDetail: rawPatch.sunDetail !== undefined ? String(rawPatch.sunDetail) : String(base.sunDetail || "เวทช่วงบน / ยืดเหยียดฟื้นฟูร่างกาย"),
    monRest: rawPatch.monRest !== undefined ? String(rawPatch.monRest) : String(base.monRest || "พักเต็มวัน + โปรตีนถึงเป้า"),
    friRest: rawPatch.friRest !== undefined ? String(rawPatch.friRest) : String(base.friRest || "พักฟื้นร่างกาย + ยืดเหยียดเบาๆ"),
    minutes:
      rawPatch.minutes !== undefined
        ? Number(rawPatch.minutes)
        : Number.isFinite(Number(base.minutes))
        ? Number(base.minutes)
        : 45,
    weeklyCardioMin:
      rawPatch.weeklyCardioMin !== undefined
        ? Number(rawPatch.weeklyCardioMin)
        : Number.isFinite(Number(base.weeklyCardioMin))
        ? Number(base.weeklyCardioMin)
        : 120,
    focus:
      rawPatch.focus !== undefined
        ? String(rawPatch.focus)
        : String(base.focus || "รักษาความสม่ำเสมอและคุมโซนหัวใจ"),
    nutritionNote:
      rawPatch.nutritionNote !== undefined
        ? String(rawPatch.nutritionNote)
        : String(base.nutritionNote || "โปรตีน 1.8-2.0 g/kg + ดื่มน้ำ 2.5 ลิตร"),
    isRecovery: rawPatch.isRecovery !== undefined ? Boolean(rawPatch.isRecovery) : Boolean(base.isRecovery),
    isEasy: rawPatch.isEasy !== undefined ? Boolean(rawPatch.isEasy) : Boolean(base.isEasy),
    isPeak: rawPatch.isPeak !== undefined ? Boolean(rawPatch.isPeak) : Boolean(base.isPeak),
    isRace: rawPatch.isRace !== undefined ? Boolean(rawPatch.isRace) : Boolean(base.isRace),
    isGoal: rawPatch.isGoal !== undefined ? Boolean(rawPatch.isGoal) : Boolean(base.isGoal),
  };

  if (rawPatch.nutritionTargets !== undefined || base.nutritionTargets) {
    merged.nutritionTargets = {
      ...(base.nutritionTargets || {}),
      ...(rawPatch.nutritionTargets || {}),
    };
  }

  // Merge 7-day `days` map cleanly without clobbering unmentioned days
  const nextDays = {};
  for (const key of DAYS_ORDER) {
    const existingStructured = buildStructuredDay(base, key, plan);
    const patchDay = rawPatch.days && typeof rawPatch.days === "object" ? rawPatch.days[key] : null;

    // Reflect explicit flat patch updates if `days[key]` was not directly provided
    let targetVal = existingStructured.target;
    let detailVal = existingStructured.detail;
    let typeVal = existingStructured.type;
    let durationVal = existingStructured.durationMin;
    let exercisesVal = existingStructured.exercises;

    if (key === "mon" && rawPatch.monRest !== undefined) detailVal = merged.monRest;
    if (key === "fri" && rawPatch.friRest !== undefined) detailVal = merged.friRest;
    if (key === "tue") {
      if (rawPatch.tueTarget !== undefined) targetVal = merged.tueTarget;
      if (rawPatch.tueDetail !== undefined) detailVal = merged.tueDetail;
    }
    if (key === "wed") {
      if (rawPatch.wedTarget !== undefined) targetVal = merged.wedTarget;
      if (rawPatch.wedDetail !== undefined) detailVal = merged.wedDetail;
    }
    if (key === "thu") {
      if (rawPatch.thuTarget !== undefined) targetVal = merged.thuTarget;
      if (rawPatch.thuDetail !== undefined) detailVal = merged.thuDetail;
    }
    if (key === "sat") {
      if (rawPatch.satTarget !== undefined) targetVal = merged.satTarget;
      if (rawPatch.satDetail !== undefined) detailVal = merged.satDetail;
    }
    if (key === "sun") {
      if (rawPatch.sunTarget !== undefined) targetVal = merged.sunTarget;
      if (rawPatch.sunDetail !== undefined) detailVal = merged.sunDetail;
    }

    if (patchDay && typeof patchDay === "object") {
      if (patchDay.type !== undefined || patchDay.sessionType !== undefined) {
        typeVal = String(patchDay.type || patchDay.sessionType);
      }
      if (patchDay.target !== undefined) targetVal = String(patchDay.target);
      if (patchDay.detail !== undefined) detailVal = String(patchDay.detail);
      if (patchDay.durationMin !== undefined) durationVal = Number(patchDay.durationMin);
      if (patchDay.exercises !== undefined) {
        exercisesVal = normalizeExercises(patchDay.exercises, existingStructured.exercises) || [];
      }
    }

    nextDays[key] = {
      dayKey: key,
      label: patchDay?.label ? String(patchDay.label) : DAY_META[key].label,
      shortLabel: DAY_META[key].short,
      type: typeVal,
      isRest: typeVal === "rest",
      target: targetVal,
      detail: detailVal,
      durationMin: durationVal,
      exercises: Array.isArray(exercisesVal) ? exercisesVal : [],
    };
  }

  merged.days = nextDays;
  syncFlatFieldsFromDays(merged, nextDays);
  return merged;
}

function serializePlanDoc(doc) {
  if (!doc) return null;
  const { _id, email, createdAt, updatedAt, deleted, ...rest } = doc;
  void _id;
  void email;
  void createdAt;
  void updatedAt;
  void deleted;
  return rest;
}

/**
 * Merges built-in default plans with user-created or AI-updated plans in `running.user_plans`.
 */
export async function getMergedPlansForUser(email, existingDb = null, { includeArchived = false } = {}) {
  if (!email) return PLANS;

  const db = existingDb || (await getDb());
  const docs = await db
    .collection("user_plans")
    .find({ email: email.toLowerCase() })
    .sort({ sortOrder: 1, createdAt: 1 })
    .toArray();

  if (!docs.length) return PLANS;

  const customById = new Map();
  const extraPlans = [];
  const deletedIds = new Set();
  const builtInIds = new Set(PLANS.map((p) => p.id));

  for (const doc of docs) {
    if (doc.deleted) {
      deletedIds.add(doc.id);
      continue;
    }
    const clean = serializePlanDoc(doc);
    if (!clean?.id) continue;
    if (builtInIds.has(clean.id)) {
      customById.set(clean.id, clean);
    } else {
      extraPlans.push(clean);
    }
  }

  const mergedBuiltIns = PLANS.filter((p) => !deletedIds.has(p.id)).map((p) => customById.get(p.id) || p);
  const all = [...mergedBuiltIns, ...extraPlans];
  return includeArchived ? all : all.filter((p) => p.status !== "archived");
}

function normalizeStatusLabel(status, customLabel) {
  if (customLabel) return String(customLabel);
  if (status === "completed") return "เสร็จสิ้นแล้ว";
  if (status === "archived") return "เก็บเข้าคลังแล้ว";
  return "แผนปัจจุบัน";
}

/**
 * Creates or updates an entire training plan for a user in `running.user_plans`.
 */
export async function upsertUserPlan(email, input, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const id = sanitizeSlug(input?.id || input?.shortName || input?.title, `plan-${Date.now()}`);
  const mergedExisting = await getMergedPlansForUser(normalizedEmail, db, { includeArchived: true });
  const prevPlan = mergedExisting.find((p) => p.id === id) || null;

  const shortName = String(input?.shortName || prevPlan?.shortName || input?.title || id).trim().slice(0, 32);
  const title = String(input?.title || prevPlan?.title || shortName).trim();
  const subtitle = String(
    input?.subtitle || prevPlan?.subtitle || "แผนซ้อมที่สร้างและปรับแต่งให้เหมาะกับเป้าหมายของคุณ"
  ).trim();
  const startDateStr = /^\d{4}-\d{2}-\d{2}$/.test(String(input?.startDateStr || ""))
    ? String(input.startDateStr)
    : prevPlan?.startDateStr || new Date().toISOString().slice(0, 10);

  const rawWeeks = Array.isArray(input?.weeks) && input.weeks.length > 0
    ? input.weeks
    : prevPlan?.weeks || [{}];
  const weeks = rawWeeks
    .map((w, idx) => normalizeWeek(w, idx + 1, null, prevPlan))
    .sort((a, b) => a.week - b.week);

  const phases =
    Array.isArray(input?.phases) && input.phases.length > 0
      ? input.phases.map((ph, idx) => ({
          id: String(ph?.id || `phase-${idx + 1}`),
          label: String(ph?.label || `Phase ${idx + 1}`),
          range: String(ph?.range || ""),
        }))
      : prevPlan?.phases ||
        Array.from(new Map(weeks.map((w) => [w.phase, { id: w.phase, label: w.phaseLabel, range: "" }])).values());

  const metrics =
    Array.isArray(input?.metrics) && input.metrics.length > 0
      ? input.metrics.slice(0, 4).map((m) => ({
          label: String(m?.label || "เป้าหมาย"),
          value: String(m?.value || "-"),
          sub: String(m?.sub || ""),
          color: String(m?.color || "text-pocariBlue"),
        }))
      : prevPlan?.metrics || [
          { label: "จำนวนสัปดาห์", value: `${weeks.length} สัปดาห์`, sub: "อัปเดตโดยผู้ช่วย AI", color: "text-pocariBlue" },
          { label: "วันเริ่มต้น", value: startDateStr, sub: String(input?.periodLabel || `${weeks.length} Weeks`), color: "text-treadmillGreen" },
        ];

  const validStatuses = ["active", "completed", "archived"];
  const status = validStatuses.includes(input?.status) ? input.status : prevPlan?.status || "active";
  const now = new Date();
  const planDoc = {
    email: normalizedEmail,
    id,
    shortName,
    title,
    subtitle,
    badge: String(input?.badge || prevPlan?.badge || "AI Custom Plan"),
    status,
    statusLabel: normalizeStatusLabel(status, input?.statusLabel),
    periodLabel: String(input?.periodLabel || prevPlan?.periodLabel || `เริ่ม ${startDateStr} (${weeks.length} สัปดาห์)`),
    startDateStr,
    storageKey: `${id.replace(/-/g, "_")}_state`,
    theme: prevPlan?.theme || DEFAULT_THEME,
    metrics,
    phases,
    ...(input?.nutritionTargets || prevPlan?.nutritionTargets
      ? { nutritionTargets: { ...(prevPlan?.nutritionTargets || {}), ...(input?.nutritionTargets || {}) } }
      : {}),
    ...(prevPlan?.playbook ? { playbook: prevPlan.playbook } : {}),
    weeks,
    source: prevPlan?.source || "mcp",
    deleted: false,
    updatedAt: now,
  };

  await db.collection("user_plans").updateOne(
    { email: normalizedEmail, id },
    {
      $set: planDoc,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  return serializePlanDoc(planDoc);
}

/**
 * Updates only plan metadata & status without overwriting `weeks[]`.
 */
export async function updateUserPlanMeta(email, planId, patch, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const mergedPlans = await getMergedPlansForUser(normalizedEmail, db, { includeArchived: true });
  const existingPlan = mergedPlans.find((p) => p.id === planId) || getPlanById(planId);
  if (!existingPlan || existingPlan.id !== planId) {
    throw new Error(`ไม่พบแผนซ้อมรหัส "${planId}"`);
  }

  const nextStatus = ["active", "completed", "archived"].includes(patch?.status)
    ? patch.status
    : existingPlan.status;
  const now = new Date();
  const updatedDoc = {
    ...existingPlan,
    email: normalizedEmail,
    shortName: patch?.shortName !== undefined ? String(patch.shortName).trim().slice(0, 32) : existingPlan.shortName,
    title: patch?.title !== undefined ? String(patch.title).trim() : existingPlan.title,
    subtitle: patch?.subtitle !== undefined ? String(patch.subtitle).trim() : existingPlan.subtitle,
    badge: patch?.badge !== undefined ? String(patch.badge).trim() : existingPlan.badge,
    periodLabel: patch?.periodLabel !== undefined ? String(patch.periodLabel).trim() : existingPlan.periodLabel,
    startDateStr:
      patch?.startDateStr && /^\d{4}-\d{2}-\d{2}$/.test(String(patch.startDateStr))
        ? String(patch.startDateStr)
        : existingPlan.startDateStr,
    status: nextStatus,
    statusLabel:
      patch?.statusLabel !== undefined
        ? String(patch.statusLabel)
        : patch?.status !== undefined
        ? normalizeStatusLabel(nextStatus)
        : existingPlan.statusLabel,
    ...(patch?.metrics !== undefined ? { metrics: patch.metrics } : {}),
    ...(patch?.phases !== undefined ? { phases: patch.phases } : {}),
    ...(patch?.nutritionTargets !== undefined
      ? { nutritionTargets: { ...(existingPlan.nutritionTargets || {}), ...patch.nutritionTargets } }
      : {}),
    deleted: false,
    updatedAt: now,
  };

  // Optional: make this plan the sole active plan cleanly if requested
  if (patch?.makePrimaryActive) {
    for (const p of mergedPlans) {
      if (p.id !== planId && p.status === "active") {
        await db.collection("user_plans").updateOne(
          { email: normalizedEmail, id: p.id },
          {
            $set: { ...p, email: normalizedEmail, status: "completed", statusLabel: "สลับไปแผนอื่นแล้ว", updatedAt: now },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );
      }
    }
    updatedDoc.status = "active";
    updatedDoc.statusLabel = normalizeStatusLabel("active", patch?.statusLabel);
  }

  await db.collection("user_plans").updateOne(
    { email: normalizedEmail, id: planId },
    {
      $set: updatedDoc,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  return serializePlanDoc(updatedDoc);
}

/**
 * Deletes a user plan (hard delete for custom plans, soft tombstone for built-ins).
 */
export async function deleteUserPlan(email, planId, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const builtInIds = new Set(PLANS.map((p) => p.id));

  if (builtInIds.has(planId)) {
    await db.collection("user_plans").updateOne(
      { email: normalizedEmail, id: planId },
      { $set: { email: normalizedEmail, id: planId, deleted: true, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  } else {
    const res = await db.collection("user_plans").deleteOne({ email: normalizedEmail, id: planId });
    if (res.deletedCount === 0) {
      throw new Error(`ไม่พบแผนซ้อมรหัส "${planId}"`);
    }
  }
  return { deleted: true, planId };
}

/**
 * Adds a new week or performs strict partial update on an existing week in any plan.
 */
export async function upsertUserWeek(email, planId, weekInput, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const mergedPlans = await getMergedPlansForUser(normalizedEmail, db, { includeArchived: true });
  const existingPlan = mergedPlans.find((p) => p.id === planId) || getPlanById(planId);
  if (!existingPlan) {
    throw new Error(`ไม่พบแผนซ้อมรหัส "${planId}"`);
  }

  const targetWeekNum =
    Number.isInteger(Number(weekInput?.week)) && Number(weekInput.week) > 0
      ? Number(weekInput.week)
      : existingPlan.weeks.length + 1;

  const existingIdx = existingPlan.weeks.findIndex((w) => w.week === targetWeekNum);
  const baseWeek = existingIdx >= 0 ? existingPlan.weeks[existingIdx] : null;
  const mergedWeek = normalizeWeek(weekInput, targetWeekNum, baseWeek, existingPlan);

  const nextWeeks = [...existingPlan.weeks];
  if (existingIdx >= 0) {
    nextWeeks[existingIdx] = mergedWeek;
  } else {
    nextWeeks.push(mergedWeek);
    nextWeeks.sort((a, b) => a.week - b.week);
  }

  const nextPhases = [...(existingPlan.phases || [])];
  if (!nextPhases.some((ph) => ph.id === mergedWeek.phase)) {
    nextPhases.push({ id: mergedWeek.phase, label: mergedWeek.phaseLabel, range: "" });
  }

  const now = new Date();
  const updatedDoc = {
    ...existingPlan,
    email: normalizedEmail,
    phases: nextPhases,
    weeks: nextWeeks,
    updatedAt: now,
  };

  await db.collection("user_plans").updateOne(
    { email: normalizedEmail, id: existingPlan.id },
    {
      $set: updatedDoc,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  return {
    planId: existingPlan.id,
    week: mergedWeek,
    action: existingIdx >= 0 ? "updated" : "added",
    totalWeeks: nextWeeks.length,
  };
}

/**
 * Deletes a specific week from a plan.
 */
export async function deleteUserWeek(email, planId, weekNum, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const mergedPlans = await getMergedPlansForUser(normalizedEmail, db, { includeArchived: true });
  const existingPlan = mergedPlans.find((p) => p.id === planId) || getPlanById(planId);
  if (!existingPlan) {
    throw new Error(`ไม่พบแผนซ้อมรหัส "${planId}"`);
  }

  const targetNum = Number(weekNum);
  const nextWeeks = existingPlan.weeks.filter((w) => w.week !== targetNum);
  if (nextWeeks.length === existingPlan.weeks.length) {
    throw new Error(`ไม่พบสัปดาห์ที่ ${targetNum} ในแผน "${planId}"`);
  }

  const now = new Date();
  await db.collection("user_plans").updateOne(
    { email: normalizedEmail, id: existingPlan.id },
    {
      $set: { ...existingPlan, email: normalizedEmail, weeks: nextWeeks, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  return { deleted: true, planId: existingPlan.id, week: targetNum, remainingWeeks: nextWeeks.length };
}

/**
 * Swaps two days (`dayA`, `dayB`) inside a given week atomically, including completion & execution logs.
 */
export async function swapWorkoutDays(email, planId, weekNum, dayAInput, dayBInput, swapProgress = true, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const dayA = resolveDayKey(dayAInput);
  const dayB = resolveDayKey(dayBInput);
  if (!dayA || !dayB || dayA === dayB) {
    throw new Error("กรุณาระบุ dayA และ dayB ที่แตกต่างกัน (mon..sun หรือ easy/str/inc/long/rec)");
  }

  const mergedPlans = await getMergedPlansForUser(normalizedEmail, db, { includeArchived: true });
  const existingPlan = mergedPlans.find((p) => p.id === planId) || getPlanById(planId);
  if (!existingPlan) {
    throw new Error(`ไม่พบแผนซ้อมรหัส "${planId}"`);
  }

  const targetNum = Number(weekNum);
  const idx = existingPlan.weeks.findIndex((w) => w.week === targetNum);
  if (idx < 0) {
    throw new Error(`ไม่พบสัปดาห์ที่ ${targetNum} ในแผน "${existingPlan.id}"`);
  }

  const normalizedWeek = normalizeWeek({}, targetNum, existingPlan.weeks[idx], existingPlan);
  const slotA = { ...normalizedWeek.days[dayA] };
  const slotB = { ...normalizedWeek.days[dayB] };

  // Swap workout payload while preserving each calendar day's label/dayKey
  normalizedWeek.days[dayA] = {
    ...slotB,
    dayKey: dayA,
    label: DAY_META[dayA].label,
    shortLabel: DAY_META[dayA].short,
  };
  normalizedWeek.days[dayB] = {
    ...slotA,
    dayKey: dayB,
    label: DAY_META[dayB].label,
    shortLabel: DAY_META[dayB].short,
  };

  syncFlatFieldsFromDays(normalizedWeek, normalizedWeek.days);

  const nextWeeks = [...existingPlan.weeks];
  nextWeeks[idx] = normalizedWeek;
  const now = new Date();

  await db.collection("user_plans").updateOne(
    { email: normalizedEmail, id: existingPlan.id },
    {
      $set: { ...existingPlan, email: normalizedEmail, weeks: nextWeeks, updatedAt: now },
      $setOnInsert: { createdAt: now },
    },
    { upsert: true }
  );

  // Also swap completion state + execution logs if requested
  if (swapProgress) {
    const progressDoc = await db.collection("user_progress").findOne({ email: normalizedEmail, planId: existingPlan.id });
    if (progressDoc) {
      const completedDays = { ...(progressDoc.completedDays || {}) };
      const executionLogs = { ...(progressDoc.executionLogs || {}) };

      const keyA = `W${targetNum}-${dayA}`;
      const legA = DAY_KEY_TO_LEGACY[dayA] ? `W${targetNum}-${DAY_KEY_TO_LEGACY[dayA]}` : null;
      const keyB = `W${targetNum}-${dayB}`;
      const legB = DAY_KEY_TO_LEGACY[dayB] ? `W${targetNum}-${DAY_KEY_TO_LEGACY[dayB]}` : null;

      const doneA = completedDays[keyA] !== undefined ? completedDays[keyA] : legA ? completedDays[legA] : undefined;
      const doneB = completedDays[keyB] !== undefined ? completedDays[keyB] : legB ? completedDays[legB] : undefined;
      const logA = executionLogs[keyA] || (legA ? executionLogs[legA] : undefined);
      const logB = executionLogs[keyB] || (legB ? executionLogs[legB] : undefined);

      if (doneB !== undefined) completedDays[keyA] = doneB;
      else delete completedDays[keyA];
      if (legA) delete completedDays[legA];

      if (doneA !== undefined) completedDays[keyB] = doneA;
      else delete completedDays[keyB];
      if (legB) delete completedDays[legB];

      if (logB !== undefined) executionLogs[keyA] = logB;
      else delete executionLogs[keyA];
      if (legA) delete executionLogs[legA];

      if (logA !== undefined) executionLogs[keyB] = logA;
      else delete executionLogs[keyB];
      if (legB) delete executionLogs[legB];

      await db.collection("user_progress").updateOne(
        { email: normalizedEmail, planId: existingPlan.id },
        { $set: { completedDays, executionLogs, updatedAt: now } }
      );
    }
  }

  return {
    status: "swapped",
    planId: existingPlan.id,
    week: targetNum,
    swapped: [dayA, dayB],
    days: {
      [dayA]: normalizedWeek.days[dayA],
      [dayB]: normalizedWeek.days[dayB],
    },
  };
}
