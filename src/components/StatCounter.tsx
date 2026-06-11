"use client";
import { useEffect, useRef, useState } from "react";

interface Props {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

export function StatCounter({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  duration = 1800,
  className = "",
}: Props) {
  const [value, setValue] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;

        const startTime = performance.now();
        function tick(now: number) {
          const elapsed = now - startTime;
          const p = Math.min(elapsed / duration, 1);
          // ease out cubic
          const eased = 1 - Math.pow(1 - p, 3);
          setValue(parseFloat((eased * to).toFixed(decimals)));
          if (p < 1) requestAnimationFrame(tick);
          else setValue(to);
        }
        requestAnimationFrame(tick);
      },
      { threshold: 0.6 }
    );

    if (spanRef.current) observer.observe(spanRef.current);
    return () => observer.disconnect();
  }, [to, decimals, duration]);

  const display =
    decimals > 0
      ? value.toFixed(decimals)
      : value >= 1000
      ? (value / 1000).toFixed(1)
      : String(Math.round(value));

  return (
    <span ref={spanRef} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
}
