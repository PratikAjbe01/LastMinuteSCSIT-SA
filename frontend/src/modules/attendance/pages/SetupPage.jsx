import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Eye, EyeOff } from "lucide-react";
import { setupAdmin } from "../services/apiService";
import toast from "react-hot-toast";

const SetupPage = ({ onSetupComplete }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim())                     return "Full name is required";
    if (!form.email.trim())                    return "Email is required";
    if (!/\S+@\S+\.\S+/.test(form.email))     return "Enter a valid email";
    if (form.password.length < 6)             return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { toast.error(err); return; }

    setLoading(true);
    try {
      await setupAdmin({
        name:     form.name.trim(),
        email:    form.email.trim().toLowerCase(),
        password: form.password,
      });
      toast.success("Admin account created! Please log in.");
      onSetupComplete?.();       // tell App.jsx setup is done
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Setup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-500/10 rounded-xl mb-4">
            <Shield className="w-7 h-7 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Initial Setup</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create your admin account to get started. This can only be done once.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full Name</label>
            <input
              type="text" name="name" value={form.name} onChange={handleChange}
              placeholder="e.g. Dr. Ramesh Kumar" required
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg
                         text-white text-sm placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email" name="email" value={form.email} onChange={handleChange}
              placeholder="admin@college.edu" required
              className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg
                         text-white text-sm placeholder-slate-500
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"} name="password"
                value={form.password} onChange={handleChange}
                placeholder="Minimum 6 characters" required
                className="w-full px-4 py-2.5 pr-10 bg-slate-700 border border-slate-600 rounded-lg
                           text-white text-sm placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button type="button" onClick={() => setShowPass((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"} name="confirmPassword"
                value={form.confirmPassword} onChange={handleChange}
                placeholder="Re-enter password" required
                className="w-full px-4 py-2.5 pr-10 bg-slate-700 border border-slate-600 rounded-lg
                           text-white text-sm placeholder-slate-500
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {form.confirmPassword && (
              <p className={`text-xs mt-1 ${form.password === form.confirmPassword ? "text-green-400" : "text-red-400"}`}>
                {form.password === form.confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
              </p>
            )}
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800
                       text-white font-semibold rounded-lg text-sm transition-colors mt-2">
            {loading ? "Creating Account…" : "Create Admin Account"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPage;