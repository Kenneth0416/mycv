import { NextRequest, NextResponse } from "next/server";

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
- Skills: Python, TypeScript, MCP Protocol, LangChain, RAG, Agentic Workflows, Context Engineering
- Email: kennethkwok9196@gmail.com
- Phone: +852 6117 1096
- Location: Hong Kong, China
- GitHub: github.com/Kenneth0416

Be concise, friendly, and helpful. When someone asks about a specific topic, scroll to the relevant section. Keep responses under 100 words.`;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-3",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || "Sorry, I couldn't process that.";

    // Parse JSON response from Grok
    try {
      const parsed = JSON.parse(content);
      return NextResponse.json({
        message: parsed.message || content,
        scrollTo: parsed.scrollTo || null,
      });
    } catch {
      // If not valid JSON, return as plain message
      return NextResponse.json({
        message: content,
        scrollTo: null,
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { message: "Sorry, I'm having trouble connecting right now. Please try again!", scrollTo: null },
      { status: 500 }
    );
  }
}