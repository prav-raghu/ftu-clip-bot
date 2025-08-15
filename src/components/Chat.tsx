import { useRef, useState } from "react";
import { OpenRouterDriver, Message } from "@/lib/open-router";
import { ProviderEnum } from "@/lib/config";

const SYSTEM_PROMPT =
  "You are FTU Clip Bot, a friendly Windows desktop assistant. Keep replies concise, actionable, and witty.";

export default function Chat() {
  const [provider, setProvider] = useState<typeof ProviderEnum.type>("enum");
  const [model, setModel] = useState("meta-llama/3.1-8b-instruct");
  const [messages, setMessages] = useState<Message[]>([
    { role: "system", content: SYSTEM_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const view = messages.filter((m) => m.role !== "system");

  async function send() {
    const content = input.trim();
    if (!content || streaming) return;
    setInput("");
    setError(null);
    const next = [...messages, { role: "user", content } as Message];
    setMessages(next);
    setStreaming(true);

    try {
      let reply = "";
      reply = await OpenRouterDriver.stream(next, model, provider, (token) => {
        reply += token;
        setMessages((m) => [
          ...m.slice(0, -1),
          { ...m[m.length - 1] },
          { role: "assistant", content: reply },
        ]);
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      setStreaming(false);
    } catch (err) {
      if (err instanceof Error) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: `⚠️ Error: ${err.message}` },
        ]);
        setStreaming(false);
        setError(err.message);
      }
    }
  }

  return (
    <div className="chat">
      <div className="messages" ref={listRef}>
        {view.map((m) => (
          <div key={`${m.role}-${m.content}`} className={`msg ${m.role}`}>
            {m.content}
          </div>
        ))}
        {error && <div className="msg assistant">{error}</div>}
      </div>
      <div className="inputbar">
        <select
          aria-label="Provider"
          value={provider}
          onChange={(e) =>
            setProvider(e.target.value as typeof ProviderEnum.type)
          }
        >
          <option value="openrouter">OpenRouter</option>
          <option value="local">Local</option>
        </select>
        <input
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="model id"
          className="model-input"
        />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask FTU..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send} disabled={streaming}>
          Send
        </button>
      </div>
    </div>
  );
}
