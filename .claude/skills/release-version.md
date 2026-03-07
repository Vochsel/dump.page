Perform a version release for Dump. Do ALL of the following steps:

1. **Bump BUILD_VERSION** in `src/lib/constants.ts` to the next appropriate semver version.

2. **Update the changelog** in `src/lib/changelog.ts`:
   - Add a new entry at the TOP of the `changelog` array
   - Set the version to match the new BUILD_VERSION
   - Set the date to today's date (YYYY-MM-DD)
   - Include entries for all changes since the last version (check git log since the last version bump)
   - Each entry needs `type: "feature" | "fix"` and a `description` string

3. **Deploy Convex** if any schema or mutation files changed:
   ```
   PATH="/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin" /bin/sh ./node_modules/.bin/convex deploy --yes --cmd 'echo "skipped"'
   ```

4. **Type check** to make sure nothing is broken:
   ```
   /usr/local/bin/node ./node_modules/typescript/bin/tsc --noEmit
   ```

5. **Commit and push** all changes to main with a message like "Release vX.Y.Z"
