import crypto from "node:crypto";
import { getDb } from "./mongodb.js";
import { getMergedPlansForUser, upsertUserPlan, upsertUserWeek } from "./plans-store.js";

const DAY_KEYS = ["easy", "str", "inc", "long", "rec"];
const JS_DAY_TO_TYPE = {
  0: "rec",
  1: null,
  2: "easy",
  3: "str",
  4: "inc",
  5: null,
  6: "long",
};

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

  // Revoke previous active tokens for clean 1-active-connection UX
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
  version: "1.0.0",
};

export const MCP_TOOLS = [
  {
    name: "list_training_plans",
    description: "List all training plans belonging to the authenticated user along with completion progress.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "get_training_schedule",
    description: "Read weekly workout details and completion status for a training plan. Optionally filter by a specific week number.",
    inputSchema: {
      type: "object",
      properties: {
        planId: {
          type: "string",
          description: "ID of the plan (e.g. 'hybrid-2026', 'pst34-2026', or a custom plan ID). Defaults to the first active plan.",
        },
        week: {
          type: "integer",
          description: "Optional specific week number to read (1-based).",
        },
      },
    },
  },
  {
    name: "get_today_workout",
    description: "Get today's scheduled workout, focus note, nutrition guidance, and completion status.",
    inputSchema: {
      type: "object",
      properties: {
        planId: {
          type: "string",
          description: "Optional plan ID. Defaults to the active training plan.",
        },
      },
    },
  },
  {
    name: "add_training_plan",
    description: "Create or update a complete training plan for the authenticated user so it appears immediately in Training Hub.",
    inputSchema: {
      type: "object",
      required: ["title", "weeks"],
      properties: {
        id: { type: "string", description: "URL-safe slug ID (e.g. 'marathon-2027'). Auto-generated if omitted." },
        shortName: { type: "string", description: "Short tab label (max 32 chars)." },
        title: { type: "string", description: "Full display title of the training plan." },
        subtitle: { type: "string", description: "Concise plan summary or goal." },
        periodLabel: { type: "string", description: "Display date range label." },
        startDateStr: { type: "string", description: "Start Monday date in YYYY-MM-DD format." },
        weeks: {
          type: "array",
          description: "Ordered list of weekly schedules.",
          items: {
            type: "object",
            properties: {
              week: { type: "integer" },
              phase: { type: "string" },
              phaseLabel: { type: "string" },
              title: { type: "string" },
              tueTarget: { type: "string" },
              tueDetail: { type: "string" },
              wedTarget: { type: "string" },
              wedDetail: { type: "string" },
              thuTarget: { type: "string" },
              thuDetail: { type: "string" },
              satTarget: { type: "string" },
              satDetail: { type: "string" },
              sunTarget: { type: "string" },
              sunDetail: { type: "string" },
              monRest: { type: "string" },
              friRest: { type: "string" },
              focus: { type: "string" },
              nutritionNote: { type: "string" },
            },
          },
        },
      },
    },
  },
  {
    name: "add_or_update_week",
    description: "Add a new week or update an existing week's workouts in a training plan.",
    inputSchema: {
      type: "object",
      required: ["planId"],
      properties: {
        planId: { type: "string", description: "Target training plan ID." },
        week: { type: "integer", description: "Week number to update, or omit to append at the end." },
        phase: { type: "string" },
        phaseLabel: { type: "string" },
        title: { type: "string" },
        tueTarget: { type: "string" },
        tueDetail: { type: "string" },
        wedTarget: { type: "string" },
        wedDetail: { type: "string" },
        thuTarget: { type: "string" },
        thuDetail: { type: "string" },
        satTarget: { type: "string" },
        satDetail: { type: "string" },
        sunTarget: { type: "string" },
        sunDetail: { type: "string" },
        monRest: { type: "string" },
        friRest: { type: "string" },
        focus: { type: "string" },
        nutritionNote: { type: "string" },
      },
    },
  },
  {
    name: "mark_workout_progress",
    description: "Mark or unmark a workout session as completed (e.g. week 1 'easy', 'str', 'inc', 'long', or 'rec').",
    inputSchema: {
      type: "object",
      required: ["planId", "week", "dayType", "completed"],
      properties: {
        planId: { type: "string" },
        week: { type: "integer" },
        dayType: { type: "string", enum: ["easy", "str", "inc", "long", "rec"] },
        completed: { type: "boolean" },
      },
    },
  },
];

async function getProgressMap(email, db) {
  const docs = await db.collection("user_progress").find({ email }).toArray();
  const map = {};
  for (const d of docs) {
    map[d.planId] = d.completedDays || {};
  }
  return map;
}

function getCurrentWeekIndex(plan) {
  const start = new Date(plan.startDateStr);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  if (!Number.isFinite(diffDays) || diffDays < 0) return 1;
  return Math.min(Math.max(Math.floor(diffDays / 7) + 1, 1), plan.weeks.length);
}

export async function executeMcpTool(name, args = {}, email) {
  const db = await getDb();

  if (name === "list_training_plans") {
    const [plans, progressByPlan] = await Promise.all([
      getMergedPlansForUser(email, db),
      getProgressMap(email, db),
    ]);
    return plans.map((p) => {
      const pMap = progressByPlan[p.id] || {};
      const total = p.weeks.length * 5;
      let completed = 0;
      for (const w of p.weeks) {
        for (const t of DAY_KEYS) {
          if (pMap[`W${w.week}-${t}`]) completed += 1;
        }
      }
      return {
        id: p.id,
        shortName: p.shortName,
        title: p.title,
        status: p.status,
        periodLabel: p.periodLabel,
        startDateStr: p.startDateStr,
        weeksCount: p.weeks.length,
        completedSessions: completed,
        totalSessions: total,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
      };
    });
  }

  if (name === "get_training_schedule") {
    const [plans, progressByPlan] = await Promise.all([
      getMergedPlansForUser(email, db),
      getProgressMap(email, db),
    ]);
    const target =
      (args.planId && plans.find((p) => p.id === args.planId)) ||
      plans.find((p) => p.status === "active") ||
      plans[0];
    if (!target) throw new Error("ไม่พบแผนซ้อม");

    const pMap = progressByPlan[target.id] || {};
    const filteredWeeks = Number.isInteger(Number(args.week))
      ? target.weeks.filter((w) => w.week === Number(args.week))
      : target.weeks;

    return {
      planId: target.id,
      title: target.title,
      startDateStr: target.startDateStr,
      weeks: filteredWeeks.map((w) => ({
        ...w,
        completed: {
          tue_easy: Boolean(pMap[`W${w.week}-easy`]),
          wed_str: Boolean(pMap[`W${w.week}-str`]),
          thu_inc: Boolean(pMap[`W${w.week}-inc`]),
          sat_long: Boolean(pMap[`W${w.week}-long`]),
          sun_rec: Boolean(pMap[`W${w.week}-rec`]),
        },
      })),
    };
  }

  if (name === "get_today_workout") {
    const [plans, progressByPlan] = await Promise.all([
      getMergedPlansForUser(email, db),
      getProgressMap(email, db),
    ]);
    const target =
      (args.planId && plans.find((p) => p.id === args.planId)) ||
      plans.find((p) => p.status === "active") ||
      plans[0];
    if (!target) throw new Error("ไม่พบแผนซ้อม");

    const weekNum = getCurrentWeekIndex(target);
    const weekObj = target.weeks.find((w) => w.week === weekNum) || target.weeks[0];
    const jsDay = new Date().getDay();
    const dayType = JS_DAY_TO_TYPE[jsDay];
    const pMap = progressByPlan[target.id] || {};

    let prescription;
    if (jsDay === 1) {
      prescription = { isRest: true, label: "วันจันทร์ • วันพัก", detail: weekObj.monRest };
    } else if (jsDay === 5) {
      prescription = { isRest: true, label: "วันศุกร์ • วันพัก", detail: weekObj.friRest };
    } else {
      const dayDetailMap = {
        easy: { label: "วันอังคาร", title: weekObj.tueTarget, detail: weekObj.tueDetail },
        str: { label: "วันพุธ", title: weekObj.wedTarget, detail: weekObj.wedDetail },
        inc: { label: "วันพฤหัสบดี", title: weekObj.thuTarget, detail: weekObj.thuDetail },
        long: { label: "วันเสาร์", title: weekObj.satTarget, detail: weekObj.satDetail },
        rec: { label: "วันอาทิตย์", title: weekObj.sunTarget, detail: weekObj.sunDetail },
      };
      const key = `W${weekObj.week}-${dayType}`;
      prescription = {
        isRest: false,
        dayType,
        progressKey: key,
        completed: Boolean(pMap[key]),
        ...(dayDetailMap[dayType] || dayDetailMap.easy),
      };
    }

    return {
      planId: target.id,
      planTitle: target.title,
      week: weekObj.week,
      phaseLabel: weekObj.phaseLabel,
      focus: weekObj.focus,
      nutritionNote: weekObj.nutritionNote,
      today: prescription,
    };
  }

  if (name === "add_training_plan") {
    const saved = await upsertUserPlan(email, args, db);
    return {
      status: "saved",
      plan: {
        id: saved.id,
        shortName: saved.shortName,
        title: saved.title,
        weeksCount: saved.weeks.length,
        startDateStr: saved.startDateStr,
      },
    };
  }

  if (name === "add_or_update_week") {
    if (!args.planId) throw new Error("planId is required");
    return await upsertUserWeek(email, args.planId, args, db);
  }

  if (name === "mark_workout_progress") {
    const { planId, week, dayType, completed } = args;
    if (!planId || !week || !DAY_KEYS.includes(dayType)) {
      throw new Error("Invalid planId, week, or dayType");
    }
    const key = `W${Number(week)}-${dayType}`;
    const doc = await db.collection("user_progress").findOne({ email, planId });
    const nextMap = { ...(doc?.completedDays || {}), [key]: Boolean(completed) };

    await db.collection("user_progress").updateOne(
      { email, planId },
      {
        $set: { completedDays: nextMap, updatedAt: new Date() },
        $setOnInsert: { email, planId, createdAt: new Date() },
      },
      { upsert: true }
    );

    return { status: "updated", planId, key, completed: Boolean(completed) };
  }

  throw new Error(`Unknown MCP tool: ${name}`);
}
