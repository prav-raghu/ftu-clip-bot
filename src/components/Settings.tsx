import { useEffect, useState } from "react";
import { ftu } from "@/lib/ftu-api";
import { AppConfig } from "@/lib/config";

interface SettingsProps {
  onClose: () => void;
}

export default function Settings({ onClose }: Readonly<SettingsProps>) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [apiKeySet, setApiKeySet] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    ftu.getConfig().then((cfg) => {
      setConfig(cfg);
      setApiKeySet(cfg.apiKeySet);
    });
  }, []);

  async function save() {
    if (!config) return;
    setSaving(true);
    await ftu.saveConfig(config);
    setSaving(false);
  }

  async function setKey() {
    await ftu.setApiKey(apiKey);
    setApiKeySet(true);
    setApiKey("");
  }

  async function clearKey() {
    await ftu.clearApiKey();
    setApiKeySet(false);
  }

  if (!config) return <div className="chat">Loading...</div>;

  return (
    <div className="chat">
      <h3>Settings</h3>
      <div>
        <label htmlFor="provider-select">Provider:</label>
        <select
          id="provider-select"
          value={config.provider}
          onChange={(e) =>
            setConfig({
              ...config,
              provider: e.target.value as "openrouter" | "local",
            })
          }
        >
          <option value="openrouter">OpenRouter</option>
          <option value="local">Local</option>
        </select>
      </div>
      <div>
        <label>Model:</label>
        <input
          value={config.model}
          onChange={(e) => setConfig({ ...config, model: e.target.value })}
          placeholder="Enter model name"
        />
      </div>
      <div>
        <label>OpenRouter Base URL:</label>
        <input
          value={config.openrouter.baseURL}
          onChange={(e) =>
            setConfig({
              ...config,
              openrouter: { ...config.openrouter, baseURL: e.target.value },
            })
          }
          placeholder="Enter OpenRouter base URL"
          title="OpenRouter base URL"
        />
      </div>
      <div>
        <label>Local Base URL:</label>
        <input
          value={config.local.baseURL}
          onChange={(e) =>
            setConfig({
              ...config,
              local: { ...config.local, baseURL: e.target.value },
            })
          }
          placeholder="Enter Local base URL"
          title="Local base URL"
        />
      </div>
      <div>
        <label htmlFor="alwaysOnTop">Always On Top:</label>
        <input
          id="alwaysOnTop"
          type="checkbox"
          checked={config.ui.alwaysOnTop}
          onChange={(e) =>
            setConfig({
              ...config,
              ui: { ...config.ui, alwaysOnTop: e.target.checked },
            })
          }
          title="Toggle Always On Top"
        />
      </div>
      <div>
        <label>Start On Login:</label>
        <input
          type="checkbox"
          checked={config.ui.startOnLogin}
          onChange={(e) =>
            setConfig({
              ...config,
              ui: { ...config.ui, startOnLogin: e.target.checked },
            })
          }
          title="Toggle Start On Login"
          placeholder="Enable start on login"
        />
      </div>
      <div>
        <label>Hotkeys Enabled:</label>
        <input
          type="checkbox"
          checked={config.ui.hotkeysEnabled}
          onChange={(e) =>
            setConfig({
              ...config,
              ui: { ...config.ui, hotkeysEnabled: e.target.checked },
            })
          }
          title="Toggle Hotkeys Enabled"
          placeholder="Enable or disable hotkeys"
        />
      </div>
      <div>
        <label>API Key:</label>
        <span>{apiKeySet ? "Set" : "Not set"}</span>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Set new key"
        />
        <button onClick={setKey}>Set</button>
        <button onClick={clearKey}>Clear</button>
      </div>
      <div>
        <button onClick={save} disabled={saving}>
          Save
        </button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
