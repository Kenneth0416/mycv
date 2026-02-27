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
  name: string;
  params: Record<string, string>;
  status: "pending" | "running" | "done";
  result?: any;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCall[];
  isStreaming?: boolean;
};

const SECTION_MAP: Record<string, string> = {
  hero: "hero",
  about: "about",
  skills: "skills",
  projects: "projects",
  experience: "experience",
  education: "education",
  contact: "contact",
};

async function executeTool(tool: string, params: Record<string, string>): Promise<any> {
  const url = `/api/chat?tool=${tool}&params=${encodeURIComponent(JSON.stringify(params))}`;
  const response = await fetch(url);
  return response.json();
}

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

  const parseToolCalls = (content: string): { text: string; tools: ToolCall[] } => {
    const toolRegex = /\[TOOL:(\w+)\]([\s\S]*?)\[\/TOOL\]/g;
    const tools: ToolCall[] = [];
    let match;
    let text = content;

    while ((match = toolRegex.exec(content)) !== null) {
      const toolName = match[1];
      const paramsStr = match[2].trim();
      try {
        const params = JSON.parse(paramsStr);
        tools.push({ name: toolName, params, status: "pending" });
      } catch {
        tools.push({ name: toolName, params: { raw: paramsStr }, status: "pending" });
      }
      text = text.replace(match[0], "");
    }

    return { text: text.trim(), tools };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsStreaming(true);

    // Add placeholder for streaming response
    const assistantIndex = messages.length + 1;
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", isStreaming: true },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullContent += parsed.content;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  newMessages[assistantIndex] = {
                    role: "assistant",
                    content: fullContent,
                    isStreaming: true,
                  };
                  return newMessages;
                });
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      // Parse tool calls from the final content
      const { text, tools } = parseToolCalls(fullContent);

      if (tools.length > 0) {
        // Show tool calls being executed
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[assistantIndex] = {
            role: "assistant",
            content: text,
            toolCalls: tools.map((t) => ({ ...t, status: "running" as const })),
            isStreaming: false,
          };
          return newMessages;
        });

        // Execute tools
        const toolResults: string[] = [];
        for (let i = 0; i < tools.length; i++) {
          const tool = tools[i];
          const result = await executeTool(tool.name, tool.params);
          toolResults.push(JSON.stringify(result));

          // Update tool status
          setMessages((prev) => {
            const newMessages = [...prev];
            const msg = newMessages[assistantIndex] as Message;
            if (msg.toolCalls) {
              msg.toolCalls[i] = { ...msg.toolCalls[i], status: "done", result };
            }
            return newMessages;
          });

          // Handle scroll_to
          if (tool.name === "scroll_to" && tool.params.section) {
            scrollToSection(tool.params.section);
          }
        }

        // Always continue conversation with tool results to get a summary
        if (toolResults.length > 0) {
          const finalResponse = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              message: userMessage,
              toolResult: toolResults.join("\n"),
            }),
          });

          const finalReader = finalResponse.body?.getReader();
          if (finalReader) {
            let finalContent = text;
            while (true) {
              const { done, value } = await finalReader.read();
              if (done) break;
              const chunk = decoder.decode(value);
              const lines = chunk.split("\n");
              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);
                  if (data === "[DONE]") continue;
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.content) {
                      finalContent += parsed.content;
                      setMessages((prev) => {
                        const newMessages = [...prev];
                        newMessages[assistantIndex] = {
                          role: "assistant",
                          content: finalContent,
                          toolCalls: tools.map((t) => ({
                            ...t,
                            status: "done" as const,
                            result: t.result,
                          })),
                          isStreaming: false,
                        };
                        return newMessages;
                      });
                    }
                  } catch {}
                }
              }
            }
            // Update final content
            setMessages((prev) => {
              const newMessages = [...prev];
              newMessages[assistantIndex] = {
                role: "assistant",
                content: finalContent,
                toolCalls: tools.map((t) => ({
                  ...t,
                  status: "done" as const,
                  result: t.result,
                })),
                isStreaming: false,
              };
              return newMessages;
            });
          }
        }
      }

      // Final update
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[assistantIndex] = {
          role: "assistant",
          content: text || fullContent,
          toolCalls: tools.length > 0 ? tools : undefined,
          isStreaming: false,
        };
        return newMessages;
      });
    } catch (error) {
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[assistantIndex] = {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting. Please try again!",
          isStreaming: false,
        };
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
            {tool.params.query && `("${tool.params.query}")`}
            {tool.params.section && `("${tool.params.section}")`}
          </span>
          {isRunning && <FaSpinner className="ml-auto animate-spin text-cyan-400" />}
          {isDone && <span className="ml-auto text-green-400">✓</span>}
        </div>

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
                  <p className="text-xs text-white/50">Powered by Grok • Agentic</p>
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
                    {msg.toolCalls && msg.toolCalls.map((tool, i) => renderToolCall(tool, i))}
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