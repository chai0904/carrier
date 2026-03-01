import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
