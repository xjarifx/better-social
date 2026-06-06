import { motion } from "framer-motion";
import { pageVariants } from "@/lib/motion";
import type { PageTransitionProps } from "@/types/shared";

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}
