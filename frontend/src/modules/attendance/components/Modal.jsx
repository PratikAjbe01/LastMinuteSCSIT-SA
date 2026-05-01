// src/features/smart-attendance/components/Modal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-md",
  hideHeader = false,
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          key="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="absolute !inset-0 bg-slate-900/50 backdrop-blur-sm"
        />

        {/* Panel */}
        <motion.div
          key="modal-panel"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className={`relative w-full ${maxWidth} bg-white rounded-2xl shadow-2xl shadow-slate-300/40 border border-slate-200 overflow-hidden`}
        >
          {/* Header */}
          {!hideHeader && (
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 text-base">{title}</h3>
                {subtitle && (
                  <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="max-h-[80vh] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default Modal;