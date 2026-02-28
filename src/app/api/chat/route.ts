import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are Kenneth's AI assistant on a portfolio website. Help visitors learn about Kenneth's skills and experience.

Kenneth's Profile:
- AI Application Engineer specializing in LLM Integration, Agentic Workflows, Context Engineering
- Built MCP-based AI math platform with 17 tools, 95% accuracy
- Created Prompt AI Helper iOS app (200+ downloads)
- Built SteamPlatForm (Next.js 15, 184 components, 23 APIs)
- Developed Crisis-Sim game platform for NTU Research
- Skills: Python, TypeScript, MCP Protocol, LangChain, RAG, Agentic Workflows, Context Engineering
- Email: kennethkwok9196@gmail.com
- Phone: +852 6117 1096
- Location: Hong Kong, China
- GitHub: github.com/Kenneth0416

Use web_search for real-time information. Use scroll_to to navigate sections. Be concise and helpful.`;

// Tool definitions (standard OpenAI function calling format)
const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "web_search",
      description: "Search the web for real-time information, GitHub repos, news, or current events.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "The search query"
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "scroll_to",
      description: "Scroll the page to a specific section. Use when user wants to navigate.",
      parameters: {
        type: "object",
        properties: {
          section: {
            type: "string",
            enum: ["about", "skills", "projects", "experience", "education", "contact"],
            description: "The section to scroll to"
          }
        },
        required: ["section"]
      }
    }
  }
];

// Execute web search using Tavily API or fallback to GitHub
async function executeWebSearch(query: string): Promise<any> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  // Try Tavily API first
  if (tavilyApiKey) {
    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${tavilyApiKey}`
        },
        body: JSON.stringify({
          query,
          max_results: 5,
          include_answer: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          type: "web_search",
          answer: data.answer,
          results: data.results.slice(0, 3).map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.content?.substring(0, 200)
          }))
        };
      }
    } catch (e) {
      console.error("Tavily search error:", e);
    }
  }

  // Fallback: GitHub API for repo searches
  try {
    const repoMatch = query.match(/github\.com\/([^\/]+\/[^\/\s]+)/i);
    if (repoMatch) {
      const repoPath = repoMatch[1];
      const response = await fetch(`https://api.github.com/repos/${repoPath}`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "Kenneth-Portfolio-Bot"
        }
      });
      if (response.ok) {
        const data = await response.json();
        return {
          type: "github_repo",
          name: data.full_name,
          description: data.description,
          stars: data.stargazers_count,
          forks: data.forks_count,
          language: data.language,
          url: data.html_url
        };
      }
    }

    // Search Kenneth's repos
    if (query.toLowerCase().includes("kenneth") || query.toLowerCase().includes("github") || query.toLowerCase().includes("repo")) {
      const searchTerm = query.replace(/github|kenneth|repos?|repositories?/gi, "").trim();
      const response = await fetch(
        `https://api.github.com/search/repositories?q=user:Kenneth0416+${encodeURIComponent(searchTerm)}&sort=updated`,
        {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "Kenneth-Portfolio-Bot"
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        const repos = data.items.slice(0, 5).map((repo: any) => ({
          name: repo.full_name,
          description: repo.description,
          stars: repo.stargazers_count,
          language: repo.language,
          url: repo.html_url
        }));
        return { type: "github_search", results: repos };
      }
    }

    return { type: "search_note", message: `No results found for: ${query}. Try a more specific query.` };
  } catch (e) {
    return { type: "error", message: "Search failed" };
  }
}

// Execute tools
async function executeTool(name: string, args: Record<string, any>): Promise<{ result: any; clientAction?: any }> {
  switch (name) {
    case "web_search":
      return { result: await executeWebSearch(args.query) };
    case "scroll_to":
      return {
        result: { success: true, section: args.section },
        clientAction: { type: "scroll", section: args.section }
      };
    default:
      return { result: { error: "Unknown tool" } };
  }
}

export async function POST(request: NextRequest) {
  const { messages: inputMessages } = await request.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      const messages: any[] = [
        { role: "system", content: SYSTEM_PROMPT },
        ...inputMessages
      ];

      let iterationCount = 0;
      const maxIterations = 5;

      while (iterationCount < maxIterations) {
        iterationCount++;

        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-4-fast",
            messages,
            tools: TOOLS,
            tool_choice: "auto",
            temperature: 0.7,
            max_tokens: 800,
            stream: true,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("xAI API error:", response.status, errorText);
          throw new Error(`Grok API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No reader");

        let buffer = "";
        let fullContent = "";
        let toolCalls: any[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          buffer += chunk;

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                if (delta?.content) {
                  fullContent += delta.content;
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`));
                }

                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!toolCalls[idx]) {
                      toolCalls[idx] = { id: tc.id || "", function: { name: "", arguments: "" } };
                    }
                    if (tc.id) toolCalls[idx].id = tc.id;
                    if (tc.function?.name) toolCalls[idx].function.name = tc.function.name;
                    if (tc.function?.arguments) toolCalls[idx].function.arguments += tc.function.arguments;
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        if (toolCalls.length > 0) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_calls_start", tools: toolCalls.map(tc => tc.function.name) })}\n\n`));

          messages.push({
            role: "assistant",
            content: fullContent || null,
            tool_calls: toolCalls
          });

          for (const toolCall of toolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_executing", name: toolName, args: toolArgs })}\n\n`));

            const { result, clientAction } = await executeTool(toolName, toolArgs);

            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: toolName, result, clientAction })}\n\n`));

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(result)
            });
          }

          continue;
        }

        break;
      }

      await writer.write(encoder.encode("data: [DONE]\n\n"));
      await writer.close();
    } catch (error) {
      console.error("Stream error:", error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Connection failed" })}\n\n`));
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}