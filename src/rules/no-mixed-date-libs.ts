import { TSESTree } from '@typescript-eslint/utils';
import { createRule } from '../utils/create-rule';
import {
  DEFAULT_DATE_LIBS,
  getRequireSource,
  isTypeOnlyImport,
  normalizePackageName,
} from '../utils/matchers';

type Options = [
  {
    libs?: string[];
    preferred?: string;
  }?,
];

type MessageIds = 'mixedLibs' | 'nonPreferredLib';

export const noMixedDateLibs = createRule<Options, MessageIds>({
  name: 'no-mixed-date-libs',
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce a single date library — disallow importing more than one date library in the same file',
    },
    messages: {
      mixedLibs:
        "'{{lib}}' is mixed with '{{chosen}}' in the same file. Stick to a single date library for consistency.",
      nonPreferredLib:
        "'{{lib}}' is not the preferred date library ('{{preferred}}'). Use '{{preferred}}' consistently.",
    },
    schema: [
      {
        type: 'object',
        properties: {
          libs: {
            type: 'array',
            items: { type: 'string' },
            description: 'Date libraries treated as mutually exclusive',
          },
          preferred: {
            type: 'string',
            description:
              'The single allowed date library; any other library in `libs` is flagged wherever it is imported',
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
    const preferred = options.preferred;

    // The first watched date library seen in the file (source order) becomes
    // the "chosen" one; any later, different library is the inconsistency.
    // Only used when `preferred` is not set.
    let chosenLib: string | null = null;
    // Report each conflicting package at most once per file, at its first
    // import site, to avoid noise from repeated / subpath imports.
    const reported = new Set<string>();

    function checkSource(source: string, reportNode: TSESTree.Node): void {
      const pkg = normalizePackageName(source);
      if (!libs.includes(pkg)) return;

      if (preferred != null) {
        if (pkg === preferred) return;
        if (reported.has(pkg)) return;
        reported.add(pkg);
        context.report({
          node: reportNode,
          messageId: 'nonPreferredLib',
          data: { lib: pkg, preferred },
        });
        return;
      }

      if (chosenLib === null) {
        chosenLib = pkg;
        return;
      }
      if (pkg === chosenLib) return;
      if (reported.has(pkg)) return;
      reported.add(pkg);
      context.report({
        node: reportNode,
        messageId: 'mixedLibs',
        data: { lib: pkg, chosen: chosenLib },
      });
    }

    return {
      ImportDeclaration(node) {
        if (isTypeOnlyImport(node)) return;
        checkSource(node.source.value, node);
      },

      CallExpression(node) {
        const source = getRequireSource(node);
        if (source !== null) checkSource(source, node);
      },
    };
  },
});
