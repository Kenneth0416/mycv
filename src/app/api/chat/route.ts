import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `You are Kenneth's AI assistant on his portfolio website. You help visitors learn about Kenneth's skills and experience.

You have access to the following tools:
1. web_search - Search the web for information (especially GitHub repos)
2. scroll_to - Scroll to a section on the page

When asked about GitHub repos or projects, use web_search to get real-time information.

Respond in a conversational way. When you need to use a tool, output it in this format:
[TOOL:tool_name]{"param": "value"}[/TOOL]

For example:
[TOOL:web_search]{"query": "Kenneth0416/MathPlatform GitHub"}[/TOOL]
[TOOL:scroll_to]{"section": "projects"}[/TOOL]

After using a tool, you'll receive the result and can continue your response.

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

Be concise, friendly, and helpful.`;

async function webSearch(query: string): Promise<string> {
  try {
    // Use GitHub API for repo searches
    if (query.toLowerCase().includes("github") || query.includes("Kenneth0416")) {
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
          return JSON.stringify({
            type: "github_repo",
            name: data.full_name,
            description: data.description,
            stars: data.stargazers_count,
            forks: data.forks_count,
            language: data.language,
            topics: data.topics,
            url: data.html_url,
            lastUpdated: data.updated_at
          });
        }
      }

      // Search Kenneth's repos
      const searchMatch = query.match(/Kenneth0416\/?(\w*)/i);
      if (searchMatch) {
        const searchTerm = searchMatch[1] || "";
        const response = await fetch(
          `https://api.github.com/search/repositories?q=user:Kenneth0416+${searchTerm}&sort=updated`,
          {
            headers: {
              "Accept": "application/vnd.github.v3+json",
              "User-Agent": "Kenneth-Portfolio-Bot"
            }
          }
        );
        if (response.ok) {
          const data = await response.json();
          const repos = data.items.slice(0, 3).map((repo: any) => ({
            name: repo.full_name,
            description: repo.description,
            stars: repo.stargazers_count,
            language: repo.language,
            url: repo.html_url
          }));
          return JSON.stringify({ type: "github_search", results: repos });
        }
      }
    }

    // Generic search fallback
    return JSON.stringify({ type: "search_result", message: "Searched: " + query });
  } catch (error) {
    return JSON.stringify({ type: "error", message: "Search failed" });
  }
}

export async function POST(request: NextRequest) {
  const { message, toolResult } = await request.json();

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  (async () => {
    try {
      // Build messages array
      const messages: any[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];

      if (toolResult) {
        // When we have tool results, add the context
        messages.push({
          role: "user",
          content: message
        });
        messages.push({
          role: "assistant",
          content: `I searched for the information. Here are the results:`
        });
        messages.push({
          role: "user",
          content: `Based on these search results, please provide a helpful summary:\n${toolResult}`
        });
      } else {
        messages.push({ role: "user", content: message });
      }

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-3",
          messages,
          temperature: 0.7,
          max_tokens: 800,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        buffer += chunk;

        // Process SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              await writer.write(encoder.encode("data: [DONE]\n\n"));
              continue;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                await writer.write(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      await writer.close();
    } catch (error) {
      console.error("Stream error:", error);
      await writer.write(encoder.encode(`data: ${JSON.stringify({ error: "Connection failed" })}\n\n`));
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

// Tool execution endpoint
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tool = searchParams.get("tool");
  const params = searchParams.get("params");

  if (tool === "web_search" && params) {
    const { query } = JSON.parse(params);
    const result = await webSearch(query);
    return new Response(result, {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (tool === "scroll_to" && params) {
    const { section } = JSON.parse(params);
    return new Response(JSON.stringify({ scrolled: true, section }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify({ error: "Unknown tool" }), { status: 400 });
}