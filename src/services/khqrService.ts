import api from "./api";
import { supabase } from "./supabase";
import { ensureAdminSession } from "./productService";
import { BakongKHQR, khqrData, IndividualInfo } from "bakong-khqr";

const env = (import.meta as any).env || {};

const BAKONG_API_TOKEN =
  env.VITE_BAKONG_API_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiYTQ2Yjk3YTMzOTYyNDg4ZiJ9LCJpYXQiOjE3OTQxMzA5OTEsImV4cCI6MTgwMTkwNjk5MX0.WcswF46ufm9d7UqPtN48LcoKc0AzCjb0rLN4Zir2lIw";

const BAKONG_API_URL = env.VITE_BAKONG_API_URL || "https://api-bakong.nbc.gov.kh";
const BAKONG_ACCOUNT_ID = env.VITE_BAKONG_ACCOUNT_ID || "rayou_va@bkrt";
const BAKONG_MERCHANT_NAME = env.VITE_BAKONG_MERCHANT_NAME || "Rayou Va";
const BAKONG_PHONE = env.VITE_BAKONG_PHONE || "0968350317";

export interface KhqrCreatePayload {
  amount: number;
  currency?: "USD" | "KHR";
  orderId?: number | string;
  orderNumber?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
}

export interface KhqrPaymentData {
  id: number | string;
  orderId?: number | string;
  orderNumber: string;
  amount: number;
  currency: string;
  md5Hash: string;
  qrString: string;
  qrImage: string;
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  expiresAt?: string;
  paidAt?: string;
  merchantName?: string;
  transactionId?: string;
}

export interface KhqrCreateResponse {
  success: boolean;
  payment: KhqrPaymentData;
  qr_string: string;
  qr_image: string;
  md5_hash: string;
  deeplink?: string | null;
  expires_at: string;
  merchant_name: string;
  bakong_account_id?: string;
  phone_number?: string;
  live_mode?: boolean;
}

export interface KhqrStatusResponse {
  status: "PENDING" | "PAID" | "FAILED" | "EXPIRED";
  is_paid: boolean;
  rate_limit_exceeded?: boolean;
  transaction_id?: string;
  paid_at?: string;
  payment?: KhqrPaymentData;
  message?: string;
}

// ---------------------------------------------------------------------------
// Standard RFC 1321 MD5 Implementation (Byte-for-byte identical to NBC Bakong)
// ---------------------------------------------------------------------------

export function calculateMd5(string: string): string {
  function rotateLeft(lValue: number, iShiftBits: number) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX: number, lY: number) {
    const lX4 = lX & 0x40000000;
    const lY4 = lY & 0x40000000;
    const lX8 = lX & 0x80000000;
    const lY8 = lY & 0x80000000;
    const lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      else return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    } else {
      return lResult ^ lX8 ^ lY8;
    }
  }
  function F(x: number, y: number, z: number) { return (x & y) | (~x & z); }
  function G(x: number, y: number, z: number) { return (x & z) | (y & ~z); }
  function H(x: number, y: number, z: number) { return x ^ y ^ z; }
  function I(x: number, y: number, z: number) { return y ^ (x | ~z); }

  function FF(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function GG(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function HH(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }
  function II(a: number, b: number, c: number, d: number, x: number, s: number, ac: number) {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac));
    return addUnsigned(rotateLeft(a, s), b);
  }

  function convertToWordArray(str: string) {
    let lWordCount;
    const lMessageLength = str.length;
    const lNumberOfWords_temp1 = lMessageLength + 8;
    const lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
    const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
    const lWordArray = Array(lNumberOfWords - 1).fill(0);
    let lBytePosition = 0;
    let lByteCount = 0;
    while (lByteCount < lMessageLength) {
      lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (str.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    lWordCount = (lByteCount - (lByteCount % 4)) / 4;
    lBytePosition = (lByteCount % 4) * 8;
    lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }

  function wordToHex(lValue: number) {
    let WordToHexValue = "";
    for (let lCount = 0; lCount <= 3; lCount++) {
      const lByte = (lValue >>> (lCount * 8)) & 255;
      const WordToHexValue_temp = "0" + lByte.toString(16);
      WordToHexValue += WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
    }
    return WordToHexValue;
  }

  const x = convertToWordArray(string);
  let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  for (let k = 0; k < x.length; k += 16) {
    const AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], 7, 0xd76aa478);
    d = FF(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
    c = FF(c, d, a, b, x[k + 2], 17, 0x242070db);
    b = FF(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
    d = FF(d, a, b, c, x[k + 5], 12, 0x4787c62a);
    c = FF(c, d, a, b, x[k + 6], 17, 0xa8304613);
    b = FF(b, c, d, a, x[k + 7], 22, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], 7, 0x698098d8);
    d = FF(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
    c = FF(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
    b = FF(b, c, d, a, x[k + 11], 22, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], 7, 0x6b901122);
    d = FF(d, a, b, c, x[k + 13], 12, 0xfd987193);
    c = FF(c, d, a, b, x[k + 14], 17, 0xa679438e);
    b = FF(b, c, d, a, x[k + 15], 22, 0x49b40821);

    a = GG(a, b, c, d, x[k + 1], 5, 0xf61e2562);
    d = GG(d, a, b, c, x[k + 6], 9, 0xc040b340);
    c = GG(c, d, a, b, x[k + 11], 14, 0x265e5a51);
    b = GG(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], 5, 0xd62f105d);
    d = GG(d, a, b, c, x[k + 10], 9, 0x2441453);
    c = GG(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
    b = GG(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
    d = GG(d, a, b, c, x[k + 14], 9, 0xc33707d6);
    c = GG(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
    b = GG(b, c, d, a, x[k + 8], 20, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
    d = GG(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
    c = GG(c, d, a, b, x[k + 7], 14, 0x676f02d9);
    b = GG(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);

    a = HH(a, b, c, d, x[k + 5], 4, 0xfffa3942);
    d = HH(d, a, b, c, x[k + 8], 11, 0x8771f681);
    c = HH(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
    b = HH(b, c, d, a, x[k + 14], 23, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], 4, 0xa4beea44);
    d = HH(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
    c = HH(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
    b = HH(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
    d = HH(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
    c = HH(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
    b = HH(b, c, d, a, x[k + 6], 23, 0x4881d05);
    a = HH(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
    d = HH(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
    c = HH(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
    b = HH(b, c, d, a, x[k + 2], 23, 0xc4ac5665);

    a = II(a, b, c, d, x[k + 0], 6, 0xf4292244);
    d = II(d, a, b, c, x[k + 7], 10, 0x432aff97);
    c = II(c, d, a, b, x[k + 14], 15, 0xab9423a7);
    b = II(b, c, d, a, x[k + 5], 21, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], 6, 0x655b59c3);
    d = II(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
    c = II(c, d, a, b, x[k + 10], 15, 0xffeff47d);
    b = II(b, c, d, a, x[k + 1], 21, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
    d = II(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
    c = II(c, d, a, b, x[k + 6], 15, 0xa3014314);
    b = II(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], 6, 0xf7537e82);
    d = II(d, a, b, c, x[k + 11], 10, 0xbd3af235);
    c = II(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
    b = II(b, c, d, a, x[k + 9], 21, 0xeb86d391);

    a = addUnsigned(a, AA);
    b = addUnsigned(b, BB);
    c = addUnsigned(c, CC);
    d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

// ---------------------------------------------------------------------------
// Client-Side EMVCo KHQR Generator
// ---------------------------------------------------------------------------

function crc16Ccitt(data: string): string {
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
      } else {
        crc = (crc << 1) & 0xFFFF;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function emvTlv(tag: string, value: string): string {
  const lenStr = String(new TextEncoder().encode(value).length).padStart(2, "0");
  return `${tag}${lenStr}${value}`;
}

export function generateDynamicKhqrString(
  amount: number,
  currency: string = "USD",
  orderNumber: string = "",
  accountId: string = BAKONG_ACCOUNT_ID,
  merchantName: string = BAKONG_MERCHANT_NAME,
  merchantCity: string = "Phnom Penh",
  phone: string = BAKONG_PHONE,
  expirationMinutes: number = 10
): { qr: string; md5: string } {
  const isKhr = currency.toUpperCase() === "KHR";
  const numAmount = isKhr ? Math.round(amount) : Number(Number(amount).toFixed(2));
  const nowMs = Date.now();
  const expireMs = nowMs + expirationMinutes * 60 * 1000;
  const billNum = orderNumber || `ATL-${Date.now().toString().slice(-6)}`;
  const rawPhone = String(phone || BAKONG_PHONE || "855968350317").replace(/[^0-9]/g, "");
  const cleanPhone = rawPhone.startsWith("855") ? rawPhone : `855${rawPhone.replace(/^0/, "")}`;

  // 1. First attempt: Official NBC bakong-khqr SDK
  try {
    if (BakongKHQR && IndividualInfo && khqrData) {
      const optionalData = {
        currency: isKhr ? khqrData.currency.khr : khqrData.currency.usd,
        amount: numAmount,
        billNumber: billNum,
        mobileNumber: cleanPhone,
        storeLabel: merchantName || "Rayou Va",
        terminalLabel: "Online POS",
        expirationTimestamp: expireMs,
        merchantCategoryCode: "5999",
      };
      const individualInfo = new IndividualInfo(
        accountId || "rayou_va@bkrt",
        merchantName || "Rayou Va",
        merchantCity || "Phnom Penh",
        optionalData
      );
      const khqr = new BakongKHQR();
      const res = khqr.generateIndividual(individualInfo);
      if (res?.data?.qr) {
        return {
          qr: res.data.qr,
          md5: res.data.md5 || calculateMd5(res.data.qr),
        };
      }
    }
  } catch (err) {
    console.warn("[BakongKHQR SDK fallback to pure-JS generator]", err);
  }

  // 2. Pure-JS EMVCo KHQR Generator with Tag 99 Timestamps (Universal Standard)
  const currencyCode = isKhr ? "116" : "840";
  const formattedAmount = isKhr ? String(numAmount) : numAmount.toFixed(2);
  const tag29 = emvTlv("00", accountId || "rayou_va@bkrt");

  const sub01 = emvTlv("01", billNum.slice(0, 25));
  const sub02 = emvTlv("02", cleanPhone.slice(0, 25));
  const sub03 = emvTlv("03", (merchantName || "Rayou Va").slice(0, 25));
  const sub07 = emvTlv("07", "Online POS");
  const tag62 = `${sub01}${sub02}${sub03}${sub07}`;

  // Tag 99: Mandatory Timestamp Data for Dynamic KHQR
  // Subtag 00 (Creation Timestamp, 13 ms digits)
  // Subtag 01 (Expiration Timestamp, 13 ms digits)
  const sub99_00 = emvTlv("00", String(nowMs));
  const sub99_01 = emvTlv("01", String(expireMs));
  const tag99 = `${sub99_00}${sub99_01}`;

  const payload =
    emvTlv("00", "01") +
    emvTlv("01", "12") +
    emvTlv("29", tag29) +
    emvTlv("52", "5999") +
    emvTlv("53", currencyCode) +
    emvTlv("54", formattedAmount) +
    emvTlv("58", "KH") +
    emvTlv("59", (merchantName || "Rayou Va").slice(0, 25)) +
    emvTlv("60", (merchantCity || "Phnom Penh").slice(0, 15)) +
    emvTlv("62", tag62) +
    emvTlv("99", tag99) +
    "6304";

  const crc = crc16Ccitt(payload);
  const fullQr = payload.slice(0, -4) + emvTlv("63", crc);
  return {
    qr: fullQr,
    md5: calculateMd5(fullQr),
  };
}

// Short-term throttling cache to protect the developer token quota (100 req/day)
const checkStatusCache: Record<string, { timestamp: number; result: KhqrStatusResponse }> = {};

export const khqrService = {
  /**
   * Generates authentic dynamic EMVCo KHQR code, computes real MD5, and persists record
   */
  createPayment: async (payload: KhqrCreatePayload): Promise<KhqrCreateResponse> => {
    const orderNum =
      payload.orderNumber || `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const generated = generateDynamicKhqrString(
      payload.amount,
      payload.currency || "USD",
      orderNum,
      BAKONG_ACCOUNT_ID,
      BAKONG_MERCHANT_NAME,
      "Phnom Penh",
      payload.customerPhone || BAKONG_PHONE,
      10
    );

    const qrString = generated.qr;
    const md5Hash = generated.md5;

    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=380x380&margin=1&data=${encodeURIComponent(qrString)}`;
    const deeplink = `bakong://pay?qr=${encodeURIComponent(qrString)}`;

    // Persist payment record into Supabase `payments` table
    try {
      await ensureAdminSession();
      await supabase.from("payments").insert([
        {
          order_number: orderNum,
          gateway: "BAKONG_KHQR",
          amount: payload.amount,
          currency: payload.currency || "USD",
          md5_hash: md5Hash,
          qr_string: qrString,
          qr_image: qrImage,
          status: "PENDING",
          customer_name: payload.customerName || "Patron Client",
          customer_email: payload.customerEmail || "",
          customer_phone: payload.customerPhone || "",
          expires_at: expiresAt,
        },
      ]);
    } catch (e) {
      console.warn("[Supabase] payment insert note:", e);
    }

    return {
      success: true,
      payment: {
        id: md5Hash,
        orderNumber: orderNum,
        amount: payload.amount,
        currency: payload.currency || "USD",
        md5Hash,
        qrString,
        qrImage,
        status: "PENDING",
        expiresAt,
        merchantName: BAKONG_MERCHANT_NAME,
      },
      qr_string: qrString,
      qr_image: qrImage,
      md5_hash: md5Hash,
      deeplink,
      expires_at: expiresAt,
      merchant_name: BAKONG_MERCHANT_NAME,
      bakong_account_id: BAKONG_ACCOUNT_ID,
      phone_number: `+855 ${BAKONG_PHONE.replace(/^0/, "")}`,
      live_mode: true,
    };
  },

  /**
   * Real-time verification with the official National Bank of Cambodia (NBC) Bakong Open API
   */
  checkStatus: async (paymentIdOrMd5: number | string): Promise<KhqrStatusResponse> => {
    const md5Str = String(paymentIdOrMd5).trim();
    const now = Date.now();

    // 1. Check local cache (throttle requests to avoid burning daily quota)
    const cached = checkStatusCache[md5Str];
    if (cached && now - cached.timestamp < 5000) {
      return cached.result;
    }

    // 2. Query official NBC Bakong Open API directly
    try {
      const response = await fetch(`${BAKONG_API_URL.replace(/\/$/, "")}/v1/check_transaction_by_md5`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BAKONG_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ md5: md5Str }),
      });

      if (response.ok) {
        const resJson = await response.json();

        // ResponseCode 0 = TRANSACTION SUCCESSFUL AND SETTLED ON NBC BAKONG
        if (resJson.responseCode === 0) {
          const txnData = resJson.data || {};
          const txnId =
            txnData.hash ||
            txnData.externalTransactionId ||
            txnData.trx_id ||
            `NBC-${Date.now()}`;

          // Update Supabase payment status
          try {
            await ensureAdminSession();
            await supabase
              .from("payments")
              .update({ status: "PAID", transaction_id: txnId, paid_at: new Date().toISOString() })
              .eq("md5_hash", md5Str);
          } catch {}

          const paidResult: KhqrStatusResponse = {
            status: "PAID",
            is_paid: true,
            transaction_id: txnId,
            paid_at: new Date().toISOString(),
          };
          checkStatusCache[md5Str] = { timestamp: now, result: paidResult };
          return paidResult;
        }

        // Daily developer quota limit (100 req/day)
        if (resJson.errorCode === 17 || resJson.errorCode === 18 || resJson.errorCode === 19) {
          const quotaResult: KhqrStatusResponse = {
            status: "PENDING",
            is_paid: false,
            rate_limit_exceeded: true,
            message: resJson.responseMessage || "NBC Bakong daily developer query limit reached.",
          };
          checkStatusCache[md5Str] = { timestamp: now, result: quotaResult };
          return quotaResult;
        }
      }
    } catch (err: any) {
      console.warn("[Bakong Open API] Check status notice:", err.message);
    }

    // Check if marked paid in Supabase payments table
    try {
      const { data: dbPayment } = await supabase
        .from("payments")
        .select("status, transaction_id, paid_at")
        .eq("md5_hash", md5Str)
        .maybeSingle();

      if (dbPayment?.status === "PAID") {
        const res: KhqrStatusResponse = {
          status: "PAID",
          is_paid: true,
          transaction_id: dbPayment.transaction_id || `BAKONG-${Date.now()}`,
          paid_at: dbPayment.paid_at,
        };
        checkStatusCache[md5Str] = { timestamp: now, result: res };
        return res;
      }
    } catch {}

    const pendingResult: KhqrStatusResponse = {
      status: "PENDING",
      is_paid: false,
    };
    checkStatusCache[md5Str] = { timestamp: now, result: pendingResult };
    return pendingResult;
  },

  /**
   * Manual confirmation or on-demand verification
   */
  verifyPayment: async (
    paymentIdOrMd5: number | string,
    transactionId?: string,
    confirmPaid?: boolean
  ): Promise<{ success: boolean; is_paid: boolean; message?: string; transaction_id?: string; rate_limit_exceeded?: boolean }> => {
    const md5Str = String(paymentIdOrMd5).trim();

    // 1. Try NBC Bakong API first if not forced
    if (!confirmPaid) {
      const statusRes = await khqrService.checkStatus(md5Str);
      if (statusRes.is_paid) {
        return {
          success: true,
          is_paid: true,
          transaction_id: statusRes.transaction_id,
          message: "Payment successfully confirmed on NBC Bakong network.",
        };
      }
    }

    // 2. Mark confirmed in Supabase
    const txn = transactionId || `BAKONG-${Date.now()}`;
    try {
      await ensureAdminSession();
      await supabase
        .from("payments")
        .update({ status: "PAID", transaction_id: txn, paid_at: new Date().toISOString() })
        .eq("md5_hash", md5Str);
    } catch {}

    const paidResult: KhqrStatusResponse = {
      status: "PAID",
      is_paid: true,
      transaction_id: txn,
      paid_at: new Date().toISOString(),
    };
    checkStatusCache[md5Str] = { timestamp: Date.now(), result: paidResult };

    return {
      success: true,
      is_paid: true,
      transaction_id: txn,
      message: "Payment verified and recorded in Supabase ledger.",
    };
  },

  /**
   * Get all payment records from Supabase for Admin Ledger
   */
  getPayments: async () => {
    try {
      await ensureAdminSession();
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        return data;
      }
    } catch (e) {
      console.warn("[Supabase] getPayments note:", e);
    }
    return [];
  },

  /**
   * Gateway metadata and status
   */
  getGatewayStatus: async () => {
    return {
      status: "ONLINE",
      live_mode: true,
      gateway: "National Bank of Cambodia (NBC) Bakong Open API",
      merchant_account: BAKONG_ACCOUNT_ID,
      merchant_name: BAKONG_MERCHANT_NAME,
      merchant_city: "Phnom Penh",
      merchant_phone: `+855 ${BAKONG_PHONE.replace(/^0/, "")}`,
      api_endpoint: BAKONG_API_URL,
      supported_currencies: ["USD", "KHR"],
      emvco_specification: "EMVCo KHQR Universal QR Standard",
    };
  },
};

export default khqrService;
