"use client";

import { motion } from "framer-motion";
import { FaBrain, FaCode, FaLayerGroup, FaTools } from "react-icons/fa";

const skillGroups = [
  {
    title: "AI / LLM",
    icon: FaBrain,
    skills: [
      "MCP Protocol",
      "Prompt Engineering",
      "Context Engineering",
      "RAG",
      "LangChain/LangGraph",
      "OpenAI API",
      "Agentic Workflows",
      "n8n/Coze",
    ],
  },
  {
    title: "Languages",
    icon: FaCode,
    skills: ["Python", "TypeScript", "JavaScript", "Swift", "C", "SQL"],
  },
  {
    title: "Frameworks",
    icon: FaLayerGroup,
    skills: [
      "Next.js",
      "React",
      "Flask/FastAPI",
      "Node.js",
      "Express",
      "Prisma",
      "Drizzle ORM",
    ],
  },
  {
    title: "Tools & Infra",
    icon: FaTools,
    skills: [
      "Git",
      "Vercel",
      "Neon PostgreSQL",
      "Docker",
      "Figma",
      "Tableau",
      "Cursor",
      "Claude Code",
    ],
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.58, 1] as const },
  },
};

export default function Skills() {
  return (
    <motion.section
      id="skills"
      className="mx-auto max-w-6xl px-4 py-20"
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <h2 className="text-3xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-500 sm:text-4xl">
        Technical Skills
      </h2>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {skillGroups.map((group) => {
          const Icon = group.icon;
          return (
            <motion.div
              key={group.title}
              variants={cardVariants}
              className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="text-lg font-semibold text-white">
                  {group.title}
                </h3>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {group.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-400 transition-shadow hover:shadow-[0_0_10px_rgba(0,240,255,0.3)]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}
