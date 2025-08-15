"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/storage.ts
var storage_exports = {};
__export(storage_exports, {
  Storage: () => Storage
});
module.exports = __toCommonJS(storage_exports);
var import_electron = require("electron");
var import_node_fs = __toESM(require("fs"));
var import_node_path = __toESM(require("path"));

// src/lib/config.ts
var import_zod = require("zod");
var ProviderEnum = import_zod.z.enum(["openrouter", "local"]);
var AppUI = import_zod.z.object({
  alwaysOnTop: import_zod.z.boolean().default(true),
  startOnLogin: import_zod.z.boolean().default(false),
  hotkeysEnabled: import_zod.z.boolean().default(true)
});
var OpenRouterConfig = import_zod.z.object({
  baseURL: import_zod.z.string().url().default("https://openrouter.ai/api/v1"),
  referer: import_zod.z.string().url().optional(),
  title: import_zod.z.string().optional()
});
var LocalConfig = import_zod.z.object({
  baseURL: import_zod.z.string().url().default("http://localhost:11434/v1")
});
var AppConfigSchema = import_zod.z.object({
  provider: ProviderEnum.default("openrouter"),
  model: import_zod.z.string().min(1).default("meta-llama/3.1-8b-instruct"),
  openrouter: OpenRouterConfig.default({
    baseURL: "https://openrouter.ai/api/v1"
  }),
  local: LocalConfig.default({ baseURL: "http://localhost:11434/v1" }),
  ui: AppUI.default({
    alwaysOnTop: true,
    startOnLogin: false,
    hotkeysEnabled: true
  })
});
var ChatMessageSchema = import_zod.z.object({
  role: import_zod.z.enum(["system", "user", "assistant"]),
  content: import_zod.z.string().min(1)
});
var ChatRequestSchema = import_zod.z.object({
  messages: import_zod.z.array(ChatMessageSchema).min(1),
  model: import_zod.z.string().min(1),
  provider: ProviderEnum
});

// electron/storage.ts
var import_keytar = __toESM(require("keytar"));
var CONFIG_PATH = import_node_path.default.join(import_electron.app.getPath("userData"), "config.json");
var SERVICE = "ftu-clip-bot";
var ACCOUNT = "openrouter";
var Storage = class _Storage {
  static loadConfig() {
    try {
      const raw = import_node_fs.default.readFileSync(CONFIG_PATH, "utf8");
      const parsed = AppConfigSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        const repaired = AppConfigSchema.parse({});
        _Storage.saveConfig(repaired);
        return repaired;
      }
      return parsed.data;
    } catch {
      const def = AppConfigSchema.parse({});
      _Storage.saveConfig(def);
      return def;
    }
  }
  static saveConfig(partial) {
    const current = _Storage.loadConfig();
    const merged = { ...current, ...partial };
    const valid = AppConfigSchema.parse(merged);
    import_node_fs.default.writeFileSync(CONFIG_PATH, JSON.stringify(valid, null, 2));
    return valid;
  }
  static async setApiKey(key) {
    await import_keytar.default.setPassword(SERVICE, ACCOUNT, key);
  }
  static async clearApiKey() {
    await import_keytar.default.deletePassword(SERVICE, ACCOUNT);
  }
  static async apiKeySet() {
    const key = await import_keytar.default.getPassword(SERVICE, ACCOUNT);
    return !!key;
  }
  static async getApiKey() {
    return await import_keytar.default.getPassword(SERVICE, ACCOUNT);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Storage
});
