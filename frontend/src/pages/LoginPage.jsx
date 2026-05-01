// LoginPage.jsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Loader, Eye, EyeOff, ArrowLeft, ShieldCheck, GraduationCap, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import toast from "react-hot-toast";

const ROLES = [
  { value: "student", label: "Student",  icon: GraduationCap },
  { value: "faculty", label: "Faculty",  icon: BookOpen },
  { value: "admin",   label: "Admin",    icon: ShieldCheck },
];

const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 bg-green-400/20 rounded-full"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{ y: [0, -40, 0], opacity: [0, 0.6, 0], scale: [0, 1, 0] }}
        transition={{ duration: Math.random() * 5 + 4, repeat: Infinity, delay: Math.random() * 4 }}
      />
    ))}
  </div>
);

const InputField = ({ icon: Icon, error, ...props }) => (
  <div className="relative group">
    <Icon size={16}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors z-10 pointer-events-none" />
    <input
      {...props}
      className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500
        bg-gray-800/80 border transition-all outline-none
        ${error
          ? "border-red-500/60 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
          : "border-gray-700/60 hover:border-gray-600 focus:border-green-500/60 focus:ring-2 focus:ring-green-500/15"
        }`}
    />
  </div>
);

const LoginPage = () => {
  const [form, setForm]               = useState({ email: "", password: "", role: "student" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginStep, setLoginStep]     = useState("credentials");
  const [code, setCode]               = useState(["", "", "", "", "", ""]);
  const inputRefs                     = useRef([]);

  const { login, verifyAdminOtp, isLoading, error, clearError } = useAuthStore();

  useEffect(() => { clearError(); }, [loginStep]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await login(form.email, form.password, form.role);
      if (res?.message === "OTP sent to your email.") { setLoginStep("otp"); return; }
      toast.success("Login successful");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const next = [...code];
    next[index] = value;
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    setCode(next);
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otp = code.join("");
    if (otp.length !== 6) return;
    try {
      await verifyAdminOtp(form.email, otp);
      toast.success("Admin verified");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 pt-24
      bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full
        bg-green-500/5 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full
        bg-blue-500/5 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {loginStep === "credentials" ? (
            <motion.div
              key="credentials"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/80
                shadow-2xl shadow-black/50 overflow-hidden"
            >
              {/* Header stripe */}
              <div className="relative px-8 pt-8 pb-6 border-b border-gray-800/60">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600
                    flex items-center justify-center shadow-lg shadow-green-500/25">
                    <BookOpen size={22} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400
                      text-transparent bg-clip-text">
                      Welcome Back
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 space-y-5">
                {/* Role selector */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
                    Sign in as
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {ROLES.map((r) => {
                      const Icon = r.icon;
                      const active = form.role === r.value;
                      return (
                        <button
                          key={r.value}
                          type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold
                            transition-all duration-200
                            ${active
                              ? "border-green-500/50 bg-green-500/10 text-green-400"
                              : "border-gray-800 bg-gray-800/40 text-gray-500 hover:border-gray-700 hover:text-gray-300"
                            }`}
                        >
                          <Icon size={16} />
                          {r.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-3">
                  <InputField
                    icon={Mail}
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />

                  <div className="relative group">
                    <Lock size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-green-400 transition-colors z-10 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl text-sm text-white placeholder-gray-500
                        bg-gray-800/80 border border-gray-700/60 hover:border-gray-600
                        focus:border-green-500/60 focus:ring-2 focus:ring-green-500/15 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  <div className="flex justify-end">
                    <Link to="/forgot-password"
                      className="text-xs text-gray-500 hover:text-green-400 transition-colors">
                      Forgot password?
                    </Link>
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20
                        rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white
                      bg-gradient-to-r from-green-500 to-emerald-500
                      hover:from-green-400 hover:to-emerald-400
                      shadow-lg shadow-green-500/20 hover:shadow-green-500/35
                      disabled:opacity-60 disabled:cursor-not-allowed
                      transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isLoading
                      ? <><Loader size={15} className="animate-spin" /> Signing in…</>
                      : "Sign In"
                    }
                  </button>
                </form>
              </div>

              <div className="px-8 py-4 bg-gray-950/50 border-t border-gray-800/60 text-center">
                <p className="text-sm text-gray-500">
                  Don't have an account?{" "}
                  <Link to="/signup" className="text-green-400 font-semibold hover:text-green-300 transition-colors">
                    Sign Up
                  </Link>
                </p>
              </div>
            </motion.div>
          ) : (
            /* OTP Step */
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-800/80
                shadow-2xl shadow-black/50 overflow-hidden"
            >
              <div className="relative px-8 pt-8 pb-6 border-b border-gray-800/60">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent pointer-events-none" />
                <button
                  onClick={() => setLoginStep("credentials")}
                  className="relative flex items-center gap-1.5 text-gray-500 hover:text-white
                    text-sm font-medium transition-colors mb-4"
                >
                  <ArrowLeft size={15} /> Back
                </button>
                <div className="relative flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600
                    flex items-center justify-center shadow-lg shadow-green-500/25">
                    <ShieldCheck size={22} className="text-white" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-white">Admin Verification</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Enter the 6-digit code sent to{" "}
                      <span className="text-green-400 font-medium">{form.email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6">
                <form onSubmit={handleOtpSubmit} className="space-y-5">
                  <div className="flex justify-center gap-2">
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        value={digit}
                        maxLength={1}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className={`w-12 h-14 text-center text-xl font-bold rounded-xl border
                          bg-gray-800/80 text-white outline-none transition-all
                          ${digit
                            ? "border-green-500/60 bg-green-500/8"
                            : "border-gray-700/60 hover:border-gray-600 focus:border-green-500/60 focus:ring-2 focus:ring-green-500/15"
                          }`}
                      />
                    ))}
                  </div>

                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs text-red-400 text-center bg-red-500/10 border border-red-500/20
                        rounded-lg px-3 py-2"
                    >
                      {error}
                    </motion.p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || code.join("").length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white
                      bg-gradient-to-r from-green-500 to-emerald-500
                      hover:from-green-400 hover:to-emerald-400
                      shadow-lg shadow-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    {isLoading
                      ? <><Loader size={15} className="animate-spin" /> Verifying…</>
                      : "Verify OTP"
                    }
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default LoginPage;