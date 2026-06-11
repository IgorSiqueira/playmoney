"use client";
import { useRef, MouseEvent, ReactNode, CSSProperties } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  intensity?: number;
}

export function TiltCard({ children, className = "", style, intensity = 10 }: Props) {
  const innerRef = useRef<HTMLDivElement>(null);

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    const outer = e.currentTarget.getBoundingClientRect();
    const cx = outer.left + outer.width / 2;
    const cy = outer.top + outer.height / 2;
    const rx = ((e.clientY - cy) / (outer.height / 2)) * -intensity;
    const ry = ((e.clientX - cx) / (outer.width / 2)) * intensity;
    if (innerRef.current) {
      innerRef.current.style.transform =
        `perspective(700px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
    }
  }

  function onMouseLeave() {
    if (innerRef.current) {
      innerRef.current.style.transform =
        "perspective(700px) rotateX(0deg) rotateY(0deg) scale(1)";
    }
  }

  return (
    <div
      className={className}
      style={style}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={innerRef}
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 0.18s ease",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
