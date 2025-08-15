import { app } from "electron";
import fs from "node:fs";
import path from "node:path";
import { AppConfigSchema, AppConfig } from "../src/lib/config";
import keytar from "keytar";

const CONFIG_PATH = path.join(app.getPath("userData"), "config.json");
const SERVICE = "ftu-clip-bot";
const ACCOUNT = "openrouter";

export class Storage {
  public static loadConfig(): AppConfig {
    try {
      const raw = fs.readFileSync(CONFIG_PATH, "utf8");
      const parsed = AppConfigSchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        const repaired = AppConfigSchema.parse({});
        Storage.saveConfig(repaired);
        return repaired;
      }
      return parsed.data;
    } catch {
      const def = AppConfigSchema.parse({});
      Storage.saveConfig(def);
      return def;
    }
  }

  public static saveConfig(partial: Partial<AppConfig>): AppConfig {
    const current = Storage.loadConfig();
    const merged = { ...current, ...partial };
    const valid = AppConfigSchema.parse(merged);
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(valid, null, 2));
    return valid;
  }

  public static async setApiKey(key: string): Promise<void> {
    await keytar.setPassword(SERVICE, ACCOUNT, key);
  }

  public static async clearApiKey(): Promise<void> {
    await keytar.deletePassword(SERVICE, ACCOUNT);
  }

  public static async apiKeySet(): Promise<boolean> {
    const key = await keytar.getPassword(SERVICE, ACCOUNT);
    return !!key;
  }

  public static async getApiKey(): Promise<string | null> {
    return await keytar.getPassword(SERVICE, ACCOUNT);
  }
}
