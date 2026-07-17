import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const [prevTarget, setPrevTarget] = useState(target);

  if (target !== prevTarget) {
    setPrevTarget(target);
    if (target === 0) setVal(0);
  }

  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) return;
    
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      setVal(eased * target);
      if (progress < 1) rafId.current = requestAnimationFrame(animate);
    };
    rafId.current = requestAnimationFrame(animate);
    return () => { 
      if (rafId.current) cancelAnimationFrame(rafId.current); 
    };
  }, [target, duration]);

  return val;
}
