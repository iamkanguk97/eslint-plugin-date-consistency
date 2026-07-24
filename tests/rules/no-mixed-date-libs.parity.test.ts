import { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';
import { noMixedDateLibs } from '../../src/rules/no-mixed-date-libs';
import { MIXED_LIB_FIXTURES } from '../../fixtures/mixed-lib-parity';

// Runs the same fixtures as playground/tests/linter.mixed-parity.test.ts
// against the real ESLint rule, so a change on either side that isn't mirrored
// on the other fails a test instead of silently diverging.
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
