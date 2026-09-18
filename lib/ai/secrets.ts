import { eq, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { appSettings } from "../db/schema";
import type { AIProvider } from "./models";

const PROVIDER_KEY_MAP: Record<AIProvider, string> = {
  gemini: "google_api_key",
  openai: "openai_api_key",
};

/**
 * Retrieves the API key for a provider strictly from the database.
 * No .env fallback is used.
 */
export async function getApiKeyFromDb(provider: AIProvider): Promise<string | null> {
  const settingKey = PROVIDER_KEY_MAP[provider];
  const [row] = await db
    .select()
    .from(appSettings)
    .where(eq(appSettings.key, settingKey));

  if (row && row.value && row.value.trim().length > 0) {
    return row.value.trim();
  }
  return null;
}

/**
 * Saves or updates an API key in the database.
 */
export async function saveApiKeyToDb(provider: AIProvider, apiKey: string): Promise<void> {
  const settingKey = PROVIDER_KEY_MAP[provider];
  const trimmed = apiKey.trim();
  const now = new Date();

  await db
    .insert(appSettings)
    .values({ key: settingKey, value: trimmed, updatedAt: now })
    .onConflictDoUpdate({
      target: appSettings.key,
      set: { value: trimmed, updatedAt: now },
    });
}

/**
 * Deletes an API key from the database.
 */
export async function deleteApiKeyFromDb(provider: AIProvider): Promise<void> {
  const settingKey = PROVIDER_KEY_MAP[provider];
  await db.delete(appSettings).where(eq(appSettings.key, settingKey));
}

/**
 * Masks an API key for safe UI display (e.g. "AIzaSy...4aB2").
 */
function maskSecret(secret: string): string {
  if (secret.length <= 8) return "••••••••";
  const start = secret.slice(0, 6);
  const end = secret.slice(-4);
  return `${start}${"•".repeat(Math.min(12, secret.length - 10))}${end}`;
}

/**
 * Returns the configuration status and masked previews for both providers.
 */
export async function getApiKeysStatus(): Promise<
  Record<AIProvider, { configured: boolean; masked: string; updatedAt: string | null }>
> {
  const rows = await db
    .select()
    .from(appSettings)
    .where(inArray(appSettings.key, ["google_api_key", "openai_api_key"]));

  const geminiRow = rows.find((r) => r.key === "google_api_key");
  const openaiRow = rows.find((r) => r.key === "openai_api_key");

  return {
    gemini: {
      configured: !!(geminiRow && geminiRow.value.trim().length > 0),
      masked: geminiRow && geminiRow.value ? maskSecret(geminiRow.value) : "",
      updatedAt: geminiRow?.updatedAt ? geminiRow.updatedAt.toISOString() : null,
    },
    openai: {
      configured: !!(openaiRow && openaiRow.value.trim().length > 0),
      masked: openaiRow && openaiRow.value ? maskSecret(openaiRow.value) : "",
      updatedAt: openaiRow?.updatedAt ? openaiRow.updatedAt.toISOString() : null,
    },
  };
}
