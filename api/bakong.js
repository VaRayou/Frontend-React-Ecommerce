export const config = {
  regions: ["sin1"],
};

const BAKONG_API_TOKEN =
  process.env.VITE_BAKONG_API_TOKEN ||
  process.env.BAKONG_API_TOKEN ||
  "";

const BAKONG_API_URL = (
  process.env.VITE_BAKONG_API_URL ||
  process.env.BAKONG_API_URL ||
  "https://api-bakong.nbc.gov.kh"
).replace(/\/$/, "");

const ALLOWED_CORS_ORIGINS = new Set([
  "https://frontend-react-ecommerce-inky.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
]);

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_CORS_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    res.setHeader(
      "Access-Control-Allow-Origin",
      "https://frontend-react-ecommerce-inky.vercel.app"
    );
  }
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
    const md5 = body.md5 || req.query?.md5;
    const qr = body.qr;

    let targetPath = "/v1/check_transaction_by_md5";
    let upstreamBody = { md5 };

    if (action === "generate_deeplink_by_qr" && qr) {
      targetPath = "/v1/generate_deeplink_by_qr";
      upstreamBody = { qr };
    } else {
      if (!md5 || typeof md5 !== "string" || !/^[a-fA-F0-9]{32}$/.test(md5.trim())) {
        return res.status(400).json({
          responseCode: 1,
          responseMessage: "Invalid or missing 32-character MD5 transaction hash.",
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

