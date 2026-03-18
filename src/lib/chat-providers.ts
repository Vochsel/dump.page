export const CHAT_PROVIDERS = [
  {
    id: "claude",
    name: "Claude",
    favicon: "/claude-color.svg",
    buildUrl: (prompt: string) =>
      `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    favicon: "https://chatgpt.com/favicon.ico",
    buildUrl: (prompt: string) =>
      `https://chatgpt.com/?q=${encodeURIComponent(prompt)}`,
  },
  {
    id: "grok",
    name: "Grok",
    favicon: "https://grok.com/images/favicon.svg",
    buildUrl: (prompt: string) =>
      `https://grok.com/?q=${encodeURIComponent(prompt)}`,
  },
] as const;

export type ChatProviderId = (typeof CHAT_PROVIDERS)[number]["id"];

export const CHAT_PROVIDER_STORAGE_KEY = "dump-chat-provider";
export const PRO_MODE_STORAGE_KEY = "dump-pro-mode";
