"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "bot";
  content: string;
};

// Lead state is owned by the server; we only store it and send it back.
type Lead = Record<string, unknown>;

const WELCOME_MESSAGE =
  "Welcome to Zoidics. We help businesses with websites, apps, AI, automation and custom software. What would you like help with today?";

const ERROR_MESSAGE =
  "Sorry, something went wrong. Please try again or contact us at connect@zoidics.com.";

/** Turns URLs and email addresses in bot text into clickable links. */
function renderWithLinks(text: string) {
  const pattern = /(https?:\/\/[^\s)]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;

  return text.split(pattern).map((part, i) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-orange-300 hover:text-orange-200"
        >
          {part}
        </a>
      );
    }

    if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(part)) {
      return (
        <a
          key={i}
          href={`mailto:${part}`}
          className="underline text-orange-300 hover:text-orange-200"
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", content: WELCOME_MESSAGE },
  ]);

  const [lead, setLead] = useState<Lead>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();

    const message = input.trim();

    if (!message || loading) return;

    // History = everything before this message, in the format the API expects.
    const history = messages.map((m) => ({
      role: m.role === "bot" ? "model" : "user",
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: "user", content: message }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          history,
          lead,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Something went wrong");
      }

      // Keep the conversation state returned by the server.
      setLead(data.lead ?? {});

      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
    } catch (error) {
      console.error(error);

      setMessages((prev) => [...prev, { role: "bot", content: ERROR_MESSAGE }]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    if (loading) return;
    setMessages([{ role: "bot", content: WELCOME_MESSAGE }]);
    setLead({});
    setInput("");
  };

  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md h-[650px] rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b border-white/10 px-5 py-4 flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-orange-500 flex items-center justify-center text-xl">
            Z
          </div>

          <div className="flex-1">
            <h1 className="font-semibold">Zoidics Assistant</h1>
            <p className="text-xs text-green-400">● Online</p>
          </div>

          <button
            type="button"
            onClick={startNewChat}
            disabled={loading}
            className="text-xs text-gray-400 hover:text-white disabled:opacity-40 transition"
          >
            New chat
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                  message.role === "user"
                    ? "bg-orange-500 text-white rounded-br-sm"
                    : "bg-white/10 text-gray-100 rounded-bl-sm"
                }`}
              >
                {message.role === "bot"
                  ? renderWithLinks(message.content)
                  : message.content}
              </div>
            </div>
          ))}

          {/* Loading */}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              maxLength={1500}
              className="flex-1 bg-transparent outline-none px-3 py-2 text-sm placeholder:text-gray-500"
            />

            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="h-10 w-10 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition"
            >
              ➤
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] leading-snug text-gray-500">
            AI-generated replies may be inaccurate. Please do not share
            passwords, OTPs or card details. By chatting, you agree to our{" "}
            <a href="/privacy-policy" className="underline hover:text-gray-300">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="/terms" className="underline hover:text-gray-300">
              Terms
            </a>
            .
          </p>
        </form>
      </div>
    </main>
  );
}