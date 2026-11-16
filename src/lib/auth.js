import crypto from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { getDb } from "./mongodb.js";

export const ACCESS_COOKIE_NAME = "running_access_token";
export const REFRESH_COOKIE_NAME = "running_refresh_token";
export const ACCESS_TTL_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET || "dev-running-hub-access-secret-key-change-me";
  return new TextEncoder().encode(secret);
}

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET || "dev-running-hub-refresh-secret-key-change-me";
  return new TextEncoder().encode(secret);
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function signAccessToken({ userId, email, sessionId }) {
  return new SignJWT({ sub: userId, email, sessionId, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(getAccessSecret());
}

export async function signRefreshToken({ userId, email, sessionId, jti }) {
  return new SignJWT({ sub: userId, email, sessionId, jti, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token) {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    if (payload.type !== "access" || !payload.email || !payload.sessionId) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token) {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    if (payload.type !== "refresh" || !payload.email || !payload.sessionId) return null;
    return payload;
  } catch {
    return null;
  }
}

export function getCookieOptions(maxAgeSeconds) {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: maxAgeSeconds,
  };
}

export function applyAuthCookies(response, accessToken, refreshToken) {
  if (accessToken) {
    response.cookies.set(ACCESS_COOKIE_NAME, accessToken, getCookieOptions(ACCESS_TTL_SECONDS));
  }
  if (refreshToken) {
    response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, getCookieOptions(REFRESH_TTL_SECONDS));
  }
}

export function clearAuthCookies(response) {
  response.cookies.set(ACCESS_COOKIE_NAME, "", getCookieOptions(0));
  response.cookies.set(REFRESH_COOKIE_NAME, "", getCookieOptions(0));
}

export function serializeUser(userDoc) {
  if (!userDoc) return null;
  return {
    id: userDoc._id ? String(userDoc._id) : userDoc.id,
    email: userDoc.email,
    displayName: userDoc.displayName,
    lastLoginAt: userDoc.lastLoginAt,
  };
}

export function serializeSession(sessionDoc, accessExpiresAt = null) {
  if (!sessionDoc) return null;
  return {
    sessionId: sessionDoc.sessionId,
    createdAt: sessionDoc.createdAt,
    lastRefreshedAt: sessionDoc.lastRefreshedAt,
    expiresAt: sessionDoc.expiresAt,
    accessExpiresAt,
  };
}

/**
 * Resolves the active user & session from cookies.
 * Automatically verifies access token first; if missing or expired, falls back to
 * verifying the refresh token against `running.sessions` and issuing a fresh access token.
 */
export async function resolveSessionFromCookies(cookieStore) {
  const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
  const refreshToken = cookieStore.get(REFRESH_COOKIE_NAME)?.value;

  const db = await getDb();
  const sessionsCol = db.collection("sessions");
  const usersCol = db.collection("users");
  const now = new Date();

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    if (payload) {
      const sessionDoc = await sessionsCol.findOne({
        sessionId: payload.sessionId,
        email: payload.email,
        revokedAt: null,
        expiresAt: { $gt: now },
      });
      if (sessionDoc) {
        const userDoc = await usersCol.findOne({ email: payload.email });
        if (userDoc) {
          return {
            user: serializeUser(userDoc),
            session: serializeSession(
              sessionDoc,
              payload.exp ? new Date(payload.exp * 1000).toISOString() : null
            ),
            rotatedAccessToken: null,
          };
        }
      }
    }
  }

  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      const tokenHash = hashToken(refreshToken);
      const sessionDoc = await sessionsCol.findOne({
        sessionId: payload.sessionId,
        email: payload.email,
        refreshTokenHash: tokenHash,
        revokedAt: null,
        expiresAt: { $gt: now },
      });
      if (sessionDoc) {
        const userDoc = await usersCol.findOne({ email: payload.email });
        if (userDoc) {
          const userId = String(userDoc._id);
          const newAccessToken = await signAccessToken({
            userId,
            email: userDoc.email,
            sessionId: sessionDoc.sessionId,
          });
          const refreshedAt = new Date();
          await sessionsCol.updateOne(
            { sessionId: sessionDoc.sessionId },
            { $set: { lastRefreshedAt: refreshedAt } }
          );
          return {
            user: serializeUser(userDoc),
            session: serializeSession(
              { ...sessionDoc, lastRefreshedAt: refreshedAt },
              new Date(Date.now() + ACCESS_TTL_SECONDS * 1000).toISOString()
            ),
            rotatedAccessToken: newAccessToken,
          };
        }
      }
    }
  }

  return null;
}
