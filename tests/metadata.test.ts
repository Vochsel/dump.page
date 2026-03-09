import { describe, it, expect } from "vitest";
import {
  extractMeta,
  extractTagContent,
  extractLink,
  escapeRegex,
  decodeHtmlEntities,
} from "../src/lib/metadata";

describe("escapeRegex", () => {
  it("escapes special regex characters", () => {
    expect(escapeRegex("a.b*c+d?e")).toBe("a\\.b\\*c\\+d\\?e");
    expect(escapeRegex("foo[bar]")).toBe("foo\\[bar\\]");
    expect(escapeRegex("a|b(c)")).toBe("a\\|b\\(c\\)");
    expect(escapeRegex("$100")).toBe("\\$100");
    expect(escapeRegex("{}^\\")).toBe("\\{\\}\\^\\\\");
  });

  it("leaves normal strings unchanged", () => {
    expect(escapeRegex("hello world")).toBe("hello world");
    expect(escapeRegex("og:title")).toBe("og:title");
  });
});

describe("decodeHtmlEntities", () => {
  it("decodes standard entities", () => {
    expect(decodeHtmlEntities("&amp;")).toBe("&");
    expect(decodeHtmlEntities("&lt;")).toBe("<");
    expect(decodeHtmlEntities("&gt;")).toBe(">");
    expect(decodeHtmlEntities("&quot;")).toBe('"');
  });

  it("decodes apostrophe variants", () => {
    expect(decodeHtmlEntities("&#39;")).toBe("'");
    expect(decodeHtmlEntities("&#x27;")).toBe("'");
  });

  it("decodes slash entity", () => {
    expect(decodeHtmlEntities("&#x2F;")).toBe("/");
  });

  it("handles mixed content", () => {
    expect(decodeHtmlEntities("Tom &amp; Jerry &lt;3")).toBe("Tom & Jerry <3");
  });

  it("returns plain text unchanged", () => {
    expect(decodeHtmlEntities("just text")).toBe("just text");
  });
});

describe("extractMeta", () => {
  it("extracts og:title with property before content", () => {
    const html = `<meta property="og:title" content="My Page Title">`;
    expect(extractMeta(html, "og:title")).toBe("My Page Title");
  });

  it("extracts og:title with content before property", () => {
    const html = `<meta content="Reversed Order" property="og:title">`;
    expect(extractMeta(html, "og:title")).toBe("Reversed Order");
  });

  it("extracts name-based meta tags", () => {
    const html = `<meta name="description" content="A page description">`;
    expect(extractMeta(html, "description")).toBe("A page description");
  });

  it("decodes HTML entities in content", () => {
    const html = `<meta property="og:title" content="Tom &amp; Jerry">`;
    expect(extractMeta(html, "og:title")).toBe("Tom & Jerry");
  });

  it("returns undefined when not found", () => {
    const html = `<meta property="og:image" content="img.png">`;
    expect(extractMeta(html, "og:title")).toBeUndefined();
  });

  it("is case-insensitive on tag matching", () => {
    const html = `<META PROPERTY="og:title" CONTENT="Uppercase">`;
    expect(extractMeta(html, "og:title")).toBe("Uppercase");
  });
});

describe("extractTagContent", () => {
  it("extracts title tag", () => {
    const html = `<html><head><title>Page Title</title></head></html>`;
    expect(extractTagContent(html, "title")).toBe("Page Title");
  });

  it("decodes entities", () => {
    const html = `<title>A &amp; B</title>`;
    expect(extractTagContent(html, "title")).toBe("A & B");
  });

  it("returns undefined when tag missing", () => {
    const html = `<html><head></head></html>`;
    expect(extractTagContent(html, "title")).toBeUndefined();
  });

  it("trims whitespace", () => {
    const html = `<title>  Spaced  </title>`;
    expect(extractTagContent(html, "title")).toBe("Spaced");
  });
});

describe("extractLink", () => {
  it("extracts canonical link with rel before href", () => {
    const html = `<link rel="canonical" href="https://example.com/page">`;
    expect(extractLink(html, "canonical")).toBe("https://example.com/page");
  });

  it("extracts link with href before rel", () => {
    const html = `<link href="/icon.png" rel="icon">`;
    expect(extractLink(html, "icon")).toBe("/icon.png");
  });

  it("returns undefined when not found", () => {
    const html = `<link rel="stylesheet" href="style.css">`;
    expect(extractLink(html, "icon")).toBeUndefined();
  });
});
