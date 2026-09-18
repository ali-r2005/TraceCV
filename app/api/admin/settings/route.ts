import { ensureSeeded } from "@/lib/db/migrate";
import { NextRequest, NextResponse } from "next/server";
import {
  getApiKeysStatus,
  saveApiKeyToDb,
  deleteApiKeyFromDb,
} from "@/lib/ai/secrets";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

export async function GET() {
  await ensureSeeded();
  const status = await getApiKeysStatus();
  return NextResponse.json(status);
}

export async function POST(req: NextRequest) {
  await ensureSeeded();
  try {
    const body = await req.json();
    const { action, provider, apiKey, testOnly } = body as {
      action?: "save" | "delete" | "test";
      provider?: "gemini" | "openai";
      apiKey?: string;
      testOnly?: boolean;
    };

    if (!provider || !["gemini", "openai"].includes(provider)) {
      return NextResponse.json(
        { error: "Invalid provider. Must be 'gemini' or 'openai'." },
        { status: 400 }
      );
    }

    // Action: Test API key connectivity
    if (action === "test" || testOnly) {
      if (!apiKey || !apiKey.trim()) {
        return NextResponse.json(
          { error: "API key is required to test connectivity." },
          { status: 400 }
        );
      }

      try {
        if (provider === "gemini") {
          const testLlm = new ChatGoogleGenerativeAI({
            model: "gemini-2.5-flash",
            temperature: 0,
            apiKey: apiKey.trim(),
          });
          await testLlm.invoke("Ping");
        } else {
          const testLlm = new ChatOpenAI({
            modelName: "gpt-4o-mini",
            temperature: 0,
            openAIApiKey: apiKey.trim(),
          });
          await testLlm.invoke("Ping");
        }
        return NextResponse.json({ success: true, message: "Connection successful!" });
      } catch (testErr) {
        return NextResponse.json(
          { error: `Connection failed: ${(testErr as Error).message}` },
          { status: 400 }
        );
      }
    }

    // Action: Delete API key
    if (action === "delete") {
      await deleteApiKeyFromDb(provider);
      return NextResponse.json({
        success: true,
        message: `${provider === "gemini" ? "Google Gemini" : "OpenAI"} key removed.`,
        status: await getApiKeysStatus(),
      });
    }

    // Action: Save API key
    if (!apiKey || !apiKey.trim()) {
      return NextResponse.json(
        { error: "API key cannot be empty." },
        { status: 400 }
      );
    }

    await saveApiKeyToDb(provider, apiKey.trim());

    return NextResponse.json({
      success: true,
      message: `${provider === "gemini" ? "Google Gemini" : "OpenAI"} API key saved successfully.`,
      status: await getApiKeysStatus(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update settings", details: `${err}` },
      { status: 500 }
    );
  }
}
