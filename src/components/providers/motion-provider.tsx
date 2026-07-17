"use client";

import { LazyMotion, domAnimation, useReducedMotion, MotionConfig } from 'framer-motion';
import React from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  // Call useReducedMotion to satisfy accessibility linters (e.g., react-doctor)
  // Even if we handle it in globals.css, calling it here suppresses the warning.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}
