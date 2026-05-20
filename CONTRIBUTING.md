# Contributing

Thank you for considering a contribution to `eslint-plugin-date-consistency`.

## Development Setup

```bash
git clone https://github.com/iamkanguk97/eslint-plugin-date-consistency.git
cd eslint-plugin-date-consistency

# use whichever package manager you prefer
npm install   # or: yarn install / pnpm install
```

## Project Structure

```
src/
  index.ts                              # Plugin entry point
  rules/
    no-new-date-with-lib.ts             # Rule: flag new Date() when a lib is imported
    no-deprecated-date-lib.ts           # Rule: flag deprecated libraries (e.g. moment)
  utils/
    create-rule.ts                      # RuleCreator helper
    matchers.ts                         # Package name normalization utilities
tests/
  rules/
    no-new-date-with-lib.test.ts        # RuleTester-based tests
    no-deprecated-date-lib.test.ts      # RuleTester-based tests
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm test` | Run all tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

## Testing Locally with a Real Project

You can test the plugin against real code before publishing using `npm link`.

**Step 1** — Build and link the plugin from this repo:

```bash
npm run build
npm link
```

**Step 2** — Create a test project (or use an existing one) and link the plugin:

```bash
mkdir my-test-playground && cd my-test-playground
npm init -y
npm link eslint-plugin-date-consistency
```

**Step 3** — Add an `eslint.config.mjs`:

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['warn', {
        libs: ['dayjs', 'date-fns'],
        checkStaticMethods: true,
      }],
      'date-consistency/no-deprecated-date-lib': 'warn',
    },
  },
];
```

**Step 4** — Create a sample file and run ESLint:

```js
// sample.js
import dayjs from 'dayjs';
const d = new Date(); // should produce a warning
```

```bash
npx eslint sample.js
```

After making changes to the plugin source, re-run `npm run build` in this repo to pick up the changes — no need to re-link.

---

## Adding a New Rule

1. Create `src/rules/<rule-name>.ts` following the pattern of `no-new-date-with-lib.ts`.
2. Export a `meta` block with `type`, `docs`, `messages`, and `schema`.
3. Register the rule in `src/index.ts` under `rules`.
4. Add corresponding tests in `tests/rules/<rule-name>.test.ts`.
   - Cover all `valid` and `invalid` cases including edge cases and option variants.
5. Document the rule in `README.md` following the existing format.

## Writing Tests

Tests use `@typescript-eslint/rule-tester` with Vitest.

```ts
ruleTester.run('rule-name', rule, {
  valid: [
    { code: `...` },
    { code: `...`, options: [{ myOption: true }] },
  ],
  invalid: [
    {
      code: `...`,
      errors: [{ messageId: 'myMessageId' }],
    },
  ],
});
```

Every new rule must have tests for:
- The base behavior (no options)
- Each option variant
- Edge cases documented in the rule's `meta.docs.description`

## Pull Request Guidelines

- Keep PRs focused — one rule or fix per PR.
- All tests must pass (`npm test`).
- Build must succeed (`npm run build`).
- Update `README.md` if the PR changes behavior or adds options.
- Add an entry to `CHANGELOG.md` under `[Unreleased]`.

## Commit Message Format

```
type: short description

type: feat | fix | docs | test | refactor | chore
```

Examples:
```
feat: add allowAsArgument option to no-new-date-with-lib
fix: handle require() with destructuring assignment
docs: add luxon examples to README
```

## Reporting Issues

Please open a GitHub issue with:
- ESLint version
- Plugin version
- Minimal reproduction code
- Expected vs. actual behavior
