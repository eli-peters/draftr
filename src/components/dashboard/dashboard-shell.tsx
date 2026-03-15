"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10 gradient-crimson"
    >
      {children}
    </motion.div>
  );
}
