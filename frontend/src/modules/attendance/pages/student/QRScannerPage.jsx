// src/features/smart-attendance/pages/student/QRScannerPage.jsx
import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence }   from "framer-motion";
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle,
  Clock, QrCode, Wifi, Lock, RefreshCw,
  Shield, Info, Camera,
} from "lucide-react";
import { useNavigate }            from "react-router-dom";
import { markAttendance }         from "../../services/attendanceService";
import ScannerComponent           from "../../components/ScannerComponent";
import { useAuthStore }           from "../../../../store/authStore";

const RESET_DELAY = 6000;

const STATES = {
  success: {
    icon:      CheckCircle,
    color:     "text-emerald-600",
    bg:        "bg-emerald-50",
    border:    "border-emerald-200",
    ring:      "ring-emerald-100",
    label:     "Attendance Recorded",
    badge:     "bg-emerald-100 text-emerald-700",
    barColor:  "bg-emerald-500",
  },
  duplicate: {
    icon:      Clock,
    color:     "text-amber-600",
    bg:        "bg-amber-50",
    border:    "border-amber-200",
    ring:      "ring-amber-100",
    label:     "Already Marked",
    badge:     "bg-amber-100 text-amber-700",
    barColor:  "bg-amber-400",
  },
  expired: {
    icon:      Clock,
    color:     "text-orange-500",
    bg:        "bg-orange-50",
    border:    "border-orange-200",
    ring:      "ring-orange-100",
    label:     "QR Expired",
    badge:     "bg-orange-100 text-orange-700",
    barColor:  "bg-orange-400",
  },
  invalid: {
    icon:      XCircle,
    color:     "text-red-500",
    bg:        "bg-red-50",
    border:    "border-red-200",
    ring:      "ring-red-100",
    label:     "Invalid QR Code",
    badge:     "bg-red-100 text-red-700",
    barColor:  "bg-red-400",
  },
  network: {
    icon:      Wifi,
    color:     "text-red-500",
    bg:        "bg-red-50",
    border:    "border-red-200",
    ring:      "ring-red-100",
    label:     "Network Error",
    badge:     "bg-red-100 text-red-700",
    barColor:  "bg-red-400",
  },
  denied: {
    icon:      Shield,
    color:     "text-violet-600",
    bg:        "bg-violet-50",
    border:    "border-violet-200",
    ring:      "ring-violet-100",
    label:     "Access Denied",
    badge:     "bg-violet-100 text-violet-700",
    barColor:  "bg-violet-400",
  },
  error: {
    icon:      AlertCircle,
    color:     "text-red-600",
    bg:        "bg-red-50",
    border:    "border-red-200",
    ring:      "ring-red-100",
    label:     "Scan Failed",
    badge:     "bg-red-100 text-red-700",
    barColor:  "bg-red-400",
  },
};

const TIPS = [
  {
    icon:  Camera,
    title: "Hold Steady",
    text:  "Keep your phone still and ensure good lighting for fastest detection.",
  },
  {
    icon:  Wifi,
    title: "College Network Required",
    text:  "You must be connected to the college WiFi to mark attendance.",
  },
  {
    icon:  Lock,
    title: "5-Second Tokens",
    text:  "QR codes rotate every 5 seconds — scan the code currently shown.",
  },
  {
    icon:  Info,
    title: "One Scan Per Session",
    text:  "Attendance can only be marked once per class session.",
  },
];

// ── Result overlay ────────────────────────────────────────────────────────────
const ScanResult = ({ scanState, message, onReset }) => {
  const cfg = STATES[scanState];
  if (!cfg) return null;

  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, scale: 0.92, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, y: 8 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className="flex flex-col items-center gap-5 py-4 text-center w-full max-w-xs mx-auto"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, rotate: -90 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", damping: 14, delay: 0.08 }}
        className={`w-24 h-24 ${cfg.bg} border-2 ${cfg.border}
          rounded-2xl flex items-center justify-center ring-8 ${cfg.ring}`}
      >
        <cfg.icon className={`w-12 h-12 ${cfg.color}`} />
      </motion.div>

      {/* Label + message */}
      <div className="space-y-2">
        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${cfg.badge}`}>
          {cfg.label}
        </span>
        <p className="text-slate-600 text-sm leading-relaxed">{message}</p>
      </div>

      {/* Auto-reset progress */}
      <div className="w-full space-y-1.5">
        <p className="text-xs text-slate-400">Scanner resets automatically…</p>
        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: "0%" }}
            transition={{ duration: RESET_DELAY / 1000, ease: "linear" }}
            className={`h-full rounded-full ${cfg.barColor}`}
          />
        </div>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700
          text-white rounded-xl text-sm font-semibold transition-colors active:scale-95"
      >
        <QrCode className="w-4 h-4" /> Scan Again
      </button>
    </motion.div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const QRScannerPage = () => {
  const { token } = useAuthStore();
  const navigate  = useNavigate();

  const [scanState,    setScanState]    = useState("idle");
  const [message,      setMessage]      = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Refs to avoid stale closures without re-creating handleScan
  const isProcessingRef  = useRef(false);
  const lastScannedRef   = useRef("");
  const resetTimerRef    = useRef(null);

  const isDone = scanState !== "idle";

  // Cleanup on unmount
  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
  }, []);

  const reset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setScanState("idle");
    setMessage("");
    setIsProcessing(false);
    isProcessingRef.current = false;
    lastScannedRef.current  = "";
  }, []);

  const scheduleReset = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetTimerRef.current = setTimeout(reset, RESET_DELAY);
  }, [reset]);

  // ── Core scan handler — stable ref, camera never restarts ────────────────
  const handleScan = useCallback(async (rawText) => {
    // Deduplicate rapid successive reads of same QR
    if (isProcessingRef.current)          return;
    if (rawText === lastScannedRef.current) return;

    isProcessingRef.current = true;
    lastScannedRef.current  = rawText;
    setIsProcessing(true);

    // ── 1. Parse QR payload ─────────────────────────────────────────────────
    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      setScanState("invalid");
      setMessage("QR format not recognized. Make sure you scan the AttendEase attendance QR.");
      setIsProcessing(false);
      isProcessingRef.current = false;
      scheduleReset();
      return;
    }

    const { sessionId, token: qrToken } = parsed;
    if (!sessionId || !qrToken) {
      setScanState("invalid");
      setMessage("Incomplete QR data. Scan the QR code shown on your faculty's screen.");
      setIsProcessing(false);
      isProcessingRef.current = false;
      scheduleReset();
      return;
    }

    // ── 2. Submit to backend ────────────────────────────────────────────────
    try {
      const { ok, status, data } = await markAttendance(sessionId, qrToken, token);

      if (ok && data.success) {
        setScanState("success");
        setMessage(data.message || "Your attendance has been recorded successfully!");
      } else if (status === 409) {
        setScanState("duplicate");
        setMessage("Attendance already marked for this session.");
      } else if (
        status === 400 &&
        data.message?.toLowerCase().includes("expired")
      ) {
        setScanState("expired");
        setMessage("This QR has expired. Please scan the updated code shown on the screen.");
      } else if (status === 403) {
        // Could be IP restriction or not enrolled
        setScanState("denied");
        setMessage(
          data.message ||
          "Access denied. Ensure you are connected to the authorized college network."
        );
      } else if (status === 400 && data.message?.toLowerCase().includes("session")) {
        setScanState("error");
        setMessage(data.message || "This session has already ended.");
      } else {
        setScanState("error");
        setMessage(data.message || "Could not process attendance. Please try again.");
      }
    } catch {
      setScanState("network");
      setMessage("Network error. Check your WiFi connection and try again.");
    }

    setIsProcessing(false);
    isProcessingRef.current = false;
    scheduleReset();
  }, [token, scheduleReset]); // stable — no isProcessing state dep

  return (
    <div className="min-h-screen bg-slate-50 pb-8">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600
              transition-all active:scale-95 flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center flex-shrink-0">
                <QrCode className="w-3 h-3 text-white" />
              </div>
              <h1 className="text-base font-bold text-slate-800 leading-none">
                Mark Attendance
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Scan the QR code shown by your faculty
            </p>
          </div>

          {/* Processing indicator */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200
                  rounded-full flex-shrink-0"
              >
                <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                <span className="text-xs text-blue-600 font-semibold">Verifying…</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-5">

        {/* ── Scanner Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          {/* Card header */}
          <div className="flex items-center justify-between px-5 py-3.5
            bg-gradient-to-r from-blue-600 to-blue-500">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-2 h-2 bg-white rounded-full"
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <p className="text-white text-sm font-semibold">
                {isDone ? "Scan Result" : "Camera Active — Align QR Code"}
              </p>
            </div>
            <Shield className="w-4 h-4 text-blue-200" />
          </div>

          {/* Content — camera OR result */}
          <div className="p-5">
            <AnimatePresence mode="wait">
              {!isDone ? (
                <motion.div
                  key="scanner"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  {/*
                    CRITICAL: ScannerComponent is always mounted here.
                    We do NOT unmount/remount it on isProcessing — instead
                    handleScan uses isProcessingRef to debounce at the logic
                    level while the camera viewfinder stays live.
                  */}
                  <ScannerComponent
                    onScan={handleScan}
                    active={!isDone}
                  />
                </motion.div>
              ) : (
                <ScanResult
                  key="result"
                  scanState={scanState}
                  message={message}
                  onReset={reset}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Tips ── */}
        <div className="grid grid-cols-2 gap-3">
          {TIPS.map(({ icon: Icon, title, text }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5
                flex flex-col gap-2.5"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700">{title}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{text}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Status Footer ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-3 bg-white
            border border-slate-200 rounded-2xl shadow-sm"
        >
          <span className={`w-2 h-2 rounded-full animate-pulse
            ${isProcessing ? "bg-blue-400" : "bg-emerald-400"}`}
          />
          <span className="text-xs text-slate-400 font-medium">
            {isProcessing
              ? "Processing scan…"
              : "Ready to scan · 5-second token rotation"
            }
          </span>
        </motion.div>
      </div>
    </div>
  );
};

export default QRScannerPage;