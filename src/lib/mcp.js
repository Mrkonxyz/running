import crypto from "node:crypto";
import { getDb } from "./mongodb.js";
import {
  DAYS_ORDER,
  VALID_SESSION_TYPES,
  buildStructuredDay,
  buildWeekDaysMap,
  countPlanProgress,
  getSessionCompletion,
  resolveWeekAndDayForDate,
} from "./schedule-utils.js";
import {
  deleteUserPlan,
  deleteUserWeek,
  getMergedPlansForUser,
  swapWorkoutDays,
  updateUserPlanMeta,
  upsertUserPlan,
  upsertUserWeek,
} from "./plans-store.js";
import {
  getActivePlanRulesContext,
  getAthleteProfileContext,
  getBodyCompHistory,
  getDecisionGates,
  getExerciseHistory,
  getReadinessSummary,
  getUserProgressAndLogs,
  logBodyComp,
  logDailyBiometrics,
  logExerciseSets,
  logExtraActivity,
  logNutritionEntry,
  logWorkoutCompletion,
  resolveDecisionGate,
} from "./coaching-store.js";

export function hashMcpToken(rawToken) {
  return crypto.createHash("sha256").update(String(rawToken || "")).digest("hex");
}

export async function getActiveMcpTokenMeta(email, existingDb = null) {
  const db = existingDb || (await getDb());
  const doc = await db.collection("mcp_tokens").findOne(
    { email: email.trim().toLowerCase(), revokedAt: null },
    { sort: { createdAt: -1 } }
  );
  if (!doc) {
    return { connected: false };
  }
  return {
    connected: true,
    tokenPrefix: doc.tokenPrefix,
    label: doc.label || "AI Assistant MCP",
    createdAt: doc.createdAt,
    lastUsedAt: doc.lastUsedAt || null,
  };
}

export async function createUserMcpToken(email, label = "AI Assistant MCP", existingDb = null) {
  const normalizedEmail = email.trim().toLowerCase();
  const db = existingDb || (await getDb());
  const now = new Date();

  await db.collection("mcp_tokens").updateMany(
    { email: normalizedEmail, revokedAt: null },
    { $set: { revokedAt: now } }
  );

  const rawToken = `th_mcp_${crypto.randomBytes(24).toString("hex")}`;
  const tokenHash = hashMcpToken(rawToken);
  const tokenPrefix = `${rawToken.slice(0, 12)}...${rawToken.slice(-4)}`;

  await db.collection("mcp_tokens").insertOne({
    email: normalizedEmail,
    tokenHash,
    tokenPrefix,
    label: String(label || "AI Assistant MCP").slice(0, 60),
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  });

  return {
    rawToken,
    meta: {
      connected: true,
      tokenPrefix,
      label,
      createdAt: now,
      lastUsedAt: null,
    },
  };
}

export async function revokeUserMcpTokens(email, existingDb = null) {
  const db = existingDb || (await getDb());
  const res = await db.collection("mcp_tokens").updateMany(
    { email: email.trim().toLowerCase(), revokedAt: null },
    { $set: { revokedAt: new Date() } }
  );
  return res.modifiedCount;
}

export async function authenticateMcpRequest(request, existingDb = null) {
  const authHeader = request.headers.get("authorization") || "";
  const altHeader = request.headers.get("x-mcp-token") || "";

  let rawToken = "";
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    rawToken = authHeader.slice(7).trim();
  } else if (altHeader.trim()) {
    rawToken = altHeader.trim();
  }

  if (!rawToken) return null;

  const db = existingDb || (await getDb());
  const tokenHash = hashMcpToken(rawToken);
  const doc = await db.collection("mcp_tokens").findOne({
    tokenHash,
    revokedAt: null,
  });
  if (!doc) return null;

  await db.collection("mcp_tokens").updateOne(
    { _id: doc._id },
    { $set: { lastUsedAt: new Date() } }
  );

  return {
    email: doc.email,
    tokenPrefix: doc.tokenPrefix,
  };
}

export const MCP_SERVER_INFO = {
  name: "training-hub-mcp",
  version: "2.0.0",
};

const EXERCISE_ITEM_SCHEMA = {
  type: "object",
  properties: {
    code: { type: "string", description: "Exercise code e.g. 'A1', 'B2'." },
    name: { type: "string", description: "Exercise display name." },
    sets: { type: "string", description: "Target sets x reps e.g. '3 x 8-12'." },
    targetRir: { type: "string", description: "Target RIR e.g. '1-2 RIR'." },
    tempo: { type: "string", description: "Optional tempo e.g. '3-1-1-0'." },
    restSec: { type: "integer", description: "Rest interval in seconds." },
    homeOption: { type: "string", description: "Home dumbbell/bodyweight option." },
    gymOption: { type: "string", description: "Commercial gym option." },
    rehabStage: { type: "string", description: "Optional knee rehab stage note." },
    progression: { type: "string", description: "Progression cue." },
    note: { type: "string", description: "Form cue or safety note." },
  },
};

const DAY_ENTRY_SCHEMA = {
  type: "object",
  properties: {
    type: {
      type: "string",
      enum: VALID_SESSION_TYPES,
      description: "Semantic session type: chill_z2_run | incline_walk | strength_a | strength_b | football | long_run | rest | easy | str | inc | long | rec",
    },
    target: { type: "string", description: "Short headline target for the day (preserves UTF-8 symbols/emojis)." },
    detail: { type: "string", description: "Detailed workout prescription and HR/RPE cues." },
    durationMin: { type: "integer", description: "Planned duration in minutes (0 for rest days)." },
    isRest: { type: "boolean", description: "Set true when this day is a rest/recovery day." },
    exercises: {
      type: "array",
      description: "Structured strength/rehab exercises for this session.",
      items: EXERCISE_ITEM_SCHEMA,
    },
  },
};

const WEEK_PROPERTIES_SCHEMA = {
  week: { type: "integer", description: "1-based week number." },
  phase: { type: "string", description: "Phase slug (e.g. 'cut', 'rehab', 'base', 'peak', 'taper')." },
  phaseLabel: { type: "string", description: "Display phase label." },
  title: { type: "string", description: "Optional week title or theme." },
  days: {
    type: "object",
    description: "Flexible 7-day schedule keyed by mon..sun. Supports partial merge per day on update.",
    properties: {
      mon: DAY_ENTRY_SCHEMA,
      tue: DAY_ENTRY_SCHEMA,
      wed: DAY_ENTRY_SCHEMA,
      thu: DAY_ENTRY_SCHEMA,
      fri: DAY_ENTRY_SCHEMA,
      sat: DAY_ENTRY_SCHEMA,
      sun: DAY_ENTRY_SCHEMA,
    },
  },
  monTarget: { type: "string" },
  monDetail: { type: "string" },
  monRest: { type: "string" },
  tueTarget: { type: "string" },
  tueDetail: { type: "string" },
  wedTarget: { type: "string" },
  wedDetail: { type: "string" },
  thuTarget: { type: "string" },
  thuDetail: { type: "string" },
  friTarget: { type: "string" },
  friDetail: { type: "string" },
  friRest: { type: "string" },
  satTarget: { type: "string" },
  satDetail: { type: "string" },
  sunTarget: { type: "string" },
  sunDetail: { type: "string" },
  focus: { type: "string" },
  nutritionNote: { type: "string" },
  minutes: { type: "integer", description: "Total planned weekly minutes." },
  weeklyCardioMin: { type: "integer", description: "Planned weekly aerobic/cardio minutes." },
  isRecovery: { type: "boolean" },
  isEasy: { type: "boolean" },
  isPeak: { type: "boolean" },
  isGoal: { type: "boolean" },
  isRace: { type: "boolean" },
  nutritionTargets: {
    type: "object",
    description: "Optional per-week day-type calorie/macro targets (rest, cardio, lift, long_run, maintenance, diet_break).",
    additionalProperties: true,
  },
};

export const MCP_TOOLS = [
  {
    name: "list_training_plans",
    description: "List training plans for the authenticated user with status, dates, 7-day completion progress, and active plan indicator.",
    inputSchema: {
      type: "object",
      properties: {
        includeArchived: {
          type: "boolean",
          description: "Set true to also return archived plans (default false).",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_training_schedule",
    description: "Read weekly workout schedules (flexible 7-day days.mon..sun + structured exercises + flat compatibility fields), execution logs, and nutrition targets.",
    inputSchema: {
      type: "object",
      properties: {
        planId: {
          type: "string",
          description: "Plan ID (e.g. 'hybrid-2026', 'pst34-2026'). Defaults to the active plan.",
        },
        week: {
          type: "integer",
          description: "Optional specific 1-based week number to filter.",
        },
      },
    },
  },
  {
    name: "get_today_workout",
    description: "Get today's workout (or any target date / offsetDays in Asia/Bangkok timezone), including structured exercises, completion state, execution log, and matching day-type nutrition targets.",
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string", description: "Optional plan ID. Defaults to the active plan." },
        date: { type: "string", description: "Optional target date in YYYY-MM-DD (Asia/Bangkok)." },
        offsetDays: { type: "integer", description: "Optional day offset from date/today (e.g. +1 for tomorrow, -1 for yesterday)." },
      },
    },
  },
  {
    name: "get_workout_by_date",
    description: "Query the scheduled workout, execution log, and nutrition target for a specific YYYY-MM-DD date or offsetDays in Asia/Bangkok timezone without manual week math.",
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string", description: "Optional plan ID. Defaults to the active plan." },
        date: { type: "string", description: "Target date in YYYY-MM-DD (Asia/Bangkok). Defaults to today." },
        offsetDays: { type: "integer", description: "Optional day offset from date/today (e.g. 1 = tomorrow)." },
      },
    },
  },
  {
    name: "add_training_plan",
    description: "Create or replace a training plan with flexible 7-day weeks, status, phases, weekly volume flags, and day-type nutritionTargets.",
    inputSchema: {
      type: "object",
      required: ["title", "weeks"],
      properties: {
        id: { type: "string", description: "URL-safe slug ID. Auto-generated if omitted." },
        shortName: { type: "string", description: "Short tab label (max 32 chars)." },
        title: { type: "string", description: "Full display title." },
        subtitle: { type: "string" },
        periodLabel: { type: "string" },
        startDateStr: { type: "string", description: "Start Monday in YYYY-MM-DD format." },
        status: { type: "string", enum: ["active", "completed", "archived"] },
        setActive: { type: "boolean", description: "Set true to make this plan the sole active plan." },
        phases: { type: "object", additionalProperties: true },
        nutritionTargets: { type: "object", additionalProperties: true },
        weeks: {
          type: "array",
          items: { type: "object", properties: WEEK_PROPERTIES_SCHEMA },
        },
      },
    },
  },
  {
    name: "add_or_update_week",
    description: "Partially update or add a single week in an existing plan. Only provided fields/days are updated; untouched days, exercises, completed flags, and UTF-8 emojis/symbols are preserved.",
    inputSchema: {
      type: "object",
      required: ["planId", "week"],
      properties: {
        planId: { type: "string", description: "Target training plan ID." },
        ...WEEK_PROPERTIES_SCHEMA,
      },
    },
  },
  {
    name: "update_training_plan",
    description: "Update plan metadata (title, shortName, subtitle, periodLabel, startDateStr, status active/completed/archived, setActive, phases, nutritionTargets) without resending weeks[].",
    inputSchema: {
      type: "object",
      required: ["planId"],
      properties: {
        planId: { type: "string", description: "Plan ID to update." },
        shortName: { type: "string" },
        title: { type: "string" },
        subtitle: { type: "string" },
        periodLabel: { type: "string" },
        startDateStr: { type: "string" },
        status: { type: "string", enum: ["active", "completed", "archived"] },
        setActive: { type: "boolean", description: "Switch this plan to active (demotes other active plans to archived if they were active, unless left completed)." },
        phases: { type: "object", additionalProperties: true },
        nutritionTargets: { type: "object", additionalProperties: true },
      },
    },
  },
  {
    name: "delete_training_plan",
    description: "Delete a custom training plan (or hide a built-in plan) and clean up user progress for that plan.",
    inputSchema: {
      type: "object",
      required: ["planId"],
      properties: {
        planId: { type: "string", description: "Plan ID to delete." },
      },
    },
  },
  {
    name: "delete_week",
    description: "Remove a specific week number from a training plan and re-sync weekly metadata.",
    inputSchema: {
      type: "object",
      required: ["planId", "week"],
      properties: {
        planId: { type: "string" },
        week: { type: "integer", description: "1-based week number to delete." },
      },
    },
  },
  {
    name: "swap_workout_days",
    description: "Swap two days within the same week (e.g. wed <-> tue for Clean Football-Week Swap), optionally swapping their completion status and execution logs too.",
    inputSchema: {
      type: "object",
      required: ["planId", "week", "dayA", "dayB"],
      properties: {
        planId: { type: "string" },
        week: { type: "integer" },
        dayA: { type: "string", description: "First day (mon..sun or legacy easy/str/inc/long/rec)." },
        dayB: { type: "string", description: "Second day (mon..sun or legacy easy/str/inc/long/rec)." },
        swapProgress: { type: "boolean", description: "Swap completion & execution logs alongside schedule (default true)." },
      },
    },
  },
  {
    name: "mark_workout_progress",
    description: "Mark a session completed/incomplete (supports mon..sun or legacy easy/str/inc/long/rec, or date) with optional Garmin telemetry and RPE/knee pain logs.",
    inputSchema: {
      type: "object",
      required: ["planId", "completed"],
      properties: {
        planId: { type: "string" },
        week: { type: "integer" },
        dayKey: { type: "string", description: "Preferred 7-day key: mon | tue | wed | thu | fri | sat | sun." },
        dayType: { type: "string", description: "Legacy or 7-day alias: mon..sun or easy/str/inc/long/rec." },
        date: { type: "string", description: "Optional YYYY-MM-DD date to resolve week/day automatically." },
        completed: { type: "boolean" },
        actualType: { type: "string", description: "What was actually done e.g. 'football_swap', 'incline_walk'." },
        garminActivityId: { type: "string", description: "Garmin Activity ID for deduplication." },
        actualDurationMin: { type: "number" },
        distanceKm: { type: "number" },
        avgHr: { type: "number" },
        maxHr: { type: "number" },
        elevationGainM: { type: "number" },
        trainingLoad: { type: "number" },
        rpe: { type: "number", description: "Session RPE (1-10)." },
        kneePainScore: { type: "number", description: "Patella/knee pain score (0-10)." },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "log_workout_result",
    description: "Log completed workout telemetry from Garmin/manual tracking (deduplicates by garminActivityId, supports actualType, RPE, kneePainScore, HR, distance, elevation, trainingLoad).",
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string", description: "Optional plan ID. Defaults to active plan." },
        week: { type: "integer" },
        dayKey: { type: "string", description: "Day key (mon..sun or legacy alias)." },
        dayType: { type: "string", description: "Alias for dayKey." },
        date: { type: "string", description: "Optional YYYY-MM-DD (Asia/Bangkok)." },
        offsetDays: { type: "integer" },
        completed: { type: "boolean", description: "Defaults to true." },
        actualType: { type: "string", description: "e.g. 'chill_z2_run', 'football_swap', 'strength_a'." },
        garminActivityId: { type: "string" },
        actualDurationMin: { type: "number" },
        distanceKm: { type: "number" },
        avgHr: { type: "number" },
        maxHr: { type: "number" },
        elevationGainM: { type: "number" },
        trainingLoad: { type: "number" },
        rpe: { type: "number" },
        kneePainScore: { type: "number" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "log_extra_activity",
    description: "Log an ad-hoc or bonus activity (e.g. recovery walk, unscheduled football, mobility) without overwriting the primary scheduled slot.",
    inputSchema: {
      type: "object",
      required: ["title"],
      properties: {
        date: { type: "string", description: "YYYY-MM-DD (defaults to today Bangkok)." },
        type: { type: "string", description: "e.g. 'recovery_walk', 'football', 'mobility', 'cycling'." },
        title: { type: "string" },
        durationMin: { type: "number" },
        distanceKm: { type: "number" },
        avgHr: { type: "number" },
        maxHr: { type: "number" },
        elevationGainM: { type: "number" },
        rpe: { type: "number" },
        kneePainScore: { type: "number" },
        garminActivityId: { type: "string" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "log_exercise_sets",
    description: "Log working sets (weightKg, reps, rir) for a strength exercise and get automated Double Progression evaluation (+2.5 kg recommendation when hitting target reps across all sets).",
    inputSchema: {
      type: "object",
      required: ["sets"],
      properties: {
        date: { type: "string", description: "YYYY-MM-DD (defaults to today Bangkok)." },
        planId: { type: "string" },
        week: { type: "integer" },
        dayKey: { type: "string" },
        code: { type: "string", description: "Exercise code e.g. 'A1', 'A2', 'B1'." },
        name: { type: "string", description: "Exercise name e.g. 'Incline DB Press'." },
        targetTopRep: { type: "integer", description: "Top of target rep range (default 12)." },
        sets: {
          type: "array",
          items: {
            type: "object",
            required: ["reps"],
            properties: {
              weightKg: { type: "number" },
              reps: { type: "integer" },
              rir: { type: "number" },
              note: { type: "string" },
            },
          },
        },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "get_exercise_history",
    description: "Retrieve recent strength progression logs and latest Double Progression recommendation for an exercise code or name.",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "Filter by exercise code (e.g. 'A1')." },
        name: { type: "string", description: "Case-insensitive name substring filter." },
        limit: { type: "integer", description: "Max entries (1-100, default 20)." },
      },
    },
  },
  {
    name: "get_gates",
    description: "List physiological & rehab decision gates (e.g. Wed Nov 18 Cut vs Fast-Track Gate, Patella Stage 1->2->3 Gate, Steep Incline 8-12% Gate) and their status.",
    inputSchema: {
      type: "object",
      properties: {
        planId: { type: "string", description: "Optional plan ID filter." },
      },
    },
  },
  {
    name: "resolve_gate",
    description: "Resolve or update a decision gate status (pending / passed / failed), selected branch, metrics snapshot, and coach notes.",
    inputSchema: {
      type: "object",
      required: ["gateId", "status"],
      properties: {
        gateId: { type: "string" },
        planId: { type: "string" },
        title: { type: "string" },
        criteria: { type: "string" },
        status: { type: "string", enum: ["pending", "passed", "failed"] },
        selectedBranch: { type: "string", description: "Chosen branch e.g. 'Standard Conservative' or 'Fast-Track'." },
        metricsSnapshot: { type: "object", additionalProperties: true },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "log_body_composition",
    description: "Log Fitdays / scale body composition checkpoint (weightKg, bodyFatPct, fatMassKg, ffmKg, muscleMassKg, legLeftKg, legRightKg, visceralFat, bmr) with automatic 18.0% BF & 10.3 kg leg armor checks.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD (defaults to today Bangkok)." },
        source: { type: "string", description: "Default 'fitdays'." },
        weightKg: { type: "number" },
        bodyFatPct: { type: "number" },
        fatMassKg: { type: "number" },
        ffmKg: { type: "number" },
        muscleMassKg: { type: "number" },
        legLeftKg: { type: "number" },
        legRightKg: { type: "number" },
        visceralFat: { type: "number" },
        bmr: { type: "number" },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "get_body_composition_history",
    description: "Retrieve chronological Fitdays body composition history plus weight/body-fat/muscle/leg mass trend deltas toward the 18.0% BF target.",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Default 20 (max 100)." },
      },
    },
  },
  {
    name: "log_daily_biometrics",
    description: "Log daily Garmin recovery & knee biometrics (sleepScore, overnightHrv, hrv7dAvg, rhr, readiness, bodyBattery, acwr, kneePainScore) and evaluate Red-Light Deficit Pause triggers.",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD (defaults to today Bangkok)." },
        sleepScore: { type: "number" },
        overnightHrv: { type: "number" },
        hrv7dAvg: { type: "number" },
        rhr: { type: "number" },
        readiness: { type: "number" },
        bodyBattery: { type: "number" },
        acwr: { type: "number" },
        kneePainScore: { type: "number", description: "0-10 morning/post-session knee pain score." },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "get_readiness_summary",
    description: "Summarize recent daily biometrics, consecutive Red-Light days, and whether the 2-day Red-Light Deficit Pause rule is active.",
    inputSchema: {
      type: "object",
      properties: {
        days: { type: "integer", description: "Lookback window in days (1-30, default 7)." },
      },
    },
  },
  {
    name: "log_nutrition",
    description: "Log daily intake (calories, proteinG, carbsG, fatG, waterL, supplements) against the active plan's dayType macro targets (rest/cardio/lift/long_run/maintenance/diet_break).",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "YYYY-MM-DD (defaults to today Bangkok)." },
        planId: { type: "string" },
        dayType: {
          type: "string",
          enum: ["rest", "cardio", "lift", "long_run", "maintenance", "diet_break"],
          description: "Target macro template key (default 'cardio').",
        },
        calories: { type: "number" },
        proteinG: { type: "number" },
        carbsG: { type: "number" },
        fatG: { type: "number" },
        waterL: { type: "number" },
        supplements: {
          type: "array",
          items: { type: "string" },
          description: "e.g. ['Collagen 15g + Vit C', 'Creatine 5g', 'Omega-3']",
        },
        notes: { type: "string" },
      },
    },
  },
];

export const MCP_RESOURCES = [
  {
    uri: "athlete://profile",
    name: "Athlete Profile & Telemetry Thresholds",
    description: "Core physiological profile, %HRR heart-rate zones, knee rehab status, latest Fitdays body comp, and recent readiness flags.",
    mimeType: "application/json",
  },
  {
    uri: "plan://active/rules",
    name: "Active Plan Guardrails, Gates & Nutrition Targets",
    description: "Non-negotiable training rules (Strict No-Cooldown, 1 Activity/Day, Clean Football-Week Swap, Double Progression, Red-Light Pause), day-type nutrition targets, and decision gates.",
    mimeType: "application/json",
  },
];

export async function readMcpResource(uri, email, existingDb = null) {
  const db = existingDb || (await getDb());
  if (uri === "athlete://profile") {
    const profile = await getAthleteProfileContext(email, db);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(profile, null, 2),
        },
      ],
    };
  }
  if (uri === "plan://active/rules") {
    const [rulesCtx, gates] = await Promise.all([
      getActivePlanRulesContext(email, db),
      getDecisionGates(email, null, db),
    ]);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ ...rulesCtx, gates }, null, 2),
        },
      ],
    };
  }
  throw new Error(`Unknown MCP resource URI: ${uri}`);
}

function resolveDayNutritionTarget(dayObj, weekObj, plan) {
  const targets = weekObj?.nutritionTargets || plan?.nutritionTargets || null;
  if (!targets || !dayObj) return null;

  const type = dayObj.type;
  if (targets[type]) return { key: type, ...targets[type] };
  if (dayObj.isRest || type === "rest") {
    return targets.rest ? { key: "rest", ...targets.rest } : null;
  }
  if (type === "strength_a" || type === "strength_b" || type === "str") {
    return targets.lift ? { key: "lift", ...targets.lift } : null;
  }
  if (type === "long_run" || type === "football" || type === "long") {
    return targets.long_run ? { key: "long_run", ...targets.long_run } : null;
  }
  return targets.cardio ? { key: "cardio", ...targets.cardio } : null;
}

async function queryWorkoutForDate(email, args = {}, db) {
  const plans = await getMergedPlansForUser(email, db);
  const target =
    (args.planId && plans.find((p) => p.id === args.planId)) ||
    plans.find((p) => p.status === "active") ||
    plans[0];
  if (!target) throw new Error("ไม่พบแผนซ้อม");

  const resolved = resolveWeekAndDayForDate(target, args.date || null, Number(args.offsetDays || 0));
  const weekObj = target.weeks.find((w) => w.week === resolved.week) || target.weeks[0];
  if (!weekObj) throw new Error("แผนซ้อมยังไม่มีข้อมูลรายสัปดาห์");

  const { progressByPlan, executionLogsByPlan } = await getUserProgressAndLogs(email, db);
  const pMap = progressByPlan[target.id] || {};
  const logMap = executionLogsByPlan[target.id] || {};

  const dayObj = buildStructuredDay(weekObj, resolved.dayKey, target);
  const comp = getSessionCompletion(pMap, logMap, weekObj.week, resolved.dayKey);
  const dayNutritionTarget = resolveDayNutritionTarget(dayObj, weekObj, target);

  const workoutPayload = {
    ...dayObj,
    title: dayObj.target,
    dayType: comp.legacyKey ? comp.legacyKey.split("-")[1] : dayObj.dayKey,
    progressKey: comp.progressKey,
    legacyKey: comp.legacyKey,
    completed: comp.completed,
    executionLog: comp.log,
  };

  return {
    planId: target.id,
    planTitle: target.title,
    date: resolved.date,
    todayDate: resolved.todayDate,
    timezone: resolved.timezone,
    dayKey: resolved.dayKey,
    week: weekObj.week,
    outOfRange: resolved.outOfRange,
    phase: weekObj.phase,
    phaseLabel: weekObj.phaseLabel,
    title: weekObj.title,
    focus: weekObj.focus,
    nutritionNote: weekObj.nutritionNote,
    dayNutritionTarget,
    nutritionTargets: weekObj.nutritionTargets || target.nutritionTargets || null,
    workout: workoutPayload,
    today: workoutPayload,
  };
}

export async function executeMcpTool(name, args = {}, email, existingDb = null) {
  const db = existingDb || (await getDb());

  if (name === "list_training_plans") {
    const plans = await getMergedPlansForUser(email, db, {
      includeArchived: Boolean(args?.includeArchived),
    });
    const { progressByPlan } = await getUserProgressAndLogs(email, db);

    return {
      user: email,
      timezone: "Asia/Bangkok",
      plans: plans.map((p) => {
        const pMap = progressByPlan[p.id] || {};
        const prog = countPlanProgress(p, pMap);
        return {
          id: p.id,
          shortName: p.shortName,
          title: p.title,
          subtitle: p.subtitle,
          periodLabel: p.periodLabel,
          startDateStr: p.startDateStr,
          status: p.status || "active",
          isCustom: Boolean(p.isCustom),
          weeksCount: p.weeks.length,
          completedSessions: prog.completed,
          totalSessions: prog.total,
          progressPercent: prog.percent,
        };
      }),
    };
  }

  if (name === "get_training_schedule") {
    const plans = await getMergedPlansForUser(email, db, { includeArchived: true });
    const target =
      (args.planId && plans.find((p) => p.id === args.planId)) ||
      plans.find((p) => p.status === "active") ||
      plans[0];
    if (!target) {
      throw new Error(`ไม่พบแผนซ้อมรหัส "${args.planId}"`);
    }

    const { progressByPlan, executionLogsByPlan } = await getUserProgressAndLogs(email, db);
    const pMap = progressByPlan[target.id] || {};
    const logMap = executionLogsByPlan[target.id] || {};

    let weeks = target.weeks;
    if (args.week) {
      weeks = weeks.filter((w) => w.week === Number(args.week));
    }

    const enrichedWeeks = weeks.map((w) => {
      const daysMap = buildWeekDaysMap(w, target);
      const enrichedDays = {};
      for (const dk of DAYS_ORDER) {
        const comp = getSessionCompletion(pMap, logMap, w.week, dk);
        enrichedDays[dk] = {
          ...daysMap[dk],
          progressKey: comp.progressKey,
          legacyKey: comp.legacyKey,
          completed: comp.completed,
          executionLog: comp.log,
        };
      }
      return {
        ...w,
        days: enrichedDays,
      };
    });

    return {
      plan: {
        id: target.id,
        shortName: target.shortName,
        title: target.title,
        subtitle: target.subtitle,
        periodLabel: target.periodLabel,
        startDateStr: target.startDateStr,
        status: target.status || "active",
        nutritionTargets: target.nutritionTargets || null,
        phases: target.phases || null,
      },
      weeks: enrichedWeeks,
      progress: pMap,
      executionLogs: logMap,
    };
  }

  if (name === "get_today_workout" || name === "get_workout_by_date") {
    return await queryWorkoutForDate(email, args, db);
  }

  if (name === "add_training_plan") {
    const saved = await upsertUserPlan(email, args, db);
    return {
      status: "saved",
      plan: {
        id: saved.id,
        shortName: saved.shortName,
        title: saved.title,
        status: saved.status,
        weeksCount: saved.weeks.length,
        startDateStr: saved.startDateStr,
      },
    };
  }

  if (name === "add_or_update_week") {
    if (!args.planId) throw new Error("planId is required");
    return await upsertUserWeek(email, args.planId, args, db);
  }

  if (name === "update_training_plan") {
    if (!args.planId) throw new Error("planId is required");
    return await updateUserPlanMeta(email, args.planId, args, db);
  }

  if (name === "delete_training_plan") {
    if (!args.planId) throw new Error("planId is required");
    return await deleteUserPlan(email, args.planId, db);
  }

  if (name === "delete_week") {
    if (!args.planId || !args.week) throw new Error("planId and week are required");
    return await deleteUserWeek(email, args.planId, args.week, db);
  }

  if (name === "swap_workout_days") {
    if (!args.planId || !args.week || !args.dayA || !args.dayB) {
      throw new Error("planId, week, dayA, and dayB are required");
    }
    return await swapWorkoutDays(
      email,
      args.planId,
      args.week,
      args.dayA,
      args.dayB,
      args.swapProgress !== false,
      db
    );
  }

  if (name === "mark_workout_progress" || name === "log_workout_result") {
    const completed =
      name === "log_workout_result"
        ? args.completed !== undefined
          ? Boolean(args.completed)
          : true
        : Boolean(args.completed);

    return await logWorkoutCompletion(
      email,
      {
        ...args,
        dayKey: args.dayKey || args.day || args.dayType,
        completed,
      },
      db
    );
  }

  if (name === "log_extra_activity") {
    return await logExtraActivity(
      email,
      {
        ...args,
        type: args.type || args.activityType || "extra_activity",
      },
      db
    );
  }

  if (name === "log_exercise_sets") {
    return await logExerciseSets(
      email,
      {
        ...args,
        code: args.code ?? args.exerciseCode,
        name: args.name ?? args.exerciseName,
      },
      db
    );
  }

  if (name === "get_exercise_history") {
    return await getExerciseHistory(
      email,
      {
        code: args.code ?? args.exerciseCode,
        name: args.name ?? args.exerciseName,
        limit: args.limit,
      },
      db
    );
  }

  if (name === "get_gates") {
    const gates = await getDecisionGates(email, args.planId || null, db);
    return { count: gates.length, gates };
  }

  if (name === "resolve_gate") {
    return await resolveDecisionGate(email, args, db);
  }

  if (name === "log_body_composition") {
    return await logBodyComp(email, args, db);
  }

  if (name === "get_body_composition_history") {
    return await getBodyCompHistory(email, args.limit, db);
  }

  if (name === "log_daily_biometrics") {
    return await logDailyBiometrics(email, args, db);
  }

  if (name === "get_readiness_summary") {
    return await getReadinessSummary(email, args.days, db);
  }

  if (name === "log_nutrition") {
    return await logNutritionEntry(
      email,
      {
        ...args,
        calories: args.calories ?? args.caloriesKcal,
        waterL: args.waterL ?? args.waterLiters,
        supplements: args.supplements ?? args.supplementsTaken,
      },
      db
    );
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}
