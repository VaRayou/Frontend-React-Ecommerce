import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  X,
  Clock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  AlertTriangle,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { khqrService, KhqrCreateResponse } from "../../services/khqrService";

interface KhqrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (transactionId: string) => void;
  khqrData: KhqrCreateResponse | null;
  onRegenerate: () => void;
}

export const KhqrPaymentModal: React.FC<KhqrPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  khqrData,
  onRegenerate,
}) => {
  const [isPaid, setIsPaid] = useState(false);
  const [transactionId, setTransactionId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Countdown timer in seconds (defaults to 600s / 10 mins)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isExpired, setIsExpired] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onPaymentSuccessRef = useRef(onPaymentSuccess);

  useEffect(() => {
    onPaymentSuccessRef.current = onPaymentSuccess;
  }, [onPaymentSuccess]);

  // Initialize countdown from expires_at
  useEffect(() => {
    if (!isOpen || !khqrData) return;

    setIsPaid(false);
    setIsExpired(false);
    setTransactionId("");

    const expiresAtMs = khqrData.expires_at ? new Date(khqrData.expires_at).getTime() : 0;
    const nowMs = Date.now();
    const diffSeconds = expiresAtMs > nowMs ? Math.floor((expiresAtMs - nowMs) / 1000) : 600;
    setTimeLeft(diffSeconds > 0 ? diffSeconds : 600);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, khqrData]);

  // Real-time automatic polling to verify payment from NBC Bakong Bank API
  useEffect(() => {
    if (!isOpen || !khqrData || isPaid || isExpired) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }

    const checkStatus = async () => {
      try {
        const paymentId = khqrData.payment?.id || khqrData.md5_hash;
        const res = await khqrService.checkStatus(paymentId);
        if (res.is_paid || res.status === "PAID") {
          setIsPaid(true);
          const txn = res.transaction_id || `BAKONG-${Date.now()}`;
          setTransactionId(txn);
          if (pollingRef.current) clearInterval(pollingRef.current);

          // Delay slightly so customer sees the celebratory green checkmark
          setTimeout(() => {
            onPaymentSuccessRef.current(txn);
          }, 1800);
        } else if (res.status === "EXPIRED") {
          setIsExpired(true);
          if (pollingRef.current) clearInterval(pollingRef.current);
        }
      } catch {
        // quiet polling error
      }
    };

    // Run immediately once, then poll every 3.5 seconds
    checkStatus();
    pollingRef.current = setInterval(checkStatus, 3500);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [isOpen, khqrData, isPaid, isExpired]);

  if (!isOpen || !khqrData) return null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleCopyMd5 = () => {
    if (!khqrData?.md5_hash) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(khqrData.md5_hash).catch(() => {});
      }
    } catch {
      // ignore clipboard error on non-secure contexts
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-[390px] max-h-[94vh] bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-in zoom-in-95 duration-200 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Authentic Bakong KHQR Red Header */}
        <div className="bg-[#E1251B] text-white px-5 py-3.5 flex items-center justify-between relative shadow-sm shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center font-black tracking-wider text-sm shadow-xs">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black tracking-tight text-base leading-none">KHQR</span>
                <span className="px-1.5 py-0.5 rounded-sm bg-white text-[#E1251B] font-black text-[9px] uppercase tracking-wider">
                  Bakong
                </span>
              </div>
              <span className="text-[10px] text-white/85 font-medium tracking-wide block mt-0.5">
                National Bank of Cambodia
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isPaid}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors text-white cursor-pointer disabled:opacity-40"
            title="Cancel payment"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 text-center space-y-3 overflow-y-auto">
          {/* PAID CELEBRATION VIEW */}
          {isPaid ? (
            <div className="py-6 space-y-3.5 animate-in zoom-in-90 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg animate-bounce">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-emerald-600 block mb-1">
                  Payment Verified & Settled
                </span>
                <h3 className="text-xl font-black text-gray-950 uppercase">
                  Payment Received!
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs mx-auto">
                  Bakong NBC has confirmed transaction <br />
                  <strong className="font-mono text-gray-800 text-[11px] font-bold">
                    {transactionId}
                  </strong>
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 max-w-xs mx-auto text-xs text-gray-600 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>Finalizing your order confirmation...</span>
              </div>
            </div>
          ) : isExpired ? (
            /* EXPIRED STATE */
            <div className="py-6 space-y-3.5">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">QR Code Expired</h3>
                <p className="text-xs text-gray-500 mt-1">
                  For your security, dynamic KHQR codes expire after 10 minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={onRegenerate}
                className="px-6 py-2.5 rounded-xl bg-black text-[#D6FF00] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 hover:bg-neutral-800 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate KHQR</span>
              </button>
            </div>
          ) : (
            /* ACTIVE QR CODE VIEW - WAITING FOR BANK VERIFICATION */
            <>
              {/* Recipient Account & Amount Banner */}
              <div className="p-3 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-left border-b border-gray-100 pb-1.5">
                  <div>
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                      Account Holder
                    </div>
                    <div className="text-xs sm:text-sm font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                      <span>{khqrData.merchant_name || "Rayou Va"}</span>
                      <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded font-semibold">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                        Verified
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                      Bakong ID
                    </div>
                    <div className="text-[11px] font-mono font-bold text-[#E1251B] bg-red-50 px-2 py-0.5 rounded-md">
                      {khqrData.bakong_account_id || "rayou_va@bkrt"}
                    </div>
                  </div>
                </div>

                <div className="pt-0.5 flex items-baseline justify-between">
                  <div className="text-left">
                    <div className="text-[9px] uppercase font-bold text-gray-400 tracking-wider">
                      Total Due
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight leading-none mt-0.5">
                      {khqrData.payment?.currency === "KHR"
                        ? `${Number(khqrData.payment?.amount || 0).toLocaleString()} ៛`
                        : `$${Number(khqrData.payment?.amount || 0).toFixed(2)}`}{" "}
                      <span className="text-[11px] font-bold text-gray-500">
                        {khqrData.payment?.currency || "USD"}
                      </span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] font-mono text-gray-500">
                    Ref: <span className="font-bold text-gray-800">{khqrData.payment?.orderNumber || `#${khqrData.payment?.id}`}</span>
                  </div>
                </div>
              </div>

              {/* Dynamic QR Code Frame */}
              <div className="relative p-2 rounded-2xl bg-white border-2 border-dashed border-gray-200 inline-block mx-auto shadow-2xs max-w-full">
                <img
                  src={khqrData.qr_image}
                  alt="Bakong KHQR Dynamic Payment Code"
                  className="max-h-[215px] max-w-[185px] mx-auto object-contain rounded-lg"
                />

                {/* Corner decorative anchors */}
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 border-t-2 border-l-2 border-[#E1251B]" />
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border-t-2 border-r-2 border-[#E1251B]" />
                <div className="absolute bottom-1.5 left-1.5 w-2.5 h-2.5 border-b-2 border-l-2 border-[#E1251B]" />
                <div className="absolute bottom-1.5 right-1.5 w-2.5 h-2.5 border-b-2 border-r-2 border-[#E1251B]" />
              </div>

              {/* Real-Time Bank Verification Radar & Status */}
              <div className="p-2.5 rounded-2xl bg-gradient-to-r from-gray-50 via-white to-gray-50 border border-gray-200/80 shadow-2xs flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 shrink-0 border border-emerald-100">
                    <span className="absolute inline-flex h-full w-full rounded-xl bg-emerald-400 opacity-25 animate-ping" />
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-[11px] font-black text-gray-900 tracking-tight flex items-center gap-1.5">
                      <span>Waiting for Bank Payment...</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    </div>
                    <p className="text-[10px] text-gray-500 leading-tight mt-0.5">
                      Scan with ABA, Bakong, or Wing. Auto-verifies on transfer.
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0 pl-2 border-l border-gray-100">
                  <div className="text-[8px] uppercase font-bold text-gray-400 tracking-wider">
                    Time Left
                  </div>
                  <div className="flex items-center gap-1 font-mono font-black text-gray-900 text-xs">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span>{formatTimer(timeLeft)}</span>
                  </div>
                </div>
              </div>

              {/* Deep link button if opened on mobile device */}
              {khqrData.deeplink && (
                <a
                  href={khqrData.deeplink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#E1251B] hover:bg-red-700 text-white font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Open in Bakong App</span>
                </a>
              )}

              {/* Supported Banking Apps & Audit Footer */}
              <div className="pt-1.5 border-t border-gray-100 flex flex-col items-center gap-1 text-center">
                <p className="text-[10px] text-gray-500 font-medium">
                  ABA Mobile • Bakong • Wing • ACLEDA • Canadia • Sathapana
                </p>
                <div className="flex items-center justify-center gap-2 text-[9px] text-gray-400 font-mono">
                  <span className="inline-flex items-center gap-1 font-sans text-gray-500">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    NBC EMVCo
                  </span>
                  <span>•</span>
                  <span>Hash: {(khqrData.md5_hash || "").slice(0, 12)}...</span>
                  <button
                    type="button"
                    onClick={handleCopyMd5}
                    className="hover:text-black cursor-pointer inline-flex items-center gap-0.5 text-[9px] font-sans text-gray-500 font-semibold"
                    title="Copy MD5 hash"
                  >
                    {copied ? <Check className="w-2.5 h-2.5 text-emerald-600" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default KhqrPaymentModal;
