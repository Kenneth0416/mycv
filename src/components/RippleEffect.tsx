"use client";

import { useState, useEffect, useCallback } from "react";

type Ripple = {
  id: number;
  x: number;
  y: number;
};

export default function RippleEffect() {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: MouseEvent) => {
    const ripple = {
      id: Date.now(),
      x: e.clientX,
      y: e.clientY,
    };
    setRipples((prev) => [...prev, ripple]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
    }, 600);
  }, []);

  useEffect(() => {
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [handleClick]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden">
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute animate-ripple"
          style={{
            left: ripple.x - 150,
            top: ripple.y - 150,
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: "2px solid rgba(0, 240, 255, 0.4)",
            background: "radial-gradient(circle, rgba(0, 240, 255, 0.08) 0%, transparent 70%)",
          }}
        />
      ))}
    </div>
  );
}