import "@/lib/db/migrate";
import { NextResponse } from "next/server";
import { SUPPORTED_MODELS } from "@/lib/ai/models";
import { getApiKeysStatus } from "@/lib/ai/secrets";

export async function GET() {
  const status = getApiKeysStatus();

  const models = SUPPORTED_MODELS.map((m) => {
    const isAvailable = status[m.provider].configured;
    return {
      ...m,
      isAvailable,
    };
  });

  return NextResponse.json({
    models,
    configuredProviders: {
      gemini: status.gemini.configured,
      openai: status.openai.configured,
    },
  });
}
