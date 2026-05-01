// src/features/smart-attendance/components/QRCodeDisplay.jsx
import { motion, AnimatePresence } from "framer-motion";
import QRCode                      from "react-qr-code";
import { RefreshCw, Clock, Shield } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const QR_REFRESH_MS  = 5000;
const LOGO_PATH      = "/authfavicon.png";
const QR_SIZE        = 200;
const LOGO_SIZE      = 36;   // center logo size in px
const LOGO_PADDING   = 4;    // white padding around logo
const LOGO_CONTAINER = LOGO_SIZE + LOGO_PADDING * 2;

// ── QR with center logo rendered on canvas ────────────────────────────────────
const QRWithLogo = ({ value, size = QR_SIZE }) => {
  const canvasRef  = useRef(null);
  const svgRef     = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!value) return;
    setReady(false);

    // Small tick to let the SVG render first
    const raf = requestAnimationFrame(async () => {
      const svg    = svgRef.current;
      const canvas = canvasRef.current;
      if (!svg || !canvas) return;

      const ctx = canvas.getContext("2d");
      canvas.width  = size;
      canvas.height = size;

      // ── Serialize SVG → image ───────────────────────────────────────────
      const svgData   = new XMLSerializer().serializeToString(svg);
      const svgBlob   = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl    = URL.createObjectURL(svgBlob);
      const qrImg     = new Image();

      qrImg.onload = () => {
        // Draw QR
        ctx.drawImage(qrImg, 0, 0, size, size);
        URL.revokeObjectURL(svgUrl);

        // ── Draw white rounded square behind logo ───────────────────────
        const x = (size - LOGO_CONTAINER) / 2;
        const y = (size - LOGO_CONTAINER) / 2;
        const r = 8; // border radius

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + LOGO_CONTAINER - r, y);
        ctx.quadraticCurveTo(x + LOGO_CONTAINER, y, x + LOGO_CONTAINER, y + r);
        ctx.lineTo(x + LOGO_CONTAINER, y + LOGO_CONTAINER - r);
        ctx.quadraticCurveTo(x + LOGO_CONTAINER, y + LOGO_CONTAINER, x + LOGO_CONTAINER - r, y + LOGO_CONTAINER);
        ctx.lineTo(x + r, y + LOGO_CONTAINER);
        ctx.quadraticCurveTo(x, y + LOGO_CONTAINER, x, y + LOGO_CONTAINER - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();

        // ── Draw logo image ─────────────────────────────────────────────
        const logo    = new Image();
        logo.onload  = () => {
          const lx = (size - LOGO_SIZE) / 2;
          const ly = (size - LOGO_SIZE) / 2;

          // Clip logo to rounded rect
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(lx + 4, ly);
          ctx.lineTo(lx + LOGO_SIZE - 4, ly);
          ctx.quadraticCurveTo(lx + LOGO_SIZE, ly, lx + LOGO_SIZE, ly + 4);
          ctx.lineTo(lx + LOGO_SIZE, ly + LOGO_SIZE - 4);
          ctx.quadraticCurveTo(lx + LOGO_SIZE, ly + LOGO_SIZE, lx + LOGO_SIZE - 4, ly + LOGO_SIZE);
          ctx.lineTo(lx + 4, ly + LOGO_SIZE);
          ctx.quadraticCurveTo(lx, ly + LOGO_SIZE, lx, ly + LOGO_SIZE - 4);
          ctx.lineTo(lx, ly + 4);
          ctx.quadraticCurveTo(lx, ly, lx + 4, ly);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logo, lx, ly, LOGO_SIZE, LOGO_SIZE);
          ctx.restore();

          setReady(true);
        };
        logo.onerror = () => {
          // Logo failed to load — still show QR without logo
          setReady(true);
        };
        logo.src = LOGO_PATH;
      };

      qrImg.onerror = () => setReady(true);
      qrImg.src = svgUrl;
    });

    return () => cancelAnimationFrame(raf);
  }, [value, size]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Hidden SVG — source for canvas rendering */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
        <QRCode
          ref={svgRef}
          value={value}
          size={size}
          level="H"  // High error correction — needed for center logo
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>

      {/* Visible canvas with logo composited in */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className={`rounded-lg transition-opacity duration-200 ${ready ? "opacity-100" : "opacity-0"}`}
        style={{ display: "block" }}
      />

      {/* Spinner while compositing */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-white rounded-lg">
          <RefreshCw className="w-6 h-6 text-slate-300 animate-spin" />
        </div>
      )}
    </div>
  );
};

// ── Main QRCodeDisplay ────────────────────────────────────────────────────────
const QRCodeDisplay = ({ sessionId, qrToken }) => {
  const [refreshProgress, setRefreshProgress] = useState(100);
  const [isRefreshing,    setIsRefreshing]    = useState(false);
  const [secondsLeft,     setSecondsLeft]     = useState(Math.ceil(QR_REFRESH_MS / 1000));

  useEffect(() => {
    if (!qrToken) return;

    setRefreshProgress(100);
    setSecondsLeft(Math.ceil(QR_REFRESH_MS / 1000));
    setIsRefreshing(true);
    const flashTimer = setTimeout(() => setIsRefreshing(false), 600);

    const startTime = Date.now();
    const tick = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct     = Math.max(0, 100 - (elapsed / QR_REFRESH_MS) * 100);
      const secs    = Math.max(0, Math.ceil((QR_REFRESH_MS - elapsed) / 1000));
      setRefreshProgress(pct);
      setSecondsLeft(secs);
      if (pct === 0) clearInterval(tick);
    }, 100);

    return () => { clearInterval(tick); clearTimeout(flashTimer); };
  }, [qrToken]);

  const qrValue = qrToken
    ? JSON.stringify({ sessionId, token: qrToken })
    : null;

  const barColor =
    refreshProgress > 60 ? "#10b981" :
    refreshProgress > 30 ? "#f59e0b" : "#ef4444";

  const barLabel =
    refreshProgress > 60 ? "text-emerald-600" :
    refreshProgress > 30 ? "text-amber-500"   : "text-red-500";

  return (
    <div className="flex flex-col items-center gap-4 w-full">

      {/* QR frame */}
      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={qrToken || "empty"}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="p-4 bg-white rounded-xl shadow-md border border-slate-100"
          >
            {qrValue ? (
              <QRWithLogo value={qrValue} size={QR_SIZE} />
            ) : (
              <div
                className="flex flex-col items-center justify-center bg-slate-50
                  rounded-lg border border-dashed border-slate-300 gap-3"
                style={{ width: QR_SIZE, height: QR_SIZE }}
              >
                <RefreshCw className="w-8 h-8 text-slate-300 animate-spin" />
                <p className="text-xs text-slate-400 font-medium text-center px-4">
                  Generating secure token...
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Refresh flash badge */}
        <AnimatePresence>
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-2.5 -right-2.5 w-8 h-8 bg-emerald-500 rounded-full
                flex items-center justify-center shadow-lg shadow-emerald-200/60"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Countdown bar */}
      {qrToken && (
        <div className="w-full max-w-[240px] space-y-2">
          <div className="relative h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              animate={{ width: `${refreshProgress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400 font-medium">Rotates in</span>
            </div>
            <span className={`text-xs font-bold font-mono ${barLabel}`}>
              {secondsLeft}s
            </span>
          </div>
        </div>
      )}

      {/* Token info */}
      {qrToken && (
        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200
          rounded-xl w-full max-w-[240px]">
          <Shield className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-medium leading-none">Active Token</p>
            <p className="text-xs font-mono text-blue-600 font-semibold mt-0.5 truncate">
              {qrToken.slice(0, 16)}…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;