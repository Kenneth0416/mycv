"use client";

import { motion } from "framer-motion";
import { FaGraduationCap } from "react-icons/fa";

const educationItems = [
  {
    institution: "The Education University of Hong Kong (EdUHK)",
    period: "2025 – 2026 (Studying)",
    degree: "MSc in AI for Senior Professionals",
    details:
      "AI strategy, data analytics & visualization, prompt engineering & LLM deployment, process automation, AI ethics.",
  },
  {
    institution:
      "Technological and Higher Education Institute of Hong Kong (THEi)",
    period: "2022 – 2024",
    degree:
      "BSc (Hons) in Innovation and Multimedia Technology — Upper Second-Class Honours",
    details:
      "UI/UX, web & mobile development, AI & blockchain, information visualization.",
  },
  {
    institution: "HKU SPACE Community College",
    period: "2019 – 2022",
    degree: "Associate of Science in Computer Engineering",
    details:
      "Discrete math, linear algebra, probability, algorithms & data structures, C/Python engineering.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
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

export default function Education() {
  return (
    <section
      id="education"
      className="py-20 max-w-6xl mx-auto px-4 text-white/90"
    >
      <h2 className="text-3xl sm:text-4xl font-semibold gradient-text">
        Education
      </h2>
      <motion.div
        className="mt-10 flex flex-col gap-6"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
      >
        {educationItems.map((item) => (
          <motion.div
            key={item.institution}
            variants={cardVariants}
            className="glass rounded-2xl p-6 sm:p-8 shadow-lg"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                  <FaGraduationCap className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-white">
                    {item.institution}
                  </h3>
                  <p className="mt-1 text-sm text-white/70">{item.degree}</p>
                </div>
              </div>
              <span className="text-sm uppercase tracking-[0.2em] text-white/50">
                {item.period}
              </span>
            </div>
            <p className="mt-4 text-sm sm:text-base text-white/70">
              {item.details}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
