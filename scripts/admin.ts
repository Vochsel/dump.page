#!/usr/bin/env npx tsx
/**
 * Dump Admin CLI
 *
 * Usage:
 *   pnpm admin stats          - Overview of all usage metrics
 *   pnpm admin users          - Recent users (last 20)
 *   pnpm admin boards         - Recently created boards (last 20)
 *   pnpm admin active         - Recently active boards (last 20)
 *   pnpm admin suggestions    - View feature suggestions
 *   pnpm admin help           - Show this help
 */

import fs from "fs";
import path from "path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

function loadEnv(env: "dev" | "prod") {
  if (process.env.NEXT_PUBLIC_CONVEX_URL) return;
  const envFile = env === "prod" ? ".env.production" : ".env.local";
  const envPath = path.resolve(__dirname, "..", envFile);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const match = line.match(/^NEXT_PUBLIC_CONVEX_URL=(.+)$/);
      if (match) {
        process.env.NEXT_PUBLIC_CONVEX_URL = match[1].trim().replace(/^["']|["']$/g, "");
        break;
      }
    }
  }
}

function table(rows: Record<string, unknown>[], columns?: string[]) {
  if (rows.length === 0) {
    console.log("  (none)");
    return;
  }
  const cols = columns ?? Object.keys(rows[0]);
  const widths = cols.map((c) =>
    Math.max(c.length, ...rows.map((r) => String(r[c] ?? "").length))
  );
  const header = cols.map((c, i) => c.padEnd(widths[i])).join("  ");
  const sep = widths.map((w) => "─".repeat(w)).join("──");
  console.log(`  ${header}`);
  console.log(`  ${sep}`);
  for (const row of rows) {
    const line = cols
      .map((c, i) => {
        const val = String(row[c] ?? "");
        return typeof row[c] === "number" ? val.padStart(widths[i]) : val.padEnd(widths[i]);
      })
      .join("  ");
    console.log(`  ${line}`);
  }
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

async function main() {
  const isDev = process.argv.includes("--dev");
  const env = isDev ? "dev" : "prod";
  const args = process.argv.slice(2).filter((a) => a !== "--dev");

  loadEnv(env);

  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) {
    console.error(
      `Error: NEXT_PUBLIC_CONVEX_URL not set. Add it to ${env === "prod" ? ".env.production" : ".env.local"}`
    );
    process.exit(1);
  }

  console.log(`\n[${env.toUpperCase()}] ${url}`);

  const convex = new ConvexHttpClient(url);
  const command = args[0] ?? "help";

  switch (command) {
    case "stats": {
      const s = await convex.query(api.admin.stats);

      console.log("\n📊 Dump Stats\n");
      console.log(`  Users:        ${s.totals.users}`);
      console.log(`  Boards:       ${s.totals.boards}`);
      console.log(`  Nodes:        ${s.totals.nodes}`);
      console.log(`  Memberships:  ${s.totals.memberships}`);

      console.log("\n📈 Growth\n");
      console.log(`  New users:    ${s.newUsers.last24h} (24h)  ${s.newUsers.last7d} (7d)  ${s.newUsers.last30d} (30d)`);
      console.log(`  New boards:   ${s.newBoards.last24h} (24h)  ${s.newBoards.last7d} (7d)  ${s.newBoards.last30d} (30d)`);
      console.log(`  New nodes:    ${s.newNodes.last24h} (24h)  ${s.newNodes.last7d} (7d)`);

      console.log("\n📋 Averages\n");
      console.log(`  Nodes/board:  ${s.avgNodesPerBoard}`);
      console.log(`  Boards/user:  ${s.avgBoardsPerUser}`);

      console.log("\n🔒 Visibility\n");
      console.log(`  Private: ${s.visibility.private}  Shared: ${s.visibility.shared}  Public: ${s.visibility.public}`);

      console.log("\n📦 Node Types\n");
      console.log(`  Text: ${s.nodeTypes.text}  Link: ${s.nodeTypes.link}  Checklist: ${s.nodeTypes.checklist}`);

      if (s.topBoards.length > 0) {
        console.log("\n🏆 Top Boards (by nodes)\n");
        table(
          s.topBoards.map((b) => ({ name: b.name, nodes: b.count })),
          ["name", "nodes"]
        );
      }
      console.log();
      break;
    }

    case "users": {
      const u = await convex.query(api.admin.recentUsers);
      console.log("\n👤 Recent Users\n");
      table(
        u.map((r) => ({
          name: r.name,
          email: r.email,
          joined: timeAgo(r.joinedAt),
          boards: r.boardsOwned,
          memberships: r.memberships,
        })),
        ["name", "email", "joined", "boards", "memberships"]
      );
      console.log();
      break;
    }

    case "boards": {
      const b = await convex.query(api.admin.recentBoards);
      console.log("\n📋 Recent Boards\n");
      table(
        b.map((r) => ({
          name: r.name,
          owner: r.owner,
          vis: r.visibility,
          nodes: r.nodes,
          members: r.members,
          created: timeAgo(r.createdAt),
        })),
        ["name", "owner", "vis", "nodes", "members", "created"]
      );
      console.log();
      break;
    }

    case "active": {
      const b = await convex.query(api.admin.activeBoards);
      console.log("\n🔥 Active Boards\n");
      table(
        b.map((r) => ({
          name: r.name,
          owner: r.owner,
          vis: r.visibility,
          nodes: r.nodes,
          members: r.members,
          updated: timeAgo(r.updatedAt),
        })),
        ["name", "owner", "vis", "nodes", "members", "updated"]
      );
      console.log();
      break;
    }

    case "suggestions": {
      const reqs = await convex.query(api.featureRequests.list);
      console.log(`\n💡 Feature Suggestions (${reqs.length})\n`);
      table(
        reqs.map((r) => ({
          type: r.type,
          kind: r.kind,
          description: r.description.length > 60 ? r.description.slice(0, 57) + "..." : r.description,
          email: r.email ?? "-",
          credit: r.creditOptIn ? "yes" : "-",
          submitted: timeAgo(new Date(r.createdAt).toISOString()),
        })),
        ["type", "kind", "description", "email", "credit", "submitted"]
      );
      console.log();
      break;
    }

    case "help":
    case "--help":
    case "-h":
      console.log(`
Dump Admin CLI

Commands:
  stats     Overview of usage metrics, growth, and top boards
  users     Last 20 users who signed up
  boards    Last 20 boards created
  active        Last 20 boards by recent activity
  suggestions   View feature suggestions
  help          Show this help

Flags:
  --dev       Use dev Convex (default: prod)

Usage:
  pnpm admin <command>
  pnpm admin <command> --dev
`);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
