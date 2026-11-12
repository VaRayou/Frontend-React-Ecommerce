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

export default async function handler(req, res) {
  // Set permissive CORS headers so browser requests never fail preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
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
    } else if (!md5) {
      return res.status(400).json({
        responseCode: 1,
        responseMessage: "Missing md5 parameter",
      });
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

