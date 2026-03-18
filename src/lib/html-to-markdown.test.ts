import { describe, it, expect } from "vitest";
import { htmlToMarkdown } from "./html-to-markdown";

describe("htmlToMarkdown", () => {
  it("returns empty string for empty input", () => {
    expect(htmlToMarkdown("")).toBe("");
  });

  it("returns plain text unchanged", () => {
    expect(htmlToMarkdown("hello world")).toBe("hello world");
  });

  it("converts bold to markdown", () => {
    expect(htmlToMarkdown("<strong>bold</strong>")).toBe("**bold**");
  });

  it("converts italic to markdown", () => {
    expect(htmlToMarkdown("<em>italic</em>")).toBe("_italic_");
  });

  it("converts links to markdown", () => {
    expect(htmlToMarkdown('<a href="https://example.com">click here</a>')).toBe(
      "[click here](https://example.com)"
    );
  });

  it("converts blockquotes to markdown", () => {
    expect(htmlToMarkdown("<blockquote><p>quoted text</p></blockquote>")).toBe(
      "> quoted text"
    );
  });

  it("converts headings to markdown", () => {
    expect(htmlToMarkdown("<h1>Title</h1>")).toBe("# Title");
    expect(htmlToMarkdown("<h2>Subtitle</h2>")).toBe("## Subtitle");
    expect(htmlToMarkdown("<h3>Section</h3>")).toBe("### Section");
  });

  it("converts unordered lists to markdown", () => {
    const html = "<ul><li>one</li><li>two</li><li>three</li></ul>";
    expect(htmlToMarkdown(html)).toBe("-   one\n-   two\n-   three");
  });

  it("converts ordered lists to markdown", () => {
    const html = "<ol><li>first</li><li>second</li></ol>";
    expect(htmlToMarkdown(html)).toBe("1.  first\n2.  second");
  });

  it("converts inline code to markdown", () => {
    expect(htmlToMarkdown("<code>foo()</code>")).toBe("`foo()`");
  });

  it("converts code blocks to markdown", () => {
    expect(htmlToMarkdown("<pre><code>let x = 1;</code></pre>")).toBe(
      "    let x = 1;"
    );
  });

  it("handles mixed formatting", () => {
    const html = "<p>This is <strong>bold</strong> and <em>italic</em> text with a <a href=\"https://example.com\">link</a>.</p>";
    expect(htmlToMarkdown(html)).toBe(
      "This is **bold** and _italic_ text with a [link](https://example.com)."
    );
  });

  it("handles paragraphs", () => {
    const html = "<p>First paragraph.</p><p>Second paragraph.</p>";
    expect(htmlToMarkdown(html)).toBe(
      "First paragraph.\n\nSecond paragraph."
    );
  });

  it("handles line breaks", () => {
    const html = "<p>line one<br>line two</p>";
    expect(htmlToMarkdown(html)).toContain("line one");
    expect(htmlToMarkdown(html)).toContain("line two");
  });
});
