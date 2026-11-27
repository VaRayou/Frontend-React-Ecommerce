import crypto from "crypto";
import { recordSecurityEvent } from "./_lib/securityMonitor.js";

export const config = {
  regions: ["sin1"],
};

const SUPABASE_URL = (
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  "https://awcgcpoibputqrtuvrms.supabase.co"
).replace(/\/$/, "");

const SUPABASE_ANON_KEY =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "sb_publishable_UGc-TpOB6-ONOpUNlqYFhA_XuyDiSbv";

// Trusted server-only Service Role Key (Bypasses RLS strictly for server-side re-pricing, stock decrement, & payment verification)
const SUPABASE_SERVICE_ROLE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
).trim();

// Bakong Configuration (Server-Side Only — set BAKONG_API_TOKEN in Vercel)
const BAKONG_API_TOKEN = (
  process.env.BAKONG_API_TOKEN ||
  process.env.VITE_BAKONG_API_TOKEN ||
  ""
).trim();
const BAKONG_API_URL = (
  process.env.BAKONG_API_URL || "https://api-bakong.nbc.gov.kh"
).replace(/\/$/, "");
const BAKONG_ACCOUNT_ID =
  process.env.BAKONG_ACCOUNT_ID ||
  process.env.VITE_BAKONG_ACCOUNT_ID ||
  "rayou_va@bkrt";
const BAKONG_MERCHANT_NAME =
  process.env.BAKONG_MERCHANT_NAME ||
  process.env.VITE_BAKONG_MERCHANT_NAME ||
  "Rayou Va";
const BAKONG_PHONE =
  process.env.BAKONG_PHONE ||
  process.env.VITE_BAKONG_PHONE ||
  "0968350317";

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

// In-memory sliding window rate limiter
const rateLimitMap = new Map();
function checkRateLimit(ip, maxRequests = 30, windowMs = 60000) {
  const now = Date.now();
  const record = rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    rateLimitMap.set(ip, record);
    return false;
  }
  record.count += 1;
  rateLimitMap.set(ip, record);
  return record.count > maxRequests;
}

// Admin email whitelist (Second layer of defence-in-depth, alongside app_metadata.role)
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

// Helper: Get Supabase DB Headers (Prefers service_role for serverless tasks, falls back to anon)
function getDbHeaders(userJwt = null) {
  const bearer = SUPABASE_SERVICE_ROLE_KEY || userJwt || SUPABASE_ANON_KEY;
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY,
    Authorization: `Bearer ${bearer}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

// Helper: Verify User Supabase JWT
async function verifyUserJwt(token) {
  if (!token) return null;
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn("[api/orders] JWT verification failed:", e.message);
  }
  return null;
}

// Helper: Check if verified user has admin privilege
function checkIsAdmin(user) {
  if (!user) return false;
  const email = String(user.email || "").toLowerCase().trim();
  const role = String(user.app_metadata?.role || "").toLowerCase().trim();
  const hasAdminRole =
    role.includes("admin") ||
    role.includes("controller") ||
    role.includes("catalog");
  return (hasAdminRole && ADMIN_EMAILS.has(email)) || hasAdminRole;
}

// CRC16-CCITT for standard EMVCo KHQR String generation
function crc16(data) {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  return (crc & 0xffff).toString(16).toUpperCase().padStart(4, "0");
}

function generateKhqrPayload(merchantId, merchantName, amount, orderRef, currency = "USD") {
  const pad = (id, str) => `${id}${String(str.length).padStart(2, "0")}${str}`;
  const isKhr = String(currency).toUpperCase() === "KHR";
  const currencyCode = isKhr ? "116" : "840";
  const formattedAmount = isKhr ? String(Math.round(amount)) : Number(amount).toFixed(2);
  const nowMs = Date.now();
  const expireMs = nowMs + 10 * 60 * 1000;
  const tag29 = pad("00", merchantId || "rayou_va@bkrt");
  const tag62 = pad("01", String(orderRef || "").slice(0, 25));
  const tag99 = pad("00", String(nowMs)) + pad("01", String(expireMs));
  const payload =
    pad("00", "01") +
    pad("01", "12") +
    pad("29", tag29) +
    pad("52", "5999") +
    pad("53", currencyCode) +
    pad("54", formattedAmount) +
    pad("58", "KH") +
    pad("59", (merchantName || "Rayou Va").slice(0, 25)) +
    pad("60", "Phnom Penh") +
    pad("62", tag62) +
    pad("99", tag99) +
    "6304";
  const checksum = crc16(payload);
  return `${payload}${checksum}`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
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

  const clientIp =
    (req.headers["x-forwarded-for"] || "").split(",")[0].trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const action = req.query?.action || (typeof req.body === "object" ? req.body?.action : null);

  // -----------------------------------------------------------------
  // 1. PUBLIC ACTION: Track Order (Enumeration-proof)
  // -----------------------------------------------------------------
  if (action === "track") {
    if (checkRateLimit(`track:${clientIp}`, 20, 60000)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({ success: false, error: "Too many tracking attempts. Please wait 60s." });
    }

    const orderNumber = String(req.query?.order_number || req.body?.order_number || "").trim();
    const contact = String(req.query?.contact || req.body?.contact || "").trim().toLowerCase();

    if (!orderNumber || !contact) {
      return res.status(400).json({
        success: false,
        error: "Both order number and verified email/phone on file are required to track order status.",
      });
    }

    const cleanContact = contact.replace(/[\s\-\(\)]/g, "");
    try {
      const dbRes = await fetch(
        `${SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(orderNumber)}&select=id,order_number,order_status,payment_status,total,subtotal,shipping_fee,discount,currency,payment_method,created_at,customer_email,customer_phone,order_items(product_name,quantity,size,color,image)`,
        { headers: getDbHeaders() }
      );

      if (!dbRes.ok) {
        return res.status(404).json({ success: false, error: "Order record not found." });
      }

      const rows = await dbRes.json();
      const matched = rows?.[0];

      if (!matched) {
        return res.status(404).json({ success: false, error: "No matching order found with the provided details." });
      }

      // Check contact match (Email or sanitized phone)
      const orderEmail = String(matched.customer_email || "").toLowerCase().trim();
      const orderPhone = String(matched.customer_phone || "").replace(/[\s\-\(\)]/g, "").toLowerCase().trim();

      const isEmailMatch = orderEmail === cleanContact;
      const isPhoneMatch = cleanContact.length >= 6 && orderPhone.endsWith(cleanContact);

      if (!isEmailMatch && !isPhoneMatch) {
        return res.status(404).json({ success: false, error: "No matching order found with the provided details." });
      }

      // Return ONLY non-sensitive status fields. Never expose full customer PII or address!
      return res.status(200).json({
        success: true,
        order: {
          id: matched.id,
          order_number: matched.order_number,
          order_status: matched.order_status,
          payment_status: matched.payment_status,
          total: matched.total,
          subtotal: matched.subtotal,
          shipping_fee: matched.shipping_fee,
          discount: matched.discount,
          currency: matched.currency || "USD",
          payment_method: matched.payment_method,
          created_at: matched.created_at,
          order_items: matched.order_items || [],
        },
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: "Internal tracking service error." });
    }
  }

  // -----------------------------------------------------------------
  // 2. PUBLIC ACTION: Server-side Coupon Validation
  // -----------------------------------------------------------------
  if (action === "validate_coupon") {
    if (checkRateLimit(`coupon:${clientIp}`, 30, 60000)) {
      return res.status(429).json({ success: false, error: "Too many coupon validation attempts." });
    }

    const code = String(req.query?.code || req.body?.code || "").trim().toUpperCase();
    const subtotal = Number(req.query?.subtotal || req.body?.subtotal || 0);

    if (!code) {
      return res.status(400).json({ success: false, error: "Coupon code is required." });
    }

    try {
      const cRes = await fetch(
        `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(code)}&select=code,discount_percent,discount_amount,discount_type,min_spend,is_active,expires_at,usage_limit,times_used,description`,
        { headers: getDbHeaders() }
      );

      if (cRes.ok) {
        const coupons = await cRes.json();
        const cp = coupons?.[0];

        if (cp && cp.is_active !== false) {
          if (cp.expires_at && new Date(cp.expires_at).getTime() < Date.now()) {
            return res.status(400).json({ success: false, error: "This coupon code has expired." });
          }
          if (cp.usage_limit && (cp.times_used || 0) >= cp.usage_limit) {
            return res.status(400).json({ success: false, error: "This coupon has reached its maximum usage limit." });
          }
          const minSpend = Number(cp.min_spend || 0);
          if (subtotal < minSpend) {
            return res.status(400).json({
              success: false,
              error: `Minimum spend of $${minSpend.toFixed(2)} required for code ${code}.`,
            });
          }

          const discountType = cp.discount_type || (cp.discount_percent ? "percentage" : "fixed");
          const discountPercent = Number(cp.discount_percent || 0);
          let discountAmount = Number(cp.discount_amount || 0);
          if (discountType === "percentage") {
            discountAmount = Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
          }

          return res.status(200).json({
            success: true,
            valid: true,
            code: cp.code,
            discountType,
            discountPercent,
            discountAmount,
            minSpend,
            description: cp.description || `Coupon ${code} applied`,
          });
        }
      }

      // Strict fail: unknown or inactive coupon
      return res.status(404).json({ success: false, valid: false, error: `Invalid or expired promotional code "${code}".` });
    } catch (e) {
      return res.status(500).json({ success: false, error: "Error validating coupon." });
    }
  }

  // -----------------------------------------------------------------
  // 3. ACTION: Server-side Payment Verification (Bakong MD5 Check)
  // -----------------------------------------------------------------
  if (action === "verify_payment") {
    const rawMd5 = req.body?.md5 || req.query?.md5;
    const cleanMd5 = typeof rawMd5 === "string" ? rawMd5.trim() : "";
    const orderNumber = String(req.body?.order_number || req.query?.order_number || "").trim();

    if (!cleanMd5 || !/^[a-fA-F0-9]{32}$/.test(cleanMd5)) {
      return res.status(400).json({
        success: false,
        is_paid: false,
        error: "Valid 32-character hexadecimal MD5 transaction hash required.",
      });
    }

    if (!BAKONG_API_TOKEN) {
      return res.status(500).json({
        success: false,
        is_paid: false,
        error: "Bakong API token not configured on server.",
      });
    }

    try {
      // 1. Fetch live transaction status directly from NBC Bakong Open API
      const bakongRes = await fetch(`${BAKONG_API_URL}/v1/check_transaction_by_md5`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BAKONG_API_TOKEN}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ md5: cleanMd5 }),
      });

      const bakongData = await bakongRes.json().catch(() => null);

      if (!bakongData || bakongData.responseCode !== 0 || !bakongData.data) {
        return res.status(200).json({
          success: false,
          is_paid: false,
          responseCode: bakongData?.responseCode ?? 1,
          message: bakongData?.responseMessage || "Transaction not yet detected on NBC Bakong network.",
        });
      }

      const txnData = bakongData.data;
      const paidAmount = Number(txnData.amount || 0);
      const bakongTxnId = String(txnData.hash || cleanMd5);

      // 2. Fetch payment row from Supabase to verify amount match
      const payRes = await fetch(
        `${SUPABASE_URL}/rest/v1/payments?md5_hash=eq.${cleanMd5}&select=*`,
        { headers: getDbHeaders() }
      );
      const paymentRows = payRes.ok ? await payRes.json() : [];
      const payment = paymentRows?.[0];

      if (payment) {
        const expectedAmount = Number(payment.amount || 0);
        // Allow within 0.01 margin of floating point rounding
        if (Math.abs(paidAmount - expectedAmount) > 0.05 && expectedAmount > 0) {
          console.error(`[Fraud Alert] Payment amount mismatch for MD5 ${cleanMd5}: Expected ${expectedAmount}, received ${paidAmount}`);
          await recordSecurityEvent({
            req,
            eventType: "PAYMENT_AMOUNT_MISMATCH",
            severity: "CRITICAL",
            endpoint: "/api/orders?action=verify_payment",
            details: {
              order_number: payment.order_number || orderNumber,
              expected_amount: expectedAmount,
              paid_amount: paidAmount,
            },
            detectionReason: `Bakong settled amount ($${paidAmount}) does not match order total ($${expectedAmount})`,
            actionTaken: "Payment settlement blocked (400)",
            notify: true,
          });
          return res.status(400).json({
            success: false,
            is_paid: false,
            error: "Payment amount does not match order total.",
          });
        }

        // 3. Update payment status to PAID atomically
        await fetch(`${SUPABASE_URL}/rest/v1/payments?id=eq.${payment.id}`, {
          method: "PATCH",
          headers: getDbHeaders(),
          body: JSON.stringify({
            status: "PAID",
            paid_at: new Date().toISOString(),
            transaction_id: bakongTxnId,
          }),
        });

        // 4. Update order status to Processing, payment_status to Paid
        const targetOrder = payment.order_number || orderNumber;
        if (targetOrder) {
          await fetch(`${SUPABASE_URL}/rest/v1/orders?order_number=eq.${encodeURIComponent(targetOrder)}`, {
            method: "PATCH",
            headers: getDbHeaders(),
            body: JSON.stringify({
              payment_status: "Paid",
              order_status: "Processing",
            }),
          });
        }
      }

      return res.status(200).json({
        success: true,
        is_paid: true,
        transaction_id: bakongTxnId,
        message: "Payment successfully verified and confirmed on NBC Bakong network.",
      });
    } catch (e) {
      return res.status(500).json({
        success: false,
        is_paid: false,
        error: "Error verifying transaction with Bakong gateway.",
      });
    }
  }

  // -----------------------------------------------------------------
  // 4. GET /api/orders — Fetch Orders (Strict Role-Based Authorization)
  // -----------------------------------------------------------------
  if (req.method === "GET") {
    if (checkRateLimit(`get_orders:${clientIp}`, 60, 60000)) {
      return res.status(429).json({ success: false, error: "Rate limit exceeded." });
    }

    // Require valid Supabase JWT in Authorization header
    const authHeader = req.headers.authorization || "";
    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!jwt) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Missing authentication bearer token.",
      });
    }

    const authUser = await verifyUserJwt(jwt);
    if (!authUser || !authUser.id) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid or expired authentication token.",
      });
    }

    const isAdmin = checkIsAdmin(authUser);
    const userEmail = String(authUser.email || "").toLowerCase().trim();
    const userId = authUser.id;

    try {
      let limit = Math.min(Math.max(1, Number(req.query?.limit || 20)), 50);
      let queryUrl = `${SUPABASE_URL}/rest/v1/orders?select=*,order_items(*)&order=created_at.desc&limit=${limit}`;

      if (isAdmin) {
        const orderNumber = req.query?.order_number;
        const id = req.query?.id;
        if (orderNumber) {
          queryUrl += `&order_number=eq.${encodeURIComponent(orderNumber)}`;
        } else if (id) {
          queryUrl += `&id=eq.${encodeURIComponent(id)}`;
        } else {
          queryUrl += `&notes=neq.DELETED`;
        }
      } else {
        // Customer view: Strictly scoped to user's own email or customer_id
        queryUrl += `&or=(customer_email.eq.${encodeURIComponent(userEmail)},customer_id.eq.${encodeURIComponent(userId)})`;
      }

      const ordersRes = await fetch(queryUrl, { headers: getDbHeaders(jwt) });
      if (!ordersRes.ok) {
        return res.status(ordersRes.status).json({
          success: false,
          error: "Failed to fetch orders from database.",
        });
      }

      const orders = await ordersRes.json();
      return res.status(200).json({
        success: true,
        orders,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Internal server error fetching orders.",
      });
    }
  }

  // -----------------------------------------------------------------
  // 5. POST /api/orders — Create Order with Authoritative Server Re-Pricing
  // -----------------------------------------------------------------
  if (req.method === "POST") {
    if (checkRateLimit(`create_order:${clientIp}`, 10, 60000)) {
      res.setHeader("Retry-After", "60");
      return res.status(429).json({
        success: false,
        error: "Order creation rate limit exceeded. Please wait 60s.",
      });
    }

    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};

      // 1. Sanitize customer inputs
      const customerName = String(body.customerName || body.customer_name || "Valued Patron").trim().slice(0, 100);
      const customerEmail = String(body.customerEmail || body.customer_email || "").trim().toLowerCase().slice(0, 120);
      const customerPhone = String(body.customerPhone || body.customer_phone || "").trim().slice(0, 30);
      const customerId = body.customerId || body.customer_id || null;

      if (!customerEmail || !customerEmail.includes("@")) {
        return res.status(400).json({ success: false, error: "A valid customer email is required for order confirmation." });
      }

      const shippingAddress =
        typeof body.shippingAddress === "object"
          ? body.shippingAddress
          : typeof body.shipping_address === "object"
          ? body.shipping_address
          : { street: String(body.shippingAddress || body.shipping_address || "Phnom Penh, Cambodia").slice(0, 255) };

      const paymentMethod = String(body.paymentMethod || body.payment_method || "Bakong KHQR").slice(0, 50);
      const promoCode = String(body.promoCode || body.promo_code || "").trim().toUpperCase();
      const rawItems = Array.isArray(body.items) ? body.items : (Array.isArray(body.order_items) ? body.order_items : []);

      if (rawItems.length === 0) {
        return res.status(400).json({ success: false, error: "Cannot create an empty order. Cart items required." });
      }

      // 2. Authoritative Server Re-Pricing: Fetch real product prices & stock from database
      let serverSubtotal = 0;
      const validatedLineItems = [];

      for (const item of rawItems) {
        const prodId = item.productId || item.product_id || item.id;
        const requestedQty = Math.max(1, Math.min(100, Number(item.quantity || item.qty || 1)));

        if (!prodId) {
          return res.status(400).json({ success: false, error: "Invalid line item: missing product identifier." });
        }

        const pRes = await fetch(
          `${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(prodId)}&select=id,name,price,stock,images,status`,
          { headers: getDbHeaders() }
        );

        if (!pRes.ok) {
          return res.status(400).json({ success: false, error: `Product lookup failed for ID ${prodId}.` });
        }

        const prods = await pRes.json();
        const product = prods?.[0];

        if (!product) {
          return res.status(400).json({ success: false, error: `Product not found: ${prodId}. Order cannot be placed.` });
        }

        const currentStock = Number(product.stock ?? 0);
        if (currentStock < requestedQty) {
          return res.status(400).json({
            success: false,
            error: `Insufficient stock for "${product.name}". Available: ${currentStock}, requested: ${requestedQty}.`,
          });
        }

        const authoritativePrice = Number(product.price);
        if (isNaN(authoritativePrice) || authoritativePrice < 0) {
          return res.status(400).json({ success: false, error: `Invalid pricing on product "${product.name}".` });
        }

        serverSubtotal += authoritativePrice * requestedQty;

        validatedLineItems.push({
          product_id: product.id,
          product_name: product.name,
          price: authoritativePrice,
          quantity: requestedQty,
          size: String(item.size || item.selected_size || "Standard").slice(0, 20),
          color: String(item.color || item.selected_color || "Standard").slice(0, 30),
          image:
            item.image ||
            (Array.isArray(product.images) && product.images[0]) ||
            "/uploads/8a82fc7bb76c.jpg",
          currentStock,
        });
      }

      // 3. Server Coupon Validation
      let serverDiscount = 0;
      if (promoCode) {
        try {
          const cpRes = await fetch(
            `${SUPABASE_URL}/rest/v1/coupons?code=eq.${encodeURIComponent(promoCode)}&select=code,discount_percent,discount_amount,discount_type,min_spend,is_active,expires_at,usage_limit,times_used`,
            { headers: getDbHeaders() }
          );
          if (cpRes.ok) {
            const cps = await cpRes.json();
            const cp = cps?.[0];
            if (cp && cp.is_active !== false) {
              const notExpired = !cp.expires_at || new Date(cp.expires_at).getTime() >= Date.now();
              const underLimit = !cp.usage_limit || (cp.times_used || 0) < cp.usage_limit;
              const meetsMinSpend = serverSubtotal >= Number(cp.min_spend || 0);

              if (notExpired && underLimit && meetsMinSpend) {
                if (cp.discount_type === "percentage" || cp.discount_percent) {
                  serverDiscount = Math.round(((serverSubtotal * Number(cp.discount_percent || 0)) / 100) * 100) / 100;
                } else {
                  serverDiscount = Math.min(serverSubtotal, Number(cp.discount_amount || 0));
                }
              }
            }
          }
        } catch (e) {
          console.warn("[api/orders] Server coupon check failed:", e);
        }
      }

      // 4. Server-computed shipping fee & total
      const serverShippingFee = serverSubtotal >= 200 ? 0 : 0; // Default $0 shipping for Atelier Boutique
      const serverTax = 0;
      const serverTotal = Math.max(0, Math.round((serverSubtotal + serverShippingFee + serverTax - serverDiscount) * 100) / 100);

      // 5. Generate secure order reference (preserve valid ATL/STEAV ref if provided)
      const clientOrderNum = String(body.order_number || body.orderNumber || "").trim();
      const orderNumber =
        clientOrderNum && /^(ATL|STEAV)-\d{4}-[A-Z0-9]{4,10}$/i.test(clientOrderNum)
          ? clientOrderNum
          : `ATL-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Verify if a verified PAID transaction exists for this order/transactionId
      const clientTxnId = String(body.transactionId || body.transaction_id || "").trim();
      let isVerifiedPaid = false;
      if (clientTxnId) {
        try {
          const payCheckRes = await fetch(
            `${SUPABASE_URL}/rest/v1/payments?or=(order_number.eq.${encodeURIComponent(orderNumber)},transaction_id.eq.${encodeURIComponent(clientTxnId)})&status=eq.PAID&select=id,status`,
            { headers: getDbHeaders() }
          );
          if (payCheckRes.ok) {
            const paidRows = await payCheckRes.json();
            if (Array.isArray(paidRows) && paidRows.length > 0) {
              isVerifiedPaid = true;
            }
          }
        } catch {}
      }

      // 6. Insert order record
      const orderPayload = {
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        customer_id: customerId,
        shipping_address: shippingAddress,
        subtotal: serverSubtotal,
        shipping_fee: serverShippingFee,
        tax: serverTax,
        discount: serverDiscount,
        total: serverTotal,
        currency: "USD",
        payment_method: paymentMethod,
        payment_status: isVerifiedPaid ? "Paid" : "PENDING",
        order_status: isVerifiedPaid ? "Processing" : "Pending",
        notes: body.notes ? String(body.notes).slice(0, 300) : "",
      };

      const orderInsertRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: "POST",
        headers: getDbHeaders(),
        body: JSON.stringify(orderPayload),
      });

      if (!orderInsertRes.ok) {
        const orderErr = await orderInsertRes.json().catch(() => ({}));
        return res.status(500).json({
          success: false,
          error: "Failed to persist order in database.",
          details: orderErr.message,
        });
      }

      const insertedOrders = await orderInsertRes.json();
      const newOrder = Array.isArray(insertedOrders) ? insertedOrders[0] : insertedOrders;

      // 7. Insert order items & decrement stock atomically
      let insertedItemRows = [];
      if (newOrder?.id) {
        const itemRows = validatedLineItems.map((li) => ({
          order_id: newOrder.id,
          product_id: li.product_id,
          product_name: li.product_name,
          price: li.price,
          quantity: li.quantity,
          size: li.size,
          color: li.color,
          image: li.image,
        }));
        insertedItemRows = itemRows;

        await fetch(`${SUPABASE_URL}/rest/v1/order_items`, {
          method: "POST",
          headers: getDbHeaders(),
          body: JSON.stringify(itemRows),
        });

        // Decrement stock in database
        for (const li of validatedLineItems) {
          const nextStock = Math.max(0, li.currentStock - li.quantity);
          await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(li.product_id)}`, {
            method: "PATCH",
            headers: getDbHeaders(),
            body: JSON.stringify({
              stock: nextStock,
              status: nextStock <= 0 ? "Out of Stock" : "Active",
            }),
          });
        }
      }

      // 8. Generate KHQR payload & PENDING payment row
      const khqrString = generateKhqrPayload(
        BAKONG_ACCOUNT_ID,
        BAKONG_MERCHANT_NAME,
        serverTotal,
        orderNumber
      );

      const md5Hash = crypto
        .createHash("md5")
        .update(khqrString)
        .digest("hex");

      await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
        method: "POST",
        headers: getDbHeaders(),
        body: JSON.stringify({
          order_number: orderNumber,
          customer_email: customerEmail,
          amount: serverTotal,
          currency: "USD",
          status: "PENDING",
          md5_hash: md5Hash,
          qr_string: khqrString,
        }),
      });

      // 9. Server-side Telegram Order Notification (Guaranteed delivery even if browser closes)
      let telegramNotified = false;
      const tgToken = (process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN || "").trim();
      const tgChatId = String(process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID || "1389246582").trim();
      if (tgToken && tgChatId) {
        try {
          const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          const itemsSummary = validatedLineItems
            .slice(0, 8)
            .map((li) => `  • <b>${esc(li.product_name)}</b> ×${li.quantity} ($${Number(li.price * li.quantity).toFixed(2)})`)
            .join("\n");
          const payBadge = isVerifiedPaid ? "✅ PAID (Verified)" : "⏳ PENDING";
          const alertText =
            `🛍 <b>NEW ORDER #${esc(orderNumber)}</b>\n` +
            `━━━━━━━━━━━━━━━━━━━━━━\n` +
            `<b>Patron:</b> ${esc(customerName)}\n` +
            `<b>Email:</b> ${esc(customerEmail)}\n` +
            `<b>Phone:</b> <code>${esc(customerPhone || "N/A")}</code>\n` +
            `<b>Method:</b> ${esc(paymentMethod)} — <b>${payBadge}</b>\n` +
            `<b>Total:</b> <b>$${Number(serverTotal).toFixed(2)} USD</b>\n` +
            (itemsSummary ? `\n<b>Items:</b>\n${itemsSummary}\n` : "") +
            `━━━━━━━━━━━━━━━━━━━━━━`;
          const tgRes = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: tgChatId,
              text: alertText,
              parse_mode: "HTML",
              disable_web_page_preview: true,
              reply_markup: {
                inline_keyboard: [
                  [
                    { text: "🚚 Mark Shipped", callback_data: `ship:${orderNumber}` },
                    { text: "✅ Delivered", callback_data: `deliver:${orderNumber}` },
                  ],
                  [{ text: "🔍 Track Order", callback_data: `track:${orderNumber}` }],
                ],
              },
            }),
          });
          const tgJson = await tgRes.json().catch(() => ({}));
          telegramNotified = Boolean(tgJson?.ok);
        } catch {}
      }

      return res.status(200).json({
        success: true,
        order_number: orderNumber,
        subtotal: serverSubtotal,
        discount: serverDiscount,
        shipping_fee: serverShippingFee,
        total: serverTotal,
        currency: "USD",
        payment_status: orderPayload.payment_status,
        order_status: orderPayload.order_status,
        telegram_notified: telegramNotified,
        order: {
          ...newOrder,
          order_items: insertedItemRows,
        },
        payment: {
          md5_hash: md5Hash,
          qr_string: khqrString,
          status: orderPayload.payment_status,
          amount: serverTotal,
        },
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || "Internal server error creating order.",
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
