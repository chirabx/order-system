import { motion } from "framer-motion";

export default function Skeleton({ className = "" }) {
  return (
    <motion.div
      initial={{ scaleY: 0, opacity: 0.7 }}
      animate={{ scaleY: 1, opacity: 1 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
      style={{ transformOrigin: "top" }}
      className={`animate-pulse rounded-md bg-stone-200/80 dark:bg-slate-800 ${className}`}
      aria-hidden="true"
    />
  );
}
