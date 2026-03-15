"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

interface GreetingSectionProps {
  greeting: string;
  subtitle: string;
}

export function GreetingSection({ greeting, subtitle }: GreetingSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.6], [0, -20]);

  return (
    <motion.div ref={ref} style={{ opacity, y }}>
      <h1 className="text-display text-foreground">{greeting}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </motion.div>
  );
}
