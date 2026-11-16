import { cookies } from "next/headers";
import { resolveSessionFromCookies } from "../lib/auth.js";
import { getDb } from "../lib/mongodb.js";
import { getMergedPlansForUser } from "../lib/plans-store.js";
import { TrainingHubApp } from "../components/TrainingHubApp.jsx";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  let initialUser = null;
  let initialSession = null;
  let initialProgressByPlan = {};
  let initialPlans = null;

  try {
    const cookieStore = await cookies();
    const resolved = await resolveSessionFromCookies(cookieStore);
    if (resolved?.user) {
      initialUser = resolved.user;
      initialSession = resolved.session;

      const db = await getDb();
      const [progressDocs, mergedPlans] = await Promise.all([
        db.collection("user_progress").find({ email: resolved.user.email }).toArray(),
        getMergedPlansForUser(resolved.user.email, db),
      ]);
      for (const doc of progressDocs) {
        initialProgressByPlan[doc.planId] = doc.completedDays || {};
      }
      initialPlans = mergedPlans;
    }
  } catch {
    // Graceful fallback if cookies or DB temporarily unavailable during initial SSR
  }

  return (
    <TrainingHubApp
      initialUser={initialUser}
      initialSession={initialSession}
      initialProgressByPlan={initialProgressByPlan}
      initialPlans={initialPlans}
    />
  );
}
