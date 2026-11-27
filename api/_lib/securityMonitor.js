import crypto from "crypto";

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  "https://awcgcpoibputqrtuvrms.supabase.co"
).replace(/\/$/, "");

const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).trim();

const TELEGRAM_BOT_TOKEN = (
  process.env.TELEGRAM_BOT_TOKEN ||
  process.env.VITE_TELEGRAM_BOT_TOKEN ||
  ""
).trim();

const TELEGRAM_SECURITY_CHAT_ID = String(
  process.env.TELEGRAM_SECURITY_CHAT_ID ||
    process.env.TELEGRAM_CHAT_ID ||
    process.env.VITE_TELEGRAM_CHAT_ID ||
    ""
).trim();

const ALERT_DEDUPE_WINDOW_MS =
  Math.max(10, Number(process.env.SECURITY_ALERT_DEDUPE_SEC || 120)) * 1000;

const VALID_SEVERITIES = new Set(["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"]);
const NOTIFY_SEVERITIES = new Set(
  String(process.env.SECURITY_NOTIFY_SEVERITIES || "CRITICAL,HIGH,MEDIUM")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
);

// In-memory alert deduplication cache (per serverless instance)
const alertDedupeMap = new Map();

/**
 * Extracts a trusted source IP from Cloudflare/Vercel metadata headers.
 * Returns null if no reliable IP is present (never invents or trusts spoofed client fields).
 */
export function getTrustedSourceIp(req) {
  if (!req || !req.headers) return null;
  const candidates = [
    req.headers["cf-connecting-ip"],
    req.headers["x-vercel-forwarded-for"],
    req.headers["x-real-ip"],
    req.headers["x-forwarded-for"],
  ];
  for (const raw of candidates) {
    if (typeof raw === "string" && raw.trim()) {
      const first = raw.split(",")[0].trim();
      if (/^[a-fA-F0-9:.]{3,45}$/.test(first)) {
        return first.slice(0, 64);
      }
    }
  }
  const sockIp = req.socket?.remoteAddress;
  if (typeof sockIp === "string" && /^[a-fA-F0-9:.]{3,45}$/.test(sockIp)) {
    return sockIp.slice(0, 64);
  }
  return null;
}

const SENSITIVE_KEY_PATTERN =
  /(password|passwd|secret|token|cookie|authorization|jwt|session|apikey|api_key|card|cvv|pin)/i;

/**
 * Recursively sanitizes event details to strip secrets, tokens, cookies, and oversized values.
 */
export function sanitizeEventDetails(input, depth = 0) {
  if (depth > 3) return "[truncated]";
  if (input === null || input === undefined) return null;
  if (typeof input === "number" || typeof input === "boolean") return input;
  if (typeof input === "string") {
    return input.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, "Bearer [REDACTED]").slice(0, 300);
  }
  if (Array.isArray(input)) {
    return input.slice(0, 15).map((item) => sanitizeEventDetails(item, depth + 1));
  }
  if (typeof input === "object") {
    const out = {};
    let count = 0;
    for (const [k, v] of Object.entries(input)) {
      if (count >= 20) break;
      if (SENSITIVE_KEY_PATTERN.test(k)) {
        out[k] = "[REDACTED]";
      } else {
        out[k] = sanitizeEventDetails(v, depth + 1);
      }
      count += 1;
    }
    return out;
  }
  return String(input).slice(0, 120);
}

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatAlertTimestamp(date = new Date()) {
  try {
    return (
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Phnom_Penh",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(date) + " ICT"
    );
  } catch {
    return date.toISOString();
  }
}

/**
 * Dispatches a notification-only Telegram alert with timeout, bounded exponential backoff, and deduplication.
 */
async function sendSecurityTelegramAlert(event) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_SECURITY_CHAT_ID) {
    return { ok: false, skipped: true, reason: "Telegram security credentials not configured" };
  }
  if (!NOTIFY_SEVERITIES.has(event.severity)) {
    return { ok: false, skipped: true, reason: "Severity below notification threshold" };
  }

  const dedupeKey = `${event.event_type}:${event.source_ip || "unknown"}:${event.endpoint}`;
  const now = Date.now();
  const existing = alertDedupeMap.get(dedupeKey);
  if (existing && now - existing.lastSent < ALERT_DEDUPE_WINDOW_MS) {
    existing.suppressedCount += 1;
    return { ok: true, deduplicated: true, suppressed: existing.suppressedCount };
  }
  const priorSuppressed = existing?.suppressedCount || 0;
  alertDedupeMap.set(dedupeKey, { lastSent: now, suppressedCount: 0 });

  const severityEmoji =
    event.severity === "CRITICAL"
      ? "🚨"
      : event.severity === "HIGH"
        ? "⚠️"
        : event.severity === "MEDIUM"
          ? "🛡️"
          : "ℹ️";

  const suppressedLine =
    priorSuppressed > 0
      ? `\n<b>Grouped Alerts:</b> +${priorSuppressed} similar events suppressed in window`
      : "";

  const message =
    `${severityEmoji} <b>SECURITY ALERT</b>\n` +
    `━━━━━━━━━━━━━━━━━━\n\n` +
    `<b>Event:</b> ${escapeHtml(event.event_type)}\n` +
    `<b>Severity:</b> <b>${escapeHtml(event.severity)}</b>\n\n` +
    `<b>Source IP:</b> <code>${escapeHtml(event.source_ip || "unavailable")}</code>\n` +
    `<b>Endpoint:</b> <code>${escapeHtml(event.endpoint)}</code>\n` +
    `<b>Action:</b> ${escapeHtml(event.action_taken)}\n` +
    `<b>Detection reason:</b> ${escapeHtml(event.detection_reason)}${suppressedLine}\n` +
    `<b>Time:</b> ${escapeHtml(formatAlertTimestamp())}\n` +
    `<b>Correlation ID:</b> <code>${escapeHtml(event.correlation_id)}</code>\n\n` +
    `<i>Ecommerce Security Monitoring (Notification-Only)</i>`;

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    try {
      const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          chat_id: TELEGRAM_SECURITY_CHAT_ID,
          text: message,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      });
      clearTimeout(timer);
      if (res.ok) {
        return { ok: true, attempt };
      }
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return { ok: false, status: res.status };
      }
    } catch (err) {
      clearTimeout(timer);
      if (attempt === maxAttempts) {
        console.warn("[SecurityMonitor] Telegram alert delivery failed:", err?.message || err);
        return { ok: false, error: err?.message || "Telegram timeout" };
      }
    }
    await new Promise((r) => setTimeout(r, 250 * Math.pow(2, attempt - 1)));
  }
  return { ok: false };
}

/**
 * Records a trusted server-side security event into Supabase `security_events`
 * and dispatches a Telegram security alert when severity warrants.
 * Never throws or blocks customer checkout flows.
 */
export async function recordSecurityEvent({
  req = null,
  eventType,
  severity = "MEDIUM",
  endpoint,
  userId = null,
  details = {},
  detectionReason,
  actionTaken,
  notify = true,
}) {
  const cleanSeverity = VALID_SEVERITIES.has(String(severity).toUpperCase())
    ? String(severity).toUpperCase()
    : "MEDIUM";
  const correlationId = `sec_${Date.now().toString(36)}_${crypto.randomBytes(4).toString("hex")}`;
  const sourceIp = getTrustedSourceIp(req);
  const rawUa = req?.headers?.["user-agent"];
  const userAgent =
    typeof rawUa === "string" ? rawUa.replace(/[\r\n]/g, " ").slice(0, 300) : null;

  const eventRow = {
    event_type: String(eventType || "SECURITY_EVENT").slice(0, 80),
    severity: cleanSeverity,
    source_ip: sourceIp,
    endpoint: String(endpoint || req?.url || "/api/unknown").split("?")[0].slice(0, 255),
    user_id: userId && /^[0-9a-f-]{36}$/i.test(String(userId)) ? String(userId) : null,
    user_agent: userAgent,
    event_details: sanitizeEventDetails(details) || {},
    detection_reason: String(detectionReason || "Automated security policy check").slice(0, 300),
    action_taken: String(actionTaken || "Logged").slice(0, 120),
    correlation_id: correlationId,
  };

  let persisted = false;
  if (SUPABASE_SERVICE_ROLE_KEY) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/security_events`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        signal: controller.signal,
        body: JSON.stringify(eventRow),
      });
      persisted = dbRes.ok;
      if (!dbRes.ok) {
        console.warn("[SecurityMonitor] Supabase insert status:", dbRes.status);
      }
    } catch (err) {
      console.warn("[SecurityMonitor] Supabase insert error:", err?.message || err);
    } finally {
      clearTimeout(timer);
    }
  }

  let alertResult = { ok: false, skipped: true };
  if (notify) {
    alertResult = await sendSecurityTelegramAlert(eventRow);
  }

  return {
    correlationId,
    persisted,
    alertResult,
  };
}

