import { TSESTree } from '@typescript-eslint/utils';
import { minimatch } from 'minimatch';
import { createRule } from '../utils/create-rule';
import { isDateLibImport, normalizePackageName } from '../utils/matchers';

const DEFAULT_DATE_LIBS = ['dayjs', 'date-fns', 'moment', 'luxon'];

// Wrapper libraries replace native Date with their own object, so any
// new Date() is an inconsistency. The map value is the concrete
// replacement shown in the warning message.
const WRAPPER_REPLACEMENTS: Record<string, string> = {
  dayjs: "'dayjs()'",
  moment: "'moment()'",
  luxon: "'DateTime.now()'",
};

// Native-Date libraries operate on native Date objects (input and output),
// so creating a Date is idiomatic. Only unreliable string parsing
// (new Date(string) / Date.parse()) is flagged for them by default.
// Overridable per-project via the `nativeLibs` option.
const DATE_NATIVE_LIBS = ['date-fns'];
const PARSE_ALTERNATIVES: Record<string, string> = {
  'date-fns': "'parseISO()' from date-fns",
};

const STATIC_METHODS = ['now', 'parse', 'UTC'];

type Options = [
  {
    libs?: string[];
    nativeLibs?: string[];
    allowAsArgument?: boolean;
    checkStaticMethods?: boolean;
    ignorePatterns?: string[];
    banNativeDate?: boolean;
  }?,
];

type MessageIds =
  | 'noNewDate'
  | 'noNewDateWithArgs'
  | 'noNewDateBanned'
  | 'noStaticDate'
  | 'noStaticDateWithArgs'
  | 'noStaticDateBanned'
  | 'unreliableParsing'
  | 'centralizeCreation';

export const noNewDateWithLib = createRule<Options, MessageIds>({
  name: 'no-new-date-with-lib',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow using new Date() when a date library is imported in the same file',
    },
    messages: {
      noNewDate:
        "'{{detectedLib}}' is already imported. Use {{replacement}} instead of 'new Date()'.",
      noNewDateWithArgs:
        "'{{detectedLib}}' is already imported. Replace 'new Date(...)' with an equivalent {{detectedLib}} call that preserves the same arguments.",
      noNewDateBanned:
        "Avoid using native 'new Date()'. Use a date library instead (e.g. {{libs}}).",
      noStaticDate:
        "'{{detectedLib}}' is already imported. Use {{replacement}} instead of 'Date.{{method}}'.",
      noStaticDateWithArgs:
        "'{{detectedLib}}' is already imported. Replace 'Date.{{method}}(...)' with an equivalent {{detectedLib}} call that preserves the same arguments.",
      noStaticDateBanned:
        "Avoid using native 'Date.{{method}}()'. Use a date library instead (e.g. {{libs}}).",
      unreliableParsing:
        'Parsing date strings with {{construct}} is unreliable across engines. Use {{alternative}} instead.',
      centralizeCreation:
        "Avoid ad-hoc '{{construct}}'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          libs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Date libraries to watch for',
          },
          nativeLibs: {
            type: 'array',
            items: { type: 'string' },
            description:
              'Libraries in `libs` that operate on native Date objects (input and output), so creating a Date is idiomatic for them (e.g. date-fns). Only unreliable string parsing is flagged for these libraries by default',
          },
          allowAsArgument: {
            type: 'boolean',
            description: 'Allow new Date() when passed as an argument to a date library call',
          },
          checkStaticMethods: {
            type: 'boolean',
            description:
              'Also check Date.now() and Date.UTC(). For native-Date libraries (see `nativeLibs`), Date.parse() is always checked regardless of this option, since it carries the same risk as new Date(string)',
          },
          ignorePatterns: {
            type: 'array',
            items: { type: 'string' },
            description: 'Glob patterns for files where new Date() is allowed (e.g. test files)',
          },
          banNativeDate: {
            type: 'boolean',
            description: 'Forbid new Date() even when no date library is imported',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context) {
    const options = context.options[0] ?? {};
    const libs = options.libs ?? DEFAULT_DATE_LIBS;
    const nativeLibs = options.nativeLibs ?? DATE_NATIVE_LIBS;
    const allowAsArgument = options.allowAsArgument ?? false;
    const checkStaticMethods = options.checkStaticMethods ?? false;
    const ignorePatterns = options.ignorePatterns ?? [];
    const banNativeDate = options.banNativeDate ?? false;

    const filename = context.filename;
    if (
      ignorePatterns.length > 0 &&
      ignorePatterns.some((pattern) => minimatch(filename, pattern, { matchBase: true }))
    ) {
      return {};
    }

    // A wrapper lib takes precedence over a native-Date lib when both are
    // imported: the wrapper's own object makes new Date() an inconsistency.
    let detectedWrapperLib: string | null = null;
    let detectedNativeLib: string | null = null;

    function checkImportSource(source: string): void {
      if (!isDateLibImport(source, libs)) return;
      const pkg = normalizePackageName(source);
      if (nativeLibs.includes(pkg)) {
        detectedNativeLib ??= pkg;
      } else {
        detectedWrapperLib ??= pkg;
      }
    }

    function wrapperReplacement(lib: string): string {
      return WRAPPER_REPLACEMENTS[lib] ?? 'it';
    }

    function parseAlternative(lib: string): string {
      return PARSE_ALTERNATIVES[lib] ?? 'a dedicated parsing function';
    }

    // Only a single string/template-literal argument is a parse call
    // (new Date(string)); with more arguments, the first one is a numeric
    // date component (new Date(year, month, ...)), not a parsed string.
    function isUnreliableParseCall(args: readonly TSESTree.CallExpressionArgument[]): boolean {
      if (args.length !== 1) return false;
      const [arg] = args;
      if (arg.type === 'Literal') return typeof arg.value === 'string';
      return arg.type === 'TemplateLiteral';
    }

    // Returns true when node is passed as an argument to any function call.
    // Used by allowAsArgument to permit new Date() inside calls like dayjs(new Date()).
    function isInsideAnyFunctionCall(node: TSESTree.Node): boolean {
      const parent = node.parent;
      if (
        parent?.type === 'CallExpression' &&
        parent.arguments.some((arg) => arg === node)
      ) {
        const callee = parent.callee;
        if (callee.type === 'Identifier') return true;
        if (callee.type === 'MemberExpression') return true;
      }
      return false;
    }

    return {
      ImportDeclaration(node) {
        if (node.importKind === 'type') return;
        checkImportSource(node.source.value);
      },

      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          checkImportSource(node.arguments[0].value);
        }
      },

      NewExpression(node) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Date') return;
        if (allowAsArgument && isInsideAnyFunctionCall(node)) return;

        if (detectedWrapperLib !== null) {
          if (node.arguments.length === 0) {
            context.report({
              node,
              messageId: 'noNewDate',
              data: {
                detectedLib: detectedWrapperLib,
                replacement: wrapperReplacement(detectedWrapperLib),
              },
            });
          } else {
            context.report({
              node,
              messageId: 'noNewDateWithArgs',
              data: { detectedLib: detectedWrapperLib },
            });
          }
          return;
        }

        if (detectedNativeLib !== null) {
          if (isUnreliableParseCall(node.arguments)) {
            context.report({
              node,
              messageId: 'unreliableParsing',
              data: {
                construct: 'new Date(string)',
                alternative: parseAlternative(detectedNativeLib),
              },
            });
          } else if (banNativeDate) {
            context.report({
              node,
              messageId: 'centralizeCreation',
              data: { construct: 'new Date()' },
            });
          }
          return;
        }

        if (banNativeDate) {
          context.report({ node, messageId: 'noNewDateBanned', data: { libs: libs.join(', ') } });
        }
      },

      MemberExpression(node) {
        if (
          node.object.type !== 'Identifier' ||
          node.object.name !== 'Date' ||
          node.property.type !== 'Identifier' ||
          !STATIC_METHODS.includes(node.property.name) ||
          node.parent?.type !== 'CallExpression' ||
          node.parent.callee !== node
        ) {
          return;
        }
        if (allowAsArgument && isInsideAnyFunctionCall(node.parent)) return;

        const method = node.property.name;
        const callArgs = node.parent.arguments;

        if (detectedWrapperLib !== null) {
          if (!checkStaticMethods) return;
          if (callArgs.length === 0) {
            context.report({
              node,
              messageId: 'noStaticDate',
              data: {
                detectedLib: detectedWrapperLib,
                method,
                replacement: wrapperReplacement(detectedWrapperLib),
              },
            });
          } else {
            context.report({
              node,
              messageId: 'noStaticDateWithArgs',
              data: { detectedLib: detectedWrapperLib, method },
            });
          }
          return;
        }

        if (detectedNativeLib !== null) {
          // Date.parse() is a string-parsing trap, so — like new Date(string)
          // — it is flagged regardless of checkStaticMethods. Date.now()/UTC()
          // are idiomatic bare creation for native-Date libs (like new Date()
          // itself) and are only flagged when checkStaticMethods opts into
          // inspecting static methods at all AND banNativeDate forbids
          // ad-hoc creation.
          if (method === 'parse') {
            context.report({
              node,
              messageId: 'unreliableParsing',
              data: {
                construct: 'Date.parse()',
                alternative: parseAlternative(detectedNativeLib),
              },
            });
          } else if (banNativeDate && checkStaticMethods) {
            context.report({
              node,
              messageId: 'centralizeCreation',
              data: { construct: `Date.${method}()` },
            });
          }
          return;
        }

        if (banNativeDate && checkStaticMethods) {
          context.report({
            node,
            messageId: 'noStaticDateBanned',
            data: { libs: libs.join(', '), method },
          });
        }
      },
    };
  },
});
