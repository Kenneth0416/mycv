"use client";

import { motion } from "framer-motion";

const experiences = [
  {
    company: "Aloes Tree EdTech Ltd",
    dates: "Feb 2025 - Aug 2025",
    role: "Curriculum Product Manager",
    subtitle: "K12 AI+IoT Integrated Solutions | Agile (Scrum/Kanban)",
    points: [
      "Designed AI+IoT curriculum with Teachable Machine, deployed to edge devices.",
      "Architected modular curriculum pathways with Kanban.",
      "Authored SOPs and training programs.",
    ],
    tags: [
      "AI",
      "IoT",
      "Teachable Machine",
      "Edge Deployment",
      "ESP32",
      "Kanban",
    ],
  },
  {
    company: "Chasing Wish Ltd",
    dates: "Sep 2024 - Feb 2025",
    role: "Full-Stack Engineer",
    subtitle: "ERP & Mini-Program Development",
    points: [
      "Independently architected multiple business systems.",
      "Set up logging, automated backups, and CI/CD.",
    ],
    tags: [],
  },
  {
    company: "EtechArt Ltd",
    dates: "Jun 2023 - Aug 2024",
    role: "Product Designer (Part-Time)",
    subtitle: "STEAM Curriculum & Hardware Prototyping",
    points: [
      "Designed Arduino/micro:bit teaching kits with SolidWorks structural drawings.",
    ],
    tags: ["Arduino", "micro:bit", "SolidWorks", "STEAM"],
  },
] as const;

export default function Experience() {
  return (
    <section id="experience" className="py-20 max-w-6xl mx-auto px-4">
      <div className="mb-12 text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-sky-500 to-purple-500">
          Work Experience
        </h2>
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-0.5 -translate-x-1/2 bg-gradient-to-b from-cyan-500 to-purple-500" />
        <div className="space-y-12">
          {experiences.map((experience, index) => {
            const isLeft = index % 2 === 0;

            return (
              <div
                key={`${experience.company}-${experience.dates}`}
                className="relative"
              >
                <span className="absolute left-1/2 top-0 h-4 w-4 -translate-x-1/2 rounded-full bg-cyan-500 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <motion.article
                    initial={{ opacity: 0, x: isLeft ? -60 : 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: [0, 0, 0.58, 1] as const }}
                    viewport={{ once: true, amount: 0.3 }}
                    className={[
                      "mt-6 w-full max-w-xl group",
                      "rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl transition-all duration-300 hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(0,240,255,0.15)]",
                      isLeft
                        ? "md:col-start-1 md:justify-self-end md:mr-12"
                        : "md:col-start-2 md:justify-self-start md:ml-12",
                    ].join(" ")}
                  >
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="text-xl font-semibold text-white">
                        {experience.company}
                      </h3>
                      <span className="text-sm font-medium text-gray-400">
                        {experience.dates}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-cyan-400">
                      {experience.role}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {experience.subtitle}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm text-gray-300">
                      {experience.points.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-cyan-500" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    {experience.tags.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {experience.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </motion.article>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
