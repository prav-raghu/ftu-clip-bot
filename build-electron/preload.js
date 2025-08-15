"use strict";

// electron/preload.ts
var import_electron = require("electron");
import_electron.contextBridge.exposeInMainWorld("ftu", {
  chat: async (messages) => import_electron.ipcRenderer.invoke("chat", {
    messages,
    model: void 0,
    provider: void 0
  }),
  startChatStream: async (messages) => import_electron.ipcRenderer.invoke("startChatStream", {
    messages,
    model: void 0,
    provider: void 0
  }),
  onChatToken: (cb) => import_electron.ipcRenderer.on("chat:token", (_evt, payload) => cb(payload)),
  onChatDone: (cb) => import_electron.ipcRenderer.on("chat:done", (_evt, payload) => cb(payload)),
  onChatError: (cb) => import_electron.ipcRenderer.on("chat:error", (_evt, payload) => cb(payload)),
  cancelChatStream: async (id) => import_electron.ipcRenderer.invoke("cancelChatStream", id),
  getConfig: async () => import_electron.ipcRenderer.invoke("getConfig"),
  saveConfig: async (partial) => import_electron.ipcRenderer.invoke("saveConfig", partial),
  setApiKey: async (key) => import_electron.ipcRenderer.invoke("setApiKey", key),
  clearApiKey: async () => import_electron.ipcRenderer.invoke("clearApiKey"),
  toggleWindow: async () => import_electron.ipcRenderer.invoke("toggleWindow"),
  focusInput: async () => import_electron.ipcRenderer.invoke("focusInput")
});
