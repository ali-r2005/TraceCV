import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { getApiKeyFromDb } from "./secrets";
import { getModelById, type AIProvider } from "./models";

export type ChatModelOptions = {
  modelId?: string;
  provider?: AIProvider;
  temperature?: number;
};

/**
 * Returns the configured chat model for LangChain agents.
 * API keys are fetched strictly from the database.
 */
export async function getChatModel(options: ChatModelOptions | number = 0) {
  const temperature =
    typeof options === "number" ? options : options.temperature ?? 0;
  const requestedModelId =
    typeof options === "object" ? options.modelId : undefined;
  const requestedProvider =
    typeof options === "object" ? options.provider : undefined;

  const modelInfo = getModelById(requestedModelId);
  const provider: AIProvider =
    requestedProvider || (modelInfo ? modelInfo.provider : "gemini");
  const modelName = modelInfo ? modelInfo.id : (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o");

  const apiKey = await getApiKeyFromDb(provider);

  if (!apiKey) {
    const providerName = provider === "gemini" ? "Google Gemini" : "OpenAI";
    throw new Error(
      `${providerName} API key is not configured in the database. Please visit the Admin Portal (/admin/settings) to configure the API key.`
    );
  }

  if (provider === "gemini") {
    return new ChatGoogleGenerativeAI({
      model: modelName,
      temperature,
      apiKey,
    });
  }

  return new ChatOpenAI({
    modelName,
    temperature,
    openAIApiKey: apiKey,
  });
}
