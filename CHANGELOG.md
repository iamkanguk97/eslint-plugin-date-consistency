# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
