"use client";

import { motion } from "framer-motion";
import { FaEnvelope, FaGithub, FaMapMarkerAlt } from "react-icons/fa";

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.58, 1] as const },
  },
};

const contactItems = [
  {
    label: "13631963305@163.com",
    href: "mailto:13631963305@163.com",
    Icon: FaEnvelope,
  },
  {
    label: "Hong Kong, China",
    Icon: FaMapMarkerAlt,
  },
  {
    label: "github.com/Kenneth0416",
    href: "https://github.com/Kenneth0416",
    Icon: FaGithub,
  },
];

export default function Contact() {
  return (
    <section
      id="contact"
      className="py-20 max-w-6xl mx-auto px-4 text-white/90"
    >
      <div className="flex flex-col items-center text-center">
        <h2 className="text-3xl sm:text-4xl font-semibold gradient-text">
          Get In Touch
        </h2>
        <motion.div
          className="glass mt-10 w-full max-w-2xl rounded-2xl p-8 shadow-lg"
          variants={cardVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          <div className="flex flex-col gap-6 text-left">
            {contactItems.map(({ Icon, label, href }) => (
              <div key={label} className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                {href ? (
                  <a
                    href={href}
                    target={href.startsWith("http") ? "_blank" : undefined}
                    rel={href.startsWith("http") ? "noreferrer" : undefined}
                    className="text-sm sm:text-base text-white/80 transition hover:text-cyan-300"
                  >
                    {label}
                  </a>
                ) : (
                  <span className="text-sm sm:text-base text-white/80">
                    {label}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <a
              href="#"
              className="inline-flex items-center justify-center rounded-full border border-cyan-400/50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-400/10"
            >
              Download CV
            </a>
          </div>
        </motion.div>
        <p className="mt-10 text-sm text-white/50">
          © 2025 Kenneth Kwok. Built with Next.js & Tailwind CSS.
        </p>
      </div>
    </section>
  );
}
