import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  CreditCard,
  QrCode,
  Banknote,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Sparkles,
  RefreshCw,
  MapPin,
  Navigation,
  Loader2,
  Printer,
} from "lucide-react";
import { useCartStore } from "../../store/useCartStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useUIStore } from "../../store/useUIStore";
import { orderService } from "../../services/orderService";
import { KhqrPaymentModal } from "../../components/checkout/KhqrPaymentModal";
import { ThermalReceiptModal } from "../../components/receipt/ThermalReceiptModal";
import { InvoiceModal } from "../../components/common/InvoiceModal";
import { khqrService, KhqrCreateResponse } from "../../services/khqrService";
import { useCurrencyStore } from "../../store/useCurrencyStore";

// Zod Checkout Validation Schema
const checkoutSchema = z.object({
  fullName: z.string().min(3, "Full name must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Please enter a valid phone number"),
  street: z.string().min(5, "Street address is required"),
  city: z.string().min(2, "City is required"),
  country: z.string().min(2, "Country is required"),
  postalCode: z.string().min(3, "Postal/ZIP code is required"),
  paymentMethod: z.enum(["Cash on Delivery", "Bank Transfer", "QR Payment"]),
  orderNotes: z.string().optional(),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

// Quick Cambodia Delivery Presets for Instant Checkout
const CAMBODIA_DISTRICTS = [
  { label: "BKK1, Chamkarmon", city: "Phnom Penh", zip: "12302", street: "St. 302, Sangkat Boeng Keng Kang 1" },
  { label: "Daun Penh (Riverside)", city: "Phnom Penh", zip: "12204", street: "St. 178, Sangkat Chey Chumneas" },
  { label: "Tuol Kouk", city: "Phnom Penh", zip: "12151", street: "St. 289, Sangkat Boeng Kak 2" },
  { label: "Chroy Changvar", city: "Phnom Penh", zip: "12110", street: "National Road 6A, Sangkat Chroy Changvar" },
  { label: "Siem Reap (Old Market)", city: "Siem Reap", zip: "17252", street: "Pub Street Area, Sangkat Svay Dangkum" },
  { label: "Sihanoukville", city: "Sihanoukville", zip: "18204", street: "Ekareach St., Sangkat 3" },
];

export const Checkout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState<boolean>(false);

  const {
    items,
    getSubtotal,
    getShipping,
    getDiscount,
    getTotal,
    clearCart,
    syncCartWithLiveStock,
    promoCode,
    applyPromoCode,
    removePromoCode,
    promoDescription,
  } = useCartStore();
  const { user, isAuthenticated, addOrder } = useAuthStore();
  const { showToast } = useUIStore();
  const navigate = useNavigate();

  const [couponInput, setCouponInput] = useState<string>("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState<boolean>(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setIsApplyingCoupon(true);
    const res = await applyPromoCode(couponInput);
    setIsApplyingCoupon(false);
    if (res.success) {
      showToast(res.message || "Promo voucher applied!", "success");
      setCouponInput("");
    } else {
      showToast(res.message || "Invalid coupon code", "error");
    }
  };

  const subtotal = getSubtotal();
  const shipping = getShipping();
  const discount = getDiscount();
  const total = getTotal();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      street: user?.address?.street || "",
      city: user?.address?.city || "Phnom Penh",
      country: user?.address?.country || "Cambodia",
      postalCode: user?.address?.postalCode || "12000",
      paymentMethod: "QR Payment",
      orderNotes: "",
    },
  });

  const selectedPayment = watch("paymentMethod");
  const { currency, formatPrice } = useCurrencyStore();

  // Dynamic KHQR Payment State
  const [isKhqrModalOpen, setIsKhqrModalOpen] = useState(false);
  const [khqrData, setKhqrData] = useState<KhqrCreateResponse | null>(null);
  const [isGeneratingKhqr, setIsGeneratingKhqr] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<CheckoutFormData | null>(null);

  // Step transitions with partial field validations
  const handleNextStep = async () => {
    if (currentStep === 1) {
      const valid = await trigger(["fullName", "email", "phone"]);
      if (valid) setCurrentStep(2);
    } else if (currentStep === 2) {
      const valid = await trigger(["street", "city", "country", "postalCode"]);
      if (valid) setCurrentStep(3);
    }
  };

  // HTML5 Geolocation Auto-Detection & Reverse Geocode
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const road =
              addr.road ||
              addr.suburb ||
              addr.neighbourhood ||
              addr.residential ||
              `GPS Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
            const city =
              addr.city || addr.town || addr.municipality || addr.state || "Phnom Penh";
            const country = addr.country || "Cambodia";
            const zip = addr.postcode || "12000";

            setValue("street", road, { shouldValidate: true });
            setValue("city", city, { shouldValidate: true });
            setValue("country", country, { shouldValidate: true });
            setValue("postalCode", zip, { shouldValidate: true });
            showToast(`Location detected: ${city}, ${country}`, "success");
          } else {
            setValue("street", `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`, { shouldValidate: true });
            setValue("city", "Phnom Penh", { shouldValidate: true });
            setValue("country", "Cambodia", { shouldValidate: true });
            setValue("postalCode", "12000", { shouldValidate: true });
            showToast("GPS coordinates captured", "info");
          }
        } catch {
          setValue("street", `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`, { shouldValidate: true });
          setValue("city", "Phnom Penh", { shouldValidate: true });
          setValue("country", "Cambodia", { shouldValidate: true });
          setValue("postalCode", "12000", { shouldValidate: true });
          showToast("GPS coordinates set", "info");
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        showToast("Could not access GPS location. Please select a preset district or enter manually.", "error");
      },
      { timeout: 7000 }
    );
  };

  const handleSelectDistrict = (dist: (typeof CAMBODIA_DISTRICTS)[0]) => {
    setValue("street", dist.street, { shouldValidate: true });
    setValue("city", dist.city, { shouldValidate: true });
    setValue("country", "Cambodia", { shouldValidate: true });
    setValue("postalCode", dist.zip, { shouldValidate: true });
    showToast(`Address set to ${dist.label}`, "info");
  };

  const finalizeOrder = async (
    data: CheckoutFormData,
    paymentStatus: string,
    paymentMethod: string,
    transactionId?: string
  ) => {
    const orderNumber = khqrData?.payment?.orderNumber || `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const formattedItems = (items || []).map((i) => {
      const name = String(i.product?.name || (i as any)?.name || "Fashion Piece");
      return {
        productId: String(i.product?.id || (i as any)?.id || "prod-item"),
        productName: name,
        name: name,
        price: Number(i.product?.price ?? (i as any)?.price ?? 0),
        quantity: Number(i.quantity) || 1,
        image: String(i.product?.images?.[0] || i.product?.image || (i as any)?.image || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"),
        size: String(i.selectedSize || "M"),
        color: typeof i.selectedColor === "object" && i.selectedColor?.name ? String(i.selectedColor.name) : String(i.selectedColor || "Standard"),
      };
    });

    const newOrder: any = {
      id: `ord-${Date.now()}`,
      orderNumber,
      order_number: orderNumber,
      invoiceNumber: `INV-${orderNumber}`,
      createdAt: new Date().toISOString(),
      date: new Date().toISOString().split("T")[0],
      status: "Processing" as const,
      orderStatus: "Processing",
      items: formattedItems,
      subtotal,
      shipping,
      shippingFee: shipping,
      discount,
      tax: 0,
      total,
      shippingAddress: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        street: data.street,
        city: data.city,
        country: data.country,
        postalCode: data.postalCode,
      },
      customerName: data.fullName,
      customerEmail: data.email,
      customerPhone: data.phone,
      paymentMethod,
      paymentStatus,
      transactionId: transactionId || undefined,
    };

    addOrder(newOrder);
    setPlacedOrder(newOrder);

    // Sync order to backend / controller database
    try {
      const persisted = await orderService.createOrder({
        orderNumber,
        customerName: data.fullName,
        customerEmail: data.email,
        customerPhone: data.phone,
        shippingAddress: `${data.street}, ${data.city}, ${data.postalCode}, ${data.country}`,
        items: formattedItems,
        subtotal: subtotal,
        shippingFee: shipping,
        tax: 0,
        total: total,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        orderStatus: "Processing",
        transactionId: transactionId || undefined,
      });
      if (persisted?.orderNumber) {
        newOrder.orderNumber = persisted.orderNumber;
        setPlacedOrder(newOrder);
      }
    } catch (e) {
      console.warn("Order sync note:", e);
    }

    clearCart();
    setCurrentStep(4);
    setIsReceiptModalOpen(true);
    showToast(
      transactionId
        ? `Order #${orderNumber} paid via Bakong KHQR (${transactionId})!`
        : `Order #${orderNumber} placed successfully!`,
      "success"
    );
  };

  const onSubmitOrder = async (data: CheckoutFormData) => {
    // Pre-checkout live inventory stock check
    const stockCheck = await syncCartWithLiveStock();
    if (!stockCheck.valid) {
      stockCheck.adjustments.forEach((msg) => showToast(msg, "error"));
      return;
    }
    if ((useCartStore.getState().items || []).length === 0) {
      showToast("Your bag is empty because selected items are out of stock.", "error");
      navigate("/shop");
      return;
    }

    // If KHQR payment is selected, generate dynamic QR and open modal
    if (data.paymentMethod === "QR Payment") {
      setIsGeneratingKhqr(true);
      try {
        const orderNumber = `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        setPendingFormData(data);
        const khqrAmount = currency === "KHR" ? Math.round(total * 4100) : Number(total.toFixed(2));
        const res = await khqrService.createPayment({
          amount: khqrAmount,
          currency: currency,
          orderNumber,
          customerName: data.fullName,
          customerEmail: data.email,
          customerPhone: data.phone,
        });
        setKhqrData(res);
        setIsKhqrModalOpen(true);
      } catch (err) {
        showToast("Failed to initialize Bakong KHQR payment. Please verify backend connection.", "error");
      } finally {
        setIsGeneratingKhqr(false);
      }
      return;
    }

    // Standard flow for Cash on Delivery / Bank Transfer
    finalizeOrder(data, "Authorized", data.paymentMethod);
  };

  const handleKhqrSuccess = (transactionId: string) => {
    setIsKhqrModalOpen(false);
    if (pendingFormData) {
      finalizeOrder(pendingFormData, "Paid", "Bakong KHQR", transactionId);
    }
  };

  const handleRegenerateKhqr = async () => {
    if (!pendingFormData) return;
    try {
      const orderNumber = `ATL-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      const khqrAmount = currency === "KHR" ? Math.round(total * 4100) : Number(total.toFixed(2));
      const res = await khqrService.createPayment({
        amount: khqrAmount,
        currency: currency,
        orderNumber,
        customerName: pendingFormData.fullName,
        customerEmail: pendingFormData.email,
        customerPhone: pendingFormData.phone,
      });
      setKhqrData(res);
    } catch (e) {
      alert("Failed to regenerate KHQR code.");
    }
  };

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: "/checkout" }} replace />;
  }

  if (items.length === 0 && currentStep !== 4) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold uppercase mb-2">No Items in Bag to Checkout</h2>
        <p className="text-xs text-gray-500 mb-6">
          Your shopping bag is empty. Please add products before checking out.
        </p>
        <Link
          to="/shop"
          className="px-6 py-3 bg-black text-[#D6FF00] font-black text-xs uppercase rounded-full tracking-widest inline-block"
        >
          Browse Collections
        </Link>
      </div>
    );
  }

  // STEP 4: Order Confirmation Screen
  if (currentStep === 4 && placedOrder) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-bold tracking-widest uppercase text-emerald-600 block mb-1">
            Order Confirmed & Received
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-black uppercase">
            Thank You, {placedOrder.shippingAddress.fullName.split(" ")[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-2 font-light">
            Your runway order <strong>#{placedOrder.orderNumber}</strong> has been received by our Paris Atelier.
            A confirmation dispatch was sent to <strong>{placedOrder.shippingAddress.email}</strong>.
          </p>
        </div>

        {/* Order Details Receipt Box */}
        <div className="p-6 rounded-3xl bg-white border border-gray-100 shadow-xs text-left text-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-400 font-semibold uppercase">Tracking Reference</span>
            <span className="font-extrabold text-black font-mono">{placedOrder.orderNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-400 font-semibold uppercase">Destination</span>
            <span className="font-bold text-black text-right">
              {placedOrder.shippingAddress.street}, {placedOrder.shippingAddress.city}
            </span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <span className="text-gray-400 font-semibold uppercase">Payment Selection</span>
            <span className="font-bold text-black">{placedOrder.paymentMethod}</span>
          </div>

          <div className="flex justify-between items-center text-sm font-black text-black pt-1">
            <span>Total Charged</span>
            <span className="text-lg">{formatPrice(Number(placedOrder.total || 0))}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 flex-wrap">
          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-6 py-3.5 rounded-full bg-black text-[#D6FF00] font-black text-xs uppercase tracking-widest shadow-md hover:scale-105 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>POS Receipt</span>
          </button>
          <button
            type="button"
            onClick={() => setIsInvoiceModalOpen(true)}
            className="px-6 py-3.5 rounded-full bg-neutral-800 text-white hover:bg-black font-black text-xs uppercase tracking-widest shadow-md hover:scale-105 transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#D6FF00]" />
            <span>Print Tax Invoice</span>
          </button>
          <Link
            to="/orders"
            className="px-6 py-3.5 rounded-full bg-neutral-900 text-white font-black text-xs uppercase tracking-widest shadow-md hover:scale-105 transition-all inline-flex items-center justify-center"
          >
            Track in Orders
          </Link>
          <Link
            to="/shop"
            className="px-6 py-3.5 rounded-full border border-gray-300 text-black font-bold text-xs uppercase tracking-widest hover:border-black transition-all inline-flex items-center justify-center"
          >
            Continue Shopping
          </Link>
        </div>

        {/* POS Thermal Receipt Modal */}
        <ThermalReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          invoiceData={placedOrder}
        />

        {/* Official Tax Invoice Modal */}
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={placedOrder}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Checkout Progress Stepper */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className={`flex items-center gap-2 ${currentStep >= 1 ? "text-black" : "text-gray-300"}`}>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 1 ? "bg-black text-[#D6FF00]" : "bg-gray-100 text-gray-400"
              }`}
            >
              1
            </span>
            <span className="hidden sm:inline">Client Info</span>
          </div>

          <div className={`h-[2px] flex-1 mx-3 ${currentStep >= 2 ? "bg-black" : "bg-gray-200"}`} />

          <div className={`flex items-center gap-2 ${currentStep >= 2 ? "text-black" : "text-gray-300"}`}>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 2 ? "bg-black text-[#D6FF00]" : "bg-gray-100 text-gray-400"
              }`}
            >
              2
            </span>
            <span className="hidden sm:inline">Shipping Address</span>
          </div>

          <div className={`h-[2px] flex-1 mx-3 ${currentStep >= 3 ? "bg-black" : "bg-gray-200"}`} />

          <div className={`flex items-center gap-2 ${currentStep >= 3 ? "text-black" : "text-gray-300"}`}>
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep >= 3 ? "bg-black text-[#D6FF00]" : "bg-gray-100 text-gray-400"
              }`}
            >
              3
            </span>
            <span className="hidden sm:inline">Payment & Review</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Form Steps (7 Cols) + Summary (5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Form Body */}
        <div className="lg:col-span-7">
          <form onSubmit={handleSubmit(onSubmitOrder)} className="space-y-6">
            {/* STEP 1: Customer Information */}
            {currentStep === 1 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-5">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 block">
                    Step 1 of 3
                  </span>
                  <h2 className="text-xl font-black uppercase text-black">
                    Client Contact Information
                  </h2>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      {...register("fullName")}
                      placeholder="e.g. Camille Laurent"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    />
                    {errors.fullName && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.fullName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="e.g. camille@atelier.com"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    />
                    {errors.email && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      {...register("phone")}
                      placeholder="+1 (555) 349-2810"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-8 py-3.5 bg-black hover:bg-neutral-800 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group"
                  >
                    <span>Continue to Shipping</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Shipping Address */}
            {currentStep === 2 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 block">
                      Step 2 of 3
                    </span>
                    <h2 className="text-xl font-black uppercase text-black">
                      Delivery Destination
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-neutral-900 hover:text-[#D6FF00] text-gray-800 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer self-start sm:self-auto border border-gray-200"
                    title="Detect address via GPS Geolocation"
                  >
                    {isLocating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{isLocating ? "Detecting GPS..." : "Auto-Detect Location"}</span>
                  </button>
                </div>

                {/* Quick Cambodia District Presets */}
                <div className="bg-neutral-50/90 p-3.5 rounded-2xl border border-gray-200/70">
                  <div className="flex items-center gap-1.5 mb-2 text-gray-600 font-bold text-[10px] uppercase tracking-wider">
                    <MapPin className="w-3 h-3 text-red-500" />
                    <span>Quick Cambodia Presets (Click to Auto-Fill):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {CAMBODIA_DISTRICTS.map((dist) => (
                      <button
                        key={dist.label}
                        type="button"
                        onClick={() => handleSelectDistrict(dist)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white hover:bg-black hover:text-[#D6FF00] border border-gray-200 transition-all cursor-pointer shadow-2xs"
                      >
                        {dist.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      {...register("street")}
                      placeholder="e.g. 740 Madison Avenue, Apt 8B"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                    />
                    {errors.street && (
                      <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                        {errors.street.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        {...register("city")}
                        placeholder="e.g. New York or Phnom Penh"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                      />
                      {errors.city && (
                        <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                          {errors.city.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Postal / ZIP Code *</label>
                      <input
                        type="text"
                        {...register("postalCode")}
                        placeholder="10065 or 12000"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                      />
                      {errors.postalCode && (
                        <p className="text-[11px] text-rose-500 mt-1 font-semibold">
                          {errors.postalCode.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Country / Region *</label>
                    <select
                      {...register("country")}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none bg-white font-medium"
                    >
                      <option value="Cambodia">Cambodia</option>
                      <option value="United States">United States</option>
                      <option value="France">France</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Italy">Italy</option>
                      <option value="Japan">Japan</option>
                      <option value="Canada">Canada</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-6 py-3 border border-gray-200 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:border-black transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-8 py-3.5 bg-black hover:bg-neutral-800 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 group"
                  >
                    <span>Proceed to Payment</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Payment Method & Submit */}
            {currentStep === 3 && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-6">
                <div>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400 block">
                    Step 3 of 3
                  </span>
                  <h2 className="text-xl font-black uppercase text-black">
                    Select Payment Method
                  </h2>
                </div>

                <div className="space-y-3">
                  {/* Payment Option 1: Bank Transfer */}
                  <label
                    onClick={() => setValue("paymentMethod", "Bank Transfer")}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedPayment === "Bank Transfer"
                        ? "border-black bg-gray-50 ring-1 ring-black"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-black">
                          Direct Bank Wire / SWIFT
                        </strong>
                        <span className="text-[11px] text-gray-500">
                          Transfer directly to Atelier Paris Treasury with IBAN
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      value="Bank Transfer"
                      {...register("paymentMethod")}
                      className="accent-black w-4 h-4"
                    />
                  </label>

                  {/* Payment Option 2: Cash on Delivery */}
                  <label
                    onClick={() => setValue("paymentMethod", "Cash on Delivery")}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedPayment === "Cash on Delivery"
                        ? "border-black bg-gray-50 ring-1 ring-black"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black text-[#D6FF00] flex items-center justify-center">
                        <Banknote className="w-5 h-5" />
                      </div>
                      <div>
                        <strong className="block text-xs font-bold text-black">
                          Cash on Delivery (White Glove)
                        </strong>
                        <span className="text-[11px] text-gray-500">
                          Inspect garments upon courier delivery before payment
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      value="Cash on Delivery"
                      {...register("paymentMethod")}
                      className="accent-black w-4 h-4"
                    />
                  </label>

                  {/* Payment Option 3: Bakong KHQR Payment */}
                  <label
                    onClick={() => setValue("paymentMethod", "QR Payment")}
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedPayment === "QR Payment"
                        ? "border-[#E1251B] bg-red-50/30 ring-1 ring-[#E1251B]"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#E1251B] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <QrCode className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs font-bold text-black">
                            Bakong KHQR (All Cambodia Mobile Banks)
                          </strong>
                          <span className="px-1.5 py-0.5 rounded-sm bg-[#E1251B] text-white text-[9px] font-black uppercase tracking-wider">
                            Instant KHQR
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 block mt-0.5">
                          Scan with ABA Mobile, Bakong, Wing, ACLEDA, Canadia, etc.
                        </span>
                      </div>
                    </div>
                    <input
                      type="radio"
                      value="QR Payment"
                      {...register("paymentMethod")}
                      className="accent-[#E1251B] w-4 h-4"
                    />
                  </label>
                </div>

                <div className="pt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-6 py-3 border border-gray-200 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:border-black transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isGeneratingKhqr}
                    className="px-8 py-4 bg-[#D6FF00] hover:bg-[#c6ef00] text-black font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 group cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingKhqr ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Initializing Bakong KHQR...</span>
                      </>
                    ) : selectedPayment === "QR Payment" ? (
                      <>
                        <span>Pay with Bakong KHQR ({formatPrice(total)})</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    ) : (
                      <>
                        <span>Authorize &amp; Place Order ({formatPrice(total)})</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-6">
            <h3 className="font-black text-base uppercase tracking-tight text-black pb-4 border-b border-gray-100">
              Bag Overview ({items.length} pieces)
            </h3>

            {/* Compact Items List */}
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {(items || []).map((item) => {
                const prod = item?.product || (item as any) || {};
                const img =
                  prod.images?.[0] ||
                  prod.image ||
                  (item as any)?.image ||
                  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80";
                const name = prod.name || (item as any)?.name || "Fashion Piece";
                const price = Number(prod.price ?? (item as any)?.price ?? 0);
                const size = item?.selectedSize || "M";
                const colorName =
                  typeof item?.selectedColor === "object" && item?.selectedColor?.name
                    ? item.selectedColor.name
                    : String(item?.selectedColor || "Standard");
                const qty = Number(item?.quantity) || 1;

                return (
                  <div key={item?.id || name} className="flex items-center gap-3 text-xs">
                    <img
                      src={img}
                      alt={name}
                      className="w-12 h-14 object-cover rounded-lg bg-gray-100 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-black truncate">{name}</h4>
                      <p className="text-[11px] text-gray-400">
                        {size} • {colorName} • Qty: {qty}
                      </p>
                    </div>
                    <span className="font-extrabold text-black shrink-0">
                      {formatPrice(price * qty)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Promotional Voucher Input */}
            <div className="pt-2">
              {promoCode ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold text-emerald-950 block">{promoCode} Active</span>
                      <span className="text-[10px] text-emerald-700">
                        {promoDescription || "Promotional discount applied"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removePromoCode();
                      showToast("Coupon removed", "info");
                    }}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Promo code (e.g. ATELIER20)"
                      className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-black uppercase font-medium placeholder:normal-case"
                    />
                    <button
                      type="submit"
                      disabled={isApplyingCoupon || !couponInput.trim()}
                      className="px-4 py-2 bg-black hover:bg-neutral-800 text-[#D6FF00] font-bold text-xs uppercase rounded-xl transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isApplyingCoupon ? "..." : "Apply"}
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <span>Try:</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput("ATELIER20")}
                      className="font-mono font-bold text-black hover:underline cursor-pointer"
                    >
                      ATELIER20
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput("WELCOME10")}
                      className="font-mono font-bold text-black hover:underline cursor-pointer"
                    >
                      WELCOME10
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setCouponInput("FREESHIP")}
                      className="font-mono font-bold text-black hover:underline cursor-pointer"
                    >
                      FREESHIP
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2.5 text-xs pt-4 border-t border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-bold text-black">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-600 font-bold uppercase text-[11px]">Free</span>
                  ) : (
                    formatPrice(shipping)
                  )}
                </span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Coupon Discount ({promoCode})</span>
                  <span>-{formatPrice(discount)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-gray-100 flex justify-between text-base font-black text-black">
                <span>Total Amount Due</span>
                <span className="text-xl">{formatPrice(total)}</span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl flex items-center gap-2 text-[11px] text-gray-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Certified SSL encryption & buyer protection guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Bakong KHQR Payment Modal */}
      <KhqrPaymentModal
        isOpen={isKhqrModalOpen}
        onClose={() => setIsKhqrModalOpen(false)}
        onPaymentSuccess={handleKhqrSuccess}
        khqrData={khqrData}
        onRegenerate={handleRegenerateKhqr}
      />
    </div>
  );
};

export default Checkout;

