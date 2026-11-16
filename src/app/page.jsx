import { cookies } from "next/headers";
import { resolveSessionFromCookies } from "../lib/auth.js";
import { getDb } from "../lib/mongodb.js";
import { TrainingHubApp } from "../components/TrainingHubApp.jsx";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialUser = null;
  let initialSession = null;
  let initialProgressByPlan = {};

  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (resolved?.user) {
      initialUser = resolved.user;
      initialSession = resolved.session;

      const db = await getDb();
      const progressDocs = await db
        .collection("user_progress")
        .find({ email: resolved.user.email })
        .toArray();
      for (const doc of progressDocs) {
        initialProgressByPlan[doc.planId] = doc.completedDays || {};
      }
    }
  } catch {
    // Graceful fallback if cookies or DB temporarily unavailable during initial SSR
  }

  return (
    <TrainingHubApp
      initialUser={initialUser}
      initialSession={initialSession}
      initialProgressByPlan={initialProgressByPlan}
    />
  );
}
