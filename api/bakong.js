export const config = {
  regions: ["sin1"],
};

const BAKONG_FALLBACK_TOKEN_B64 =
  "ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5LmV5SmtZWFJoSWpwN0ltbGtJam9pWVRRMllqazNZVE16T1RZeU5EZzRaaUo5TENKcFlYUWlPakUzT1RReE16QTVPVEVzSW1WNGNDSTZNVGd3TVRrd05qazVNWDAuV2Nzd0Y0NnVmbTlkN1VxUHRONDhMY29LYzBBekNqYjByTE40WmlyMmxJdw==";

const BAKONG_API_TOKEN =
  process.env.VITE_BAKONG_API_TOKEN ||
  process.env.BAKONG_API_TOKEN ||
  (typeof Buffer !== "undefined"
    ? Buffer.from(BAKONG_FALLBACK_TOKEN_B64, "base64").toString("utf-8")
    : "");

const BAKONG_API_URL = (
  process.env.VITE_BAKONG_API_URL ||
  process.env.BAKONG_API_URL ||
  "https://api-bakong.nbc.gov.kh"
).replace(/\/$/, "");

function isAllowedOrigin(origin) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    const host = url.hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".vercel.app") ||
      host === "frontend-react-ecommerce-inky.vercel.app"
    ) {
      return true;
    }
  } catch {}
  return false;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin || "*");
  } else {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://frontend-react-ecommerce-inky.vercel.app"
    );
  }
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    const body =
      typeof req.body === "string"
        ? JSON.parse(req.body || "{}")
        : req.body || {};

    const action = body.action || req.query?.action || "check_transaction_by_md5";
    const rawMd5 = body.md5 || body.md5_hash || body.hash || req.query?.md5 || req.query?.md5_hash;
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
          responseMessage: "Invalid or missing 32-character MD5 transaction hash.",
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
        "User-Agent": "BakongKHQR/1.0 (Atelier-Paris-Ecommerce)",
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
      responseMessage: err?.message || "Internal proxy error",
    });
  }
}

