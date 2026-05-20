import { TSESTree } from '@typescript-eslint/utils';
import { minimatch } from 'minimatch';
import { createRule } from '../utils/create-rule';
import { isDateLibImport, normalizePackageName } from '../utils/matchers';

const DEFAULT_DATE_LIBS = ['dayjs', 'date-fns', 'moment', 'luxon'];

type Options = [
  {
    libs?: string[];
    allowAsArgument?: boolean;
    checkStaticMethods?: boolean;
    ignorePatterns?: string[];
    banNativeDate?: boolean;
  }?,
];

type MessageIds = 'noNewDate' | 'noNewDateBanned' | 'noStaticDate' | 'noStaticDateBanned';

export const noNewDateWithLib = createRule<Options, MessageIds>({
  name: 'no-new-date-with-lib',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow using new Date() when a date library is imported in the same file',
    },
    messages: {
      noNewDate: "'{{detectedLib}}' is already imported. Use it instead of 'new Date()'.",
      noNewDateBanned:
        "Avoid using native 'new Date()'. Use a date library instead (e.g. {{libs}}).",
      noStaticDate:
        "'{{detectedLib}}' is already imported. Use it instead of 'Date.{{method}}'.",
      noStaticDateBanned:
        "Avoid using native 'Date.{{method}}()'. Use a date library instead (e.g. {{libs}}).",
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
          allowAsArgument: {
            type: 'boolean',
            description: 'Allow new Date() when passed as an argument to a date library call',
          },
          checkStaticMethods: {
            type: 'boolean',
            description: 'Also check Date.now() and Date.parse()',
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

    let detectedLib: string | null = null;

    function checkImportSource(source: string): void {
      if (detectedLib === null && isDateLibImport(source, libs)) {
        detectedLib = normalizePackageName(source);
      }
    }

    function isInsideDateLibCall(node: TSESTree.Node): boolean {
      const parent = node.parent;
      if (
        parent?.type === 'CallExpression' &&
        parent.arguments.includes(node as TSESTree.Expression)
      ) {
        const callee = parent.callee;
        // dayjs(new Date()), format(new Date(), ...) 등
        if (callee.type === 'Identifier') return true;
        // dayjs.utc(new Date()) 등 멤버 표현식
        if (callee.type === 'MemberExpression') return true;
      }
      return false;
    }

    return {
      ImportDeclaration(node) {
        // type-only import는 무시
        if (node.importKind === 'type') return;
        checkImportSource(node.source.value);
      },

      CallExpression(node) {
        // require('dayjs') 형태 감지
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
        const hasLib = detectedLib !== null;
        if (!hasLib && !banNativeDate) return;
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'Date') return;

        if (allowAsArgument && hasLib && isInsideDateLibCall(node)) return;

        if (hasLib) {
          context.report({ node, messageId: 'noNewDate', data: { detectedLib: detectedLib! } });
        } else {
          context.report({ node, messageId: 'noNewDateBanned', data: { libs: libs.join(', ') } });
        }
      },

      MemberExpression(node) {
        if (!checkStaticMethods) return;
        const hasLib = detectedLib !== null;
        if (!hasLib && !banNativeDate) return;

        if (
          node.object.type === 'Identifier' &&
          node.object.name === 'Date' &&
          node.property.type === 'Identifier' &&
          ['now', 'parse', 'UTC'].includes(node.property.name) &&
          node.parent?.type === 'CallExpression' &&
          node.parent.callee === node
        ) {
          if (hasLib) {
            context.report({
              node,
              messageId: 'noStaticDate',
              data: { detectedLib: detectedLib!, method: node.property.name },
            });
          } else {
            context.report({
              node,
              messageId: 'noStaticDateBanned',
              data: { libs: libs.join(', '), method: node.property.name },
            });
          }
        }
      },
    };
  },
});
