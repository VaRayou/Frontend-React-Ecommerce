export const config = {
  regions: ["sin1"],
};

const BREVO_API_KEY = (process.env.BREVO_API_KEY || "").trim();
const BREVO_SENDER_EMAIL = (
  process.env.BREVO_SENDER_EMAIL || "varayouk@gmail.com"
).trim();
const BREVO_SENDER_NAME = (
  process.env.BREVO_SENDER_NAME || "STEAV PARIS"
).trim();

const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
const RESEND_SENDER_EMAIL = (
  process.env.RESEND_SENDER_EMAIL || "onboarding@resend.dev"
).trim();

// Strict CORS allowlist
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
    const originNormalized = `${parsed.protocol}//${parsed.host}`;
    return ALLOWED_ORIGINS.has(originNormalized);
  } catch {
    return false;
  }
}

// In-memory rate limiter: max 15 email sends per minute per IP
const rateLimitMap = new Map();
function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + 60000 };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + 60000;
    rateLimitMap.set(ip, record);
    return false;
  }
  record.count += 1;
  rateLimitMap.set(ip, record);
  return record.count > 15;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const clientIp =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (isRateLimited(clientIp)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({ error: "Rate limit exceeded. Please wait 60s." });
  }

  const body =
    typeof req.body === "string"
      ? JSON.parse(req.body || "{}")
      : req.body || {};

  const to = String(body.to || "").trim().toLowerCase();
  const recipientName = String(body.recipientName || "Valued Patron").trim();
  const subject = String(body.subject || "Order Confirmation | STEAV PARIS").trim();
  const htmlContent = String(body.htmlContent || "").trim();

  if (!to || !to.includes("@") || !htmlContent) {
    return res.status(400).json({ error: "Valid recipient email and htmlContent are required." });
  }

  // 1. Try Brevo First
  if (BREVO_API_KEY) {
    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: BREVO_SENDER_NAME, email: BREVO_SENDER_EMAIL },
          to: [{ email: to, name: recipientName }],
          subject,
          htmlContent,
        }),
      });

      if (brevoRes.ok) {
        const data = await brevoRes.json().catch(() => ({}));
        return res.status(200).json({ success: true, provider: "brevo", data });
      }
    } catch (e) {
      console.warn("[api/email] Brevo dispatch attempt failed:", e.message);
    }
  }

  // 2. Try Resend as Secondary Provider
  if (RESEND_API_KEY) {
    try {
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${BREVO_SENDER_NAME} <${RESEND_SENDER_EMAIL}>`,
          to: [to],
          subject,
          html: htmlContent,
        }),
      });

      if (resendRes.ok) {
        const data = await resendRes.json().catch(() => ({}));
        return res.status(200).json({ success: true, provider: "resend", data });
      }
    } catch (e) {
      console.warn("[api/email] Resend dispatch attempt failed:", e.message);
    }
  }

  // If no server keys are configured
  return res.status(200).json({
    success: false,
    message: "No server email provider configured or active. Configure BREVO_API_KEY or RESEND_API_KEY in Vercel.",
  });
}
