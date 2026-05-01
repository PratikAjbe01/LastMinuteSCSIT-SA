// src/features/smart-attendance/components/ScannerComponent.jsx
import { useEffect, useRef, useState, useCallback } from "react";
import { motion }                                    from "framer-motion";
import {
  CameraOff, RefreshCw, AlertCircle,
  Camera, Zap, Shield,
} from "lucide-react";

// Override html5-qrcode injected styles that cause black screen
const SCANNER_STYLES = `
  #qr-reader {
    border: none !important;
    padding: 0 !important;
    background: transparent !important;
  }
  #qr-reader__scan_region {
    background: transparent !important;
    border: none !important;
    min-height: unset !important;
  }
  #qr-reader__scan_region img {
    display: none !important;
  }
  #qr-reader video {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border-radius: 16px !important;
    display: block !important;
  }
  #qr-reader__dashboard {
    display: none !important;
  }
  #qr-reader__status_span {
    display: none !important;
  }
`;

const ScannerComponent = ({ onScan }) => {
  const [camState, setCamState] = useState("starting");
  const [errorMsg, setErrorMsg] = useState("");

  const html5QrRef = useRef(null);
  const startedRef = useRef(false);
  const onScanRef  = useRef(onScan);

  // Keep callback fresh without restarting camera
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);

  const stopScanner = useCallback(async () => {
    if (html5QrRef.current && startedRef.current) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current.clear();
      } catch (_) {}
      html5QrRef.current = null;
      startedRef.current = false;
    }
  }, []);

  const startScanner = useCallback(async () => {
    if (startedRef.current) return;

    setCamState("starting");
    setErrorMsg("");

    try {
      // Step 1 — Explicitly request permission first.
      // This shows the browser dialog immediately and gives us
      // the stream to verify the camera actually works.
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode:  { ideal: "environment" },
          width:       { ideal: 1280 },
          height:      { ideal: 720 },
        },
      });

      // Stop the test stream — html5-qrcode will open its own
      stream.getTracks().forEach((t) => t.stop());

      // Step 2 — Let html5-qrcode mount AFTER we confirmed permission
      const { Html5Qrcode } = await import("html5-qrcode");

      // Clear any leftover DOM from previous init
      const container = document.getElementById("qr-reader");
      if (!container) return;
      container.innerHTML = "";

      html5QrRef.current = new Html5Qrcode("qr-reader", { verbose: false });
      startedRef.current = true;

      await html5QrRef.current.start(
        { facingMode: "environment" },
        {
          fps:         20,
          qrbox:       { width: 220, height: 220 },
          aspectRatio: 1.333,
          // Let the library size the video naturally inside our container
          disableFlip: false,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true,
          },
        },
        (decodedText) => onScanRef.current?.(decodedText),
        () => {}
      );

      setCamState("active");
      console.log("[Scanner] Camera started ✅");
    } catch (err) {
      startedRef.current = false;
      console.error("[Scanner] Error:", err.name, err.message);

      if (
        err?.name === "NotAllowedError" ||
        err?.name === "PermissionDeniedError" ||
        err?.message?.toLowerCase().includes("permission") ||
        err?.message?.toLowerCase().includes("denied")
      ) {
        setCamState("denied");
        setErrorMsg("Camera permission was denied.");
      } else if (
        err?.name === "NotFoundError" ||
        err?.name === "DevicesNotFoundError"
      ) {
        setCamState("error");
        setErrorMsg("No camera found on this device.");
      } else if (err?.name === "NotReadableError") {
        setCamState("error");
        setErrorMsg("Camera is being used by another app. Close it and retry.");
      } else {
        setCamState("error");
        setErrorMsg(`Could not start camera: ${err.message || "Unknown error"}`);
      }
    }
  }, []);

  // Start immediately on mount
  useEffect(() => {
    startScanner();
    return () => { stopScanner(); };
  }, []); // eslint-disable-line

  const handleRetry = useCallback(async () => {
    await stopScanner();
    // Small gap so browser releases camera track
    setTimeout(startScanner, 150);
  }, [stopScanner, startScanner]);

  return (
    <>
      {/* Inject style overrides for html5-qrcode internals */}
      <style>{SCANNER_STYLES}</style>

      <div className="flex flex-col items-center gap-5 w-full">

        {/* ── Viewfinder container ── */}
        <div className="relative w-full max-w-[320px] mx-auto">

          {/* Fixed-size wrapper that clips the video */}
          <div
            className="relative w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700/60 shadow-xl"
            style={{ aspectRatio: "1 / 1" }}
          >
            {/* html5-qrcode mounts video here */}
            <div
              id="qr-reader"
              className="absolute inset-0 w-full h-full"
              style={{ background: "transparent" }}
            />

            {/* ── Overlay: only shown when active ── */}
            {camState === "active" && (
              <div className="absolute inset-0 pointer-events-none">

                {/* Vignette */}
                <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />

                {/* Scan frame */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative w-52 h-52">

                    {/* Pulsing border */}
                    <motion.div
                      className="absolute inset-0 rounded-xl border border-blue-400/40"
                      animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.97, 1.03, 0.97] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />

                    {/* Corner brackets */}
                    {[
                      "top-0    left-0   border-t-[3px] border-l-[3px] rounded-tl-xl",
                      "top-0    right-0  border-t-[3px] border-r-[3px] rounded-tr-xl",
                      "bottom-0 left-0   border-b-[3px] border-l-[3px] rounded-bl-xl",
                      "bottom-0 right-0  border-b-[3px] border-r-[3px] rounded-br-xl",
                    ].map((cls, i) => (
                      <div
                        key={i}
                        className={`absolute w-9 h-9 border-blue-400 ${cls}`}
                      />
                    ))}

                    {/* Scan line */}
                    <motion.div
                      className="absolute left-2 right-2 h-0.5 rounded-full
                        bg-gradient-to-r from-transparent via-blue-400 to-transparent
                        shadow-[0_0_8px_2px_rgba(96,165,250,0.6)]"
                      animate={{ top: ["12%", "88%", "12%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    />
                  </div>
                </div>

                {/* Live badge */}
                <div className="absolute top-3 left-3 flex items-center gap-1.5
                  bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                  <motion.span
                    className="w-1.5 h-1.5 bg-emerald-400 rounded-full"
                    animate={{ opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                  <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                    Live
                  </span>
                </div>

                {/* Token badge */}
                {/* <div className="absolute top-3 right-3
                  bg-black/60 backdrop-blur-sm px-2.5 py-1.5 rounded-full">
                  <span className="text-blue-300 text-[10px] font-semibold">5s tokens</span>
                </div> */}
              </div>
            )}

            {/* ── Starting overlay ── */}
            {camState === "starting" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center
                bg-slate-900 rounded-2xl gap-4 z-10">
                <div className="w-14 h-14 bg-blue-500/15 rounded-2xl
                  flex items-center justify-center">
                  <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
                </div>
                <div className="text-center px-6">
                  <p className="text-white text-sm font-semibold">Opening Camera</p>
                  <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                    Allow camera access when your browser asks
                  </p>
                </div>
              </div>
            )}

            {/* ── Permission denied overlay ── */}
            {camState === "denied" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center
                bg-slate-900 rounded-2xl gap-4 p-6 text-center z-10">
                <div className="w-14 h-14 bg-red-500/15 rounded-2xl
                  flex items-center justify-center">
                  <CameraOff className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Camera Access Blocked</p>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{errorMsg}</p>
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-500/10
                  border border-amber-500/25 rounded-xl text-left">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300 leading-relaxed">
                    Click the <strong className="text-amber-200">🔒 lock icon</strong> in
                    your browser address bar → Camera → Allow
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 py-2.5
                    bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold
                    rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Reload & Retry
                </button>
              </div>
            )}

            {/* ── Generic error overlay ── */}
            {camState === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center
                bg-slate-900 rounded-2xl gap-4 p-6 text-center z-10">
                <div className="w-14 h-14 bg-amber-500/15 rounded-2xl
                  flex items-center justify-center">
                  <Camera className="w-7 h-7 text-amber-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Camera Unavailable</p>
                  <p className="text-slate-400 text-xs mt-2 leading-relaxed">{errorMsg}</p>
                </div>
                <button
                  onClick={handleRetry}
                  className="w-full flex items-center justify-center gap-2 py-2.5
                    bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold
                    rounded-xl transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Try Again
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Instructions — only when active ── */}
        {camState === "active" && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-1"
          >
            <p className="text-sm font-semibold text-slate-700 flex items-center justify-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-500" />
              Align QR code within the frame
            </p>
            <p className="text-xs text-slate-400">
              Point at the QR on your faculty's screen
            </p>
          </motion.div>
        )}
      </div>
    </>
  );
};

export default ScannerComponent;