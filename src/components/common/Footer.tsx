import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Copy, Check, Globe, ShieldCheck } from "lucide-react";
import api from "../../services/api";
import { useUIStore } from "../../store/useUIStore";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [promoCode, setPromoCode] = useState("ATELIER20");
  const [copiedCode, setCopiedCode] = useState(false);
  const { showToast } = useUIStore();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) return;
    setSubmitting(true);
    try {
      const res = await api.post("/newsletter/", { email: email.trim() });
      if (res.data?.promoCode) {
        setPromoCode(res.data.promoCode);
      }
      setSubscribed(true);
      setEmail("");
      showToast("Subscribed to The Atelier Dispatch! Use code ATELIER20 for 20% off.", "success");
    } catch {
      setSubscribed(true);
      setEmail("");
      showToast("Welcome to The Atelier Dispatch! Use code ATELIER20 for 20% off.", "success");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyPromo = () => {
    navigator.clipboard?.writeText(promoCode);
    setCopiedCode(true);
    showToast(`Copied welcome promo code: ${promoCode}`, "success");
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <footer className="bg-[#111111] text-white pt-16 sm:pt-20 pb-12 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Newsletter & Brand Manifesto Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          <div className="lg:col-span-5 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <span className="w-3 h-3 rounded-full bg-[#D6FF00] inline-block shadow-xs group-hover:scale-125 transition-transform" />
              <span className="font-extrabold tracking-[-0.05em] text-2xl sm:text-3xl text-white">
                ATELIER
              </span>
            </Link>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md">
              A contemporary luxury fashion house celebrating architectural silhouettes, organic textures,
              and enduring tailoring. Designed between Paris and Milan for the discerning modern lifestyle.
            </p>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#D6FF00] pt-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Certified Sustainable Craftsmanship & Ethical Wool Sourcing</span>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="lg:col-span-7 lg:pl-8 flex flex-col justify-center">
            <div className="max-w-md ml-auto w-full space-y-3">
              <span className="text-[11px] font-bold tracking-widest text-[#D6FF00] uppercase block">
                The Atelier Dispatch
              </span>
              <h4 className="text-lg font-bold text-white tracking-tight">
                Receive private capsule drops and editorial invitations.
              </h4>

              {subscribed ? (
                <div className="p-3.5 rounded-xl bg-white/5 border border-[#D6FF00]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#D6FF00]">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Welcome to the circle! Enjoy <strong>20% OFF</strong> with code:</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPromo}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D6FF00] text-black font-black tracking-wider uppercase text-[11px] hover:bg-[#c4eb00] transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? "Copied!" : promoCode}</span>
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address..."
                    required
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/15 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D6FF00] transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-3 bg-[#D6FF00] hover:bg-[#c4eb00] text-black text-xs font-black tracking-widest uppercase rounded-xl transition-colors flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                  >
                    <span>{submitting ? "Joining..." : "Subscribe"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}
              <p className="text-[11px] text-gray-500">
                By subscribing, you agree to our Privacy Policy. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Middle: Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-14 border-b border-white/10 text-xs">
          {/* Column 1 */}
          <div>
            <h5 className="font-bold uppercase tracking-widest text-white text-xs mb-4">
              Collections
            </h5>
            <ul className="space-y-2.5 text-gray-400">
              <li>
                <Link to="/shop?category=women" className="hover:text-white transition-colors">
                  Women's Runway
                </Link>
              </li>
              <li>
                <Link to="/shop?category=men" className="hover:text-white transition-colors">
                  Men's Tailoring
                </Link>
              </li>
              <li>
                <Link to="/shop?category=shoes" className="hover:text-white transition-colors">
                  Footwear & Boots
                </Link>
              </li>
              <li>
                <Link to="/shop?category=bags" className="hover:text-white transition-colors">
                  Leather Goods & Bags
                </Link>
              </li>
              <li>
                <Link to="/shop?category=accessories" className="hover:text-white transition-colors">
                  Jewelry & Eyewear
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2 */}
          <div>
            <h5 className="font-bold uppercase tracking-widest text-white text-xs mb-4">
              Client Concierge
            </h5>
            <ul className="space-y-2.5 text-gray-400">
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact Client Support
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-white transition-colors">
                  Shipping & Customs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Returns & Exchanges
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Book a Private Styling
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 */}
          <div>
            <h5 className="font-bold uppercase tracking-widest text-white text-xs mb-4">
              The House
            </h5>
            <ul className="space-y-2.5 text-gray-400">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Atelier Manifesto
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Italian Craftsmanship
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Sustainability Report 2026
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Flagship Boutiques
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  Careers & Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 */}
          <div>
            <h5 className="font-bold uppercase tracking-widest text-white text-xs mb-4">
              Boutiques
            </h5>
            <div className="space-y-3 text-gray-400 text-xs">
              <div>
                <strong className="text-white block font-semibold">Paris Flagship</strong>
                <span>12 Place Vendôme, 75001 Paris</span>
              </div>
              <div>
                <strong className="text-white block font-semibold">New York Studio</strong>
                <span>740 Madison Avenue, NY 10065</span>
              </div>
              <div>
                <strong className="text-white block font-semibold">Tokyo Ginza</strong>
                <span>6-10-1 Ginza, Chuo-ku, Tokyo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright, Socials, Payments */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-6">
            <span>&copy; {new Date().getFullYear()} ATELIER PARIS S.A. ALL RIGHTS RESERVED.</span>
            <div className="hidden md:flex items-center gap-4 text-gray-400">
              <Link to="/about" className="hover:text-white transition-colors">Terms of Service</Link>
              <span>•</span>
              <Link to="/about" className="hover:text-white transition-colors">Privacy Notice</Link>
              <span>•</span>
              <Link to="/about" className="hover:text-white transition-colors">Cookies Settings</Link>
            </div>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-4 text-gray-400">
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="hover:text-[#D6FF00] transition-colors" title="Instagram">
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="hover:text-[#D6FF00] transition-colors" title="X / Twitter">
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://youtube.com" target="_blank" rel="noreferrer" className="hover:text-[#D6FF00] transition-colors" title="YouTube">
              <svg className="w-4 h-4 fill-currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            </a>
            <span className="flex items-center gap-1 text-[11px] text-gray-400 ml-2">
              <Globe className="w-3.5 h-3.5" />
              <span>Global / USD ($)</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
