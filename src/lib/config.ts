import { z } from "zod";
export const ProviderEnum = z.enum(["openrouter", "local"]);
export const AppUI = z.object({
  alwaysOnTop: z.boolean().default(true),
  startOnLogin: z.boolean().default(false),
  hotkeysEnabled: z.boolean().default(true),
});
export const OpenRouterConfig = z.object({
  baseURL: z.string().url().default("https://openrouter.ai/api/v1"),
  referer: z.string().url().optional(),
  title: z.string().optional(),
});
export const LocalConfig = z.object({
  baseURL: z.string().url().default("http://localhost:11434/v1"),
});
export const AppConfigSchema = z.object({
  provider: ProviderEnum.default("openrouter"),
  model: z.string().min(1).default("meta-llama/3.1-8b-instruct"),
  openrouter: OpenRouterConfig.default({
    baseURL: "https://openrouter.ai/api/v1",
  }),
  local: LocalConfig.default({ baseURL: "http://localhost:11434/v1" }),
  ui: AppUI.default({
    alwaysOnTop: true,
    startOnLogin: false,
    hotkeysEnabled: true,
  }),
});
export type AppConfig = z.infer<typeof AppConfigSchema>;
export const ChatMessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string().min(1),
});
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  model: z.string().min(1),
  provider: ProviderEnum,
});
