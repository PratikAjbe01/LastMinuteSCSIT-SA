// src/features/smart-attendance/layouts/DashboardLayout.jsx
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { IdentityAuthProvider } from "../hooks/useFingerPrint";

const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <IdentityAuthProvider>
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 flex">

      {/* ── Sidebar — full height, left edge ── */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* ── Right column: Navbar + Content ── */}
      <div className="flex flex-col flex-1 min-w-0 h-screen overflow-hidden">

        {/* Navbar sits above content, width = remaining space */}
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="min-h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
    </IdentityAuthProvider>
  );
};

export default DashboardLayout;