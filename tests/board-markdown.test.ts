import { describe, it, expect, beforeAll } from "vitest";

// board-markdown.ts creates a ConvexHttpClient at module scope,
// which requires NEXT_PUBLIC_CONVEX_URL. Set a dummy value so the
// import doesn't throw — we only test the pure formatBoardDataAsMarkdown.
process.env.NEXT_PUBLIC_CONVEX_URL = "https://dummy.convex.cloud";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let formatBoardDataAsMarkdown: any;

beforeAll(async () => {
  const mod = await import("../src/lib/board-markdown");
  formatBoardDataAsMarkdown = mod.formatBoardDataAsMarkdown;
});

describe("formatBoardDataAsMarkdown", () => {
  it("renders empty board", () => {
    const md = formatBoardDataAsMarkdown({ name: "My Board" }, []);
    expect(md).toContain("# My Board");
    expect(md).toContain("*This board is empty.*");
  });

  it("renders text nodes under Notes heading", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, [
      { type: "text", content: "Hello world", title: "Greeting" },
    ]);
    expect(md).toContain("## Notes");
    expect(md).toContain("### Greeting");
    expect(md).toContain("Hello world");
  });

  it("renders text node without title (no ### heading)", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, [
      { type: "text", content: "No title here" },
    ]);
    expect(md).toContain("## Notes");
    expect(md).not.toContain("###");
    expect(md).toContain("No title here");
  });

  it("renders link nodes under Links heading", () => {
    const md = formatBoardDataAsMarkdown({ name: "Links Board" }, [
      {
        type: "link",
        content: "https://example.com",
        metadata: { title: "Example", description: "A site" },
      },
    ]);
    expect(md).toContain("## Links");
    expect(md).toContain("[Example](https://example.com)");
    expect(md).toContain("- A site");
  });

  it("uses URL as link title when no metadata title", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, [
      { type: "link", content: "https://example.com", metadata: null },
    ]);
    expect(md).toContain("[https://example.com](https://example.com)");
  });

  it("renders checklist nodes", () => {
    const items = JSON.stringify([
      { text: "Buy milk", checked: false },
      { text: "Write tests", checked: true },
    ]);
    const md = formatBoardDataAsMarkdown({ name: "Tasks" }, [
      { type: "checklist", content: items, title: "TODO" },
    ]);
    expect(md).toContain("## Checklists");
    expect(md).toContain("### TODO");
    expect(md).toContain("- [ ] Buy milk");
    expect(md).toContain("- [x] Write tests");
  });

  it("handles invalid checklist JSON gracefully", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, [
      { type: "checklist", content: "not valid json" },
    ]);
    expect(md).toContain("not valid json");
  });

  it("renders mixed node types in correct order", () => {
    const md = formatBoardDataAsMarkdown({ name: "Mixed" }, [
      { type: "link", content: "https://a.com", metadata: { title: "Link A" } },
      { type: "text", content: "Note text" },
      { type: "checklist", content: JSON.stringify([{ text: "Item", checked: false }]) },
    ]);
    const notesIdx = md.indexOf("## Notes");
    const checklistsIdx = md.indexOf("## Checklists");
    const linksIdx = md.indexOf("## Links");
    expect(notesIdx).toBeLessThan(checklistsIdx);
    expect(checklistsIdx).toBeLessThan(linksIdx);
  });

  it("includes skill context type preamble", () => {
    const md = formatBoardDataAsMarkdown(
      { name: "Skills", settings: { contextType: "skill" } },
      []
    );
    expect(md).toContain("Context Type: Skill");
  });

  it("includes agent context type preamble", () => {
    const md = formatBoardDataAsMarkdown(
      { name: "Agent", settings: { contextType: "agent" } },
      []
    );
    expect(md).toContain("Context Type: Agent");
  });

  it("includes system prompt when set", () => {
    const md = formatBoardDataAsMarkdown(
      { name: "Custom", settings: { systemPrompt: "You are a helpful bot." } },
      []
    );
    expect(md).toContain("You are a helpful bot.");
  });

  it("includes MCP footer", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, []);
    expect(md).toContain("dump.page/mcp");
  });
});
