import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import { noMixedDateLibs } from '../../src/rules/no-mixed-date-libs';
import { MIXED_LIB_FIXTURES } from '../../fixtures/mixed-lib-parity';

// Runs the shared fixtures against the rule from source with ESLint's Linter
// (espree parser), locking the exact message text. The playground suite
// (playground/tests/linter.mixed-parity.test.ts) runs the same fixtures
// against the built package, so the two catch different failure modes.
describe('no-mixed-date-libs — playground parity fixtures', () => {
  const linter = new Linter();

  for (const fixture of MIXED_LIB_FIXTURES) {
    it(fixture.name, () => {
      const messages = linter.verify(fixture.code, {
        languageOptions: { ecmaVersion: 2020, sourceType: 'module' },
        // @typescript-eslint/utils' RuleCreator output is structurally
        // stricter than eslint's own Rule.RuleModule type, but is the same
        // shape ESLint uses at runtime (see src/index.ts).
        plugins: {
          'date-consistency': { rules: { 'no-mixed-date-libs': noMixedDateLibs } },
        } as unknown as Linter.Config['plugins'],
        rules: {
          'date-consistency/no-mixed-date-libs': ['warn', fixture.options ?? {}],
        },
      });

      expect(messages.map((m) => m.message)).toEqual(fixture.expected);
    });
  }
});
