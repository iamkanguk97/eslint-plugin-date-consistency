// Shared parity fixtures for the `no-new-date-with-lib` ESLint rule. They run
// twice: against the rule from source (tests/rules/no-new-date-with-lib.parity.test.ts)
// and through the playground's lint() wrapper (playground/tests/), which lints
// with the built package via eslint/universal. Both runs must produce the
// exact `expected` message text, locking messages in and catching a broken
// dist build or playground wiring.

export interface ParityFixtureOptions {
  libs?: string[];
  nativeLibs?: string[];
  allowAsArgument?: boolean;
  checkStaticMethods?: boolean;
  banNativeDate?: boolean;
}

export interface ParityFixture {
  name: string;
  code: string;
  options?: ParityFixtureOptions;
  expected: string[];
}

export const PARITY_FIXTURES: ParityFixture[] = [
  {
    name: 'no lib imported — bare new Date() allowed',
    code: `const d = new Date();`,
    expected: [],
  },
  {
    name: 'dayjs — bare new Date() flagged with a concrete replacement',
    code: `import dayjs from 'dayjs';\nconst d = new Date();`,
    expected: ["'dayjs' is already imported. Use 'dayjs()' instead of 'new Date()'."],
  },
  {
    name: 'luxon — bare new Date() flagged with a concrete replacement',
    code: `import { DateTime } from 'luxon';\nconst d = new Date();`,
    expected: ["'luxon' is already imported. Use 'DateTime.now()' instead of 'new Date()'."],
  },
  {
    name: 'dayjs — new Date(args) does not suggest a bare no-arg replacement',
    code: `import dayjs from 'dayjs';\nconst d = new Date('2024-01-01');`,
    expected: [
      "'dayjs' is already imported. Replace 'new Date(...)' with an equivalent dayjs call that preserves the same arguments.",
    ],
  },
  {
    name: 'date-fns — idiomatic bare new Date() allowed',
    code: `import { format } from 'date-fns';\nconst now = new Date();\nformat(now, 'yyyy-MM-dd');`,
    expected: [],
  },
  {
    name: 'date-fns — new Date(string) flagged as unreliable parsing',
    code: `import { format } from 'date-fns';\nconst d = new Date('2024-01-01');`,
    expected: [
      "Parsing date strings with new Date(string) is unreliable across engines. Use 'parseISO()' from date-fns instead.",
    ],
  },
  {
    name: 'date-fns — multi-argument constructor is not string parsing',
    code: `import { addDays } from 'date-fns';\nconst d = new Date('2024', 0, 1);`,
    expected: [],
  },
  {
    name: 'date-fns — Date.parse() flagged regardless of checkStaticMethods (same trap as new Date(string))',
    code: `import { format } from 'date-fns';\nconst ts = Date.parse('2024-01-01');`,
    expected: [
      "Parsing date strings with Date.parse() is unreliable across engines. Use 'parseISO()' from date-fns instead.",
    ],
  },
  {
    name: 'date-fns — Date.now() allowed even with checkStaticMethods (idiomatic timestamp)',
    code: `import { format } from 'date-fns';\nconst ts = Date.now();`,
    options: { checkStaticMethods: true },
    expected: [],
  },
  {
    name: 'date-fns — ad-hoc new Date() flagged when banNativeDate is true',
    code: `import { format } from 'date-fns';\nconst now = new Date();`,
    options: { banNativeDate: true },
    expected: [
      "Avoid ad-hoc 'new Date()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.",
    ],
  },
  {
    name: 'date-fns — Date.now() flagged only when banNativeDate AND checkStaticMethods are both true',
    code: `import { format } from 'date-fns';\nconst ts = Date.now();`,
    options: { banNativeDate: true, checkStaticMethods: true },
    expected: [
      "Avoid ad-hoc 'Date.now()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.",
    ],
  },
  {
    name: 'wrapper lib takes precedence over date-fns when both are imported',
    code: `import dayjs from 'dayjs';\nimport { format } from 'date-fns';\nconst d = new Date();`,
    expected: ["'dayjs' is already imported. Use 'dayjs()' instead of 'new Date()'."],
  },
  {
    name: 'custom nativeLibs option treats a user-defined library as native-Date',
    code: `import { formatDate } from 'my-native-date-utils';\nconst now = new Date();`,
    options: { libs: ['my-native-date-utils'], nativeLibs: ['my-native-date-utils'] },
    expected: [],
  },
];
