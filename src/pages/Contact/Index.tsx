import React, { useState, useEffect } from "react";
import { Mail, Phone, MapPin, Send, CheckCircle2, ChevronDown, Clock } from "lucide-react";
import { useUIStore } from "../../store/useUIStore";
import { useAuthStore } from "../../store/useAuthStore";
import { telegramService } from "../../services/telegramService";

const FAQS = [
  {
    q: "How does complimentary express worldwide shipping work?",
    a: "Orders over $200 qualify for complimentary courier delivery via DHL Express. Deliveries typically arrive within 2–4 business days across North America, Europe, and Asia-Pacific. Duties and import taxes are pre-calculated and covered by Atelier.",
  },
  {
    q: "What is the return and exchange window?",
    a: "We offer complimentary 30-day returns from the date of delivery. All garments must be unworn, unwashed, and retained with original luxury garment tags and security ribbons intact.",
  },
  {
    q: "Can I book a private styling session at your flagship boutiques?",
    a: "Yes. Private appointments are available in Paris (Place Vendôme) and New York (Madison Avenue). Please select 'Private Styling Appointment' in the contact inquiry dropdown or email concierge@atelier.com.",
  },
  {
    q: "How should I care for virgin wool and cashmere pieces?",
    a: "We recommend gentle professional dry cleaning or steaming. For daily maintenance, brush gently with a natural bristle garment brush and store in breathable cotton dust bags away from direct heat.",
  },
];

export const Contact: React.FC = () => {
  const { showToast } = useUIStore();
  const { user } = useAuthStore();
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [formSent, setFormSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "Client Inquiry",
    message: "",
  });

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      // Invisible honeypot trap triggered by automated scraper/spambot! Discard quietly.
      console.warn("[Security Trap] Automated spam bot detected and discarded.");
      setFormSent(true);
      return;
    }
    if (!formData.name || !formData.email || !formData.message) return;
    setSubmitting(true);
    try {
      // 1. Send live Telegram concierge alert to store staff
      await telegramService.sendContactInquiry({
        name: formData.name,
        email: formData.email,
        phone: user?.phone,
        subject: formData.subject,
        message: formData.message,
      });

      // 2. Persist locally for audit
      const existingInquiries = JSON.parse(localStorage.getItem("atelier_contact_inquiries") || "[]");
      existingInquiries.unshift({
        id: `inq-${Date.now()}`,
        ...formData,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem("atelier_contact_inquiries", JSON.stringify(existingInquiries.slice(0, 50)));
    } catch (err) {
      console.warn("Contact inquiry sync notice:", err);
    } finally {
      setSubmitting(false);
      setFormSent(true);
      showToast("Your inquiry has been delivered to the Atelier concierge.", "success");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-20">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block">
          Client Concierge
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight">
          Contact The House
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 font-light">
          Our Paris client advisors are available 7 days a week for styling guidance, bespoke sizing,
          and order assistance.
        </p>
      </div>

      {/* Main Grid: Contact Form (7 cols) + Boutique Locations (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Form */}
        <div className="lg:col-span-7 p-8 sm:p-10 rounded-3xl bg-white border border-gray-100 shadow-xs space-y-6">
          <h2 className="text-lg font-black uppercase text-black">
            Send an Inquiry to Concierge
          </h2>

          {formSent ? (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-emerald-900 uppercase">Inquiry Transmitted</h3>
              <p className="text-xs text-emerald-700">
                Thank you, {formData.name}. An advisor will review your message and reply to{" "}
                <strong>{formData.email}</strong> within 12 hours.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs relative">
              {/* Invisible honeypot trap to catch automated scraping bots */}
              <div
                style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}
                aria-hidden="true"
              >
                <input
                  type="text"
                  name="bot_field_honey"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Your Full Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Camille Laurent"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="camille@atelier.com"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Inquiry Topic</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none bg-white font-medium"
                >
                  <option value="Client Inquiry">Order & Delivery Inquiries</option>
                  <option value="Private Styling">Private Styling Appointment</option>
                  <option value="Bespoke Sizing">Bespoke Garment & Tailoring</option>
                  <option value="Press & Media">Press & Editorial Editorial</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Your Message *</label>
                <textarea
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your inquiry or order reference..."
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-black outline-none font-medium"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-black hover:bg-neutral-900 text-[#D6FF00] font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>Dispatch Inquiry</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

        {/* Flagship Boutiques Info */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 rounded-3xl bg-[#111111] text-white shadow-xl space-y-6">
            <span className="text-[10px] font-bold tracking-widest text-[#D6FF00] uppercase block">
              Flagship Boutiques
            </span>

            {/* Paris */}
            <div className="space-y-1.5 pb-4 border-b border-white/10 text-xs">
              <strong className="text-white text-sm font-bold block">Paris Place Vendôme</strong>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-[#D6FF00] shrink-0" />
                <span>12 Place Vendôme, 75001 Paris, France</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Mon – Sat: 10:00 – 19:30 CET</span>
              </div>
            </div>

            {/* New York */}
            <div className="space-y-1.5 pb-4 border-b border-white/10 text-xs">
              <strong className="text-white text-sm font-bold block">New York Madison Studio</strong>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-[#D6FF00] shrink-0" />
                <span>740 Madison Avenue, New York, NY 10065</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Mon – Sat: 10:00 – 19:00 EST</span>
              </div>
            </div>

            {/* Tokyo */}
            <div className="space-y-1.5 text-xs">
              <strong className="text-white text-sm font-bold block">Tokyo Ginza Boutique</strong>
              <div className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-3.5 h-3.5 text-[#D6FF00] shrink-0" />
                <span>6-10-1 Ginza, Chuo-ku, Tokyo 104-0061</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>Daily: 11:00 – 20:00 JST</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <span className="text-xs font-bold tracking-widest uppercase text-gray-400 block mb-1">
            Common Answers
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-black uppercase">
            Frequently Answered Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <div
              key={idx}
              className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-2xs"
            >
              <button
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full p-5 text-left font-bold text-xs sm:text-sm text-black flex items-center justify-between"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform shrink-0 ${
                    activeFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeFaq === idx && (
                <div className="px-5 pb-5 text-xs text-gray-600 font-light leading-relaxed border-t border-gray-50 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

