"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaComments, FaTimes, FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";

type Message = {
  role: "user" | "assistant";
  content: string;
  action?: {
    type: "scroll";
    target: string;
  };
};

const SYSTEM_PROMPT = `You are Kenneth's AI assistant on his portfolio website. You help visitors learn about Kenneth's skills and experience.

IMPORTANT: You MUST respond in valid JSON format with this structure:
{
  "message": "Your response text here",
  "scrollTo": "section-id or null"
}

Available sections to scroll to:
- "hero" - Introduction
- "about" - About Kenneth
- "skills" - Technical Skills
- "projects" - Featured Projects
- "experience" - Work Experience
- "education" - Education
- "contact" - Contact Information

Kenneth's Profile:
- AI Application Engineer specializing in LLM Integration, Agentic Workflows, Context Engineering
- Built MCP-based AI math platform with 17 tools, 95% accuracy
- Created Prompt AI Helper iOS app (200+ downloads)
- Built SteamPlatForm (Next.js 15, 184 components, 23 APIs)
- Developed Crisis-Sim game platform for NTU Research
- Skills: Python, TypeScript, MCP Protocol, LangChain, RAG, Agentic Workflows
- Email: kennethkwok9196@gmail.com
- Phone: +852 6117 1096
- Location: Hong Kong, China
- GitHub: github.com/Kenneth0416

Be concise, friendly, and helpful. When someone asks about a specific topic, scroll to the relevant section.`;

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Kenneth's AI assistant. Ask me about his skills, projects, or experience!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.scrollTo) {
        scrollToSection(data.scrollTo);
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.message },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again!",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-shadow"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isOpen ? 0 : 1, y: isOpen ? 20 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <FaComments className="h-6 w-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 flex h-[500px] w-[380px] flex-col rounded-2xl border border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                  <FaRobot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-white/50">Powered by Grok</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/50 hover:bg-white/10 hover:text-white transition-colors"
              >
                <FaTimes className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                      <FaRobot className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                        : "bg-white/10 text-white/90"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <FaUser className="h-3.5 w-3.5 text-white/70" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                    <FaRobot className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl bg-white/10 px-3 py-2">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-400" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about Kenneth..."
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/25 transition-all"
                  disabled={isLoading}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-white disabled:opacity-50 transition-opacity"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPaperPlane className="h-4 w-4" />
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}