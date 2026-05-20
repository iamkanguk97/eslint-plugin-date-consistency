# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [Unreleased]

### Fixed
- Fix `allowAsArgument` being ignored when `banNativeDate: true` and no date library is imported
- Fix `allowAsArgument` not applying to static methods (`Date.now()`, `Date.parse()`, `Date.UTC()`) when `checkStaticMethods: true`
- Fix `meta.version` in plugin metadata to match actual package version

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
