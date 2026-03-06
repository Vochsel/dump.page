# BoardOps: Swappable Board Operations Context

## Overview

BoardOps is a provider pattern that abstracts all board node CRUD operations behind a common `BoardOps` interface. This lets the same Canvas component render identically for both authenticated Convex-backed boards (`/b/[boardId]`) and anonymous localStorage-backed boards (`/new`) with zero code duplication.

## Architecture

```
BoardOpsContext (interface)
    |
    +-- ConvexBoardOpsProvider   --> authenticated boards, Convex mutations/queries
    |
    +-- LocalBoardOpsProvider    --> anonymous boards, useState + localStorage
```

All canvas components (`Canvas`, `Toolbar`, `TextNode`, `LinkNode`, `ChecklistNode`) consume from `useBoardOps()` instead of calling Convex directly. The provider is swapped at the page level.

## The BoardOps Interface

Defined in `src/context/board-ops-context.tsx`:

```typescript
interface BoardOps {
  nodes: BoardNode[] | undefined;
  boardId: string;
  createNode: (args: CreateNodeArgs) => Promise<string>;
  updateNode: (args: { nodeId: string; content?: string; metadata?: Metadata }) => Promise<null>;
  updateNodePosition: (args: { nodeId: string; position: Position }) => Promise<null>;
  deleteNode: (args: { nodeId: string }) => Promise<null>;
  fetchLinkMetadata: (args: { nodeId: string; url: string }) => Promise<void>;
}
```

Key design decisions:
- **String IDs everywhere** -- `BoardNode._id` is `string`, not `Id<"nodes">`. The Convex provider casts at the boundary; the local provider uses `crypto.randomUUID()`.
- **`nodes` can be `undefined`** -- Matches the Convex `useQuery` behavior where data hasn't loaded yet. The Canvas handles this gracefully.
- **`fetchLinkMetadata` is part of the interface** -- The Convex provider delegates to a server action; the local provider calls the `/api/fetch-metadata` API route instead.

## Providers

### ConvexBoardOpsProvider

**File:** `src/context/convex-board-ops.tsx`
**Used by:** `/b/[boardId]` (authenticated board pages)

Wraps the existing `useQuery`, `useMutation`, and `useAction` hooks. Casts `Id<"nodes">` / `Id<"boards">` to `string` at the boundary so downstream components are Convex-agnostic.

```tsx
// In /b/[boardId]/page.tsx
<ConvexBoardOpsProvider boardId={boardId as Id<"boards">}>
  <Canvas canEdit={access.canEdit} settings={boardSettings} />
</ConvexBoardOpsProvider>
```

### LocalBoardOpsProvider

**File:** `src/context/local-board-ops.tsx`
**Used by:** `/new` (anonymous board page)

Stores nodes in React state synced to `localStorage` under the key `dump-local-board`. Node IDs are generated with `crypto.randomUUID()`.

For link metadata, it calls the Next.js API route `/api/fetch-metadata` since there's no Convex auth context.

```tsx
// In /new/page.tsx
<LocalBoardOpsProvider>
  <Canvas canEdit={true} />
</LocalBoardOpsProvider>
```

## Anonymous Board Flow (`/new`)

1. User clicks "Start dumping!" on the landing page
2. Redirected to `/new` -- no auth required
3. Board state lives in `localStorage` via `LocalBoardOpsProvider`
4. User creates nodes (text, link, checklist), pastes URLs, etc.
5. Refreshing the page restores all nodes from `localStorage`
6. User clicks **Share**:
   - If not logged in: dialog prompts Google sign-in
   - On successful login: `persistLocalBoard` Convex mutation is called with all local nodes
   - Board is created in Convex with the user as owner
   - `localStorage` is cleared
   - User is redirected to `/b/[newBoardId]`

## API Route: `/api/fetch-metadata`

**File:** `src/app/api/fetch-metadata/route.ts`

A no-auth GET endpoint that fetches a URL and parses Open Graph / meta tags.

```
GET /api/fetch-metadata?url=https://example.com
```

Returns:
```json
{
  "title": "Example Domain",
  "description": "This domain is for use in illustrative examples.",
  "favicon": "https://example.com/favicon.ico"
}
```

Uses the same parsing logic as the Convex `fetchLinkMetadata` action, extracted into shared helpers at `src/lib/metadata.ts`.

Constraints:
- 8 second fetch timeout
- 50KB HTML limit (only reads the head of the page)
- Returns `{}` on any error (never fails the request)

## Shared Metadata Parsing

**File:** `src/lib/metadata.ts`

Exported helpers used by both the API route and (optionally) the Convex action:

| Function | Purpose |
|----------|---------|
| `extractMeta(html, property)` | Extracts content from `<meta>` tags by `property` or `name` |
| `extractTagContent(html, tag)` | Extracts inner text from HTML tags like `<title>` |
| `extractLink(html, rel)` | Extracts `href` from `<link>` tags by `rel` attribute |
| `escapeRegex(s)` | Escapes regex special characters |
| `decodeHtmlEntities(s)` | Decodes common HTML entities (`&amp;`, `&lt;`, etc.) |

## Convex Mutation: `persistLocalBoard`

**File:** `convex/boards.ts`

Creates a new board and bulk-inserts all nodes from a local session:

```typescript
persistLocalBoard({
  name: "Untitled Board",
  icon: "...",
  nodes: [
    { type: "text", content: "...", position: { x, y }, metadata?: { ... } },
    // ...
  ]
})
```

- Requires authentication
- Creates the board as `private` visibility
- Adds the user as `owner` in `boardMembers`
- Returns the new `boardId`

## Adding a New Provider

To add a new storage backend (e.g., IndexedDB, a REST API, a collaboration server):

1. Create a new file `src/context/my-board-ops.tsx`
2. Implement all methods of the `BoardOps` interface
3. Wrap them in `<BoardOpsContext.Provider value={ops}>`
4. Use your provider at the page level:

```tsx
<MyBoardOpsProvider>
  <Canvas canEdit={true} />
</MyBoardOpsProvider>
```

No changes needed to Canvas or any node components.

## File Map

```
src/context/
  board-ops-context.tsx     -- BoardOps interface, BoardOpsContext, useBoardOps()
  convex-board-ops.tsx      -- ConvexBoardOpsProvider (Convex backend)
  local-board-ops.tsx       -- LocalBoardOpsProvider (localStorage backend)

src/lib/
  metadata.ts               -- Shared HTML metadata parsing helpers

src/app/
  api/fetch-metadata/
    route.ts                -- No-auth metadata fetching endpoint
  new/
    page.tsx                -- Anonymous board page
  b/[boardId]/
    page.tsx                -- Authenticated board page (wraps in ConvexBoardOpsProvider)

src/components/canvas/
  Canvas.tsx                -- Uses useBoardOps() (provider-agnostic)
  Toolbar.tsx               -- Uses useBoardOps()
  TextNode.tsx              -- Uses useBoardOps()
  LinkNode.tsx              -- Uses useBoardOps()
  ChecklistNode.tsx         -- Uses useBoardOps()

src/hooks/
  useUndoRedo.ts            -- Works with string IDs (provider-agnostic)

convex/
  boards.ts                 -- persistLocalBoard mutation
```
