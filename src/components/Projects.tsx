"use client";

import { motion } from "framer-motion";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import TiltCard from "./TiltCard";
import TextScramble from "./TextScramble";

const projects = [
  {
    title: "MCP-Driven AI Math Ecosystem",
    date: "Oct 2025 – Present",
    role: "MCP Backend Developer at EdUHK",
    description:
      "Architected an MCP-based AI tool ecosystem for DSE math education with 17 standardized tool interfaces. Achieved 95% tool selection accuracy.",
    tags: ["Python", "SymPy", "MCP Protocol", "OpenAI API", "Prompt Chains", "LaTeX"],
    github: "https://github.com/Kenneth0416/MathPlatform",
  },
  {
    title: "Prompt AI Helper",
    date: "Aug – Nov 2025",
    role: "Lead Designer & Developer",
    description:
      "Native iOS app integrating prompt engineering into multimedia learning workflows. 200+ downloads with 3 workshops delivered at THEi.",
    tags: ["iOS", "Swift", "Prompt Engineering", "HITL", "LLM Integration"],
    github: "https://github.com/Kenneth0416/PromptAIHelper",
  },
  {
    title: "SteamPlatForm",
    date: "2025 – 2026",
    role: "Independent Architecture & Development",
    description:
      "Steam-inspired gaming platform with Next.js 15, 184 React components, 23 API endpoints. Full auth, game library, wishlist, cart, reviews.",
    tags: [
      "Next.js 15",
      "TypeScript",
      "Prisma",
      "PostgreSQL",
      "NextAuth.js",
      "Tailwind",
      "Vercel",
    ],
    github: "https://github.com/Kenneth0416/SteamPlatForm",
  },
  {
    title: "HKMJ — 港麻記帳",
    date: "2025",
    role: "Full-Stack PWA Development",
    description:
      "Professional Hong Kong Mahjong scoring PWA with bilingual UI, offline support, custom rules, game history, and live deployment at hkmj.app.",
    tags: ["React 19", "TypeScript", "PWA", "Vercel", "Bilingual"],
    github: "https://github.com/Kenneth0416/HKMJ",
    demo: "https://hkmj.app",
  },
  {
    title: "Markdown-Converter-Web",
    date: "2025",
    role: "Full-Stack Tool Development",
    description:
      "Document-to-Markdown converter built with Flask and MarkItDown. Supports PDF and multiple formats with Docker deployment ready.",
    tags: ["Flask", "Python", "MarkItDown", "Docker", "HTML"],
    github: "https://github.com/Kenneth0416/Markdown-Converter-Web",
  },
  {
    title: "Crisis-Sim",
    date: "2026",
    role: "Game Design & Full-Stack at NTU Research",
    description:
      "Interactive crisis management simulator with 4 mini-games, real-time state management, scoring engine, and scenario branching.",
    tags: [
      "Next.js 14",
      "TypeScript",
      "Drizzle ORM",
      "Neon PostgreSQL",
      "Game Design",
      "Vercel",
    ],
    github: "https://github.com/Kenneth0416/crisis-sim",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0, 0, 0.58, 1] as const,
    },
  },
};

export default function Projects() {
  return (
    <section id="projects" className="mx-auto max-w-6xl px-4 py-20">
      <div className="mb-12 flex items-center justify-between">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          <TextScramble text="Featured Projects" className="gradient-text" speed={1.5} />
        </h2>
      </div>
      <motion.div
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {projects.map((project) => (
          <motion.article
            key={project.title}
            variants={cardVariants}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:border-cyan-500/30"
          >
            <TiltCard tiltX={10} tiltY={10}>
              <div className="flex min-h-[260px] flex-col gap-3 p-6">
                <span className="absolute right-6 top-6 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-100/90">
                  {project.date}
                </span>
                <div className="space-y-1 pr-20">
                  <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                  <p className="text-sm text-cyan-100/80">{project.role}</p>
                </div>
                <p className="text-sm leading-relaxed text-white/70">{project.description}</p>
                <div className="flex flex-1 items-end">
                  <div className="flex flex-wrap gap-2">
                    {project.tags.slice(0, 5).map((tag) => (
                      <span
                        key={`${project.title}-${tag}`}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags.length > 5 && (
                      <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70">
                        +{project.tags.length - 5}
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 px-4 py-2 text-sm font-medium text-cyan-100/90 transition-colors hover:bg-cyan-500/10 hover:text-cyan-50"
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`View ${project.title} on GitHub`}
                  >
                    <FaGithub className="text-base" />
                    <span>GitHub</span>
                  </a>
                  {"demo" in project && project.demo && (
                    <a
                      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 px-4 py-2 text-sm font-medium text-emerald-100/90 transition-colors hover:bg-emerald-500/10 hover:text-emerald-50"
                      href={project.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`View ${project.title} demo`}
                    >
                      <FaExternalLinkAlt className="text-sm" />
                      <span>Demo</span>
                    </a>
                  )}
                </div>
              </div>
            </TiltCard>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}