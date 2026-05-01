// src/features/smart-attendance/components/DashboardCard.jsx
import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const colorMap = {
  blue: {
    bg:      "bg-blue-600",
    light:   "bg-blue-50",
    text:    "text-blue-700",
    value:   "text-blue-600",
    border:  "border-blue-100",
    shadow:  "shadow-blue-100",
  },
  green: {
    bg:      "bg-emerald-600",
    light:   "bg-emerald-50",
    text:    "text-emerald-700",
    value:   "text-emerald-600",
    border:  "border-emerald-100",
    shadow:  "shadow-emerald-100",
  },
  indigo: {
    bg:      "bg-indigo-600",
    light:   "bg-indigo-50",
    text:    "text-indigo-700",
    value:   "text-indigo-600",
    border:  "border-indigo-100",
    shadow:  "shadow-indigo-100",
  },
  amber: {
    bg:      "bg-amber-500",
    light:   "bg-amber-50",
    text:    "text-amber-700",
    value:   "text-amber-600",
    border:  "border-amber-100",
    shadow:  "shadow-amber-100",
  },
  slate: {
    bg:      "bg-slate-600",
    light:   "bg-slate-50",
    text:    "text-slate-700",
    value:   "text-slate-600",
    border:  "border-slate-100",
    shadow:  "shadow-slate-100",
  },
};

const DashboardCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color    = "blue",
  delay    = 0,
  onClick,
  trend,
  trendUp,
}) => {
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      whileHover={onClick ? { y: -3, transition: { duration: 0.15 } } : {}}
      onClick={onClick}
      className={`bg-white rounded-2xl border ${c.border} shadow-sm hover:shadow-md ${c.shadow} transition-all duration-200 p-6 ${onClick ? "cursor-pointer" : ""} overflow-hidden relative`}
    >
      {/* Subtle background glow */}
      <div className={`absolute -top-6 -right-6 w-24 h-24 ${c.light} rounded-full blur-2xl opacity-60 pointer-events-none`} />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          {Icon && (
            <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        {/* Value */}
        <p className={`text-3xl font-bold ${c.value} leading-none`}>{value}</p>

        {/* Subtitle & Trend */}
        <div className="flex items-center justify-between mt-2">
          {subtitle && (
            <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${trendUp ? "text-emerald-600" : "text-red-500"}`}>
              <TrendingUp className={`w-3.5 h-3.5 ${!trendUp && "rotate-180"}`} />
              {trend}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardCard;