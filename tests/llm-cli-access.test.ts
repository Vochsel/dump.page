import { describe, it, expect } from "vitest";
import { execSync } from "child_process";

const BASE = "https://www.dump.page";

const BOARDS = {
  shared: {
    slug: "sq69ikk2",
    token: "91e92fd332004b1f",
    llmsUrl: `${BASE}/b/sq69ikk2/llms.txt?token=91e92fd332004b1f`,
  },
  public: {
    slug: "94ulfvtn",
    llmsUrl: `${BASE}/b/94ulfvtn/llms.txt`,
  },
};

const FULL_PATH = [
  process.env.HOME + "/.local/bin",
  "/usr/local/bin",
  "/usr/bin",
  "/bin",
  "/usr/sbin",
  "/sbin",
  process.env.PATH,
].join(":");

function runCli(command: string): string {
  return execSync(command, {
    encoding: "utf-8",
    timeout: 120_000,
    env: { ...process.env, PATH: FULL_PATH, CLAUDECODE: "" },
  }).trim();
}

function hasCli(name: string): boolean {
  try {
    execSync(`which ${name}`, { encoding: "utf-8", env: { PATH: FULL_PATH } });
    return true;
  } catch {
    return false;
  }
}

const HAS_CLAUDE = hasCli("claude");
const HAS_CODEX = hasCli("codex");

const CLAUDE_PROMPT = (url: string) =>
  `Fetch this exact URL and output ONLY its raw text content with no commentary: ${url}. If you cannot access it or get an error, output exactly: FETCH_FAILED`;

const CODEX_PROMPT = (url: string) =>
  `Fetch this exact URL and output ONLY its raw text content with no commentary: ${url}. If you cannot access it or get an error, output exactly: FETCH_FAILED`;

function assertBoardContent(output: string) {
  expect(output).not.toContain("FETCH_FAILED");
  expect(output).toContain("#");
  expect(output.length).toBeGreaterThan(50);
}

describe("Claude CLI can pull boards", { timeout: 120_000 }, () => {
  it.skipIf(!HAS_CLAUDE)("reads a public board", () => {
    const output = runCli(
      `claude -p "${CLAUDE_PROMPT(BOARDS.public.llmsUrl)}" --allowedTools "WebFetch"`
    );
    assertBoardContent(output);
  });

  it.skipIf(!HAS_CLAUDE)("reads a shared board with token", () => {
    const output = runCli(
      `claude -p "${CLAUDE_PROMPT(BOARDS.shared.llmsUrl)}" --allowedTools "WebFetch"`
    );
    assertBoardContent(output);
  });
});

describe("Codex CLI can pull boards", { timeout: 120_000 }, () => {
  it.skipIf(!HAS_CODEX)("reads a public board", () => {
    const output = runCli(
      `codex -q "${CODEX_PROMPT(BOARDS.public.llmsUrl)}"`
    );
    assertBoardContent(output);
  });

  it.skipIf(!HAS_CODEX)("reads a shared board with token", () => {
    const output = runCli(
      `codex -q "${CODEX_PROMPT(BOARDS.shared.llmsUrl)}"`
    );
    assertBoardContent(output);
  });
});
