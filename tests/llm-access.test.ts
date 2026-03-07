import { describe, it, expect } from "vitest";

const BASE = "https://www.dump.page";

const BOARDS = {
  shared: {
    slug: "sq69ikk2",
    token: "91e92fd332004b1f",
    url: `${BASE}/b/sq69ikk2`,
    llmsUrl: `${BASE}/b/sq69ikk2/llms.txt?token=91e92fd332004b1f`,
  },
  public: {
    slug: "94ulfvtn",
    url: `${BASE}/b/94ulfvtn`,
    llmsUrl: `${BASE}/b/94ulfvtn/llms.txt`,
  },
  private: {
    slug: "ztf74syo",
    url: `${BASE}/b/ztf74syo`,
    llmsUrl: `${BASE}/b/ztf74syo/llms.txt`,
  },
};

describe("LLM board access via /llms.txt", () => {
  describe("public board", () => {
    it("returns 200 with text content", async () => {
      const res = await fetch(BOARDS.public.llmsUrl);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");
    });

    it("contains board content as markdown", async () => {
      const res = await fetch(BOARDS.public.llmsUrl);
      const text = await res.text();
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain("#"); // should have markdown headings
    });

    it("is accessible without any token", async () => {
      const res = await fetch(BOARDS.public.llmsUrl);
      expect(res.status).toBe(200);
    });
  });

  describe("shared board", () => {
    it("returns 200 with valid share token", async () => {
      const res = await fetch(BOARDS.shared.llmsUrl);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("text/plain");
    });

    it("contains board content as markdown", async () => {
      const res = await fetch(BOARDS.shared.llmsUrl);
      const text = await res.text();
      expect(text.length).toBeGreaterThan(0);
      expect(text).toContain("#");
    });

    it("rejects access without token", async () => {
      const noTokenUrl = `${BASE}/b/${BOARDS.shared.slug}/llms.txt`;
      const res = await fetch(noTokenUrl);
      expect(res.status).not.toBe(200);
    });

    it("rejects access with wrong token", async () => {
      const badTokenUrl = `${BASE}/b/${BOARDS.shared.slug}/llms.txt?token=invalidtoken123`;
      const res = await fetch(badTokenUrl);
      expect(res.status).not.toBe(200);
    });
  });

  describe("private board", () => {
    it("denies unauthenticated access", async () => {
      const res = await fetch(BOARDS.private.llmsUrl);
      expect(res.status).not.toBe(200);
    });

    it("returns plain text error (not HTML)", async () => {
      const res = await fetch(BOARDS.private.llmsUrl);
      expect(res.headers.get("content-type")).toContain("text/plain");
    });
  });

  describe("board HTML page meta tags", () => {
    it("public board has OG meta tags for scrapers", async () => {
      const res = await fetch(BOARDS.public.url);
      const html = await res.text();
      expect(html).toContain('og:title');
      expect(html).toContain('og:description');
    });

    it("shared board with token loads page", async () => {
      const res = await fetch(`${BOARDS.shared.url}?token=${BOARDS.shared.token}`);
      expect(res.status).toBe(200);
    });
  });

  describe("content quality", () => {
    it("public board markdown is well-structured", async () => {
      const res = await fetch(BOARDS.public.llmsUrl);
      const text = await res.text();
      // Should start with a heading
      expect(text.trimStart()).toMatch(/^#/);
      // Should not contain raw HTML
      expect(text).not.toMatch(/<div|<span|<script/i);
    });

    it("shared board markdown is well-structured", async () => {
      const res = await fetch(BOARDS.shared.llmsUrl);
      const text = await res.text();
      expect(text.trimStart()).toMatch(/^#/);
      expect(text).not.toMatch(/<div|<span|<script/i);
    });
  });
});
