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
  if (!globalThis._mongoSetupPromise) {
    globalThis._mongoSetupPromise = (async () => {
      await Promise.all([
        db.collection("users").createIndex({ email: 1 }, { unique: true }),
        db.collection("sessions").createIndex({ sessionId: 1 }, { unique: true }),
        db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        db.collection("user_progress").createIndex({ email: 1, planId: 1 }, { unique: true }),
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
      globalThis._mongoSetupPromise = null;
      throw err;
    });
  }
  return globalThis._mongoSetupPromise;
}
