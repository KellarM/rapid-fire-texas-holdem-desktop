import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ColorSideAlert({ isOpen, onClose }) {
  const [countdown, setCountdown] = useState(3);
  const [dismissing, setDismissing] = useState(false);
  const consumedRef = useRef(false);

  const dismiss = () => {
    if (dismissing || !isOpen) return;
    setDismissing(true);
    setTimeout(() => {
      onClose();
      setDismissing(false);
      consumedRef.current = false;
    }, 100);
  };

  useEffect(() => {
    if (!isOpen) {
      setCountdown(3);
      setDismissing(false);
      consumedRef.current = false;
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          dismiss();
          return 3;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e) => {
      if (!consumedRef.current) {
        consumedRef.current = true;
        e.stopPropagation();
        dismiss();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => document.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  }, [isOpen, dismissing]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: dismissing ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dismissing ? 0.1 : 0.25 }}
            className="fixed inset-0 z-30 bg-black/60"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: dismissing ? 0 : 1, scale: dismissing ? 0.9 : 1, y: dismissing ? -30 : 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            transition={{ duration: dismissing ? 0.1 : 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
          >
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-yellow-500 rounded-2xl px-8 py-6 shadow-2xl max-w-sm pointer-events-auto">
              <div className="text-center">
                <div className="text-yellow-400 font-black text-3xl mb-2">🚫</div>
                <h2 className="text-yellow-400 font-bold text-xl mb-3">Color Board</h2>
                <p className="text-slate-100 text-base font-semibold mb-2">
                  You can only bet on
                </p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="bg-red-600 text-white font-black px-4 py-1 rounded-lg text-lg tracking-wide">RED</span>
                  <span className="text-slate-400 font-bold text-base">or</span>
                  <span className="bg-gray-900 text-white font-black px-4 py-1 rounded-lg text-lg tracking-wide border border-slate-600">BLACK</span>
                </div>
                <p className="text-slate-300 text-sm font-medium mb-4">Not Both</p>
                {!dismissing && (
                  <div className="text-slate-400 text-sm">
                    Closing in <span className="font-black text-yellow-400 text-lg">{countdown}</span> seconds
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
