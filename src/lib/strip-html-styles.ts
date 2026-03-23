/**
 * Strip all inline styles and class attributes from HTML while preserving
 * the tag structure. This produces clean HTML that tiptap can consume.
 */
export function stripHtmlStyles(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  for (const el of doc.body.querySelectorAll("*")) {
    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("id");
  }
  return doc.body.innerHTML;
}
