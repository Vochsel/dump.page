import TurndownService from "turndown";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

/** Convert HTML content to markdown. Returns plain text unchanged. */
export function htmlToMarkdown(html: string): string {
  if (!html) return "";
  if (html.trimStart().startsWith("<")) {
    return turndown.turndown(html);
  }
  return html;
}
