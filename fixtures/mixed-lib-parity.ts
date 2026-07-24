// Shared parity fixtures for the `no-mixed-date-libs` ESLint rule and its
// playground mirror (playground/src/utils/linter.ts). Both implementations
// must produce the exact `expected` message text for the same `code` and
// `options`, so a change to either side without the other fails a test here.
//
// The playground mirror is acorn-based and cannot parse TypeScript-only syntax
// (e.g. `import type`), so fixtures here stay to plain JS. TS-specific cases
// (type-only imports) live in the RuleTester test instead.

export interface MixedLibFixtureOptions {
  libs?: string[];
  preferred?: string;
}

export interface MixedLibFixture {
  name: string;
  code: string;
  options?: MixedLibFixtureOptions;
  expected: string[];
}

export const MIXED_LIB_FIXTURES: MixedLibFixture[] = [
  {
    name: 'single library — allowed',
    code: `import dayjs from 'dayjs';`,
    expected: [],
  },
  {
    name: 'same library via multiple subpaths — not mixing',
    code: `import dayjs from 'dayjs';\nimport utc from 'dayjs/plugin/utc';`,
    expected: [],
  },
  {
    name: 'two wrapper libraries — the second is flagged',
    code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
    expected: [
      "'luxon' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.",
    ],
  },
  {
    name: 'wrapper + native-Date library — still flagged as mixing',
    code: `import dayjs from 'dayjs';\nimport { format } from 'date-fns';`,
    expected: [
      "'date-fns' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.",
    ],
  },
  {
    name: 'three libraries — every extra one is flagged, in source order',
    code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';\nimport moment from 'moment';`,
    expected: [
      "'luxon' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.",
      "'moment' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.",
    ],
  },
  {
    name: 'repeated conflicting library — reported once at its first import',
    code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';\nimport { Duration } from 'luxon';`,
    expected: [
      "'luxon' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.",
    ],
  },
  {
    name: 'CJS require — mixing is detected the same way',
    code: `const dayjs = require('dayjs');\nconst { DateTime } = require('luxon');`,
    expected: [
      "'luxon' is mixed with 'dayjs' in the same file. Stick to a single date library for consistency.",
    ],
  },
  {
    name: 'custom libs list — a library outside it is ignored',
    code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
    options: { libs: ['dayjs'] },
    expected: [],
  },
  {
    name: 'preferred set — a non-preferred library is flagged even alongside the preferred one',
    code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
    options: { preferred: 'dayjs' },
    expected: [
      "'luxon' is not the preferred date library ('dayjs'). Use 'dayjs' consistently.",
    ],
  },
  {
    name: 'preferred set — a non-preferred library is flagged even when the preferred one is absent',
    code: `import { DateTime } from 'luxon';`,
    options: { preferred: 'dayjs' },
    expected: [
      "'luxon' is not the preferred date library ('dayjs'). Use 'dayjs' consistently.",
    ],
  },
  {
    name: 'preferred set — importing only the preferred library is allowed',
    code: `import dayjs from 'dayjs';\nimport utc from 'dayjs/plugin/utc';`,
    options: { preferred: 'dayjs' },
    expected: [],
  },
];
