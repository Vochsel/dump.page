# Dump

A collaborative context board for sharing projects between ChatGPT, Claude, coding agents, and humans.

Dump is a visual canvas for collecting links, notes, checklists, and project briefs. Use it as a shared project context layer: one board your team can read, your AI tools can consume, and your future self can actually find again.

**Live at [dump.page](https://www.dump.page)**

## What Dump Is Good For

- Share a project between ChatGPT and Claude without rebuilding the same context in every chat
- Create a reusable project brief for Claude Code, Codex, Cursor, or other coding agents
- Replace scattered Slack threads and bookmark folders with one shared research board
- Keep multimodal context outside any single LLM vendor or chat history
- Expose board content through MCP and `llms.txt` for agent-friendly workflows

## Features

- Freeform canvas with drag-and-drop
- Link cards with automatic metadata extraction (title, favicon, preview image)
- Text notes with rich text editing
- Checklists
- Board sharing (private, shared via link, or public)
- Real-time collaboration via Convex
- MCP server for ChatGPT, Claude, Codex, Cursor, and other AI tool integrations
- `llms.txt` endpoints for shared and public boards
- Local-first mode — use without an account

## Positioning Angles

Different people find Dump through different problems. These are all valid ways to describe the product:

- Shared project context for ChatGPT and Claude
- AI project handoff board
- MCP-ready context layer for agents
- Research hub for modern product and engineering teams
- Human-and-AI-readable whiteboard for links, notes, and decisions

## Tech Stack

- **Framework:** Next.js (App Router) + React 19
- **Backend:** Convex (serverless database + functions)
- **Canvas:** React Flow (@xyflow/react)
- **Auth:** Firebase (Google OAuth)
- **Styling:** TailwindCSS 4 + shadcn/ui
- **Language:** TypeScript

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (or Node.js 18+)
- A [Convex](https://convex.dev) account
- A [Firebase](https://firebase.google.com) project with Google Auth enabled

### Setup

1. Clone the repo:

   ```bash
   git clone https://github.com/Vochsel/dump.page.git
   cd dump
   ```

2. Install dependencies:

   ```bash
   bun install
   ```

3. Copy the environment template and fill in your values:

   ```bash
   cp .env.example .env.local
   ```

4. Start the Convex dev server:

   ```bash
   bun run deploy:convex:dev
   ```

5. Start the development server:

   ```bash
   bun run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

See [`.env.example`](.env.example) for the full list. Key variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | Your Convex deployment URL |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project config values |
| `FIREBASE_PROJECT_ID` | Firebase project ID (used by Convex auth) |
| `SCRAPINGBEE_API_KEY` | Optional — for link metadata scraping |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (uses `.env.local`) |
| `bun run build` | Production build |
| `bun run lint` | Run ESLint |
| `bun run test` | Run tests |
| `bun run deploy:convex:dev` | Start Convex dev server |
| `bun run deploy:convex` | Deploy Convex to production |

## MCP Server

Dump exposes an MCP server at `https://www.dump.page/api/mcp` so AI tools can read and write to your boards.

If you want the short version: Dump is a practical way to give ChatGPT, Claude, Claude Code, Codex, and similar tools the same project context instead of pasting links and notes into every conversation.

## Installing Boards as Skills

Shared and public boards can also be installed with [`vercel-labs/skills`](https://github.com/vercel-labs/skills) via `npx skills add`.

### Public board

```bash
npx skills add https://www.dump.page/b/<board-slug>
```

### Shared board

```bash
npx skills add https://www.dump.page/s/<share-token>/b/<board-slug>
```

Dump serves a hosted `SKILL.md` for each board through the well-known skills endpoints. The installed skill is a snapshot of the board at install/update time. For live reads, search, and write access, use the Dump MCP server instead.

### Quick Install

<details>
<summary>Claude Code</summary>

```bash
claude mcp add dump-mcp --transport http https://www.dump.page/api/mcp
```

</details>

<details>
<summary>Claude Desktop / Claude.ai</summary>

Go to **Settings → Integrations → Add More** and paste:

```
https://www.dump.page/api/mcp
```

</details>

<details>
<summary>ChatGPT</summary>

Go to **Settings → Connectors → Add connector** and paste:

```
https://www.dump.page/api/mcp
```

</details>

<details>
<summary>Cursor</summary>

Go to `Cursor Settings` → `MCP` → `Add new MCP Server`. Use `url` type with:

```
https://www.dump.page/api/mcp
```

Or add to your `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "dump-mcp": {
      "url": "https://www.dump.page/api/mcp"
    }
  }
}
```

</details>

<details>
<summary>VS Code</summary>

Add to your VS Code settings (JSON):

```json
{
  "mcp": {
    "servers": {
      "dump-mcp": {
        "type": "http",
        "url": "https://www.dump.page/api/mcp"
      }
    }
  }
}
```

</details>

<details>
<summary>Windsurf</summary>

Add to your `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "dump-mcp": {
      "serverUrl": "https://www.dump.page/api/mcp"
    }
  }
}
```

</details>

<details>
<summary>Codex</summary>

```bash
codex mcp add dump-mcp --transport http https://www.dump.page/api/mcp
```

Or add to `~/.codex/config.toml`:

```toml
[mcp_servers.dump-mcp]
type = "http"
url = "https://www.dump.page/api/mcp"
```

</details>

## Learn More

- [Blog: how to share project context between ChatGPT and Claude](https://www.dump.page/blog/share-project-context-between-chatgpt-and-claude)
- [Blog: the AI project handoff board](https://www.dump.page/blog/ai-project-handoff-board)
- [Blog: MCP is better with shared context](https://www.dump.page/blog/mcp-shared-context-for-agents)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

[MIT](LICENSE)
