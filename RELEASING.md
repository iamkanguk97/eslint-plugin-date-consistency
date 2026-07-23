# Releasing

This project publishes to npm automatically via GitHub Actions
([`.github/workflows/release.yml`](./.github/workflows/release.yml)) using
**OIDC trusted publishing** — no long-lived npm token is stored, and every
release is published with build **provenance**.

## One-time setup (required before the first automated release)

Configure npm trusted publishing for the package:

1. Sign in at <https://www.npmjs.com> and open the package page for
   `eslint-plugin-date-consistency` → **Settings**.
2. Under **Publishing access → Trusted Publisher**, add a GitHub Actions
   publisher with:
   - **Organization or user:** `iamkanguk97`
   - **Repository:** `eslint-plugin-date-consistency`
   - **Workflow filename:** `release.yml`
   - **Environment:** leave blank (none is used)
3. Save.

> If the package has never been published before, run the first `npm publish`
> manually so the package exists on npm, then configure the trusted publisher
> for all subsequent automated releases.

## Cutting a release

1. **Bump the version on `main`:**
   - Update `version` in `package.json`.
   - Update `meta.version` in `src/index.ts` to the **same** value (it is not
     derived from `package.json`, so it must be kept in sync).
   - Move the `[Unreleased]` notes in `CHANGELOG.md` under a new
     `## [X.Y.Z] - YYYY-MM-DD` heading.
   - Commit, e.g. `chore: release vX.Y.Z`.
2. **Create a GitHub Release:**
   - **Tag:** `vX.Y.Z` — must match `package.json` (the workflow verifies this
     and fails the publish on mismatch).
   - **Target:** `main`.
   - Generate release notes or paste the changelog entry.
   - Click **Publish release**.
3. The **Release** workflow then runs automatically:
   - `npm ci`
   - verifies the release tag matches `package.json`
   - `npm publish --provenance` — the `prepublishOnly` hook runs
     `npm run build && npm test` first, so a failing build or test aborts the
     publish.

## Notes

- **Provenance:** releases are published with `--provenance`, so npm shows a
  verified link back to the exact commit and workflow run that built them.
- **No secrets:** authentication uses short-lived OIDC tokens, so there is no
  `NPM_TOKEN` to rotate or leak.
- **Version mismatch guard:** if the release tag and `package.json` version
  differ, the workflow fails before anything is published.
