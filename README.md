# eslint-plugin-date-consistency

**Language / 언어:** [English](./README.md) | [한국어](./README.ko.md)

[![npm version](https://img.shields.io/npm/v/eslint-plugin-date-consistency)](https://www.npmjs.com/package/eslint-plugin-date-consistency)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Playground](https://img.shields.io/badge/Try%20it%20online-Playground-7c6af7)](https://iamkanguk97.github.io/eslint-plugin-date-consistency/)

An ESLint plugin that enforces consistent date handling — preventing accidental use of the native `Date` object when a date library is already in use, and flagging deprecated libraries like Moment.js.

## Playground

Try the rules interactively in your browser — no installation required.

**[→ Open Playground](https://iamkanguk97.github.io/eslint-plugin-date-consistency/)**

- Paste your code and see lint warnings in real time
- Toggle options (`banNativeDate`, `checkStaticMethods`, `allowAsArgument`, etc.)
- Load preset examples for dayjs, date-fns, moment, and more
- Share a specific code + config snapshot via URL

See [Playground Guide](./docs/playground.md) for detailed usage.

---

## Why?

When a project adopts a date library like **dayjs** or **date-fns**, developers may still reach for `new Date()` out of habit. This creates two problems:

1. **Inconsistency** — the codebase mixes two date representations, making it harder to reason about behavior.
2. **Reintroduced bugs** — the native `Date` object has well-known pitfalls (0-indexed months, mutability, DST edge cases, timezone traps) that libraries are designed to work around.

```js
// ❌ Inconsistent — mixing dayjs with native Date
import dayjs from 'dayjs';
const d = new Date(); // should be dayjs()

// ✅ Consistent
import dayjs from 'dayjs';
const d = dayjs();
```

This plugin catches these issues at lint time, before they reach code review or production.

> **Deeper dive:** [Why Avoid `new Date()`?](./docs/why-avoid-new-date.md) — the specific footguns behind the advice (string parsing, the system clock, 0-indexed months, mutability) and how each rule maps to them.

---

## Rules

| Rule | Description | Recommended |
|------|-------------|:-----------:|
| [`no-new-date-with-lib`](#date-consistencyno-new-date-with-lib) | Flags `new Date()` when a date library is imported | ✅ |
| [`no-deprecated-date-lib`](#date-consistencyno-deprecated-date-lib) | Flags imports of deprecated libraries (e.g. Moment.js) | ✅ |
| [`no-mixed-date-libs`](#date-consistencyno-mixed-date-libs) | Flags mixing more than one date library (opt-in) | — |

---

## How this compares to other date ESLint plugins

Several plugins touch date handling. What makes this one different is that it is **context-aware**: `no-new-date-with-lib` flags `new Date()` **only in files that already import a date library**, and tailors the message to that library (`dayjs()`, `DateTime.now()`, …), distinguishing wrapper libraries from native-`Date` libraries like date-fns. Most alternatives flag `new Date()` unconditionally, or discourage one specific library.

| Plugin | Focus | How it differs from this plugin |
|--------|-------|---------------------------------|
| [`eslint-plugin-you-dont-need-momentjs`](https://github.com/you-dont-need/You-Dont-Need-Momentjs) | Per-function Moment.js replacements | Deep on Moment migration; doesn't reason about `new Date()` vs. an imported library. Overlaps `no-deprecated-date-lib` only |
| [`eslint-plugin-no-date-parsing`](https://github.com/amzn/eslint-plugin-no-date-parsing) | `new Date(string)` / `Date.parse` string-parsing | Always flags, regardless of imports. This plugin flags the same trap but only for native-`Date` libraries (where it matters), as part of `no-new-date-with-lib` |
| `eslint-plugin-no-new-date`, `eslint-plugin-disallow-date` | Ban `new Date()` everywhere | Blanket ban with no library awareness — equivalent to this plugin's opt-in `banNativeDate: true` |
| [`eslint-plugin-date`](https://www.npmjs.com/package/eslint-plugin-date) | `no-new-date-with-args`, `no-moment-dayjs` | Closest sibling, but still flags unconditionally; no wrapper-vs-native distinction or per-library messages |

**Use this plugin when** you have adopted a date library and want consistency enforced *relative to that choice* — including, via `no-mixed-date-libs`, forbidding a second library from creeping in. **Reach for a blanket plugin instead** if you simply want to ban `new Date()` outright with no notion of which library a file uses.

---

## Requirements

| Requirement | Minimum Version |
|-------------|:---------------:|
| Node.js | `>= 20.0.0` |
| ESLint | `>= 8.0.0` |

**Package managers:** npm, pnpm, and yarn are all supported.

**TypeScript:** Not required. Works with both JavaScript and TypeScript projects.

---

## Installation

```bash
# npm
npm install --save-dev eslint-plugin-date-consistency

# yarn
yarn add --dev eslint-plugin-date-consistency

# pnpm
pnpm add --save-dev eslint-plugin-date-consistency
```

**Peer dependencies:** `eslint >= 8.0.0`

---

## Setup

### Option 1 — Recommended Config (simplest)

Enables all recommended rules with sensible defaults.

```js
// eslint.config.js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [dateConsistency.configs.recommended];
```

### Option 2 — Manual Flat Config

```js
// eslint.config.js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: {
      'date-consistency': dateConsistency,
    },
    rules: {
      'date-consistency/no-new-date-with-lib': 'warn',
      'date-consistency/no-deprecated-date-lib': 'warn',
    },
  },
];
```

### Option 3 — Legacy Config (`.eslintrc.js`)

```js
module.exports = {
  plugins: ['date-consistency'],
  rules: {
    'date-consistency/no-new-date-with-lib': 'warn',
    'date-consistency/no-deprecated-date-lib': 'warn',
  },
};
```

---

## Rules

### `date-consistency/no-new-date-with-lib`

Disallows `new Date()` (and optionally `Date.now()`, `Date.parse()`) in files that import a configured date library.

The error message includes the detected library and a concrete replacement:

```
'dayjs' is already imported. Use 'dayjs()' instead of 'new Date()'.
```

> **Note:** date-fns is handled differently from the other libraries — see [How date-fns is handled](#how-date-fns-is-handled) below.

#### Options

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  libs: ['dayjs', 'date-fns', 'moment', 'luxon'], // default
  nativeLibs: ['date-fns'],                        // default
  allowAsArgument: false,                          // default
  checkStaticMethods: false,                       // default
  ignorePatterns: [],                              // default
  banNativeDate: false,                            // default
}]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `libs` | `string[]` | `['dayjs', 'date-fns', 'moment', 'luxon']` | Date libraries to watch for. Supports subpath imports (e.g. `date-fns/format`) and scoped packages. |
| `nativeLibs` | `string[]` | `['date-fns']` | Libraries in `libs` that operate on native `Date` objects, so creating a `Date` is idiomatic for them. See [How date-fns is handled](#how-date-fns-is-handled). |
| `allowAsArgument` | `boolean` | `false` | When `true`, allows `new Date()` when passed as an argument to a function call (e.g. `dayjs(new Date())`). |
| `checkStaticMethods` | `boolean` | `false` | When `true`, also flags `Date.now()` and `Date.UTC()`. For native-Date libraries, `Date.parse()` is always flagged regardless of this option (see below). |
| `ignorePatterns` | `string[]` | `[]` | Glob patterns for files where `new Date()` is always allowed. Useful for test files. |
| `banNativeDate` | `boolean` | `false` | When `true`, flags `new Date()` even in files that do not import a date library. |

#### What is flagged

```js
// ESM default import
import dayjs from 'dayjs';
const d = new Date(); // ⚠ 'dayjs' is already imported. Use 'dayjs()' instead of 'new Date()'.

// Named import
import { DateTime } from 'luxon';
const d = new Date(); // ⚠ 'luxon' is already imported. Use 'DateTime.now()' instead of 'new Date()'.

// Subpath import
import utc from 'dayjs/plugin/utc';
const d = new Date(); // ⚠

// CommonJS require
const dayjs = require('dayjs');
const d = new Date(); // ⚠

// new Date() with arguments — the message doesn't claim a bare no-arg
// replacement, since e.g. 'dayjs()' would silently drop the date
import dayjs from 'dayjs';
const d = new Date('2024-01-01'); // ⚠ 'dayjs' is already imported. Replace 'new Date(...)' with an equivalent dayjs call that preserves the same arguments.

// Passing new Date() as argument (allowAsArgument: false, the default)
import dayjs from 'dayjs';
const d = dayjs(new Date()); // ⚠

// Date.now() when checkStaticMethods: true
import dayjs from 'dayjs';
const ts = Date.now(); // ⚠ 'dayjs' is already imported. Use 'dayjs()' instead of 'Date.now'.

// date-fns: only unreliable string parsing is flagged
import { format } from 'date-fns';
const a = new Date('2024-01-01');    // ⚠ Parsing date strings with new Date(string) is unreliable across engines. Use 'parseISO()' from date-fns instead.
const b = Date.parse('2024-01-01');  // ⚠ same warning (flagged even without checkStaticMethods)
```

#### What is allowed

```js
// No date library imported — native Date is fine
const d = new Date();

// type-only import does not trigger the rule
import type { Dayjs } from 'dayjs';
const d = new Date(); // ok

// instanceof is a type check, not a constructor call
import dayjs from 'dayjs';
if (value instanceof Date) { /* ok */ }

// Date.now() is allowed by default (checkStaticMethods: false)
import dayjs from 'dayjs';
const ts = Date.now(); // ok

// allowAsArgument: true
import dayjs from 'dayjs';
const d = dayjs(new Date()); // ok when allowAsArgument is true

// Libraries not in the configured libs list
import axios from 'axios';
const d = new Date(); // ok

// date-fns operates on native Date — creating one is idiomatic
import { format } from 'date-fns';
const now = new Date();               // ok
const label = format(now, 'yyyy-MM-dd'); // ok

// date-fns: a multi-argument constructor is not string parsing
import { addDays } from 'date-fns';
const d = new Date('2024', 0, 1); // ok — year/month/day components, not new Date(string)

// date-fns: Date.now()/Date.UTC() are allowed unless checkStaticMethods AND banNativeDate are both set
import { format } from 'date-fns';
const ts = Date.now(); // ok
```

#### How date-fns is handled

The default libraries fall into two kinds:

| Kind | Libraries | Date representation |
|------|-----------|---------------------|
| **Wrapper** | dayjs, moment, luxon | Provide their own object (`Dayjs`, `Moment`, `DateTime`) that replaces native `Date` |
| **Native-Date** | date-fns | Pure functions that take and return native `Date` objects |

For wrapper libraries, any `new Date()` mixes two date representations, so it is always flagged.

For **date-fns**, native `Date` **is** the date representation — `format(new Date(), 'yyyy-MM-dd')` is the library's official idiom, and date-fns has no function that replaces `new Date()`. So in files importing date-fns the rule only flags the genuinely dangerous patterns:

- `new Date('2024-01-01')` (a single string/template-literal argument) — string parsing varies across engines; use `parseISO()` instead. A multi-argument call like `new Date('2024', 0, 1)` is the numeric year/month/day constructor, not string parsing, so it's not flagged.
- `Date.parse('2024-01-01')` — the same trap as `new Date(string)`, so it's flagged regardless of `checkStaticMethods`.

Bare `new Date()`, `new Date(timestamp)`, `new Date(y, m, d)`, and `Date.now()`/`Date.UTC()` are allowed by default — they're idiomatic ad-hoc creation, the same category as bare `new Date()`.

If your team wants to forbid ad-hoc date creation in date-fns projects too (e.g. to centralize it in a mockable clock helper), use `banNativeDate: true`. `Date.now()`/`Date.UTC()` additionally require `checkStaticMethods: true` to be inspected at all (the same precondition static methods need for every library) — `new Date()`/`Date.parse()` aren't affected by `checkStaticMethods` since they're checked unconditionally.

```js
'date-consistency/no-new-date-with-lib': ['warn', { banNativeDate: true }]
// ⚠ Avoid ad-hoc 'new Date()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.

'date-consistency/no-new-date-with-lib': ['warn', { banNativeDate: true, checkStaticMethods: true }]
// ⚠ Avoid ad-hoc 'Date.now()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.
```

Use `nativeLibs` to treat your own native-Date-based utilities the same way date-fns is treated:

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  libs: ['dayjs', 'my-internal-date-utils'],
  nativeLibs: ['my-internal-date-utils'],
}]
```

When both a wrapper library and a native-Date library are imported in the same file, the wrapper behavior wins — the wrapper's object makes `new Date()` an inconsistency again.

#### Recipes

**Strict mode — ban `new Date()` everywhere**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  banNativeDate: true,
  checkStaticMethods: true,
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**Allow `new Date()` in test files**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**Custom library list**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  libs: ['dayjs', 'my-internal-date-utils'],
}]
```

**Allow `dayjs(new Date())` as a migration bridge**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  allowAsArgument: true,
}]
```

---

### `date-consistency/no-deprecated-date-lib`

Flags imports of deprecated or unmaintained date libraries. By default, it targets **Moment.js**, which has been in maintenance mode since September 2020 (no new features, security fixes only).

```
'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.
```

#### Options

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['moment'],                         // default
  alternatives: { moment: 'dayjs or date-fns' }, // default
}]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `deprecated` | `string[]` | `['moment']` | Libraries to flag. |
| `alternatives` | `Record<string, string>` | `{ moment: 'dayjs or date-fns' }` | Suggested alternative for each deprecated library, shown in the warning message. |

#### What is flagged

```js
import moment from 'moment';
// ⚠ 'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.

const moment = require('moment');
// ⚠ same warning

import moment from 'moment/moment'; // subpath import
// ⚠ same warning
```

#### What is allowed

```js
// type-only import is not flagged
import type { Moment } from 'moment';

// Non-deprecated libraries
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { DateTime } from 'luxon';
```

#### Recipes

**Custom deprecated list with alternatives**

```js
'date-consistency/no-deprecated-date-lib': ['error', {
  deprecated: ['moment', 'fecha'],
  alternatives: {
    moment: 'dayjs',
    fecha: 'date-fns',
  },
}]
```

**Flag without suggesting an alternative**

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['my-old-date-lib'],
  alternatives: {}, // no suggestion shown
}]
```

---

### `date-consistency/no-mixed-date-libs`

Enforces a **single date library** by flagging files that pull in more than one. This is the counterpart to `no-new-date-with-lib`: that rule keeps native `Date` from mixing with your library, and this one keeps a *second* library from mixing with your first.

> **Opt-in:** this rule is **not** part of the `recommended` config. Enable it explicitly when you want strict single-library enforcement.

```
'luxon' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.
```

#### Options

```js
'date-consistency/no-mixed-date-libs': ['warn', {
  libs: ['dayjs', 'date-fns', 'moment', 'luxon'], // default
  preferred: undefined,                            // default (no single preferred library)
}]
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `libs` | `string[]` | `['dayjs', 'date-fns', 'moment', 'luxon']` | Date libraries treated as mutually exclusive. Supports subpath imports and scoped packages. |
| `preferred` | `string` | `undefined` | The single allowed library. When set, any other library in `libs` is flagged wherever it is imported — even if the preferred one is absent from that file. When unset, the first library imported in a file wins and any different one is flagged. |

#### Two modes

**Default — no `preferred`:** the first watched library imported in a file becomes the chosen one; any *different* watched library in the same file is flagged (once, at its first import).

```js
import dayjs from 'dayjs';
import { DateTime } from 'luxon'; // ⚠ 'luxon' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.
```

**With `preferred` — project-wide single library:** because ESLint checks every file, pinning a preferred library flags any other library across the whole codebase, file by file.

```js
// options: { preferred: 'dayjs' }
import { DateTime } from 'luxon'; // ⚠ 'luxon' is not the preferred date library ('dayjs'). Use 'dayjs' consistently.
```

#### What is allowed

```js
// A single library — fine
import dayjs from 'dayjs';

// The same library over multiple subpaths is not "mixing"
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc'; // ok

// type-only imports don't count as usage
import dayjs from 'dayjs';
import type { DateTime } from 'luxon'; // ok

// A library outside the configured `libs` list is ignored
// options: { libs: ['dayjs'] }
import dayjs from 'dayjs';
import { DateTime } from 'luxon'; // ok — luxon isn't watched
```

#### Recipes

**Enforce a single library project-wide**

```js
'date-consistency/no-mixed-date-libs': ['error', { preferred: 'dayjs' }]
```

**Only forbid mixing among a specific set**

```js
'date-consistency/no-mixed-date-libs': ['warn', { libs: ['dayjs', 'luxon', 'moment'] }]
```

> **Note:** like `no-new-date-with-lib`, CJS `require()` detection is order-sensitive within a file (ESLint's single-pass visitor). Keeping `require()` calls at the top of the file — standard practice — avoids this. ESM `import`s are always hoisted, so they are unaffected.

---

## Common Configurations

### dayjs project — recommended starting point

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['warn', {
        libs: ['dayjs'],
        ignorePatterns: ['**/*.test.*', '**/*.spec.*'],
      }],
      'date-consistency/no-deprecated-date-lib': 'warn',
    },
  },
];
```

### date-fns project

Idiomatic `new Date()` stays allowed; unreliable string parsing (`new Date('...')`, `Date.parse()`) is flagged automatically:

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['error', {
        libs: ['date-fns'],
        ignorePatterns: ['**/*.test.*'],
      }],
      'date-consistency/no-deprecated-date-lib': 'error',
    },
  },
];
```

To also forbid ad-hoc date creation (centralize it in a mockable clock helper), add `banNativeDate: true`. Add `checkStaticMethods: true` too if you also want `Date.now()`/`Date.UTC()` covered, not just `new Date()`:

```js
'date-consistency/no-new-date-with-lib': ['error', {
  libs: ['date-fns'],
  banNativeDate: true,
  checkStaticMethods: true,
  ignorePatterns: ['**/*.test.*'],
}],
```

### Migrating away from Moment.js

Use both rules together to prevent new Moment.js usage while enforcing a replacement:

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-deprecated-date-lib': ['error', {
        deprecated: ['moment'],
        alternatives: { moment: 'dayjs' },
      }],
      'date-consistency/no-new-date-with-lib': ['warn', {
        libs: ['dayjs'],
      }],
    },
  },
];
```

### Enforce a single date library

Add `no-mixed-date-libs` with a `preferred` library to keep a second date library from creeping in anywhere in the codebase:

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['warn', { libs: ['dayjs'] }],
      'date-consistency/no-mixed-date-libs': ['error', { preferred: 'dayjs' }],
    },
  },
];
```

---

## Known Limitations

### CJS `require` must appear before `new Date()`

ESLint visits AST nodes in a single top-to-bottom pass. If a `require()` call appears **after** `new Date()` in the same file, the rule will not detect it:

```js
const d = new Date();          // ← not flagged: require hasn't been seen yet
const dayjs = require('dayjs');
```

This is an inherent constraint of ESLint's single-pass visitor model. The workaround is to keep `require()` at the top of the file — which is standard practice anyway.

ESM `import` declarations are always hoisted to the top of the file by the language spec, so this limitation does not apply to ESM.

### `allowAsArgument` allows `new Date()` inside any function call

When `allowAsArgument: true`, the rule permits `new Date()` whenever it is passed as an argument to **any** function — not only date library functions:

```js
import dayjs from 'dayjs';

dayjs(new Date());           // ✅ allowed — intended use case
someOtherFn(new Date());     // ✅ also allowed — may be unexpected
```

If you need stricter control, keep `allowAsArgument: false` (the default) and handle `dayjs(new Date())` as a separate lint disable comment where needed.

---

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
