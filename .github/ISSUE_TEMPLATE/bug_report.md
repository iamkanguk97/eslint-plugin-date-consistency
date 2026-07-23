---
name: Bug report
about: Report incorrect linting behavior or a crash
title: "[Bug] "
labels: bug
---

## Description

<!-- A clear and concise description of what went wrong. -->

## Environment

- **Plugin version:** <!-- e.g. 1.1.0 -->
- **ESLint version:** <!-- e.g. 9.0.0 -->
- **Node.js version:** <!-- e.g. 20.11.0 -->
- **Config format:** <!-- flat config (eslint.config.js) or legacy (.eslintrc) -->

## Rule and options

<!-- Which rule, with what options? -->

```js
'date-consistency/no-new-date-with-lib': ['warn', { /* ... */ }]
```

## Minimal reproduction

<!-- The smallest code that reproduces the problem. -->

```js
import dayjs from 'dayjs';
const d = new Date();
```

## Expected behavior

<!-- What did you expect to happen? -->

## Actual behavior

<!-- What actually happened? Include the exact warning message, if any. -->
