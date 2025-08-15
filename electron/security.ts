import { AppConfig } from "../src/lib/config";

export class Security {
  public static setupCSP(win: Electron.BrowserWindow, config: AppConfig) {
    // TODO: For dynamic CSP, update connect-src to config.openrouter.baseURL and config.local.baseURL
    win.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://openrouter.ai/api/v1 http://localhost:11434/v1; object-src 'none'; base-uri 'self'; frame-src 'none';",
            ],
          },
        });
      }
    );
  }

  public static sanitize(str: string): string {
    return str.replace(/[<>]/g, "");
  }

  public static isAllowedURL(url: string, config: AppConfig): boolean {
    return [config.openrouter.baseURL, config.local.baseURL].some((base) =>
      url.startsWith(base)
    );
  }
}
