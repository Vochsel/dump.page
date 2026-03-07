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
    version: "1.6.0",
    date: "2026-03-07",
    entries: [
      { type: "feature", description: "Link search — type a search term instead of a URL when adding a link, and the top result is added automatically" },
      { type: "feature", description: "Confetti — a burst of confetti triggers when all items in a checklist are checked off" },
      { type: "feature", description: "Document view redesign — items are now draggable cards on a freeform page, inspired by mmm.page, with positions saved per item" },
      { type: "feature", description: "List view redesign — notes show title and truncated blurb, checklists show title and progress bar, links show favicon and metadata, all with a preview button" },
      { type: "feature", description: "View switcher relocated — moved from header to a floating button with popover near the bottom-left preferences area" },
      { type: "feature", description: "Viewport persistence — board canvas position and zoom are saved per board in localStorage and restored on return" },
      { type: "feature", description: "MCP quick-add tool — new add_items MCP tool for quickly adding multiple items to a board in one call" },
      { type: "fix", description: "Right-click 'Copy content' on link nodes now shows 'Copy link' for clarity" },
      { type: "fix", description: "Dashboard board card color line is now taller for better visibility" },
    ],
  },
  {
    version: "1.5.0",
    date: "2026-03-07",
    entries: [
      { type: "feature", description: "MCP server — connect Dump to Claude, ChatGPT, Claude Code, and Codex via OAuth-based MCP integration" },
      { type: "feature", description: "Command palette — press Cmd+K to search across all boards and items, with recent boards shown by default" },
      { type: "feature", description: "List and document views — toggle between board, list, and document views for any board" },
      { type: "feature", description: "Preview collapsed items — click the magnifying glass on collapsed notes and checklists to view full content in a popup" },
      { type: "feature", description: "Multi-select copy — right-click multiple selected items to copy all their contents at once" },
      { type: "feature", description: "Checklist arrow key navigation — use up/down arrows to move between checklist items while editing" },
      { type: "feature", description: "MCP integration page — setup instructions for Claude, ChatGPT, Claude Code, and Codex at /mcp" },
      { type: "fix", description: "Checklist width — checklists now grow wider when items have longer text" },
      { type: "fix", description: "Copy content for links — right-click 'Copy content' on link items now copies the URL instead of the title" },
      { type: "fix", description: "Checklist input focus — reduced random defocus when typing in checklist items" },
      { type: "fix", description: "Dark mode context menu — node right-click menu now properly styled in dark mode" },
    ],
  },
  {
    version: "1.4.0",
    date: "2026-03-07",
    entries: [
      { type: "feature", description: "Board context types — set boards as Default, Skill, or Agent to control how LLMs interpret the context" },
      { type: "feature", description: "Custom system prompts — add an editable system prompt to any board, included in LLM markdown output" },
      { type: "feature", description: "Collapsible checklists — collapse checklists to show a completion percentage bar" },
      { type: "feature", description: "Merge notes to checklist — select multiple text notes and right-click to combine them into a single checklist" },
      { type: "feature", description: "Board templates — choose from 5 templates (Project Tracker, Event Plan, Engineering Tasks, Brand Tone, Blank) when creating a board" },
      { type: "feature", description: "Searchable emoji picker — search emoji by keyword in the unified icon/emoji picker" },
      { type: "feature", description: "Dashboard card colors — boards with a custom background color show a colored accent bar on the dashboard" },
    ],
  },
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
