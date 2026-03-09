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

  it("renders text nodes with title", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, [
      { type: "text", content: "Hello world", title: "Greeting" },
    ]);
    expect(md).toContain("### Greeting");
    expect(md).toContain("Hello world");
  });

  it("renders text node without title (no ### heading)", () => {
    const md = formatBoardDataAsMarkdown({ name: "Test" }, [
      { type: "text", content: "No title here" },
    ]);
    expect(md).not.toContain("###");
    expect(md).toContain("No title here");
  });

  it("renders link nodes", () => {
    const md = formatBoardDataAsMarkdown({ name: "Links Board" }, [
      {
        type: "link",
        content: "https://example.com",
        metadata: { title: "Example", description: "A site" },
      },
    ]);
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

  it("renders all node types interleaved (no type sections)", () => {
    const md = formatBoardDataAsMarkdown({ name: "Mixed" }, [
      { type: "link", content: "https://a.com", metadata: { title: "Link A" } },
      { type: "text", content: "Note text" },
      { type: "checklist", content: JSON.stringify([{ text: "Item", checked: false }]) },
    ]);
    // Should NOT have type-based section headings
    expect(md).not.toContain("## Notes");
    expect(md).not.toContain("## Links");
    expect(md).not.toContain("## Checklists");
    // All content should be present
    expect(md).toContain("[Link A](https://a.com)");
    expect(md).toContain("Note text");
    expect(md).toContain("- [ ] Item");
  });

  it("renders connected nodes in visual arrow direction (target → source)", () => {
    // Arrow is on markerStart (points at source). User drags from C to B
    // and B to A to create a visual chain A → B → C. The stored edges are
    // source:C target:B and source:B target:A. Reversed adjacency: B→C, A→B.
    // DFS from A yields: A, B, C (First, Second, Third).
    const md = formatBoardDataAsMarkdown(
      { name: "Connected" },
      [
        { id: "a", type: "text", content: "First", position: { x: 0, y: 0 } },
        { id: "b", type: "text", content: "Second", position: { x: 0, y: 200 } },
        { id: "c", type: "text", content: "Third", position: { x: 0, y: 400 } },
      ],
      [
        { source: "c", target: "b" },
        { source: "b", target: "a" },
      ]
    );
    const idxFirst = md.indexOf("First");
    const idxSecond = md.indexOf("Second");
    const idxThird = md.indexOf("Third");
    expect(idxFirst).toBeLessThan(idxSecond);
    expect(idxSecond).toBeLessThan(idxThird);
  });

  it("orders orphan nodes top-to-bottom by position", () => {
    const md = formatBoardDataAsMarkdown(
      { name: "Spatial" },
      [
        { id: "bottom", type: "text", content: "Bottom node", position: { x: 0, y: 500 } },
        { id: "top", type: "text", content: "Top node", position: { x: 0, y: 0 } },
        { id: "mid", type: "link", content: "https://mid.com", metadata: null, position: { x: 0, y: 250 } },
      ]
    );
    const idxTop = md.indexOf("Top node");
    const idxMid = md.indexOf("https://mid.com");
    const idxBottom = md.indexOf("Bottom node");
    expect(idxTop).toBeLessThan(idxMid);
    expect(idxMid).toBeLessThan(idxBottom);
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
