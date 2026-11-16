import { PLANS, getPlanById } from "../data/plans/index.js";
import { getDb } from "./mongodb.js";

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

export function normalizeWeek(rawWeek, fallbackNum = 1) {
  const weekNum = Number.isInteger(Number(rawWeek?.week)) && Number(rawWeek.week) > 0
    ? Number(rawWeek.week)
    : fallbackNum;

  return {
    week: weekNum,
    phase: String(rawWeek?.phase || "base"),
    phaseLabel: String(rawWeek?.phaseLabel || `สัปดาห์ที่ ${weekNum}`),
    title: String(rawWeek?.title || `Week ${weekNum} Training`),
    tueTarget: String(rawWeek?.tueTarget || "Easy Cardio 35-45m"),
    tueDetail: String(rawWeek?.tueDetail || "วิ่งหรือคาร์ดิโอโซน 2 สบายๆ 35-45 นาที"),
    wedTarget: String(rawWeek?.wedTarget || "Strength Day A 45m"),
    wedDetail: String(rawWeek?.wedDetail || "เวทเทรนนิ่งช่วงบนและแกนกลาง 45 นาที"),
    thuTarget: String(rawWeek?.thuTarget || "Incline Walk / Cardio 40m"),
    thuDetail: String(rawWeek?.thuDetail || "เดินชันหรือปั่นจักรยานโซน 2 40 นาที"),
    satTarget: String(rawWeek?.satTarget || "Long Session 60m"),
    satDetail: String(rawWeek?.satDetail || "ฝึกความอึดระยะยาวโซน 2 60 นาที"),
    sunTarget: String(rawWeek?.sunTarget || "Strength Day B / Recovery"),
    sunDetail: String(rawWeek?.sunDetail || "เวทช่วงบน / ยืดเหยียดฟื้นฟูร่างกาย"),
    monRest: String(rawWeek?.monRest || "พักเต็มวัน + โปรตีนถึงเป้า"),
    friRest: String(rawWeek?.friRest || "พักฟื้นร่างกาย + ยืดเหยียดเบาๆ"),
    minutes: Number.isFinite(Number(rawWeek?.minutes)) ? Number(rawWeek.minutes) : 45,
    weeklyCardioMin: Number.isFinite(Number(rawWeek?.weeklyCardioMin)) ? Number(rawWeek.weeklyCardioMin) : 120,
    focus: String(rawWeek?.focus || "รักษาความสม่ำเสมอและคุมโซนหัวใจ"),
    nutritionNote: String(rawWeek?.nutritionNote || "โปรตีน 1.8-2.0 g/kg + ดื่มน้ำ 2.5 ลิตร"),
    isRecovery: Boolean(rawWeek?.isRecovery),
    isEasy: Boolean(rawWeek?.isEasy),
    isPeak: Boolean(rawWeek?.isPeak),
    isRace: Boolean(rawWeek?.isRace),
    isGoal: Boolean(rawWeek?.isGoal),
  };
}

function serializePlanDoc(doc) {
  if (!doc) return null;
  const { _id, email, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void email;
  void createdAt;
  void updatedAt;
  return rest;
}

/**
 * Merges built-in default plans with user-created or AI-updated plans in `running.user_plans`.
 * User overrides take precedence by `id`; newly created plans appear cleanly alongside built-ins.
 */
export async function getMergedPlansForUser(email, existingDb = null) {
  if (!email) return PLANS;

  const db = existingDb || (await getDb());
  const docs = await db
    .collection("user_plans")
    .find({ email: email.toLowerCase() })
    .sort({ createdAt: 1 })
    .toArray();

  if (!docs.length) return PLANS;

  const customById = new Map();
  const extraPlans = [];
  const builtInIds = new Set(PLANS.map((p) => p.id));

  for (const doc of docs) {
    const clean = serializePlanDoc(doc);
    if (!clean?.id) continue;
    if (builtInIds.has(clean.id)) {
      customById.set(clean.id, clean);
    } else {
      extraPlans.push(clean);
    }
  }

  const mergedBuiltIns = PLANS.map((p) => customById.get(p.id) || p);
  // Put newly created active AI plans right after active built-ins or at the front if marked primary
  return [...mergedBuiltIns, ...extraPlans];
}

/**
 * Creates or updates an entire training plan for a user in `running.user_plans`.
 */
export async function upsertUserPlan(email, input, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const id = sanitizeSlug(input?.id || input?.shortName || input?.title, `plan-${Date.now()}`);
  const shortName = String(input?.shortName || input?.title || id).trim().slice(0, 32);
  const title = String(input?.title || shortName).trim();
  const subtitle = String(
    input?.subtitle || "แผนซ้อมที่สร้างและปรับแต่งให้เหมาะกับเป้าหมายของคุณ"
  ).trim();
  const startDateStr = /^\d{4}-\d{2}-\d{2}$/.test(String(input?.startDateStr || ""))
    ? String(input.startDateStr)
    : new Date().toISOString().slice(0, 10);

  const rawWeeks = Array.isArray(input?.weeks) && input.weeks.length > 0 ? input.weeks : [{}];
  const weeks = rawWeeks
    .map((w, idx) => normalizeWeek(w, idx + 1))
    .sort((a, b) => a.week - b.week);

  const phases =
    Array.isArray(input?.phases) && input.phases.length > 0
      ? input.phases.map((ph, idx) => ({
          id: String(ph?.id || `phase-${idx + 1}`),
          label: String(ph?.label || `Phase ${idx + 1}`),
          range: String(ph?.range || ""),
        }))
      : Array.from(
          new Map(
            weeks.map((w) => [w.phase, { id: w.phase, label: w.phaseLabel, range: "" }])
          ).values()
        );

  const metrics =
    Array.isArray(input?.metrics) && input.metrics.length > 0
      ? input.metrics.slice(0, 4).map((m) => ({
          label: String(m?.label || "เป้าหมาย"),
          value: String(m?.value || "-"),
          sub: String(m?.sub || ""),
          color: String(m?.color || "text-pocariBlue"),
        }))
      : [
          { label: "จำนวนสัปดาห์", value: `${weeks.length} สัปดาห์`, sub: "อัปเดตโดยผู้ช่วย AI", color: "text-pocariBlue" },
          { label: "วันเริ่มต้น", value: startDateStr, sub: String(input?.periodLabel || `${weeks.length} Weeks`), color: "text-treadmillGreen" },
        ];

  const status = input?.status === "completed" ? "completed" : "active";
  const now = new Date();
  const planDoc = {
    email: normalizedEmail,
    id,
    shortName,
    title,
    subtitle,
    badge: String(input?.badge || "AI Custom Plan"),
    status,
    statusLabel: String(input?.statusLabel || (status === "completed" ? "เสร็จสิ้นแล้ว" : "แผนปัจจุบัน")),
    periodLabel: String(input?.periodLabel || `เริ่ม ${startDateStr} (${weeks.length} สัปดาห์)`),
    startDateStr,
    storageKey: `${id.replace(/-/g, "_")}_state`,
    theme: DEFAULT_THEME,
    metrics,
    phases,
    weeks,
    source: "mcp",
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
 * Adds a new week or updates an existing week inside any plan for the user.
 * Built-in plans are cloned into `running.user_plans` on first edit so each user's schedule stays isolated.
 */
export async function upsertUserWeek(email, planId, weekInput, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const mergedPlans = await getMergedPlansForUser(normalizedEmail, db);
  const existingPlan = mergedPlans.find((p) => p.id === planId) || getPlanById(planId);
  if (!existingPlan) {
    throw new Error(`ไม่พบแผนซ้อมรหัส "${planId}"`);
  }

  const targetWeekNum =
    Number.isInteger(Number(weekInput?.week)) && Number(weekInput.week) > 0
      ? Number(weekInput.week)
      : existingPlan.weeks.length + 1;

  const existingIdx = existingPlan.weeks.findIndex((w) => w.week === targetWeekNum);
  const baseWeek = existingIdx >= 0 ? existingPlan.weeks[existingIdx] : {};
  const mergedWeek = normalizeWeek({ ...baseWeek, ...weekInput, week: targetWeekNum }, targetWeekNum);

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
