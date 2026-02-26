"use client";

import { motion } from "framer-motion";

const stats = [
  { value: "4+", label: "Projects" },
  { value: "200+", label: "App Downloads" },
  { value: "95%", label: "Tool Accuracy" },
  { value: "17", label: "MCP Tools" },
];

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export default function About() {
  return (
    <motion.section
      id="about"
      className="py-20 mx-auto max-w-6xl px-4"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.12 } },
      }}
    >
      <motion.h2
        variants={fadeInUp}
        className="text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500"
      >
        About Me
      </motion.h2>

      <motion.div
        variants={fadeInUp}
        className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur"
      >
        <motion.p
          variants={fadeInUp}
          className="text-base leading-7 text-white/80"
        >
          AI application engineer with hands-on experience building LLM-powered
          products end-to-end. Designed and shipped an MCP-based AI math tool
          ecosystem (17 tool interfaces, 95% selection accuracy), a prompt
          engineering iOS app (200+ downloads), and multiple full-stack
          AI-integrated platforms. Proficient in Python, TypeScript, and modern
          web stacks; skilled at translating AI capabilities into production-ready
          features through rapid prototyping, context engineering, and agentic
          workflow design.
        </motion.p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-5 text-center backdrop-blur"
            >
              <div className="text-3xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                {stat.value}
              </div>
              <div className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.section>
  );
}
