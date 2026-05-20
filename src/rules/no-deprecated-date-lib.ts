import { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import { normalizePackageName } from '../utils/matchers';

const DEFAULT_DEPRECATED = ['moment'];
const DEFAULT_ALTERNATIVES: Record<string, string> = {
  moment: 'dayjs or date-fns',
};

type Options = [
  {
    deprecated?: string[];
    alternatives?: Record<string, string>;
  }?,
];

type MessageIds = 'deprecatedLib' | 'deprecatedLibNoAlt';

export const noDeprecatedDateLib = createRule<Options, MessageIds>({
  name: 'no-deprecated-date-lib',
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow importing deprecated or unmaintained date libraries',
    },
    messages: {
      deprecatedLib:
        "'{{lib}}' is in maintenance mode. Consider migrating to {{alternative}}.",
      deprecatedLibNoAlt:
        "'{{lib}}' is in maintenance mode. Consider using an actively maintained date library.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          deprecated: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of deprecated date libraries to flag',
          },
          alternatives: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Alternative suggestions per deprecated library',
          },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context) {
    const options = context.options[0] ?? {};
    const deprecated = options.deprecated ?? DEFAULT_DEPRECATED;
    const alternatives = { ...DEFAULT_ALTERNATIVES, ...(options.alternatives ?? {}) };

    function checkSource(source: string, reportNode: TSESTree.Node): void {
      const pkg = normalizePackageName(source);
      if (!deprecated.includes(pkg)) return;
      const alternative = alternatives[pkg] ?? null;
      context.report({
        node: reportNode,
        messageId: alternative ? 'deprecatedLib' : 'deprecatedLibNoAlt',
        data: alternative ? { lib: pkg, alternative } : { lib: pkg },
      });
    }

    return {
      ImportDeclaration(node) {
        if (node.importKind === 'type') return;
        checkSource(node.source.value, node);
      },

      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal' &&
          typeof node.arguments[0].value === 'string'
        ) {
          checkSource(node.arguments[0].value, node);
        }
      },
    };
  },
});
