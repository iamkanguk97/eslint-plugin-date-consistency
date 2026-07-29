import { Linter } from 'eslint/universal';
import plugin from 'eslint-plugin-date-consistency';

export interface LintMessage {
  ruleId: string;
  message: string;
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
  severity: 1 | 2;
}

export interface PluginOptions {
  libs?: string[];
  nativeLibs?: string[];
  allowAsArgument?: boolean;
  checkStaticMethods?: boolean;
  banNativeDate?: boolean;
  deprecated?: string[];
  preferred?: string;
}

// The playground runs the real plugin rules in the browser through ESLint's
// bundler-friendly Linter (`eslint/universal`), so results match the published
// package exactly — there is no mirror implementation to keep in sync.
const linter = new Linter();

// Rule schemas declare `additionalProperties: false` and type-check every
// value, so option objects passed to ESLint must only contain the keys the
// user actually set — an explicit `undefined` would fail schema validation.
function compact<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

function verify(
  code: string,
  options: PluginOptions,
  sourceType: 'module' | 'script',
): Linter.LintMessage[] {
  return linter.verify(code, {
    languageOptions: { ecmaVersion: 2022, sourceType },
    // @typescript-eslint/utils' RuleCreator output is structurally stricter
    // than eslint's own Rule.RuleModule type, but is the same shape ESLint
    // uses at runtime (same cast as tests/rules/*.parity.test.ts).
    plugins: {
      'date-consistency': plugin,
    } as unknown as Linter.Config['plugins'],
    rules: {
      'date-consistency/no-new-date-with-lib': [
        'warn',
        compact({
          libs: options.libs,
          nativeLibs: options.nativeLibs,
          allowAsArgument: options.allowAsArgument,
          checkStaticMethods: options.checkStaticMethods,
          banNativeDate: options.banNativeDate,
        }),
      ],
      'date-consistency/no-deprecated-date-lib': [
        'warn',
        compact({ deprecated: options.deprecated }),
      ],
      'date-consistency/no-mixed-date-libs': [
        'warn',
        compact({ libs: options.libs, preferred: options.preferred }),
      ],
    },
  });
}

export function lint(code: string, options: PluginOptions): LintMessage[] {
  // Parse as ESM first and fall back to script for CJS snippets — the same
  // order the previous acorn-based implementation used. A parse error shows
  // up as a single fatal message with a null ruleId, which the filter below
  // drops, so code that fails both parses yields [].
  let messages = verify(code, options, 'module');
  if (messages.some((m) => m.fatal)) {
    messages = verify(code, options, 'script');
  }

  return messages
    .filter((m) => m.ruleId !== null)
    .map((m) => ({
      ruleId: m.ruleId as string,
      message: m.message,
      line: m.line,
      column: m.column,
      endLine: m.endLine,
      endColumn: m.endColumn,
      severity: m.severity === 2 ? 2 : 1,
    }));
}
