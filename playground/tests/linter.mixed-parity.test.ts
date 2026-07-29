import { describe, expect, it } from 'vitest';
import { lint } from '../src/utils/linter';
import { MIXED_LIB_FIXTURES } from '../../fixtures/mixed-lib-parity';

// Runs the same fixtures as tests/rules/no-mixed-date-libs.parity.test.ts
// through the playground's lint() wrapper, which lints with the built package
// (dist/) via eslint/universal — catching a broken build or wiring that the
// source-level rule tests can't see.
//
// The playground runs every rule at once, so messages are filtered to this
// rule's id — other rules (e.g. no-deprecated-date-lib on a `moment` import)
// are covered by their own suites.
describe('linter — no-mixed-date-libs parity fixtures', () => {
  for (const fixture of MIXED_LIB_FIXTURES) {
    it(fixture.name, () => {
      const messages = lint(fixture.code, fixture.options ?? {}).filter(
        (m) => m.ruleId === 'date-consistency/no-mixed-date-libs',
      );
      expect(messages.map((m) => m.message)).toEqual(fixture.expected);
    });
  }
});
