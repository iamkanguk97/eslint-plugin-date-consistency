import { describe, expect, it } from 'vitest';
import { lint } from '../src/utils/linter';
import { PARITY_FIXTURES } from '../../fixtures/date-lib-parity';

// Runs the same fixtures as tests/rules/no-new-date-with-lib.parity.test.ts
// against the playground's acorn-based mirror, so a change on either side
// that isn't mirrored on the other fails a test instead of silently diverging.
//
// The mirror runs every rule at once, so messages are filtered to this rule's
// id — a fixture that imports two libraries would otherwise also surface a
// no-mixed-date-libs message, which is covered by its own parity suite.
describe('linter — rule parity fixtures', () => {
  for (const fixture of PARITY_FIXTURES) {
    it(fixture.name, () => {
      const messages = lint(fixture.code, fixture.options ?? {}).filter(
        (m) => m.ruleId === 'date-consistency/no-new-date-with-lib',
      );
      expect(messages.map((m) => m.message)).toEqual(fixture.expected);
    });
  }
});
