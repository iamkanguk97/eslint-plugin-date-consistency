# Why Avoid `new Date()`?

"Avoid `new Date()`" is common advice, but it bundles several distinct concerns
under one phrase. The native `Date` object is not inherently unusable — for
simple cases, `Date` plus `Intl.DateTimeFormat` is perfectly fine with zero
dependencies. What people are actually warning against is a set of **specific
footguns** and, above all, **mixing paradigms** in one codebase.

This note explains each concern and shows how the rules in
`eslint-plugin-date-consistency` map to it.

---

## TL;DR

| Concern | What's actually wrong | Rule behavior |
|---------|----------------------|---------------|
| `new Date(string)` / `Date.parse()` | String parsing differs across formats and engines | Flagged as `unreliableParsing` (even for date-fns) |
| `new Date()` with no args | Reads the system clock → non-deterministic, hard to test | Flagged as `centralizeCreation` when `banNativeDate` is on |
| `new Date(y, m, d)` | Month is 0-indexed; overflow silently wraps | API footgun (a reason to prefer a library) |
| Mutating a `Date` | `setXxx` mutates in place → aliasing bugs | (a reason to prefer immutable wrappers) |
| Mixing `new Date()` with a date library | Two paradigms with different parsing, mutability, and timezone rules | The core case: `noNewDate` / `noNewDateWithArgs` |

---

## 1. String parsing is unreliable

This is the strongest and most concrete reason. Strings that look like the same
date parse differently depending on their format — and on the JavaScript engine.

```js
// In a KST (+09:00) environment:
new Date("2021-01-01")        // date-only form → parsed as UTC midnight → 2021-01-01 09:00 KST
new Date("2021/01/01")        // → parsed as local midnight → 2021-01-01 00:00 KST
new Date("2021-01-01 00:00")  // → parsed as local midnight
```

Date-only strings (`YYYY-MM-DD`) are interpreted as **UTC**, while slash-separated
or space-separated forms are interpreted as **local time** — so results can be off
by a day. Non-ISO formats (`"Jan 1 2021"`, `"1-1-2021"`) are **implementation-defined**:
they may return different values across runtimes or produce `Invalid Date`. MDN
itself discourages parsing strings with the `Date` constructor.

**In this plugin:** `new Date(string)` and `Date.parse()` are flagged with the
`unreliableParsing` message. This applies even when a native-Date library like
**date-fns** is imported (see the `nativeLibs` option) — because the parsing risk
is the same regardless of which library you use. The suggested fix is an explicit
parser such as `parseISO()`.

---

## 2. `new Date()` reads the system clock

Called with no arguments, `new Date()` returns "now" by reading the system clock.
That makes it a **side effect**: any function using it becomes non-deterministic.

```js
function isExpired(token) {
  return token.expiresAt < new Date(); // depends on "now" — cannot be fixed in a test
}
```

Code like this is hard to test (you can't pin "now", leading to flaky
"passes this year, fails next year" tests) and hard to reason about. The usual
fix is to **inject the clock** instead of reaching for the global one:

```js
function isExpired(token, now) {
  return token.expiresAt < now;
}
```

**In this plugin:** with `banNativeDate` enabled, ad-hoc `new Date()` is flagged
with the `centralizeCreation` message, which suggests centralizing date creation
(e.g. in a clock helper) so it can be mocked in tests.

---

## 3. Month is 0-indexed

The numeric constructor takes a **0-based month**, which routinely surprises people:

```js
new Date(2021, 0, 1)   // January 1, 2021  — 0 means January
new Date(2021, 12, 1)  // January 1, 2022  — month 12 silently overflows into the next year
```

There is no error on overflow; the value just wraps. This is one reason teams
reach for a library, where month handling is explicit.

---

## 4. `Date` objects are mutable

A `Date` is mutable, and its `setXxx` methods change it in place. Sharing a
reference then leads to aliasing bugs:

```js
const today = new Date();
const nextWeek = today;
nextWeek.setDate(today.getDate() + 7); // today is mutated too — they are the same object
```

Wrapper libraries (dayjs, Luxon) return **new immutable objects** instead, which
avoids this class of bug. (moment objects are mutable, which is part of why it is
in maintenance mode.)

---

## The real takeaway: consistency, not condemnation

Notice that reasons 1–4 are about *specific misuses* and *API design traps* — not
about the `Date` object being worthless. And the popular libraries all sit on top
of native `Date` internally:

- **date-fns** — pure functions that take and return native `Date`.
- **dayjs**, **moment** — wrap a native `Date` instance.
- **Luxon** — wraps native `Date` and delegates formatting/timezones to `Intl`.

So "don't use `new Date()`" inside a codebase that uses one of these libraries
really means: **don't mix paradigms.** If you use `dayjs` but drop a raw
`new Date()` in the middle, you now have two objects with different parsing rules,
different mutability, and different timezone handling — which is exactly where
consistency bugs come from. That is the concern this plugin's name
(`date-consistency`) is built around.

---

## How this maps to the rules

The `no-new-date-with-lib` rule treats libraries differently based on how they
relate to native `Date`:

| Situation | What is flagged |
|-----------|-----------------|
| A **wrapper library** is imported (dayjs, moment, luxon) | Every `new Date()` — use the library's own constructor (`dayjs()`, `moment()`, `DateTime.now()`) instead |
| A **native-Date library** is imported (date-fns) | Only unreliable string parsing (`new Date(string)`, `Date.parse()`); bare `new Date()` is idiomatic and allowed |
| **No library** is imported | Nothing by default; with `banNativeDate` on, `new Date()` is flagged too |

A team that consistently uses only native `Date` is a legitimate user of this
plugin as well — the goal is one consistent approach, not the elimination of `Date`.

---

## Further reading

- [MDN — `Date.parse()` caveats](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
- [TC39 `Temporal`](https://tc39.es/proposal-temporal/docs/) — the standardized API designed to replace `Date`, the one major API that does **not** build on native `Date`
