import { MongoClient } from "mongodb";
import { PLANS } from "../data/plans/index.js";

const DB_NAME = process.env.MONGODB_DB || "running";

function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable in .env.local");
  }
  return uri;
}

export async function getClient() {
  if (!globalThis._mongoClientPromise) {
    const client = new MongoClient(getMongoUri(), {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    globalThis._mongoClientPromise = client.connect().catch((err) => {
      globalThis._mongoClientPromise = null;
      throw err;
    });
  }
  return globalThis._mongoClientPromise;
}

export async function getDb() {
  const client = await getClient();
  const db = client.db(DB_NAME);
  await ensureDatabaseSetup(db);
  return db;
}

export async function ensureDatabaseSetup(db) {
  if (!globalThis._mongoSetupPromiseV3) {
    globalThis._mongoSetupPromiseV3 = (async () => {
      await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true }),
        db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("user_progress").createIndex({ email: 1, planId: 1 }, { unique: true }),
        db.collection("user_plans").createIndex({ email: 1, id: 1 }, { unique: true }),
        db.collection("mcp_tokens").createIndex({ tokenHash: 1 }, { unique: true }),
        db.collection("mcp_tokens").createIndex({ email: 1, revokedAt: 1 }),
        db.collection("activity_logs").createIndex({ email: 1, date: -1 }),
        db.collection("activity_logs").createIndex({ email: 1, garminActivityId: 1 }),
        db.collection("exercise_logs").createIndex({ email: 1, code: 1, date: -1 }),
        db.collection("exercise_logs").createIndex({ email: 1, name: 1, date: -1 }),
        db.collection("decision_gates").createIndex({ email: 1, gateId: 1 }, { unique: true }),
        db.collection("body_comp_logs").createIndex({ email: 1, date: 1 }, { unique: true }),
        db.collection("daily_biometrics").createIndex({ email: 1, date: 1 }, { unique: true }),
        db.collection("nutrition_logs").createIndex({ email: 1, date: 1 }, { unique: true }),
        db.collection("plans").createIndex({ id: 1 }, { unique: true }),
      ]);

      // Seed training plans into MongoDB `running.plans` if missing
      const plansCol = db.collection("plans");
      for (const plan of PLANS) {
        await plansCol.updateOne(
          { id: plan.id },
          {
            $setOnInsert: {
              id: plan.id,
              shortName: plan.shortName,
              title: plan.title,
              status: plan.status,
              periodLabel: plan.periodLabel,
              startDateStr: plan.startDateStr,
              weeksCount: plan.weeks.length,
              createdAt: new Date(),
            },
            $set: {
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
    })().catch((err) => {
      globalThis._mongoSetupPromiseV3 = null;
      throw err;
    });
  }
  return globalThis._mongoSetupPromiseV3;
}
