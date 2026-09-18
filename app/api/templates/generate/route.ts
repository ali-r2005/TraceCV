import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { db } from "@/lib/db/client";
import { templates } from "@/lib/db/schema";
import { generateResumeTemplate } from "@/lib/ai/templateAgent";

/**
 * Deploys Agent 1 (HTML Resume Template Generator). Accepts a design prompt,
 * runs the LangChain structured-output pipeline, and stores the returned
 * HTML/CSS in SQLite. (Architecture document section 6, step 4.)
 */
export async function POST(req: NextRequest) {
  await ensureSeeded();
  const body = await req.json();
  const { userDesignPrompt } = body as { userDesignPrompt?: string };

  if (!userDesignPrompt || !userDesignPrompt.trim()) {
    return NextResponse.json(
      { error: "userDesignPrompt is required" },
      { status: 400 }
    );
  }

  let generated;
  try {
    generated = await generateResumeTemplate(userDesignPrompt);
  } catch (err) {
    console.error("Agent 1 (template generator) failed:", err);
    return NextResponse.json(
      { error: "AI template generation failed", details: `${err}` },
      { status: 502 }
    );
  }

  const id = uuidv4();

  await db.insert(templates).values({
    id,
    name: generated.templateName,
    description: userDesignPrompt,
    htmlContent: generated.htmlContent,
    cssContent: generated.cssContent,
    schemaJson: "{}",
  });

  return NextResponse.json(
    { id, name: generated.templateName, ...generated },
    { status: 201 }
  );
}
