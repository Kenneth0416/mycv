"use client";

import { useCallback, useEffect, useRef } from "react";

type Ripple = {
  id: number;
  x: number;
  y: number;
  size: number;
};

export default function RippleEffect() {
  const ripplesRef = useRef<Ripple[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const ripple: Ripple = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        size: 0,
      };
      ripplesRef.current.push(ripple);

      // Animate ripple size
      const animate = () => {
        ripple.size += 8;
        if (ripple.size > 300) {
          ripplesRef.current = ripplesRef.current.filter((r) => r.id !== ripple.id);
        }
      };

      const interval = setInterval(animate, 16);
      setTimeout(() => clearInterval(interval), 600);
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden"
    >
      {ripplesRef.current.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute rounded-full border-2 border-cyan-400/50 bg-cyan-400/10"
          style={{
            left: ripple.x - ripple.size / 2,
            top: ripple.y - ripple.size / 2,
            width: ripple.size,
            height: ripple.size,
            animation: "ripple 0.6s ease-out forwards",
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}