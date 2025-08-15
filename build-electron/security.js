"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// electron/security.ts
var security_exports = {};
__export(security_exports, {
  Security: () => Security
});
module.exports = __toCommonJS(security_exports);
var Security = class {
  static setupCSP(win, config) {
    win.webContents.session.webRequest.onHeadersReceived(
      (details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            "Content-Security-Policy": [
              "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://openrouter.ai/api/v1 http://localhost:11434/v1; object-src 'none'; base-uri 'self'; frame-src 'none';"
            ]
          }
        });
      }
    );
  }
  static sanitize(str) {
    return str.replace(/[<>]/g, "");
  }
  static isAllowedURL(url, config) {
    return [config.openrouter.baseURL, config.local.baseURL].some(
      (base) => url.startsWith(base)
    );
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Security
});
