"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";

type TextScrambleProps = {
  text: string;
  className?: string;
  duration?: number;
  speed?: number;
};

export default function TextScramble({
  text,
  className = "",
  duration = 60,
  speed = 1,
}: TextScrambleProps) {
  const [displayText, setDisplayText] = useState(text);
  const [isScrambling, setIsScrambling] = useState(false);

  useEffect(() => {
    let animationFrame: number;
    let iteration = 0;
    let interval: NodeJS.Timeout;

    const startScramble = () => {
      setIsScrambling(true);
      let startTime = Date.now();

      const scramble = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / (duration * speed * 10), 1);

        if (progress < 1) {
          const scrambled = text
            .split("")
            .map((char, index) => {
              if (index < progress * text.length) {
                return text[index];
              }
              return chars[Math.floor(Math.random() * chars.length)];
            })
            .join("");
          setDisplayText(scrambled);
          animationFrame = requestAnimationFrame(scramble);
        } else {
          setDisplayText(text);
          setIsScrambling(false);
        }
      };

      scramble();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(startScramble, 300);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById(`scramble-${text}`);
    if (element) observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [text, duration, speed]);

  return (
    <motion.span
      id={`scramble-${text}`}
      className={`inline-block ${className}`}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
    >
      {displayText}
      {isScrambling && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.1, repeat: Infinity }}
          className="inline-block w-0.5 h-[1em] bg-cyan-400 ml-0.5 align-middle"
        />
      )}
    </motion.span>
  );
}