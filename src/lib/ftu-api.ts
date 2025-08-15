import { AppConfig } from "./config";

export interface FtuAPI {
  chat(
    messages: { role: "system" | "user" | "assistant"; content: string }[]
  ): Promise<string>;
  startChatStream(
    messages: { role: "system" | "user" | "assistant"; content: string }[]
  ): Promise<string>;
  onChatToken(cb: (e: { id: string; token: string }) => void): void;
  onChatDone(cb: (e: { id: string; final: string }) => void): void;
  onChatError(cb: (e: { id: string; error: string }) => void): void;
  cancelChatStream(id: string): Promise<void>;
  getConfig(): Promise<AppConfig & { apiKeySet: boolean }>;
  saveConfig(partial: Partial<AppConfig>): Promise<void>;
  setApiKey(key: string): Promise<void>;
  clearApiKey(): Promise<void>;
  toggleWindow(): Promise<void>;
  focusInput(): Promise<void>;
}

// Extend the Window interface to include 'ftu'
declare global {
  interface Window {
    ftu: FtuAPI;
  }
}

export const ftu: FtuAPI = window.ftu;
