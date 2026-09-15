export type AIProvider = "gemini" | "openai";

export type AIModelInfo = {
  id: string;
  name: string;
  provider: AIProvider;
  description: string;
  isDefault?: boolean;
};

export const SUPPORTED_MODELS: AIModelInfo[] = [
  // Google Gemini
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Fast & intelligent with high precision structured outputs",
    isDefault: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    description: "Complex reasoning & deep text enhancement",
  },
  // OpenAI
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    description: "Flagship multimodal OpenAI model",
    isDefault: true,
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast & lightweight OpenAI model",
  },
];

export function getModelById(modelId?: string): AIModelInfo | undefined {
  if (!modelId) return SUPPORTED_MODELS[0];
  return SUPPORTED_MODELS.find((m) => m.id === modelId);
}

export function getDefaultModelForProvider(provider: AIProvider): AIModelInfo {
  const found = SUPPORTED_MODELS.find(
    (m) => m.provider === provider && m.isDefault
  );
  return found || SUPPORTED_MODELS.find((m) => m.provider === provider)!;
}
