export type ChangelogEntry = {
  type: "feature" | "fix";
  description: string;
};

export type ChangelogVersion = {
  version: string;
  date: string;
  entries: ChangelogEntry[];
};

export const changelog: ChangelogVersion[] = [
  {
    version: "1.3.0",
    date: "2026-03-07",
    entries: [
      { type: "feature", description: "Zoom controls — +/- buttons and percentage popover with zoom-to-fit, 50%, 100%, 150%, 200%" },
      { type: "feature", description: "Minimap toggle — optional minimap in preferences, off by default" },
      { type: "feature", description: "Edit link — right-click a link card to change its URL" },
      { type: "feature", description: "Link toolbar dialog — add link button now opens a proper dialog with tips" },
      { type: "feature", description: "Controls variant moved to client preferences (Design/Map modes)" },
      { type: "fix", description: "Share magic link now includes the access token in the URL" },
      { type: "fix", description: "Undo no longer gets stuck when recreated nodes steal focus" },
      { type: "fix", description: "Disabled trackpad swipe-back/forward navigation on Mac" },
      { type: "fix", description: "Softer, less distorted delete sound effect" },
      { type: "fix", description: "Improved dark mode colors for text notes and board header" },
    ],
  },
  {
    version: "1.2.0",
    date: "2026-03-07",
    entries: [
      { type: "feature", description: "Archive items — right-click to archive, view and restore from preferences" },
      { type: "feature", description: "Shared with me — dashboard separates your boards from boards shared with you" },
      { type: "feature", description: "Preferences popover with snap-to-grid toggle, persisted per device" },
      { type: "feature", description: "Dark mode board colors — each board color has a matching dark variant" },
      { type: "fix", description: "Shift+Enter in checklists inserts a newline within the current item" },
      { type: "fix", description: "Dynamic fit margin — F shortcut adapts padding based on number of items" },
      { type: "fix", description: "Checklist nodes auto-grow width for longer items (up to 640px)" },
      { type: "fix", description: "Checklists show title bar by default" },
    ],
  },
  {
    version: "1.1.0",
    date: "2026-03-07",
    entries: [
      { type: "feature", description: "Optional title bars on sticky notes and checklists — hidden by default, toggle via right-click" },
      { type: "feature", description: "Collapsible sticky notes — collapse to show only 2 lines of text" },
      { type: "feature", description: "Item-specific shareable links — right-click any item to copy a direct link" },
      { type: "feature", description: "Item-specific /llms.txt routes for AI access to individual items" },
      { type: "feature", description: "Help page with AI provider integration guides" },
      { type: "feature", description: "Changelog page styled as a whiteboard" },
      { type: "feature", description: "Build version number displayed on board and dashboard pages" },
      { type: "feature", description: "Share dialog shows visibility type for non-owners" },
      { type: "fix", description: "Mute toggle button moved from top-right (overlapping header) to bottom-left" },
      { type: "fix", description: "All sound effects made significantly quieter and subtler" },
      { type: "fix", description: "Improved keyboard navigation with tabIndex on text and checklist nodes" },
      { type: "fix", description: "Dynamic page titles — tab shows board name and icon on /b routes" },
    ],
  },
  {
    version: "1.0.0",
    date: "2026-02-15",
    entries: [
      { type: "feature", description: "Rich media embeds — YouTube, Spotify, SoundCloud, Google Maps, Twitter/X" },
      { type: "feature", description: "Board creation without requiring an account" },
      { type: "feature", description: "Markdown preview in share dialog" },
      { type: "feature", description: "Sound effects for add, delete, drag start, drag end" },
      { type: "feature", description: "RSS feed generation for boards" },
      { type: "feature", description: "LLM-friendly /llms.txt export for boards" },
      { type: "feature", description: "Board chat button — open context in ChatGPT, Claude, or Grok" },
      { type: "feature", description: "Undo/redo with full action history" },
      { type: "feature", description: "Drag-and-drop files and links onto the canvas" },
      { type: "feature", description: "Board settings — background pattern, color, control variant" },
      { type: "feature", description: "Member management with email invites" },
      { type: "feature", description: "Three visibility modes — private, shared (magic link), public" },
    ],
  },
];
