import React from "react";
import { ArrowUpRight } from "lucide-react";

export function StatisticsCard({ title, value, change, icon: Icon, color = "bg-neutral-900 text-[#D6FF00]" }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
          {title}
        </span>
        <strong className="text-2xl font-black text-gray-950 mt-1 block">
          {value}
        </strong>
        {change && (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{change}</span>
          </span>
        )}
      </div>

      {Icon && (
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
}

export default StatisticsCard;
