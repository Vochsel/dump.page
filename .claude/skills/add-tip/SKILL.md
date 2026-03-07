Add a new quick tip to `src/components/board/QuickTips.tsx`.

1. **Read the file** to see existing tips and avoid duplicates.

2. **Add a new entry** to the `TIPS` array with:
   - `id`: a unique kebab-case identifier
   - `title`: short headline (2-4 words)
   - `body`: 1-2 sentence description, concise and helpful
   - `cta` (optional): `{ label: "Button text", href: "/path" }` — only add if the user specifies a link

3. **Placement**: Add the new tip at the END of the `TIPS` array (tips are shown in order, one per day, after earlier ones are dismissed).

4. **Style guide**:
   - Keep body text under ~160 characters for readability in the small tooltip
   - Use an action-oriented tone ("Try...", "Enable...", "Connect...")
   - Don't repeat information already covered by existing tips
