import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

/**
 * Wraps every routed page in a subtle fade + slide. Keyed on pathname so route
 * changes trigger AnimatePresence exit/enter cleanly without layout jumps.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{    opacity: 0, y: -6 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

/** Stagger container — children opt-in via FadeInItem. */
export const Stagger: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0.05 }) => (
  <motion.div
    className={className}
    initial="hidden"
    animate="show"
    variants={{
      hidden: {},
      show:   { transition: { staggerChildren: delay } },
    }}
  >
    {children}
  </motion.div>
);

/** Child item used inside <Stagger>. */
export const FadeInItem: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => (
  <motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 10 },
      show:   { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
    }}
  >
    {children}
  </motion.div>
);
