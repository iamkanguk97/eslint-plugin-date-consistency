# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-07-24

### Added
- New rule `no-mixed-date-libs` — enforces a single date library. With no options it flags a file that imports more than one watched date library (the first import wins; each later, different library is reported once). With `preferred` set, it flags any library other than the preferred one wherever it is imported, giving a per-file way to enforce one library across the whole project. Options: `libs` (default `['dayjs', 'date-fns', 'moment', 'luxon']`) and `preferred`
- Playground: `no-mixed-date-libs` is mirrored in the linter, exposed via a `preferred` selector and a `no-mixed-date-libs` example, and covered by a shared parity fixture suite (`fixtures/mixed-lib-parity.ts`)
- README: a "How this compares to other date ESLint plugins" section clarifying where this plugin's context-aware approach differs from the alternatives

### Note
- `no-mixed-date-libs` is **not** part of the `recommended` config — it is opt-in. `recommended` intentionally tolerates a wrapper library (e.g. dayjs) coexisting with a native-Date library (date-fns) in one file, which `no-new-date-with-lib` already handles; enable `no-mixed-date-libs` explicitly when you want strict single-library enforcement

## [1.1.0] - 2026-07-14

### Changed
- `no-new-date-with-lib`: date-fns is now treated as a **native-Date library**. Files importing date-fns no longer flag idiomatic `new Date()` / `Date.now()` / `Date.UTC()`; instead the rule flags unreliable string parsing — `new Date(string)` and `Date.parse()` (the latter regardless of `checkStaticMethods`, since it carries the same risk) — and suggests `parseISO()`. A multi-argument call like `new Date('2024', 0, 1)` is the numeric year/month/day constructor, not string parsing, and is not flagged. Use `banNativeDate: true` to also forbid ad-hoc `new Date()` in date-fns files (add `checkStaticMethods: true` too if you want `Date.now()`/`Date.UTC()` covered as well) — the warning then suggests centralizing date creation in a mockable clock helper
- `no-new-date-with-lib`: warning messages now include a concrete replacement per wrapper library (`dayjs()`, `moment()`, `DateTime.now()`); custom libraries keep the generic wording. When the flagged `new Date(...)`/`Date.{{method}}(...)` call has arguments, the message no longer suggests a bare no-arg replacement (which would silently drop the arguments) — it asks for an equivalent call that preserves them instead
- `no-new-date-with-lib`: when both a wrapper library (e.g. dayjs) and a native-Date library are imported in the same file, the wrapper behavior takes precedence
- Playground: linter mirror and the date-fns preset example updated to match the new behavior; the mirror and the rule now share a parity fixture suite (`fixtures/date-lib-parity.ts`) so the two can't silently drift apart
- CI now also installs and tests the playground package

### Added
- New messages `unreliableParsing` (string-parsing traps), `centralizeCreation` (`banNativeDate: true` with a native-Date library), `noNewDateWithArgs`, and `noStaticDateWithArgs` (argument-preserving wrapper-lib guidance) in `no-new-date-with-lib`
- `nativeLibs` option for `no-new-date-with-lib` — lets you treat your own native-Date-based utilities the same way date-fns is treated (default: `['date-fns']`)
- Playground now has its own test suite (`playground/tests/`), including the parity fixtures shared with the main rule's tests

### Fixed
- `no-new-date-with-lib`: a multi-argument `new Date(...)` call whose first argument happens to be a string (e.g. `new Date('2024', 0, 1)`) was misclassified as unreliable string parsing for native-Date libraries; only a single string/template-literal argument is treated as a parse call now

## [1.0.4] - 2026-05-20

### Fixed
- Fix `allowAsArgument` being ignored when `banNativeDate: true` and no date library is imported
- Fix `allowAsArgument` not applying to static methods (`Date.now()`, `Date.parse()`, `Date.UTC()`) when `checkStaticMethods: true`
- Fix `meta.version` in plugin metadata to match actual package version
- Remove non-null assertion (`!`) on `detectedLib` — replaced with proper TypeScript narrowing
- Replace unsafe `includes(node as TSESTree.Expression)` cast with type-safe identity comparison
- Add explicit `"import"` condition to `exports` field for ESM environments

### Added
- Tests for `Date.UTC()` with `checkStaticMethods: true`
- Tests for `allowAsArgument` combined with `banNativeDate` and `checkStaticMethods`

## [1.0.3] - 2026-05-20

### Fixed
- Fix `exports` field condition order: move `"types"` before `"default"` so TypeScript can resolve type declarations correctly

### Changed
- Drop Node.js 18 support (EOL April 2025). Minimum supported version is now Node.js 20

## [1.0.2] - 2026-05-20

### Fixed
- Move `@typescript-eslint/utils` from `devDependencies` to `dependencies` so it is available at runtime when the plugin is installed

## [1.0.1] - 2026-05-20

### Fixed
- Add `"default"` condition to `exports` field so the plugin can be imported from ESM contexts (e.g. `eslint.config.mjs`)

### Added
- `ignorePatterns` option — glob patterns for files where `new Date()` is allowed (e.g. test files)
- `banNativeDate` option — flags `new Date()` even when no date library is imported
- Dynamic error messages now include the detected library name (e.g. `'dayjs' is already imported...`)
- `no-deprecated-date-lib` rule — flags imports of deprecated libraries (default: `moment`), with configurable `deprecated` list and `alternatives` suggestions

## [1.0.0] - 2026-05-19

### Added
- `no-new-date-with-lib` rule — flags `new Date()` in files that import a date library
- `libs` option — configurable list of date libraries to watch (default: dayjs, date-fns, moment, luxon)
- `allowAsArgument` option — allow `new Date()` when passed as an argument to a function call
- `checkStaticMethods` option — also flag `Date.now()`, `Date.parse()`, `Date.UTC()`
- Subpath import support (e.g. `date-fns/format`)
- CommonJS `require()` support
- `type`-only import exemption
- `recommended` config
