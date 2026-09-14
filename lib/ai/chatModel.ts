import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

/**
 * Returns the configured chat model for the LangChain agents. Provider is
 * chosen via AI_PROVIDER ("openai" | "gemini"), defaulting to "openai".
 */
export function getChatModel(temperature: number) {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();

  if (provider === "gemini") {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error(
        "GOOGLE_API_KEY is not set. Get a key from Google AI Studio and add it to .env.local."
      );
    }
    return new ChatGoogleGenerativeAI({
      model: process.env.AI_MODEL || "gemini-2.5-flash",
      temperature,
      apiKey: process.env.GOOGLE_API_KEY,
    });
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to .env.local, or set AI_PROVIDER=gemini and GOOGLE_API_KEY instead."
    );
  }
  return new ChatOpenAI({ modelName: "gpt-4o", temperature });
}
