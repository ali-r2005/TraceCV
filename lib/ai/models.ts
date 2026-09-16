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
  {
    id: "gemini-2.5-flash-lite",
    name: "Gemini 2.5 Flash Lite",
    provider: "gemini",
    description: "Lowest cost & lowest latency, for simple high-volume tasks",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    description: "Previous-gen fast model, balanced speed and quality",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "gemini",
    description: "Previous-gen lightweight model for cost-sensitive workloads",
  },
  {
    id: "gemini-3.5-flash",
    name: "Gemini 3.5 Flash",
    provider: "gemini",
    description: "Latest-gen flagship fast model, best default for structured tasks",
  },
  {
    id: "gemini-3.5-flash-lite",
    name: "Gemini 3.5 Flash Lite",
    provider: "gemini",
    description: "Latest-gen, lowest cost & latency for simple high-volume tasks",
  },
  {
    id: "gemini-3.1-pro-preview",
    name: "Gemini 3.1 Pro (Preview)",
    provider: "gemini",
    description: "Latest-gen deepest reasoning, preview — may have tighter rate limits",
  },
  {
    id: "gemini-3.1-flash-lite",
    name: "Gemini 3.1 Flash Lite",
    provider: "gemini",
    description: "Prior latest-gen lightweight model",
  },
  {
    id: "gemini-3-flash-preview",
    name: "Gemini 3 Flash (Preview)",
    provider: "gemini",
    description: "Gemini 3 generation fast model, preview",
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
