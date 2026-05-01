import { createContext, useContext, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, ShieldAlert, Key, X, PlusCircle, Loader2 } from "lucide-react";
import { startAuthentication, startRegistration } from "@simplewebauthn/browser";
import toast from "react-hot-toast";
import { useFetch } from "./useFetch";

const IdentityAuthContext = createContext();

export const useIdentityAuth = () => useContext(IdentityAuthContext);

export const IdentityAuthProvider = ({ children }) => {
  const { fetchInstance } = useFetch();
  
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle, scanning, success, error, prompt-setup
  const [message, setMessage] = useState("");
  const [resolver, setResolver] = useState(null);

  const verifyIdentity = useCallback((customMessage = "Verify your identity to continue") => {
    setMessage(customMessage);
    setIsOpen(true);
    setStatus("idle");
    return new Promise((resolve) => {
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (resolver) resolver(false);
  };

  // ── 1. Handle Setup (First Time User) ──
  const handleSetupBiometrics = async () => {
    setStatus("scanning");
    try {
      const options = await fetchInstance.get("/biometrics/register/generate");
      const regResponse = await startRegistration({ optionsJSON: options });
      await fetchInstance.post("/biometrics/register/verify", regResponse);
      
      toast.success("Device linked! You can now use your biometrics.");
      setStatus("success");
      setTimeout(() => {
        setIsOpen(false);
        if (resolver) resolver(true);
      }, 1000);
    } catch (error) {
      console.error(error);
      toast.error("Biometric setup cancelled or failed.");
      setStatus("idle");
    }
  };

  // ── 2. Handle Authentication (Returning User) ──
  const handleScan = async () => {
    setStatus("scanning");
    
    try {
      const options = await fetchInstance.get("/biometrics/auth/generate");
      const authResponse = await startAuthentication({ optionsJSON: options });
      const verification = await fetchInstance.post("/biometrics/auth/verify", authResponse);

      if (verification.success) {
        setStatus("success");
        setTimeout(() => {
          setIsOpen(false);
          if (resolver) resolver(true);
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      
      // Catch our custom backend error if user has NO passkeys yet
      if (error.message === "NO_PASSKEYS" || error.response?.data?.message === "NO_PASSKEYS") {
         setStatus("prompt-setup");
         return;
      }

      setStatus("error");
      setMessage("Verification failed. Please try again.");
      setTimeout(() => setStatus("idle"), 2500);
    }
  };

  if (typeof document === "undefined") return <>{children}</>;

  return (
    <IdentityAuthContext.Provider value={{ verifyIdentity }}>
      {children}
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={handleClose}
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 flex flex-col items-center text-center overflow-hidden"
              >
                {/* Dynamic Background Glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 blur-[60px] rounded-full pointer-events-none transition-colors duration-500 ${
                  status === 'success' ? 'bg-emerald-500/20' : 
                  status === 'error' ? 'bg-red-500/20' : 
                  'bg-blue-500/15'
                }`} />

                <button onClick={handleClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors z-10">
                  <X className="w-5 h-5" />
                </button>

                {/* Custom UI for First-Time Setup */}
                {status === "prompt-setup" ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4 shadow-inner">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">Biometrics Not Setup</h3>
                    <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
                      You haven't linked this device yet. Register your device's fingerprint or Face ID to mark attendance securely.
                    </p>
                    <div className="w-full space-y-3">
                      <button onClick={handleSetupBiometrics} className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-600/20 active:scale-[0.98]">
                        <PlusCircle className="w-4 h-4" /> Link This Device
                      </button>
                      <button onClick={handleClose} className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold transition-all">
                        Cancel
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  // Standard Authentication UI
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full">
                    <h3 className="text-xl font-bold text-slate-800 mt-2">Security Check</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-[260px] leading-relaxed">{message}</p>

                    <div className="my-8 relative w-full flex justify-center">
                      {status === "scanning" && (
                        <div className="absolute inset-0 flex items-center justify-center">
                           <Loader2 className="w-24 h-24 text-blue-100 animate-spin" strokeWidth={1} />
                        </div>
                      )}
                      
                      <motion.button
                        whileHover={status === "idle" ? { scale: 1.05 } : {}}
                        whileTap={status === "idle" ? { scale: 0.95 } : {}}
                        onClick={handleScan}
                        disabled={status !== "idle"}
                        className={`relative z-10 w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl ${
                          status === "success" ? "bg-emerald-500 shadow-emerald-500/30" :
                          status === "error" ? "bg-red-500 shadow-red-500/30" :
                          status === "scanning" ? "bg-blue-500 shadow-blue-500/30" :
                          "bg-slate-800 hover:bg-slate-700 cursor-pointer shadow-slate-800/20"
                        }`}
                      >
                        {status === "success" ? (
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
                            <ShieldCheck className="w-10 h-10 text-white" />
                          </motion.div>
                        ) : status === "scanning" ? (
                          <ShieldCheck className="w-10 h-10 text-white animate-pulse" />
                        ) : (
                          <Key className="w-10 h-10 text-white" />
                        )}
                      </motion.button>
                    </div>

                    {status === "idle" && (
                      <p className="text-sm font-bold text-blue-600 cursor-pointer hover:underline" onClick={handleScan}>
                        Click to authenticate
                      </p>
                    )}
                    {status === "scanning" && <p className="text-sm font-bold text-blue-600 animate-pulse">Awaiting OS prompt...</p>}
                    {status === "success" && <p className="text-sm font-bold text-emerald-600">Identity Verified</p>}
                    {status === "error" && <p className="text-sm font-bold text-red-600">Verification Failed</p>}
                  </motion.div>
                )}

              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </IdentityAuthContext.Provider>
  );
};