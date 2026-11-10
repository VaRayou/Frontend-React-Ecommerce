import React, { useState, useEffect } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const MESSAGES = [
  { text: "COMPLIMENTARY EXPRESS WORLDWIDE SHIPPING ON ORDERS OVER $200", link: "/shop" },
  { text: "USE CODE 'ATELIER15' AT CHECKOUT FOR 15% OFF YOUR FIRST ORDER", link: "/shop" },
  { text: "AUTUMN/WINTER RUNWAY CAPSULE COLLECTION — NOW AVAILABLE", link: "/shop?category=new-arrivals" },
];

export const AnnouncementBar: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = MESSAGES[index];

  return (
    <div className="bg-[#111111] text-white text-xs tracking-wider font-medium py-2 px-4 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center overflow-hidden">
        <Sparkles className="w-3.5 h-3.5 text-[#D6FF00] shrink-0 animate-pulse" />
        <Link
          to={current.link}
          className="hover:text-[#D6FF00] transition-colors flex items-center gap-1.5 truncate text-[11px] sm:text-xs tracking-widest uppercase font-semibold"
        >
          <span>{current.text}</span>
          <ArrowRight className="w-3 h-3 text-[#D6FF00] shrink-0 hidden sm:inline" />
        </Link>
      </div>
    </div>
  );
};

