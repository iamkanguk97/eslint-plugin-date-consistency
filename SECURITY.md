# Security Policy

## Supported Versions

The latest published `1.x` release receives security updates. Please upgrade to
the latest version before reporting.

| Version | Supported |
|---------|:---------:|
| 1.x     | ✅        |
| < 1.0   | ❌        |

## Reporting a Vulnerability

Please report security vulnerabilities **privately** — do not open a public
issue for security problems.

1. **Preferred:** Use GitHub's private vulnerability reporting. Go to the
   [Security tab](https://github.com/iamkanguk97/eslint-plugin-date-consistency/security)
   and click **"Report a vulnerability."** This keeps the report private until a
   fix is released.
2. **Fallback:** If you cannot use GitHub advisories, email
   **iamkangukii.dev@gmail.com** with the details.

Please include:

- The affected version(s)
- A description of the vulnerability and its impact
- Steps to reproduce (a minimal proof of concept if possible)

You can expect an initial acknowledgement within a reasonable timeframe. Once
the issue is confirmed, a fix will be prepared and released, and the report will
be disclosed responsibly.

## Scope

- **Published package** (`dist/`, the ESLint rules) — the primary security
  scope. It performs static AST analysis only: no code execution, no network
  access, no filesystem writes.
- **Playground** (`playground/`, deployed to GitHub Pages) — a client-side demo
  that is **not** part of the npm package. It parses code with `acorn` (parsing
  only, never evaluation). Its `npm audit` advisories live in development-only or
  CDN-loaded transitive dependencies; see
  [CONTRIBUTING.md](./CONTRIBUTING.md#security--npm-audit).
