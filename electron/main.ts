import {
  app,
  BrowserWindow,
  Tray,
  Menu,
  ipcMain,
  globalShortcut,
} from "electron";
import path from "node:path";
import { Storage } from "./storage";
import { ChatRequestSchema, AppConfig } from "../src/lib/config";
import { Security } from "./security";
import axios, { AxiosRequestConfig } from "axios";

let win: BrowserWindow | null = null;
let tray: Tray | null = null;
let config: AppConfig = Storage.loadConfig();
const streamControllers: Map<string, AbortController> = new Map();

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 540,
    frame: false,
    transparent: true,
    alwaysOnTop: config.ui.alwaysOnTop,
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  Security.setupCSP(win, config);

  win.loadURL(
    process.env.VITE_DEV_SERVER_URL ||
      `file://${path.join(process.cwd(), "dist/index.html")}`
  );

  win.webContents.on("will-navigate", (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
}

function createTray() {
  const iconPath = path.join(process.cwd(), "assets", "mascot.png");
  tray = new Tray(iconPath);
  tray.setToolTip("FTU Clip Bot");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show/Hide",
        click: () => {
          if (!win) return;
          win.isVisible() ? win.hide() : win.show();
        },
      },
      {
        label: "Open Settings",
        click: () => win?.webContents.send("show:settings"),
      },
      {
        label: "Switch Provider",
        click: () => {
          config.provider =
            config.provider === "openrouter" ? "local" : "openrouter";
          Storage.saveConfig(config);
          win?.webContents.send("config:update", config);
        },
      },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() },
    ])
  );
}

function setupHotkeys() {
  if (!config.ui.hotkeysEnabled) return;
  globalShortcut.register("Control+Shift+Space", () =>
    win?.isVisible() ? win?.hide() : win?.show()
  );
  globalShortcut.register("Control+Shift+C", () =>
    win?.webContents.send("focus:input")
  );
}

app.whenReady().then(() => {
  config = Storage.loadConfig();
  createWindow();
  createTray();
  setupHotkeys();
  app.setLoginItemSettings({ openAtLogin: config.ui.startOnLogin });
  app.on(
    "activate",
    () => BrowserWindow.getAllWindows().length === 0 && createWindow()
  );
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => globalShortcut.unregisterAll());

//#region [IPC]
//#region [Config]
ipcMain.handle("getConfig", async () => {
  config = Storage.loadConfig();
  return { ...config, apiKeySet: await Storage.apiKeySet() };
});
ipcMain.handle("saveConfig", async (_evt, partial: Partial<AppConfig>) => {
  config = Storage.saveConfig(partial);
});
ipcMain.handle("setApiKey", async (_evt, key: string) => {
  await Storage.setApiKey(key);
});
ipcMain.handle("clearApiKey", async () => {
  await Storage.clearApiKey();
});
//#endregion
//#region [Window controls]
ipcMain.handle("toggleWindow", () => {
  if (!win) return;
  win.isVisible() ? win.hide() : win.show();
});
ipcMain.handle("focusInput", () => win?.webContents.send("focus:input"));
//#endregion
//#region [Chat (non-streaming)]
ipcMain.handle("chat", async (_evt, payload) => {
  const parsed = ChatRequestSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid chat payload");
  const { messages, model, provider } = parsed.data;
  const baseURL =
    provider === "openrouter"
      ? config.openrouter.baseURL
      : config.local.baseURL;
  if (!Security.isAllowedURL(baseURL, config))
    throw new Error("Blocked baseURL");
  const apiKey =
    provider === "openrouter" ? await Storage.getApiKey() : undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  if (provider === "openrouter") {
    if (config.openrouter.referer)
      headers["HTTP-Referer"] = config.openrouter.referer;
    if (config.openrouter.title) headers["X-Title"] = config.openrouter.title;
  }
  const body = JSON.stringify({
    model,
    messages,
    temperature: 0.7,
    stream: false,
  });
  try {
    const res = await axios.post(
      `${baseURL}/chat/completions`,
      {
        model,
        messages,
        temperature: 0.7,
        stream: false,
      },
      { headers }
    );
    return Security.sanitize(res.data.choices?.[0]?.message?.content ?? "");
  } catch (err) {
    if (axios.isAxiosError(err)) {
      throw new Error(
        `LLM error ${err.response?.status}: ${err.response?.data}`
      );
    }
    throw err;
  }
});
//#endregion
//#region [Streaming chat]
ipcMain.handle("startChatStream", async (_evt, payload) => {
  const parsed = ChatRequestSchema.safeParse(payload);
  if (!parsed.success) throw new Error("Invalid chat payload");
  const { messages, model, provider } = parsed.data;
  const baseURL =
    provider === "openrouter"
      ? config.openrouter.baseURL
      : config.local.baseURL;
  if (!Security.isAllowedURL(baseURL, config))
    throw new Error("Blocked baseURL");
  const apiKey =
    provider === "openrouter" ? await Storage.getApiKey() : undefined;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
  };
  if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
  if (provider === "openrouter") {
    if (config.openrouter.referer)
      headers["HTTP-Referer"] = config.openrouter.referer;
    if (config.openrouter.title) headers["X-Title"] = config.openrouter.title;
  }
  const streamId = Math.random().toString(36).slice(2, 10);
  const controller = new AbortController();
  streamControllers.set(streamId, controller);

  (async () => {
    try {
      const axiosConfig: AxiosRequestConfig = {
        headers,
        responseType: "stream",
        signal: controller.signal,
      };
      const res = await axios.post(
        `${baseURL}/chat/completions`,
        {
          model,
          messages,
          temperature: 0.7,
          stream: true,
        },
        axiosConfig
      );
      const stream = res.data;
      let final = "";
      let buffer = "";
      stream.on("data", (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        let lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.trim() || line.startsWith("event: ping")) continue;
          if (line.trim() === "data: [DONE]") {
            win?.webContents.send("chat:done", { id: streamId, final });
            streamControllers.delete(streamId);
            return;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const token =
                data?.choices?.[0]?.delta?.content ??
                data?.choices?.[0]?.message?.content ??
                "";
              if (token) {
                final += token;
                win?.webContents.send("chat:token", {
                  id: streamId,
                  token: Security.sanitize(token),
                });
              }
            } catch {
              win?.webContents.send("chat:error", {
                id: streamId,
                error: "Malformed SSE frame",
              });
            }
          }
          stream.on("end", () => {
            win?.webContents.send("chat:done", { id: streamId, final });
            streamControllers.delete(streamId);
          });
          stream.on("error", (err: Error) => {
            win?.webContents.send("chat:error", {
              id: streamId,
              error: err.message,
            });
            streamControllers.delete(streamId);
          });
          if (line.trim() === "data: [DONE]") {
            win?.webContents.send("chat:done", { id: streamId, final });
            streamControllers.delete(streamId);
            return;
          }
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              const token =
                data?.choices?.[0]?.delta?.content ??
                data?.choices?.[0]?.message?.content ??
                "";
              if (token) {
                final += token;
                win?.webContents.send("chat:token", {
                  id: streamId,
                  token: Security.sanitize(token),
                });
              }
            } catch (err) {
              win?.webContents.send("chat:error", {
                id: streamId,
                error: "Malformed SSE frame",
              });
            }
          }
        }
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        win?.webContents.send("chat:error", {
          id: streamId,
          error: err.message,
        });
      } else {
        win?.webContents.send("chat:error", {
          id: streamId,
          error: "Unknown error",
        });
      }
      streamControllers.delete(streamId);
    }
  })();

  return streamId;
});

ipcMain.handle("cancelChatStream", async (_evt, id: string) => {
  const controller = streamControllers.get(id);
  if (controller) controller.abort();
  streamControllers.delete(id);
});
//#endregion
//#endregion
