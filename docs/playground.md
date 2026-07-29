# Playground Guide

**[→ Open Playground](https://iamkanguk97.github.io/eslint-plugin-date-consistency/)**

The Playground lets you test `eslint-plugin-date-consistency` rules interactively in the browser — no installation, no configuration files needed.

---

## Layout Overview

```
┌─────────────────────────────────────────────────────┐
│  Header — title, npm badge, GitHub link              │
├─────────────────────────────────────────────────────┤
│  Options Panel — rule option toggles                 │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   Code Editor        │   Lint Results               │
│   (Monaco)           │   (warnings list)            │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│  Example buttons               [🔗 Share]           │
└─────────────────────────────────────────────────────┘
```

---

## Sections

### Code Editor

The left panel is a full Monaco Editor (the same engine that powers VS Code).

- Type or paste any JavaScript code
- Lint warnings appear as **yellow underlines** on the flagged lines in real time
- Hover over an underline to see the warning message inline

> The editor accepts plain JavaScript. TypeScript syntax (type annotations, generics) is not supported in the Playground.

---

### Lint Results

The right panel lists every warning produced by the two rules.

Each entry shows:

| Field | Description |
|-------|-------------|
| **Line, Col** | Exact position of the issue in the editor |
| **Rule ID** | Which rule triggered (`date-consistency/no-new-date-with-lib` or `date-consistency/no-deprecated-date-lib`) |
| **Message** | The full warning message, including the detected library name |

When there are no issues, the panel shows a green **✓ No issues found** message.

---

### Options Panel

The options panel lets you toggle rule options without writing any config file.

#### `no-new-date-with-lib` options

| Option | Default | Effect when enabled |
|--------|:-------:|---------------------|
| `banNativeDate` | off | Flags `new Date()` even when **no** date library is imported |
| `checkStaticMethods` | off | Also flags `Date.now()`, `Date.parse()`, and `Date.UTC()` |
| `allowAsArgument` | off | Allows `new Date()` when passed as an argument to a function call (e.g. `dayjs(new Date())`) |

#### `libs` (watched libraries)

Checkboxes for the four default libraries: **dayjs**, **date-fns**, **moment**, **luxon**.

- Uncheck a library to stop the rule from triggering when that library is imported.
- Example: if you only use dayjs, uncheck date-fns, moment, and luxon so the rule stays focused.

> The `deprecated` option for `no-deprecated-date-lib` is not exposed as a toggle. The rule always uses its default list (`moment`) in the Playground.

---

### Example Buttons

Six preset examples load a complete code snippet and the matching options:

| Button | What it demonstrates |
|--------|----------------------|
| **dayjs** | `import dayjs` + `new Date()` → `noNewDate` warning |
| **date-fns** | bare `new Date()` is allowed (idiomatic date-fns); `new Date('...')` / `Date.parse()` → parsing warning |
| **moment (deprecated)** | `import moment from 'moment'` → `deprecatedLib` warning |
| **banNativeDate** | `new Date()` without any library import → warning (banNativeDate + checkStaticMethods enabled) |
| **checkStaticMethods** | `Date.now()` and `Date.UTC()` with dayjs → warning |
| **allowAsArgument** | `dayjs(new Date())` is allowed; standalone `new Date()` is still flagged |

Clicking a preset button:
1. Loads the example code into the editor
2. Sets the options panel to match the example's configuration
3. Highlights the active button

Editing the code or options after loading a preset clears the active highlight.

---

### Share Button

The **🔗 Share** button encodes the current editor code and option state into the URL as a Base64 string.

```
https://iamkanguk97.github.io/eslint-plugin-date-consistency/?s=<encoded>
```

- Click **Share** → the URL is copied to your clipboard automatically
- Paste the URL anywhere (Slack, GitHub issue, PR comment) — recipients open the exact same code and config
- The URL updates on every Share click; it does **not** update automatically as you type

> The encoded state only contains your code and option toggles — no personal data.

---

## Quick Start Examples

### 1. Test the default rule

```js
import dayjs from 'dayjs';

const now = new Date();  // ⚠ warning appears here
```

Paste this into the editor. You should immediately see one warning in the Results panel.

---

### 2. Try `banNativeDate`

Enable **banNativeDate** in the Options panel, then type:

```js
const now = new Date();  // ⚠ flagged even with no library imported
```

---

### 3. Try `checkStaticMethods`

Enable **checkStaticMethods** in the Options panel, then type:

```js
import dayjs from 'dayjs';

const ts = Date.now();         // ⚠ flagged
const utc = Date.UTC(2024, 0); // ⚠ flagged
```

---

### 4. Try `allowAsArgument`

Enable **allowAsArgument** in the Options panel, then type:

```js
import dayjs from 'dayjs';

const ok  = dayjs(new Date());  // ✓ allowed — inside a function call
const bad = new Date();         // ⚠ still flagged — standalone
```

---

### 5. Test the deprecated rule

```js
import moment from 'moment';
// ⚠ 'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.
```

---

## Known Limitations of the Playground

| Limitation | Detail |
|------------|--------|
| JavaScript only | TypeScript syntax is not supported. Use plain `.js`-style code. |
| No `ignorePatterns` | The `ignorePatterns` option is not exposed in the Playground UI (it requires a file path to match against). |

---

## Differences from the Real Plugin

The Playground runs the **actual plugin rules** in the browser through ESLint's
bundler-friendly `Linter` (`eslint/universal`), parsing with espree — the same
parser ESLint uses for JavaScript. For the code it can parse, lint results,
messages, and edge-case behavior (including CJS `require()` ordering and
`eslint-disable` directive comments) match the published npm package exactly.

Two differences remain:

- **JavaScript only**: the real plugin also works on TypeScript files (via `@typescript-eslint/parser`); the Playground's espree parser does not parse TypeScript syntax.
- **Exposed options**: `ignorePatterns` is not available in the Playground UI (see the limitations table above).
