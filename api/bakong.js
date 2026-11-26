export const config = {
  regions: ["sin1"],
};

// Server-side environment configuration (Strict fail-closed security — set BAKONG_API_TOKEN in Vercel)
const BAKONG_API_TOKEN = (
  process.env.BAKONG_API_TOKEN ||
  process.env.VITE_BAKONG_API_TOKEN ||
  ""
).trim();
const BAKONG_API_URL = (
  process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh"
).replace(/\/$/, "");

// Strict CORS allowlist
const ALLOWED_ORIGINS = new Set([
  "https://youngsteav.site",
  "https://www.youngsteav.site",
  ...(process.env.NODE_ENV !== "production"
    ? [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
      ]
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

// In-memory sliding window rate limiter: 60 requests per minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60000;
const MAX_REQUESTS_PER_WINDOW = 60;

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || {
    count: 0,
    resetAt: now + RATE_LIMIT_WINDOW_MS,
  };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(ip, record);
    return false;
  }
  record.count += 1;
  rateLimitMap.set(ip, record);
  return record.count > MAX_REQUESTS_PER_WINDOW;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  } else if (!origin && process.env.NODE_ENV !== "production") {
    // Local dev or non-browser tooling
  }

  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Rate Limiting
  const clientIp =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";
  if (isRateLimited(clientIp)) {
    res.setHeader("Retry-After", "60");
    return res.status(429).json({
      responseCode: 1,
      responseMessage:
        "Rate limit exceeded. Please wait 60 seconds before retrying.",
    });
  }

  // Fail-closed enforcement: Server MUST have BAKONG_API_TOKEN configured
  if (!BAKONG_API_TOKEN) {
    console.error(
      "[CRITICAL] BAKONG_API_TOKEN environment variable is not configured on server.",
    );
    return res.status(500).json({
      responseCode: 1,
      responseMessage:
        "Bakong gateway is temporarily unavailable due to missing server configuration.",
    });
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const action =
      body.action || req.query?.action || "check_transaction_by_md5";
    const rawMd5 =
      body.md5 ||
      body.md5_hash ||
      body.hash ||
      req.query?.md5 ||
      req.query?.md5_hash;
    const cleanMd5 = typeof rawMd5 === "string" ? rawMd5.trim() : "";
    const qr = body.qr || req.query?.qr;

    let targetPath = "/v1/check_transaction_by_md5";
    let upstreamBody = { md5: cleanMd5 };

    if (action === "generate_deeplink_by_qr" && qr) {
      targetPath = "/v1/generate_deeplink_by_qr";
      upstreamBody = { qr: String(qr).trim() };
    } else {
      if (!cleanMd5 || !/^[a-fA-F0-9]{32}$/.test(cleanMd5)) {
        return res.status(400).json({
          responseCode: 1,
          responseMessage:
            "Invalid or missing 32-character hexadecimal MD5 transaction hash.",
          received: cleanMd5,
        });
      }
    }

    const upstreamRes = await fetch(`${BAKONG_API_URL}${targetPath}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${BAKONG_API_TOKEN}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "STEAV-HauteCouture/2.0 (Security-Hardened-Gateway)",
      },
      body: JSON.stringify(upstreamBody),
    });

    const text = await upstreamRes.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(upstreamRes.status || 502).json({
        responseCode: 1,
        responseMessage: "Upstream NBC Bakong returned non-JSON response",
        rawStatus: upstreamRes.status,
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({
      responseCode: 1,
      responseMessage: err?.message || "Internal Bakong proxy error",
    });
  }
}
