// src/features/smart-attendance/components/Loader.jsx
import { motion } from "framer-motion";

const Loader = ({ fullScreen = false, size = "md", text = "" }) => {
  const sizeMap = {
    sm: { outer: "w-8 h-8",  inner: "w-4 h-4",  gap: "gap-2" },
    md: { outer: "w-12 h-12", inner: "w-6 h-6", gap: "gap-3" },
    lg: { outer: "w-16 h-16", inner: "w-8 h-8", gap: "gap-4" },
  };
  const s = sizeMap[size] || sizeMap.md;

  const Spinner = (
    <div className={`flex flex-col items-center ${s.gap}`}>
      {/* Ring spinner */}
      <div className={`${s.outer} relative flex-shrink-0`}>
        {/* Outer track */}
        <div className={`absolute inset-0 rounded-full border-[3px] border-slate-200`} />
        {/* Spinning arc */}
        <motion.div
          className={`absolute inset-0 rounded-full border-[3px] border-transparent border-t-blue-600 border-r-blue-400`}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
        />
        {/* Center dot */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className={`${s.inner === "w-4 h-4" ? "w-1.5 h-1.5" : s.inner === "w-6 h-6" ? "w-2 h-2" : "w-3 h-3"} bg-blue-500 rounded-full`} />
        </div>
      </div>

      {text && (
        <p className="text-sm text-slate-500 font-medium">{text}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        {Spinner}
      </div>
    );
  }

  return Spinner;
};

export default Loader;