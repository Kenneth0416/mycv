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

Use web_search for real-time information, x_search for X/Twitter content. Be concise and helpful.`;

// Client-side tool definitions (scroll_to needs frontend handling)
const CLIENT_TOOLS = [
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

// Server-side tools (xAI handles execution automatically)
const SERVER_TOOLS = [
  { type: "web_search" as const },
  { type: "x_search" as const },
];

// Execute client-side tools
function executeClientTool(name: string, args: Record<string, any>): { result: any; clientAction?: any } {
  switch (name) {
    case "scroll_to":
      return {
        result: { success: true, section: args.section },
        clientAction: { type: "scroll", section: args.section }
      };
    default:
      return { result: { error: "Unknown tool" } };
  }
}

// GitHub API search (fallback for specific GitHub queries)
async function githubSearch(query: string): Promise<any> {
  try {
    // Direct repo lookup
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
    if (query.toLowerCase().includes("kenneth") || query.toLowerCase().includes("github")) {
      const searchTerm = query.replace(/github|kenneth|repos?/gi, "").trim();
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

    return null;
  } catch {
    return null;
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

      // Agentic loop
      let iterationCount = 0;
      const maxIterations = 5;

      while (iterationCount < maxIterations) {
        iterationCount++;

        // Call xAI API with server-side + client-side tools
        const response = await fetch("https://api.x.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "grok-4-fast",
            messages,
            tools: [...SERVER_TOOLS, ...CLIENT_TOOLS],
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
        let toolOutputs: any[] = [];

        // Read streaming response
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

                // Handle content
                if (delta?.content) {
                  fullContent += delta.content;
                  await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: delta.content })}\n\n`));
                }

                // Handle tool calls (streaming)
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

                // Handle server-side tool outputs (web_search, x_search results)
                if (delta?.tool_outputs) {
                  toolOutputs = delta.tool_outputs;
                  for (const output of toolOutputs) {
                    if (output.content) {
                      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "server_tool_output", content: output.content })}\n\n`));
                    }
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }

        // If we have tool calls, process them
        if (toolCalls.length > 0) {
          // Separate client-side and server-side tool calls
          const serverToolNames = ["web_search", "x_search", "code_execution"];
          const clientToolCalls = toolCalls.filter(tc => !serverToolNames.includes(tc.function.name));
          const serverToolCalls = toolCalls.filter(tc => serverToolNames.includes(tc.function.name));

          // Send tool call info to client
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_calls_start", tools: toolCalls.map(tc => tc.function.name) })}\n\n`));

          // Add assistant message with tool calls to history
          messages.push({
            role: "assistant",
            content: fullContent || null,
            tool_calls: toolCalls
          });

          // Process server-side tools (already executed by xAI)
          for (const toolCall of serverToolCalls) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_executing", name: toolCall.function.name, args: JSON.parse(toolCall.function.arguments || "{}") })}\n\n`));

            // Server tools are auto-executed, we get results via tool_outputs
            // Add placeholder result to messages
            const output = toolOutputs.find((o: any) => o.tool_call_id === toolCall.id);
            const resultContent = output?.content || "Search completed";

            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: toolCall.function.name, result: { type: "server_executed", summary: resultContent.substring(0, 200) } })}\n\n`));

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: resultContent
            });
          }

          // Process client-side tools
          for (const toolCall of clientToolCalls) {
            const toolName = toolCall.function.name;
            const toolArgs = JSON.parse(toolCall.function.arguments || "{}");

            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_executing", name: toolName, args: toolArgs })}\n\n`));

            let toolResult: any;
            let clientAction: any = null;

            const execution = executeClientTool(toolName, toolArgs);
            toolResult = execution.result;
            clientAction = execution.clientAction;

            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "tool_result", name: toolName, result: toolResult, clientAction })}\n\n`));

            messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });
          }

          // Continue loop to get final response
          continue;
        }

        // No tool calls - done
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