import { ftu } from "./ftu-api";
import { ProviderEnum } from "./config";

export type Role = "system" | "user" | "assistant";
export type Message = { role: Role; content: string };

export class OpenRouterDriver {
  static async chat(
    messages: Message[],
    model: string,
    provider: typeof ProviderEnum.type
  ): Promise<string> {
    return await ftu.chat(messages);
  }

  static async stream(
    messages: Message[],
    model: string,
    provider: typeof ProviderEnum.type,
    onToken: (token: string) => void
  ): Promise<string> {
    const id = await ftu.startChatStream(messages);
    let final = "";
    ftu.onChatToken((e) => {
      if (e.id === id) {
        final += e.token;
        onToken(e.token);
      }
    });
    return new Promise<string>((resolve, reject) => {
      ftu.onChatDone((e) => {
        if (e.id === id) resolve(e.final);
      });
      ftu.onChatError((e) => {
        if (e.id === id) reject(new Error(e.error));
      });
    });
  }
}
