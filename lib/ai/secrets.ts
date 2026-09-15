import { sqlite } from "../db/client";
import type { AIProvider } from "./models";

const PROVIDER_KEY_MAP: Record<AIProvider, string> = {
  gemini: "google_api_key",
  openai: "openai_api_key",
};

/**
 * Retrieves the API key for a provider strictly from the SQLite database.
 * No .env fallback is used.
 */
export function getApiKeyFromDb(provider: AIProvider): string | null {
  const settingKey = PROVIDER_KEY_MAP[provider];
  const row = sqlite
    .prepare("SELECT value FROM app_settings WHERE key = ?")
    .get(settingKey) as { value: string } | undefined;

  if (row && row.value && row.value.trim().length > 0) {
    return row.value.trim();
  }
  return null;
}

/**
 * Saves or updates an API key in the database.
 */
export function saveApiKeyToDb(provider: AIProvider, apiKey: string): void {
  const settingKey = PROVIDER_KEY_MAP[provider];
  const trimmed = apiKey.trim();
  const now = new Date().toISOString();

  sqlite
    .prepare(
      `INSERT INTO app_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .run(settingKey, trimmed, now);
}

/**
 * Deletes an API key from the database.
 */
export function deleteApiKeyFromDb(provider: AIProvider): void {
  const settingKey = PROVIDER_KEY_MAP[provider];
  sqlite.prepare("DELETE FROM app_settings WHERE key = ?").run(settingKey);
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
export function getApiKeysStatus(): Record<
  AIProvider,
  { configured: boolean; masked: string; updatedAt: string | null }
> {
  const rows = sqlite
    .prepare("SELECT key, value, updated_at FROM app_settings WHERE key IN (?, ?)")
    .all("google_api_key", "openai_api_key") as Array<{
    key: string;
    value: string;
    updated_at: string;
  }>;

  const geminiRow = rows.find((r) => r.key === "google_api_key");
  const openaiRow = rows.find((r) => r.key === "openai_api_key");

  return {
    gemini: {
      configured: !!(geminiRow && geminiRow.value.trim().length > 0),
      masked: geminiRow && geminiRow.value ? maskSecret(geminiRow.value) : "",
      updatedAt: geminiRow ? geminiRow.updated_at : null,
    },
    openai: {
      configured: !!(openaiRow && openaiRow.value.trim().length > 0),
      masked: openaiRow && openaiRow.value ? maskSecret(openaiRow.value) : "",
      updatedAt: openaiRow ? openaiRow.updated_at : null,
    },
  };
}
