"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaComments,
  FaTimes,
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaSearch,
  FaArrowRight,
  FaSpinner,
  FaGithub,
  FaStar,
  FaCodeBranch,
} from "react-icons/fa";

type ToolCall = {
  id: string;
  name: string;
  args: Record<string, any>;
  status: "pending" | "running" | "done";
  result?: any;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
};

type ClientAction = {
  type: "scroll";
  section: string;
};

const SECTION_MAP: Record<string, string> = {
  about: "about",
  skills: "skills",
  projects: "projects",
  experience: "experience",
  education: "education",
  contact: "contact",
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm Kenneth's AI assistant. Ask me about his skills, projects, or GitHub repos!",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const conversationHistoryRef = useRef<{ role: string; content: string }[]>([]);

  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(SECTION_MAP[sectionId] || sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");

    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    // Build conversation history for API
    const newHistory = [...conversationHistoryRef.current, { role: "user", content: userMessage }];
    conversationHistoryRef.current = newHistory;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newHistory }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";
      let currentContent = "";
      let currentToolCalls: ToolCall[] = [];

      // Add placeholder for assistant message
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", isStreaming: true, toolCalls: [] },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        buffer += chunk;

        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const event = JSON.parse(data);

              switch (event.type) {
                case "content":
                  // Stream text content
                  currentContent += event.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIdx = newMessages.length - 1;
                    if (newMessages[lastIdx]?.role === "assistant") {
                      newMessages[lastIdx] = {
                        ...newMessages[lastIdx],
                        content: currentContent,
                        isStreaming: true,
                      };
                    }
                    return newMessages;
                  });
                  break;

                case "tool_calls_start":
                  // Tool calls are about to be executed
                  const newToolCalls: ToolCall[] = event.tools.map((name: string, i: number) => ({
                    id: `tc_${i}`,
                    name,
                    args: {},
                    status: "pending" as const,
                  }));
                  currentToolCalls = newToolCalls;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIdx = newMessages.length - 1;
                    if (newMessages[lastIdx]?.role === "assistant") {
                      newMessages[lastIdx] = {
                        ...newMessages[lastIdx],
                        toolCalls: newToolCalls,
                      };
                    }
                    return newMessages;
                  });
                  break;

                case "tool_executing":
                  // Update tool status to running
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIdx = newMessages.length - 1;
                    const msg = newMessages[lastIdx];
                    if (msg?.role === "assistant" && msg.toolCalls) {
                      msg.toolCalls = msg.toolCalls.map((tc) =>
                        tc.name === event.name
                          ? { ...tc, args: event.args, status: "running" as const }
                          : tc
                      );
                    }
                    return newMessages;
                  });
                  break;

                case "tool_result":
                  // Tool execution completed
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIdx = newMessages.length - 1;
                    const msg = newMessages[lastIdx];
                    if (msg?.role === "assistant" && msg.toolCalls) {
                      msg.toolCalls = msg.toolCalls.map((tc) =>
                        tc.name === event.name
                          ? { ...tc, status: "done" as const, result: event.result }
                          : tc
                      );
                    }
                    return newMessages;
                  });

                  // Handle client actions (scroll, etc.)
                  if (event.clientAction?.type === "scroll") {
                    scrollToSection(event.clientAction.section);
                  }
                  break;

                case "error":
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastIdx = newMessages.length - 1;
                    if (newMessages[lastIdx]?.role === "assistant") {
                      newMessages[lastIdx] = {
                        ...newMessages[lastIdx],
                        content: "Sorry, I'm having trouble connecting. Please try again!",
                        isStreaming: false,
                      };
                    }
                    return newMessages;
                  });
                  break;
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Final update - mark as not streaming
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        if (newMessages[lastIdx]?.role === "assistant") {
          newMessages[lastIdx] = {
            ...newMessages[lastIdx],
            isStreaming: false,
          };
        }
        return newMessages;
      });

      // Update conversation history with assistant response
      if (currentContent) {
        conversationHistoryRef.current.push({ role: "assistant", content: currentContent });
      }

    } catch (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        const lastIdx = newMessages.length - 1;
        if (newMessages[lastIdx]?.role === "assistant") {
          newMessages[lastIdx] = {
            ...newMessages[lastIdx],
            content: "Sorry, I'm having trouble connecting. Please try again!",
            isStreaming: false,
          };
        }
        return newMessages;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const renderToolCall = (tool: ToolCall, idx: number) => {
    const isRunning = tool.status === "running";
    const isDone = tool.status === "done";

    return (
      <div
        key={idx}
        className={`mt-2 rounded-lg border ${
          isDone ? "border-green-500/30 bg-green-500/5" : "border-cyan-500/30 bg-cyan-500/5"
        } p-2 text-xs`}
      >
        <div className="flex items-center gap-2">
          {tool.name === "web_search" ? (
            <FaSearch className={isRunning ? "animate-pulse text-cyan-400" : isDone ? "text-green-400" : "text-white/50"} />
          ) : (
            <FaArrowRight className={isRunning ? "animate-pulse text-cyan-400" : isDone ? "text-green-400" : "text-white/50"} />
          )}
          <span className="font-mono text-white/70">
            {tool.name}
            {tool.args?.query && `("${tool.args.query}")`}
            {tool.args?.section && `("${tool.args.section}")`}
          </span>
          {isRunning && <FaSpinner className="ml-auto animate-spin text-cyan-400" />}
          {isDone && <span className="ml-auto text-green-400">✓</span>}
        </div>

        {/* GitHub Repo Result */}
        {tool.result && tool.name === "web_search" && tool.result.type === "github_repo" && (
          <div className="mt-2 rounded bg-black/30 p-2">
            <div className="flex items-center gap-2">
              <FaGithub className="text-white/70" />
              <a
                href={tool.result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:underline"
              >
                {tool.result.name}
              </a>
            </div>
            {tool.result.description && (
              <p className="mt-1 text-white/60">{tool.result.description}</p>
            )}
            <div className="mt-1 flex gap-3 text-white/50">
              {tool.result.stars && (
                <span className="flex items-center gap-1">
                  <FaStar /> {tool.result.stars}
                </span>
              )}
              {tool.result.forks && (
                <span className="flex items-center gap-1">
                  <FaCodeBranch /> {tool.result.forks}
                </span>
              )}
              {tool.result.language && <span>{tool.result.language}</span>}
            </div>
          </div>
        )}

        {/* GitHub Search Results */}
        {tool.result && tool.name === "web_search" && tool.result.type === "github_search" && (
          <div className="mt-2 space-y-1">
            {tool.result.results?.map((repo: any, i: number) => (
              <div key={i} className="rounded bg-black/30 p-2">
                <div className="flex items-center gap-2">
                  <FaGithub className="text-white/70" />
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline text-xs"
                  >
                    {repo.name}
                  </a>
                </div>
                {repo.description && (
                  <p className="mt-0.5 text-white/60 text-xs">{repo.description}</p>
                )}
                <div className="mt-0.5 flex gap-2 text-white/50 text-xs">
                  {repo.stars && <span>★ {repo.stars}</span>}
                  {repo.language && <span>{repo.language}</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
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
            className="fixed bottom-6 right-6 z-50 flex h-[520px] w-[400px] flex-col rounded-2xl border border-white/10 bg-[#0a0a1a]/95 backdrop-blur-xl shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500">
                  <FaRobot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
                  <p className="text-xs text-white/50">Powered by Grok • Native Tools</p>
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
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-cyan-500 to-purple-500 text-white"
                          : "bg-white/10 text-white/90"
                      }`}
                    >
                      {msg.content || (msg.isStreaming && <FaSpinner className="animate-spin" />)}
                      {msg.isStreaming && msg.content && (
                        <span className="ml-1 inline-block h-4 w-2 animate-pulse bg-cyan-400" />
                      )}
                    </div>
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="mt-1">
                        {msg.toolCalls.map((tool, i) => renderToolCall(tool, i))}
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20">
                      <FaUser className="h-3.5 w-3.5 text-white/70" />
                    </div>
                  )}
                </div>
              ))}
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
                  placeholder="Ask about Kenneth or his GitHub..."
                  className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white placeholder-white/40 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/25 transition-all"
                  disabled={isStreaming}
                />
                <motion.button
                  type="submit"
                  disabled={!input.trim() || isStreaming}
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