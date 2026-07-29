import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import { noNewDateWithLib } from '../../src/rules/no-new-date-with-lib';
import { PARITY_FIXTURES } from '../../fixtures/date-lib-parity';

// Runs the shared fixtures against the rule from source with ESLint's Linter
// (espree parser), locking the exact message text. The playground suite
// (playground/tests/linter.parity.test.ts) runs the same fixtures against
// the built package, so the two catch different failure modes.
describe('no-new-date-with-lib — playground parity fixtures', () => {
  const linter = new Linter();

  for (const fixture of PARITY_FIXTURES) {
    it(fixture.name, () => {
      const messages = linter.verify(fixture.code, {
        languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
        // @typescript-eslint/utils' RuleCreator output is structurally
        // stricter than eslint's own Rule.RuleModule type, but is the same
        // shape ESLint uses at runtime (see src/index.ts).
        plugins: {
          'date-consistency': { rules: { 'no-new-date-with-lib': noNewDateWithLib } },
        } as unknown as Linter.Config['plugins'],
        rules: {
          'date-consistency/no-new-date-with-lib': ['warn', fixture.options ?? {}],
        },
      });

      expect(messages.map((m) => m.message)).toEqual(fixture.expected);
    });
  }
});
