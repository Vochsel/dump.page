import { describe, it, expect } from "vitest";
import { inferUrlMetadata } from "../src/lib/url-metadata";

describe("inferUrlMetadata", () => {
  it("returns null for unknown URLs", () => {
    expect(inferUrlMetadata("https://some-random-site.xyz/page")).toBeNull();
  });

  it("returns null for invalid URLs", () => {
    expect(inferUrlMetadata("not-a-url")).toBeNull();
    expect(inferUrlMetadata("")).toBeNull();
  });

  // --- Static sites ---
  it("recognizes static site hostnames", () => {
    expect(inferUrlMetadata("https://claude.ai")).toEqual({ title: "Claude" });
    expect(inferUrlMetadata("https://linear.app")).toEqual({ title: "Linear" });
    expect(inferUrlMetadata("https://discord.com")).toEqual({ title: "Discord" });
    expect(inferUrlMetadata("https://open.spotify.com")).toEqual({ title: "Spotify" });
  });

  // --- GitHub ---
  it("infers GitHub repo", () => {
    const meta = inferUrlMetadata("https://github.com/vercel/next.js");
    expect(meta).toEqual({ title: "vercel/next.js", description: "GitHub repository" });
  });

  it("infers GitHub issue", () => {
    const meta = inferUrlMetadata("https://github.com/vercel/next.js/issues/123");
    expect(meta).toEqual({ title: "vercel/next.js #123", description: "GitHub issue" });
  });

  it("infers GitHub PR", () => {
    const meta = inferUrlMetadata("https://github.com/vercel/next.js/pull/456");
    expect(meta).toEqual({ title: "vercel/next.js PR #456", description: "GitHub pull request" });
  });

  it("infers GitHub user profile", () => {
    const meta = inferUrlMetadata("https://github.com/octocat");
    expect(meta).toEqual({ title: "octocat", description: "GitHub profile" });
  });

  it("infers GitHub gist", () => {
    const meta = inferUrlMetadata("https://gist.github.com/octocat/abc123");
    expect(meta).toEqual({ title: "Gist by octocat", description: "GitHub Gist" });
  });

  it("infers GitHub actions", () => {
    const meta = inferUrlMetadata("https://github.com/vercel/next.js/actions");
    expect(meta).toEqual({ title: "vercel/next.js Actions", description: "GitHub Actions" });
  });

  it("infers GitHub file path", () => {
    const meta = inferUrlMetadata("https://github.com/vercel/next.js/blob/main/package.json");
    expect(meta).toEqual({ title: "vercel/next.js — package.json", description: "GitHub file" });
  });

  // --- YouTube ---
  it("infers YouTube video", () => {
    const meta = inferUrlMetadata("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(meta).toEqual({ title: "YouTube Video", description: "YouTube" });
  });

  it("infers youtu.be short link", () => {
    const meta = inferUrlMetadata("https://youtu.be/dQw4w9WgXcQ");
    expect(meta).toEqual({ title: "YouTube Video", description: "YouTube" });
  });

  it("infers YouTube channel", () => {
    const meta = inferUrlMetadata("https://www.youtube.com/@mkbhd");
    expect(meta?.description).toBe("YouTube channel");
  });

  // --- Twitter/X ---
  it("infers X post", () => {
    const meta = inferUrlMetadata("https://x.com/elonmusk/status/123456");
    expect(meta).toEqual({ title: "@elonmusk on X", description: "Post on X" });
  });

  it("infers X profile", () => {
    const meta = inferUrlMetadata("https://twitter.com/vercel");
    expect(meta).toEqual({ title: "@vercel", description: "X profile" });
  });

  // --- Reddit ---
  it("infers subreddit", () => {
    const meta = inferUrlMetadata("https://www.reddit.com/r/programming");
    expect(meta).toEqual({ title: "r/programming", description: "Reddit community" });
  });

  it("infers Reddit user", () => {
    const meta = inferUrlMetadata("https://www.reddit.com/u/spez");
    expect(meta).toEqual({ title: "u/spez", description: "Reddit user" });
  });

  // --- npm ---
  it("infers npm package", () => {
    const meta = inferUrlMetadata("https://www.npmjs.com/package/react");
    expect(meta).toEqual({ title: "react", description: "npm package" });
  });

  it("infers scoped npm package", () => {
    const meta = inferUrlMetadata("https://www.npmjs.com/package/@tanstack/react-query");
    expect(meta).toEqual({ title: "@tanstack/react-query", description: "npm package" });
  });

  // --- Wikipedia ---
  it("infers Wikipedia article", () => {
    const meta = inferUrlMetadata("https://en.wikipedia.org/wiki/TypeScript");
    expect(meta).toEqual({ title: "TypeScript", description: "Wikipedia" });
  });

  it("handles Wikipedia underscores", () => {
    const meta = inferUrlMetadata("https://en.wikipedia.org/wiki/Artificial_intelligence");
    expect(meta).toEqual({ title: "Artificial intelligence", description: "Wikipedia" });
  });

  // --- LinkedIn ---
  it("infers LinkedIn profile", () => {
    const meta = inferUrlMetadata("https://www.linkedin.com/in/john-doe");
    expect(meta?.description).toBe("LinkedIn profile");
    expect(meta?.title).toBe("John Doe");
  });

  it("infers LinkedIn company", () => {
    const meta = inferUrlMetadata("https://www.linkedin.com/company/anthropic");
    expect(meta?.description).toBe("LinkedIn company");
  });

  // --- Google ---
  it("infers Google search", () => {
    const meta = inferUrlMetadata("https://www.google.com/search?q=vitest");
    expect(meta).toEqual({ title: '"vitest" — Google Search', description: "Google" });
  });

  it("infers Google Docs (static match takes priority)", () => {
    const meta = inferUrlMetadata("https://docs.google.com/document/d/abc123/edit");
    expect(meta).toEqual({ title: "Google Docs" });
  });

  // --- Notion ---
  it("infers Notion page", () => {
    const meta = inferUrlMetadata("https://www.notion.so/my-workspace/Project-Plan-abc123def456abc123def456abc123de");
    expect(meta?.description).toBe("Notion");
  });

  // --- Misc ---
  it("infers Loom (static match takes priority over /share/ pattern)", () => {
    const meta = inferUrlMetadata("https://www.loom.com/share/abc123");
    expect(meta).toEqual({ title: "Loom" });
  });

  it("infers PyPI package", () => {
    const meta = inferUrlMetadata("https://pypi.org/project/requests");
    expect(meta).toEqual({ title: "requests", description: "PyPI package" });
  });

  it("infers Rust crate", () => {
    const meta = inferUrlMetadata("https://crates.io/crates/serde");
    expect(meta).toEqual({ title: "serde", description: "Rust crate" });
  });
});
