import { contextBridge, ipcRenderer } from "electron";
import { AppConfig } from "../src/lib/config";

type Role = "system" | "user" | "assistant";

contextBridge.exposeInMainWorld("ftu", {
  chat: async (messages: { role: Role; content: string }[]) =>
    ipcRenderer.invoke("chat", {
      messages,
      model: undefined,
      provider: undefined,
    }),
  startChatStream: async (messages: { role: Role; content: string }[]) =>
    ipcRenderer.invoke("startChatStream", {
      messages,
      model: undefined,
      provider: undefined,
    }),
  onChatToken: (cb: (e: { id: string; token: string }) => void) =>
    ipcRenderer.on("chat:token", (_evt, payload) => cb(payload)),
  onChatDone: (cb: (e: { id: string; final: string }) => void) =>
    ipcRenderer.on("chat:done", (_evt, payload) => cb(payload)),
  onChatError: (cb: (e: { id: string; error: string }) => void) =>
    ipcRenderer.on("chat:error", (_evt, payload) => cb(payload)),
  cancelChatStream: async (id: string) =>
    ipcRenderer.invoke("cancelChatStream", id),
  getConfig: async () => ipcRenderer.invoke("getConfig"),
  saveConfig: async (partial: Partial<AppConfig>) =>
    ipcRenderer.invoke("saveConfig", partial),
  setApiKey: async (key: string) => ipcRenderer.invoke("setApiKey", key),
  clearApiKey: async () => ipcRenderer.invoke("clearApiKey"),
  toggleWindow: async () => ipcRenderer.invoke("toggleWindow"),
  focusInput: async () => ipcRenderer.invoke("focusInput"),
});
