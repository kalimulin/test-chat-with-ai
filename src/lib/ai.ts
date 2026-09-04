import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import {
  generateObject,
  generateText,
  streamText,
  type ModelMessage,
} from "ai";
import type { z } from "zod";
import { env } from "~/env";

export const AI_BASE_URL = "https://api.aitunnel.ru/v1/";
export const MODEL_ID = "glm-5.3-flash";

const aitunnel = createOpenAICompatible({
  name: "aitunnel",
  baseURL: AI_BASE_URL,
  apiKey: env.AITUNNEL_API_KEY,
});

export const model = aitunnel(MODEL_ID);

export type GenerateOptions = {
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  signal?: AbortSignal;
};

export async function complete(
  prompt: string | ModelMessage[],
  options: GenerateOptions = {},
): Promise<string> {
  const result = await generateText({
    model,
    ...(typeof prompt === "string" ? { prompt } : { messages: prompt }),
    ...options,
  });
  return result.text;
}

export function completeStream(
  prompt: string | ModelMessage[],
  options: GenerateOptions = {},
) {
  return streamText({
    model,
    ...(typeof prompt === "string" ? { prompt } : { messages: prompt }),
    ...options,
  });
}

export async function completeStructured<T extends z.ZodType>(args: {
  schema: T;
  prompt: string | ModelMessage[];
  system?: string;
  temperature?: number;
  signal?: AbortSignal;
}): Promise<z.infer<T>> {
  const { object } = await generateObject({
    model,
    schema: args.schema,
    ...(typeof args.prompt === "string"
      ? { prompt: args.prompt }
      : { messages: args.prompt }),
    ...(args.system ? { system: args.system } : {}),
    ...(args.temperature !== undefined
      ? { temperature: args.temperature }
      : {}),
    ...(args.signal ? { abortSignal: args.signal } : {}),
  });
  return object;
}
