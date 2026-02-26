"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FaChevronDown, FaGithub } from "react-icons/fa";

const typingPhrases = [
  "LLM Integration",
  "Rapid Prototyping",
  "Context Engineering",
  "Agentic Workflows",
];

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  alpha: number;
  color: { r: number; g: number; b: number };
};

export default function Hero() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [typingState, setTypingState] = useState({
    wordIndex: 0,
    charIndex: 0,
    isDeleting: false,
    display: "",
    pauseCount: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const particleCount = 150;
    const maxDistance = 120;
    const colors = [
      { r: 255, g: 255, b: 255 },
      { r: 0, g: 240, b: 255 },
    ];

    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    const particles: Particle[] = [];

    const resizeCanvas = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const createParticle = (): Particle => {
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1 + Math.random() * 2,
        speed: 0.2 + Math.random() * 0.4,
        alpha: 0.3 + Math.random() * 0.6,
        color,
      };
    };

    const resetParticles = () => {
      particles.length = 0;
      for (let i = 0; i < particleCount; i += 1) {
        particles.push(createParticle());
      }
    };

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.hypot(dx, dy);
          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.2;
            context.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
            context.lineWidth = 0.5;
            context.beginPath();
            context.moveTo(particles[i].x, particles[i].y);
            context.lineTo(particles[j].x, particles[j].y);
            context.stroke();
          }
        }
      }
    };

    const animate = () => {
      context.clearRect(0, 0, width, height);

      for (const particle of particles) {
        particle.y -= particle.speed;
        if (particle.y + particle.radius < 0) {
          particle.y = height + particle.radius;
          particle.x = Math.random() * width;
        }

        context.beginPath();
        context.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.alpha})`;
        context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        context.fill();
      }

      drawConnections();
      animationFrameId = window.requestAnimationFrame(animate);
    };

    const handleResize = () => {
      resizeCanvas();
      resetParticles();
    };

    resizeCanvas();
    resetParticles();
    animationFrameId = window.requestAnimationFrame(animate);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const pauseTicks = 8;
    const interval = window.setInterval(() => {
      setTypingState((prev) => {
        const currentWord = typingPhrases[prev.wordIndex];

        if (!prev.isDeleting) {
          if (prev.charIndex < currentWord.length) {
            const nextCharIndex = prev.charIndex + 1;
            return {
              ...prev,
              charIndex: nextCharIndex,
              display: currentWord.slice(0, nextCharIndex),
            };
          }

          if (prev.pauseCount < pauseTicks) {
            return { ...prev, pauseCount: prev.pauseCount + 1 };
          }

          return { ...prev, isDeleting: true, pauseCount: 0 };
        }

        if (prev.charIndex > 0) {
          const nextCharIndex = prev.charIndex - 1;
          return {
            ...prev,
            charIndex: nextCharIndex,
            display: currentWord.slice(0, nextCharIndex),
          };
        }

        const nextWordIndex = (prev.wordIndex + 1) % typingPhrases.length;
        return {
          wordIndex: nextWordIndex,
          charIndex: 0,
          isDeleting: false,
          display: "",
          pauseCount: 0,
        };
      });
    }, 120);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden bg-[#050507] text-white"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-sm uppercase tracking-[0.35em] text-white/70"
          >
            Hello, I&apos;m
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="relative mt-5 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="relative z-10" style={{
              backgroundImage: "linear-gradient(90deg, #00f0ff, #a855f7, #00f0ff)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
            }}>
              Kenneth Kwok
            </span>
            <motion.span
              className="absolute inset-0 blur-3xl"
              style={{
                background: "linear-gradient(90deg, rgba(0,240,255,0.4), rgba(168,85,247,0.4))",
                filter: "blur(40px)",
              }}
              animate={{
                opacity: [0.5, 0.8, 0.5],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-4 text-lg text-white/80 sm:text-xl"
          >
            AI Application Engineer
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-6 flex items-center gap-2 text-base text-white/80 sm:text-lg"
          >
            <span>Specializing in</span>
            <span className="font-semibold text-cyan-300">
              {typingState.display}
            </span>
            <motion.span
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-cyan-300"
            >
              |
            </motion.span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <motion.a
              href="#projects"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="group relative rounded-full border border-cyan-300/40 bg-cyan-400/10 px-6 py-3 text-xs uppercase tracking-[0.3em] text-cyan-100 transition-colors hover:bg-cyan-400/20"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/20 to-purple-500/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10">View Projects</span>
            </motion.a>
            <motion.a
              href="https://github.com/Kenneth0416"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-xs uppercase tracking-[0.3em] text-white/80 transition-colors hover:bg-white/10"
            >
              <span className="absolute inset-0 rounded-full bg-gradient-to-r from-white/10 to-cyan-400/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <FaGithub className="relative z-10 h-4 w-4" />
              <span className="relative z-10">GitHub</span>
            </motion.a>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
        className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center text-white/70"
      >
        <FaChevronDown className="h-5 w-5" />
      </motion.div>
    </section>
  );
}
