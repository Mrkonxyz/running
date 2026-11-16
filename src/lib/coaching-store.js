import { getDb } from "./mongodb.js";
import { getMergedPlansForUser } from "./plans-store.js";
import {
  DAY_KEY_TO_LEGACY,
  DAYS_ORDER,
  getBangkokDateStr,
  resolveDayKey,
  resolveWeekAndDayForDate,
} from "./schedule-utils.js";

const DEFAULT_GATES = [
  {
    gateId: "nov-18-recovery-gate",
    planId: "hybrid-2026",
    targetDate: "2026-11-18",
    title: "D+4 Morning Recovery Gate (18 พ.ย.)",
    criteria: "HRV >= 50 ms, RHR <= 49 bpm, Readiness >= 50, Knee Pain 0/10",
    branches: [
      { id: "fast-track", label: "Fast-Track (Upper 45m + Wall Sit + Flat Walk 40m + Z2 Test Sat)" },
      { id: "standard-conservative", label: "Standard Conservative (Mobility 20m เท่านั้น งดเวท/งดวิ่ง)" },
    ],
    status: "pending",
    selectedBranch: null,
  },
  {
    gateId: "dec-stage2-knee-incline-gate",
    planId: "hybrid-2026",
    targetDate: "2026-11-30",
    title: "Phase 1 Unlock Gate: Stage 2 Knee + Incline 8–10%",
    criteria: "ผ่าน 14 วัน Maintenance ครบ + Step-Down / Wall Sit ไม่ปวดเข่า (0/10)",
    branches: [
      { id: "unlock-phase1", label: "Unlock Active Cut I (-350 to -450 kcal) + Incline 8–10% + Stage 2" },
      { id: "extend-recovery", label: "Extend Phase 0 Flat Cardio อีก 1 สัปดาห์" },
    ],
    status: "pending",
    selectedBranch: null,
  },
  {
    gateId: "jan-stage3-bulgarian-gate",
    planId: "hybrid-2026",
    targetDate: "2027-01-11",
    title: "Phase 2 Unlock Gate: Stage 3 Bulgarian Split Squat + Incline 8–12%",
    criteria: "จบ Year-End Diet Break อย่างสดชื่น + เข่านิ่ง 0/10 + กล้ามขา >= 10.3 kg/ข้าง",
    branches: [
      { id: "unlock-phase2", label: "Unlock Phase 2 Push (18.0% BF) + Stage 3 + Incline 8–12%" },
      { id: "stay-stage2", label: "Maintain Stage 2 + Cut II แบบปลอดภัย" },
    ],
    status: "pending",
    selectedBranch: null,
  },
];

export async function getUserProgressAndLogs(email, existingDb = null) {
  const db = existingDb || (await getDb());
  const docs = await db.collection("user_progress").find({ email: email.toLowerCase() }).toArray();
  const progressByPlan = {};
  const executionLogsByPlan = {};
  for (const d of docs) {
    progressByPlan[d.planId] = d.completedDays || {};
    executionLogsByPlan[d.planId] = d.executionLogs || {};
  }
  return { progressByPlan, executionLogsByPlan };
}

export async function logWorkoutCompletion(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const plans = await getMergedPlansForUser(normalizedEmail, db, { includeArchived: true });
  const plan =
    (params.planId && plans.find((p) => p.id === params.planId)) ||
    plans.find((p) => p.status === "active") ||
    plans[0];
  if (!plan) throw new Error("ไม่พบแผนซ้อม");

  let weekNum = params.week ? Number(params.week) : null;
  let dayKey = resolveDayKey(params.dayKey || params.dayType);
  let resolvedDate = params.date || null;

  if (params.date || !weekNum || !dayKey) {
    const resDate = resolveWeekAndDayForDate(plan, params.date || null, params.offsetDays || 0);
    if (!weekNum) weekNum = resDate.week;
    if (!dayKey) dayKey = resDate.dayKey;
    if (!resolvedDate) resolvedDate = resDate.date;
  }

  if (!weekNum || !dayKey || !DAYS_ORDER.includes(dayKey)) {
    throw new Error("กรุณาระบุ week + dayKey (mon..sun) หรือ date (YYYY-MM-DD) ให้ถูกต้อง");
  }

  const canonicalKey = `W${weekNum}-${dayKey}`;
  const legacyKey = DAY_KEY_TO_LEGACY[dayKey] ? `W${weekNum}-${DAY_KEY_TO_LEGACY[dayKey]}` : null;
  const completed = params.completed !== undefined ? Boolean(params.completed) : true;

  // Deduplicate Garmin Activity ID across other days if provided
  if (params.garminActivityId) {
    const gid = String(params.garminActivityId);
    const existingDoc = await db.collection("user_progress").findOne({ email: normalizedEmail, planId: plan.id });
    const logs = existingDoc?.executionLogs || {};
    for (const [k, v] of Object.entries(logs)) {
      if (v?.garminActivityId === gid && k !== canonicalKey && k !== legacyKey) {
        return {
          status: "duplicate_skipped",
          reason: `Garmin Activity ID "${gid}" ถูกบันทึกไว้แล้วที่ ${k}`,
          planId: plan.id,
          existingKey: k,
        };
      }
    }
  }

  const doc = await db.collection("user_progress").findOne({ email: normalizedEmail, planId: plan.id });
  const nextCompletedDays = { ...(doc?.completedDays || {}), [canonicalKey]: completed };
  if (legacyKey) {
    nextCompletedDays[legacyKey] = completed;
  }

  const nextExecutionLogs = { ...(doc?.executionLogs || {}) };
  const hasRichFields = [
    "actualType",
    "garminActivityId",
    "actualDurationMin",
    "distanceKm",
    "avgHr",
    "maxHr",
    "elevationGainM",
    "trainingLoad",
    "rpe",
    "kneePainScore",
    "notes",
  ].some((f) => params[f] !== undefined);

  if (completed && (hasRichFields || nextExecutionLogs[canonicalKey])) {
    nextExecutionLogs[canonicalKey] = {
      ...(nextExecutionLogs[canonicalKey] || {}),
      date: resolvedDate || getBangkokDateStr(),
      ...(params.actualType !== undefined ? { actualType: String(params.actualType) } : {}),
      ...(params.garminActivityId !== undefined ? { garminActivityId: String(params.garminActivityId) } : {}),
      ...(params.actualDurationMin !== undefined ? { actualDurationMin: Number(params.actualDurationMin) } : {}),
      ...(params.distanceKm !== undefined ? { distanceKm: Number(params.distanceKm) } : {}),
      ...(params.avgHr !== undefined ? { avgHr: Number(params.avgHr) } : {}),
      ...(params.maxHr !== undefined ? { maxHr: Number(params.maxHr) } : {}),
      ...(params.elevationGainM !== undefined ? { elevationGainM: Number(params.elevationGainM) } : {}),
      ...(params.trainingLoad !== undefined ? { trainingLoad: Number(params.trainingLoad) } : {}),
      ...(params.rpe !== undefined ? { rpe: Number(params.rpe) } : {}),
      ...(params.kneePainScore !== undefined ? { kneePainScore: Number(params.kneePainScore) } : {}),
      ...(params.notes !== undefined ? { notes: String(params.notes) } : {}),
      loggedAt: new Date(),
    };
  } else if (!completed) {
    delete nextExecutionLogs[canonicalKey];
    if (legacyKey) delete nextExecutionLogs[legacyKey];
  }

  const now = new Date();
  await db.collection("user_progress").updateOne(
    { email: normalizedEmail, planId: plan.id },
    {
      $set: {
        completedDays: nextCompletedDays,
        executionLogs: nextExecutionLogs,
        updatedAt: now,
      },
      $setOnInsert: { email: normalizedEmail, planId: plan.id, createdAt: now },
    },
    { upsert: true }
  );

  return {
    status: "updated",
    planId: plan.id,
    week: weekNum,
    dayKey,
    progressKey: canonicalKey,
    completed,
    executionLog: nextExecutionLogs[canonicalKey] || null,
  };
}

export async function logExtraActivity(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(params.date || ""))
    ? String(params.date)
    : getBangkokDateStr();

  if (params.garminActivityId) {
    const existing = await db.collection("activity_logs").findOne({
      email: normalizedEmail,
      garminActivityId: String(params.garminActivityId),
    });
    if (existing) {
      return {
        status: "duplicate_skipped",
        reason: `Garmin Activity ID "${params.garminActivityId}" already logged`,
        activity: { ...existing, _id: undefined },
      };
    }
  }

  const entry = {
    email: normalizedEmail,
    date,
    type: String(params.type || "extra_activity"),
    title: String(params.title || params.type || "Extra Activity"),
    durationMin: params.durationMin !== undefined ? Number(params.durationMin) : null,
    distanceKm: params.distanceKm !== undefined ? Number(params.distanceKm) : null,
    avgHr: params.avgHr !== undefined ? Number(params.avgHr) : null,
    maxHr: params.maxHr !== undefined ? Number(params.maxHr) : null,
    elevationGainM: params.elevationGainM !== undefined ? Number(params.elevationGainM) : null,
    rpe: params.rpe !== undefined ? Number(params.rpe) : null,
    kneePainScore: params.kneePainScore !== undefined ? Number(params.kneePainScore) : null,
    garminActivityId: params.garminActivityId ? String(params.garminActivityId) : null,
    notes: params.notes ? String(params.notes) : "",
    createdAt: new Date(),
  };

  await db.collection("activity_logs").insertOne(entry);
  const { _id, ...clean } = entry;
  void _id;
  return { status: "logged", activity: clean };
}

export async function logExerciseSets(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const code = String(params.code || "").trim().toUpperCase();
  const name = String(params.name || code || "Unnamed Exercise").trim();
  if (!code && !params.name) throw new Error("กรุณาระบุ code (เช่น A1) หรือ name ของท่าออกกำลังกาย");

  const rawSets = Array.isArray(params.sets) ? params.sets : [];
  if (rawSets.length === 0) throw new Error("กรุณาระบุ sets[] อย่างน้อย 1 เซต (weightKg, reps)");

  const sets = rawSets.map((s, idx) => ({
    setNumber: idx + 1,
    weightKg: Number(s.weightKg ?? s.weight ?? 0),
    reps: Number(s.reps ?? 0),
    rir: s.rir !== undefined ? Number(s.rir) : null,
    note: s.note ? String(s.note) : null,
  }));

  const targetTopRep = Number(params.targetTopRep || 12);
  const topWeightKg = Math.max(...sets.map((s) => s.weightKg));
  const totalReps = sets.reduce((sum, s) => sum + s.reps, 0);
  const allHitTargetReps = sets.every((s) => s.reps >= targetTopRep && topWeightKg > 0);
  const recommendedNextWeightKg = allHitTargetReps ? Math.round((topWeightKg + 2.5) * 2) / 2 : topWeightKg;

  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(params.date || ""))
    ? String(params.date)
    : getBangkokDateStr();

  const doc = {
    email: normalizedEmail,
    date,
    planId: params.planId ? String(params.planId) : "hybrid-2026",
    week: params.week !== undefined ? Number(params.week) : null,
    dayKey: resolveDayKey(params.dayKey || "wed") || "wed",
    code: code || null,
    name,
    sets,
    targetTopRep,
    topWeightKg,
    totalReps,
    allHitTargetReps,
    readyToProgress: allHitTargetReps,
    recommendedNextWeightKg,
    notes: params.notes ? String(params.notes) : "",
    createdAt: new Date(),
  };

  await db.collection("exercise_logs").insertOne(doc);
  return {
    status: "logged",
    exercise: { code: doc.code, name: doc.name, date: doc.date, sets: doc.sets },
    doubleProgression: {
      topWeightKg,
      targetTopRep,
      allHitTargetReps,
      readyToProgress: allHitTargetReps,
      recommendedNextWeightKg,
      advice: allHitTargetReps
        ? `ครบ ${targetTopRep} ครั้งทุกเซตอย่างสวยงาม! แนะนำเพิ่มน้ำหนักเป็น ${recommendedNextWeightKg} kg (+2–2.5 kg) ในเซสชั่นถัดไป`
        : `คงน้ำหนัก ${topWeightKg} kg และสะสมจำนวนครั้งเข้าใกล้ ${targetTopRep} reps (1–2 RIR)`,
    },
  };
}

export async function getExerciseHistory(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());

  const query = { email: normalizedEmail };
  if (params.code) query.code = String(params.code).trim().toUpperCase();
  if (params.name) query.name = { $regex: String(params.name).trim(), $options: "i" };
  const limit = Math.min(Math.max(Number(params.limit || 20), 1), 100);

  const docs = await db
    .collection("exercise_logs")
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .limit(limit)
    .toArray();

  return {
    count: docs.length,
    entries: docs.map((d) => ({
      date: d.date,
      planId: d.planId,
      week: d.week,
      code: d.code,
      name: d.name,
      sets: d.sets,
      topWeightKg: d.topWeightKg,
      totalReps: d.totalReps,
      readyToProgress: Boolean(d.readyToProgress),
      recommendedNextWeightKg: d.recommendedNextWeightKg,
      notes: d.notes,
    })),
  };
}

export async function getDecisionGates(email, planId = null, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const col = db.collection("decision_gates");

  const count = await col.countDocuments({ email: normalizedEmail });
  if (count === 0) {
    const now = new Date();
    for (const g of DEFAULT_GATES) {
      await col.updateOne(
        { email: normalizedEmail, gateId: g.gateId },
        { $setOnInsert: { ...g, email: normalizedEmail, createdAt: now, updatedAt: now } },
        { upsert: true }
      );
    }
  }

  const filter = { email: normalizedEmail };
  if (planId) filter.planId = planId;
  const docs = await col.find(filter).sort({ targetDate: 1 }).toArray();
  return docs.map((d) => {
    const { _id, email: _e, ...rest } = d;
    void _id;
    void _e;
    return rest;
  });
}

export async function resolveDecisionGate(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  await getDecisionGates(normalizedEmail, null, db);

  const gateId = String(params.gateId || "").trim();
  if (!gateId) throw new Error("gateId is required");
  const validStatuses = ["pending", "passed", "failed"];
  const status = validStatuses.includes(params.status) ? params.status : "passed";
  const now = new Date();

  const existing = await db.collection("decision_gates").findOne({ email: normalizedEmail, gateId });
  const doc = {
    email: normalizedEmail,
    gateId,
    planId: String(params.planId || existing?.planId || "hybrid-2026"),
    title: String(params.title || existing?.title || gateId),
    criteria: String(params.criteria || existing?.criteria || ""),
    branches: params.branches || existing?.branches || [],
    status,
    selectedBranch: params.selectedBranch !== undefined ? String(params.selectedBranch) : existing?.selectedBranch || null,
    metricsSnapshot: params.metricsSnapshot || existing?.metricsSnapshot || null,
    notes: params.notes !== undefined ? String(params.notes) : existing?.notes || "",
    resolvedAt: status === "pending" ? null : now,
    updatedAt: now,
  };

  await db.collection("decision_gates").updateOne(
    { email: normalizedEmail, gateId },
    { $set: doc, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  const { email: _e, ...clean } = doc;
  void _e;
  return { status: "updated", gate: clean };
}

export async function logBodyComp(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(params.date || ""))
    ? String(params.date)
    : getBangkokDateStr();

  const doc = {
    email: normalizedEmail,
    date,
    source: String(params.source || "fitdays"),
    ...(params.weightKg !== undefined ? { weightKg: Number(params.weightKg) } : {}),
    ...(params.bodyFatPct !== undefined ? { bodyFatPct: Number(params.bodyFatPct) } : {}),
    ...(params.fatMassKg !== undefined ? { fatMassKg: Number(params.fatMassKg) } : {}),
    ...(params.ffmKg !== undefined ? { ffmKg: Number(params.ffmKg) } : {}),
    ...(params.muscleMassKg !== undefined ? { muscleMassKg: Number(params.muscleMassKg) } : {}),
    ...(params.legLeftKg !== undefined ? { legLeftKg: Number(params.legLeftKg) } : {}),
    ...(params.legRightKg !== undefined ? { legRightKg: Number(params.legRightKg) } : {}),
    ...(params.visceralFat !== undefined ? { visceralFat: Number(params.visceralFat) } : {}),
    ...(params.bmr !== undefined ? { bmr: Number(params.bmr) } : {}),
    notes: params.notes ? String(params.notes) : "",
    updatedAt: new Date(),
  };

  await db.collection("body_comp_logs").updateOne(
    { email: normalizedEmail, date },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  const { email: _e, ...clean } = doc;
  void _e;
  return {
    status: "saved",
    checkpoint: clean,
    checks: {
      goalBfPct: 18.0,
      remainingBfPct: doc.bodyFatPct !== undefined ? Number((doc.bodyFatPct - 18.0).toFixed(2)) : null,
      kneeArmorMinLegKg: 10.3,
      legLeftOk: doc.legLeftKg !== undefined ? doc.legLeftKg >= 10.3 : null,
      legRightOk: doc.legRightKg !== undefined ? doc.legRightKg >= 10.3 : null,
    },
  };
}

export async function getBodyCompHistory(email, limit = 20, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const docs = await db
    .collection("body_comp_logs")
    .find({ email: normalizedEmail })
    .sort({ date: -1 })
    .limit(Math.min(Math.max(Number(limit || 20), 1), 100))
    .toArray();

  return {
    count: docs.length,
    latest: docs[0] ? { ...docs[0], _id: undefined, email: undefined } : null,
    entries: docs.map((d) => {
      const { _id, email: _e, ...rest } = d;
      void _id;
      void _e;
      return rest;
    }),
  };
}

function evaluateBiometricFlags(entry) {
  const flags = [];
  if (entry.sleepScore !== undefined && entry.sleepScore !== null && entry.sleepScore < 60) {
    flags.push(`sleep_low (${entry.sleepScore} < 60)`);
  }
  if (entry.kneePainScore !== undefined && entry.kneePainScore !== null && entry.kneePainScore > 1) {
    flags.push(`knee_pain (${entry.kneePainScore}/10 > 1)`);
  }
  if (
    entry.overnightHrv !== undefined &&
    entry.hrv7dAvg !== undefined &&
    entry.hrv7dAvg > 0 &&
    entry.overnightHrv < entry.hrv7dAvg * 0.85
  ) {
    flags.push(`hrv_suppressed (${entry.overnightHrv} vs 7d ${entry.hrv7dAvg})`);
  }
  if (entry.rhr !== undefined && entry.rhr !== null && entry.rhr >= 53) {
    flags.push(`rhr_elevated (${entry.rhr} bpm >= 53)`);
  }
  if (entry.readiness !== undefined && entry.readiness !== null && entry.readiness < 45) {
    flags.push(`readiness_low (${entry.readiness} < 45)`);
  }
  if (entry.acwr !== undefined && entry.acwr !== null && entry.acwr > 1.3) {
    flags.push(`acwr_high (${entry.acwr} > 1.3)`);
  }
  return flags;
}

export async function logDailyBiometrics(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(params.date || ""))
    ? String(params.date)
    : getBangkokDateStr();

  const entry = {
    email: normalizedEmail,
    date,
    ...(params.sleepScore !== undefined ? { sleepScore: Number(params.sleepScore) } : {}),
    ...(params.overnightHrv !== undefined ? { overnightHrv: Number(params.overnightHrv) } : {}),
    ...(params.hrv7dAvg !== undefined ? { hrv7dAvg: Number(params.hrv7dAvg) } : {}),
    ...(params.rhr !== undefined ? { rhr: Number(params.rhr) } : {}),
    ...(params.readiness !== undefined ? { readiness: Number(params.readiness) } : {}),
    ...(params.bodyBattery !== undefined ? { bodyBattery: Number(params.bodyBattery) } : {}),
    ...(params.acwr !== undefined ? { acwr: Number(params.acwr) } : {}),
    ...(params.kneePainScore !== undefined ? { kneePainScore: Number(params.kneePainScore) } : {}),
    notes: params.notes ? String(params.notes) : "",
    updatedAt: new Date(),
  };

  const redLightFlags = evaluateBiometricFlags(entry);
  entry.redLightFlags = redLightFlags;
  entry.isRedLight = redLightFlags.length > 0;

  await db.collection("daily_biometrics").updateOne(
    { email: normalizedEmail, date },
    { $set: entry, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  const summary = await getReadinessSummary(normalizedEmail, 7, db);
  return {
    status: "saved",
    date,
    redLightFlags,
    isRedLight: entry.isRedLight,
    redLightDeficitPauseAlert: summary.redLightDeficitPauseTriggered,
  };
}

export async function getReadinessSummary(email, days = 7, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const docs = await db
    .collection("daily_biometrics")
    .find({ email: normalizedEmail })
    .sort({ date: -1 })
    .limit(Math.min(Math.max(Number(days || 7), 1), 30))
    .toArray();

  let consecutiveRedLights = 0;
  for (const d of docs) {
    if (d.isRedLight || (d.redLightFlags && d.redLightFlags.length > 0)) {
      consecutiveRedLights += 1;
    } else {
      break;
    }
  }

  return {
    daysCount: docs.length,
    latest: docs[0] ? { ...docs[0], _id: undefined, email: undefined } : null,
    consecutiveRedLights,
    redLightDeficitPauseTriggered: consecutiveRedLights >= 2,
    recommendation:
      consecutiveRedLights >= 2
        ? "RED-LIGHT PAUSE TRIGGERED (2+ วันติด): ขยับเป็น Maintenance Calories (2,250–2,400 kcal) และเปลี่ยนเป็น Recovery/Mobility จนกว่า HRV/RHR/Sleep จะฟื้น"
        : docs[0]?.isRedLight
        ? "CAUTION (1 วันสัญญาณเตือน): ระวังโหลดซ้อม ลด RPE ลง 1 ระดับ และโฟกัสการนอน"
        : "GREEN / READY: ร่างกายพร้อมซ้อมตามแผน",
    entries: docs.map((d) => {
      const { _id, email: _e, ...rest } = d;
      void _id;
      void _e;
      return rest;
    }),
  };
}

export async function logNutritionEntry(email, params = {}, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const date = /^\d{4}-\d{2}-\d{2}$/.test(String(params.date || ""))
    ? String(params.date)
    : getBangkokDateStr();

  const plans = await getMergedPlansForUser(normalizedEmail, db);
  const activePlan =
    (params.planId && plans.find((p) => p.id === params.planId)) ||
    plans.find((p) => p.status === "active") ||
    plans[0];

  const dayType = String(params.dayType || "cardio");
  const target = activePlan?.nutritionTargets?.[dayType] || null;

  const entry = {
    email: normalizedEmail,
    date,
    dayType,
    ...(params.calories !== undefined ? { calories: Number(params.calories) } : {}),
    ...(params.proteinG !== undefined ? { proteinG: Number(params.proteinG) } : {}),
    ...(params.carbsG !== undefined ? { carbsG: Number(params.carbsG) } : {}),
    ...(params.fatG !== undefined ? { fatG: Number(params.fatG) } : {}),
    ...(params.waterL !== undefined ? { waterL: Number(params.waterL) } : {}),
    supplements: Array.isArray(params.supplements) ? params.supplements.map(String) : [],
    notes: params.notes ? String(params.notes) : "",
    updatedAt: new Date(),
  };

  await db.collection("nutrition_logs").updateOne(
    { email: normalizedEmail, date },
    { $set: entry, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  const { email: _e, ...clean } = entry;
  void _e;
  return {
    status: "saved",
    entry: clean,
    planTarget: target,
  };
}

export async function getAthleteProfileContext(email, existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const [bodyComp, readiness, gates] = await Promise.all([
    getBodyCompHistory(normalizedEmail, 1, db),
    getReadinessSummary(normalizedEmail, 3, db),
    getDecisionGates(normalizedEmail, "hybrid-2026", db),
  ]);

  return {
    email: normalizedEmail,
    timezone: "Asia/Bangkok",
    heartRateModel: {
      method: "%HRR Karvonen",
      restingHrBpm: 45,
      maxHrBpm: 196,
      zones: [
        { zone: "Zone 1 (Recovery)", hrr: "50–60%", bpm: "121–135 bpm" },
        { zone: "Zone 2 (FatMax Primary)", hrr: "60–70%", bpm: "136–150 bpm" },
        { zone: "Zone 3 (Tempo)", hrr: "70–80%", bpm: "151–165 bpm" },
        { zone: "Zone 4 (Threshold)", hrr: "80–90%", bpm: "166–180 bpm" },
        { zone: "Zone 5 (VO2Max)", hrr: "90–100%", bpm: "181–196 bpm" },
      ],
    },
    equipment: {
      home: "Adjustable Dumbbell pair (2.5–20 kg), Adjustable Bench, Pull-up Bar / Resistance Band",
      commercialGym: "Full Cable Stack, Lat Pulldown, Leg Press, Incline Smith/Barbell, Stairmaster / Treadmill",
    },
    latestBodyComposition: bodyComp.latest,
    latestReadiness: readiness.latest,
    redLightStatus: readiness.recommendation,
    activeGates: gates,
  };
}

export async function getActivePlanRulesContext(email, existingDb = null) {
  const db = existingDb || (await getDb());
  const plans = await getMergedPlansForUser(email, db);
  const activePlan = plans.find((p) => p.status === "active") || plans[0];
  return {
    activePlanId: activePlan?.id,
    activePlanTitle: activePlan?.title,
    rules: [
      "1 Activity / Day: ห้ามซ้อมวิ่งและเวทหนักในวันเดียวกันเด็ดขาด (ยกเว้นวันจันทร์/ศุกร์เป็นวันพัก)",
      "Strict No-Cooldown: ใช้ Strict No-Cooldown บน Garmin เพื่อแยก Load การซ้อมกับ Recovery",
      "Clean Football-Week Swap: หากเตะบอลวันเสาร์ให้ตัด Long Run ออก 100% และตัด Hip Thrust วันอาทิตย์; หากเตะบอลกลางสัปดาห์ให้สลับวันเวท/วิ่งออกด้วย swap_workout_days",
      "No Holding Treadmill Rails: เดินชัน 8–12% ห้ามจับราวลู่เด็ดขาดเพื่อกระตุ้นก้นและแกนกลาง",
      "Double Progression (8–12 reps): ทำท่าไหนได้ครบ 12 ครั้งสวยๆ ทุกเซต ให้เพิ่มน้ำหนัก +2–2.5 kg",
      "Red-Light Deficit Pause: หาก HRV หลุด / RHR พุ่ง / Sleep < 60 / ปวดเข่า > 1 ติดกัน 2 วัน ให้พัก Cut ขึ้น Maintenance 2,250–2,400 kcal",
      "Wednesday Lift Prep: ทาน Collagen Peptides 15g + Vitamin C 50–100mg ก่อนเล่นเวทขา 30–60 นาที",
    ],
    nutritionTargets: activePlan?.nutritionTargets || null,
  };
}
