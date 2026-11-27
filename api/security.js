import { getTrustedSourceIp, recordSecurityEvent } from "./_lib/securityMonitor.js";

export const config = {
  regions: ["sin1"],
};

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://awcgcpoibputqrtuvrms.supabase.co"
).replace(/\/$/, "");

const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_UGc-TpOB6-ONOpUNlqYFhA_XuyDiSbv";

const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).trim();

const LOGIN_FAIL_THRESHOLD = Math.max(
  2,
  Number(process.env.SECURITY_LOGIN_FAIL_THRESHOLD || 5)
);
const LOGIN_WINDOW_MS =
  Math.max(60, Number(process.env.SECURITY_LOGIN_WINDOW_SEC || 300)) * 1000;

const ALLOWED_ORIGINS = new Set([
  "https://youngsteav.site",
  "https://www.youngsteav.site",
  ...(process.env.NODE_ENV !== "production"
    ? ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"]
    : []),
]);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    return ALLOWED_ORIGINS.has(`${parsed.protocol}//${parsed.host}`);
  } catch {
    return false;
  }
}

const ADMIN_EMAILS = new Set([
  "controller@steav.com",
  "admin@steav.com",
  "rayou@steav.com",
  "catalog@steav.com",
  "manager@steav.com",
  "controller@atelier.com",
  "admin@atelier.com",
  "rayou@atelier.com",
]);

function checkIsAdmin(user) {
  if (!user) return false;
  const email = String(user.email || "").toLowerCase().trim();
  const role = String(user.app_metadata?.role || "").toLowerCase().trim();
  return (
    role.includes("admin") ||
    role.includes("controller") ||
    role.includes("super") ||
    ADMIN_EMAILS.has(email)
  );
}

// In-memory brute-force tracking window
const failedLoginMap = new Map();

function recordFailedLoginAttempt(key) {
  const now = Date.now();
  const rec = failedLoginMap.get(key) || { count: 0, resetAt: now + LOGIN_WINDOW_MS };
  if (now > rec.resetAt) {
    rec.count = 1;
    rec.resetAt = now + LOGIN_WINDOW_MS;
  } else {
    rec.count += 1;
  }
  failedLoginMap.set(key, rec);
  return rec;
}

function isLoginLocked(key) {
  const now = Date.now();
  const rec = failedLoginMap.get(key);
  if (!rec) return false;
  if (now > rec.resetAt) {
    failedLoginMap.delete(key);
    return false;
  }
  return rec.count >= LOGIN_FAIL_THRESHOLD;
}

function clearLoginFailures(key) {
  failedLoginMap.delete(key);
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const body =
    req.method === "POST"
      ? typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {}
      : {};

  const action = String(req.query?.action || body.action || "").trim();

  // -----------------------------------------------------------------
  // 1. SENSITIVE-PATH SCANNING TRAP (Never reads files; returns 404)
  // -----------------------------------------------------------------
  if (action === "trap") {
    const probedPath = String(
      req.query?.path || req.headers["x-vercel-original-path"] || req.url || "/unknown"
    )
      .split("?")[0]
      .slice(0, 200);

    await recordSecurityEvent({
      req,
      eventType: "SENSITIVE_PATH_SCAN",
      severity: "HIGH",
      endpoint: probedPath,
      details: {
        method: req.method,
        probed_path: probedPath,
        status_returned: 404,
      },
      detectionReason: `Automated or manual probe for sensitive path: ${probedPath}`,
      actionTaken: "Blocked with 404 Not Found",
      notify: true,
    });

    return res.status(404).json({ error: "Not found" });
  }

  // -----------------------------------------------------------------
  // 2. RATE-LIMITED LOGIN PROXY (Preserves Supabase Auth, detects brute force)
  // -----------------------------------------------------------------
  if (req.method === "POST" && action === "login_proxy") {
    const email = String(body.email || "").trim().toLowerCase().slice(0, 150);
    const password = String(body.password || "");
    const isAdminAttempt = Boolean(body.isAdminAttempt);
    const sourceIp = getTrustedSourceIp(req) || "unknown";
    const ipKey = `ip:${sourceIp}`;
    const acctKey = `acct:${email}`;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    if (isLoginLocked(ipKey) || isLoginLocked(acctKey)) {
      res.setHeader("Retry-After", String(Math.ceil(LOGIN_WINDOW_MS / 1000)));
      await recordSecurityEvent({
        req,
        eventType: isAdminAttempt ? "ADMIN_BRUTE_FORCE_BLOCKED" : "BRUTE_FORCE_LOGIN",
        severity: isAdminAttempt ? "CRITICAL" : "HIGH",
        endpoint: "/api/security?action=login_proxy",
        details: {
          target_email: email,
          threshold: LOGIN_FAIL_THRESHOLD,
          window_seconds: Math.round(LOGIN_WINDOW_MS / 1000),
          is_admin_attempt: isAdminAttempt,
        },
        detectionReason: `Login failure threshold (${LOGIN_FAIL_THRESHOLD} in ${Math.round(
          LOGIN_WINDOW_MS / 1000
        )}s) exceeded`,
        actionTaken: "Temporary 429 rate limit applied",
        notify: true,
      });

      return res.status(429).json({
        error: "Too many failed login attempts. Please wait a few minutes and try again.",
      });
    }

    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const authData = await authRes.json().catch(() => ({}));

      if (!authRes.ok || !authData?.access_token) {
        const ipRec = recordFailedLoginAttempt(ipKey);
        const acctRec = recordFailedLoginAttempt(acctKey);
        const maxCount = Math.max(ipRec.count, acctRec.count);
        const reachedThreshold = maxCount >= LOGIN_FAIL_THRESHOLD;

        await recordSecurityEvent({
          req,
          eventType: isAdminAttempt ? "FAILED_ADMIN_LOGIN" : "FAILED_LOGIN",
          severity: reachedThreshold ? (isAdminAttempt ? "CRITICAL" : "HIGH") : "LOW",
          endpoint: "/api/security?action=login_proxy",
          details: {
            target_email: email,
            failed_attempts_in_window: maxCount,
            threshold: LOGIN_FAIL_THRESHOLD,
            is_admin_attempt: isAdminAttempt,
          },
          detectionReason: reachedThreshold
            ? `Repeated login failures (${maxCount}/${LOGIN_FAIL_THRESHOLD})`
            : "Invalid credentials supplied",
          actionTaken: reachedThreshold ? "Rate limit triggered on next attempt" : "Rejected (401)",
          notify: reachedThreshold || isAdminAttempt,
        });

        return res.status(401).json({
          error: authData?.error_description || authData?.msg || "Invalid login credentials",
        });
      }

      clearLoginFailures(ipKey);
      clearLoginFailures(acctKey);

      return res.status(200).json({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
        expires_in: authData.expires_in,
        token_type: authData.token_type,
        user: authData.user,
      });
    } catch (err) {
      return res.status(502).json({
        error: "Unable to reach authentication service.",
      });
    }
  }

  // -----------------------------------------------------------------
  // 3. ADMIN SECURITY DASHBOARD API (GET /api/security)
  // -----------------------------------------------------------------
  if (req.method === "GET") {
    const authHeader = String(req.headers.authorization || "");
    const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

    if (!jwt) {
      await recordSecurityEvent({
        req,
        eventType: "UNAUTHORIZED_ADMIN_ACCESS",
        severity: "HIGH",
        endpoint: "/api/security",
        details: { reason: "missing_bearer_token" },
        detectionReason: "Unauthenticated access attempt to security dashboard API",
        actionTaken: "Rejected (401)",
        notify: true,
      });
      return res.status(401).json({ success: false, error: "Unauthorized." });
    }

    let authUser = null;
    try {
      const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${jwt}` },
      });
      if (userRes.ok) authUser = await userRes.json();
    } catch {}

    if (!authUser || !checkIsAdmin(authUser)) {
      await recordSecurityEvent({
        req,
        eventType: "UNAUTHORIZED_ADMIN_ACCESS",
        severity: "CRITICAL",
        endpoint: "/api/security",
        userId: authUser?.id || null,
        details: { actor_email: authUser?.email || "anonymous" },
        detectionReason: "Non-admin user attempted to query security_events",
        actionTaken: "Rejected (403)",
        notify: true,
      });
      return res.status(403).json({ success: false, error: "Forbidden: Security admin access required." });
    }

    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return res.status(200).json({
        success: true,
        tableReady: false,
        message: "SUPABASE_SERVICE_ROLE_KEY not configured on server.",
        events: [],
        summary: { total: 0, criticalHigh: 0, blocked: 0, failedLogins: 0 },
      });
    }

    const page = Math.max(1, Number(req.query?.page || 1));
    const limit = Math.min(100, Math.max(10, Number(req.query?.limit || 25)));
    const offset = (page - 1) * limit;
    const severity = String(req.query?.severity || "").trim().toUpperCase();
    const eventType = String(req.query?.event_type || "").trim();
    const days = Math.min(90, Math.max(1, Number(req.query?.days || 30)));
    const sinceIso = new Date(Date.now() - days * 86400000).toISOString();

    const filters = [`created_at=gte.${encodeURIComponent(sinceIso)}`];
    if (["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].includes(severity)) {
      filters.push(`severity=eq.${encodeURIComponent(severity)}`);
    }
    if (eventType) {
      filters.push(`event_type=eq.${encodeURIComponent(eventType)}`);
    }

    const queryStr = filters.join("&");
    const headers = {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      Prefer: "count=exact",
    };

    try {
      const [listRes, summaryRes] = await Promise.all([
        fetch(
          `${SUPABASE_URL}/rest/v1/security_events?${queryStr}&order=created_at.desc&limit=${limit}&offset=${offset}`,
          { headers }
        ),
        fetch(
          `${SUPABASE_URL}/rest/v1/security_events?created_at=gte.${encodeURIComponent(
            sinceIso
          )}&select=severity,event_type,action_taken&limit=1000`,
          {
            headers: {
              apikey: SUPABASE_SERVICE_ROLE_KEY,
              Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        ),
      ]);

      if (!listRes.ok) {
        const errText = await listRes.text().catch(() => "");
        if (listRes.status === 404 || errText.includes("does not exist")) {
          return res.status(200).json({
            success: true,
            tableReady: false,
            message: "Run supabase_security_events.sql migration in Supabase to enable persistent event logs.",
            events: [],
            summary: { total: 0, criticalHigh: 0, blocked: 0, failedLogins: 0 },
          });
        }
        return res.status(502).json({ success: false, error: "Failed to query security_events." });
      }

      const events = await listRes.json();
      const contentRange = listRes.headers.get("content-range") || "";
      const totalMatched = Number(contentRange.split("/")[1] || events.length || 0);

      const allSummaryRows = summaryRes.ok ? await summaryRes.json() : [];
      const summary = {
        total: Array.isArray(allSummaryRows) ? allSummaryRows.length : 0,
        criticalHigh: 0,
        blocked: 0,
        failedLogins: 0,
      };

      if (Array.isArray(allSummaryRows)) {
        for (const r of allSummaryRows) {
          if (r.severity === "CRITICAL" || r.severity === "HIGH") summary.criticalHigh += 1;
          if (/blocked|rejected|429|403|401|404/i.test(String(r.action_taken || ""))) {
            summary.blocked += 1;
          }
          if (/LOGIN|BRUTE_FORCE/i.test(String(r.event_type || ""))) {
            summary.failedLogins += 1;
          }
        }
      }

      return res.status(200).json({
        success: true,
        tableReady: true,
        page,
        limit,
        totalMatched,
        events: Array.isArray(events) ? events : [],
        summary,
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: "Internal security dashboard error." });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

