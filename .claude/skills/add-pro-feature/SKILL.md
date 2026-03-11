Add a new feature gated behind Pro Mode (`dump-pro-mode` localStorage preference).

## Steps

1. **Implement the feature** — gate it behind the `proMode` boolean:
   - In Canvas.tsx: `const [proMode] = useLocalStorage(PRO_MODE_STORAGE_KEY, false);` (already exists)
   - In other components: `const [proMode] = useLocalStorage(PRO_MODE_STORAGE_KEY, false);` with import `import { PRO_MODE_STORAGE_KEY } from "@/lib/chat-providers";` and `import { useLocalStorage } from "@/hooks/useLocalStorage";`
   - Wrap the feature's UI with `{proMode && ( ... )}`

2. **Add to the welcome dialog** in `src/components/canvas/Canvas.tsx`:
   - Find the `Pro Mode Enabled` dialog (search for `proWelcomeOpen`)
   - Add a new entry to the features array with `{ icon: IconName, label: "Short name", desc: "One-line description" }`
   - Import the lucide icon if not already imported

3. **Document on the help page** at `src/app/help/pro-mode/page.tsx`:
   - Add a new entry to the `PRO_FEATURES` array with:
     - `icon`: lucide-react icon component
     - `title`: feature name (2-4 words)
     - `description`: 1-2 sentences explaining the feature
     - `color`: one of `blue`, `violet`, `green`, `orange`, `indigo`, `amber` — pick one not already heavily used, or add a new color to `COLOR_MAP`
   - Import the icon from lucide-react if not already imported

## Key files

- `src/lib/chat-providers.ts` — `PRO_MODE_STORAGE_KEY` constant
- `src/components/canvas/Canvas.tsx` — pro mode toggle, welcome dialog, canvas features
- `src/components/board/BoardSettings.tsx` — board settings (context type, system prompt, RSS)
- `src/components/board/ChatButton.tsx` — AI chat prompt dialog
- `src/app/b/[boardId]/page.tsx` — board page (view switcher)
- `src/app/help/pro-mode/page.tsx` — help page listing all pro features

## Style guide

- Keep welcome dialog entries concise: label (2-4 words) + desc (under 60 chars)
- Help page descriptions: 1-2 full sentences explaining what the feature does
- Always gate behind `proMode` — never show pro features by default
- Use existing patterns: `useLocalStorage` for reading the preference, lucide icons for UI
