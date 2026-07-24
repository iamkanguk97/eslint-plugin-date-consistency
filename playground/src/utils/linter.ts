import * as acorn from 'acorn';

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

const DEFAULT_LIBS = ['dayjs', 'date-fns', 'moment', 'luxon'];
const DEFAULT_DEPRECATED = ['moment'];
const DEFAULT_ALTERNATIVES: Record<string, string> = { moment: 'dayjs or date-fns' };

// Mirror of src/rules/no-new-date-with-lib.ts — keep in sync.
const WRAPPER_REPLACEMENTS: Record<string, string> = {
  dayjs: "'dayjs()'",
  moment: "'moment()'",
  luxon: "'DateTime.now()'",
};
const DATE_NATIVE_LIBS = ['date-fns']; // default; overridable via PluginOptions.nativeLibs
const PARSE_ALTERNATIVES: Record<string, string> = {
  'date-fns': "'parseISO()' from date-fns",
};

function wrapperReplacement(lib: string): string {
  return WRAPPER_REPLACEMENTS[lib] ?? 'it';
}

function parseAlternative(lib: string): string {
  return PARSE_ALTERNATIVES[lib] ?? 'a dedicated parsing function';
}

function normalizePackageName(source: string): string {
  if (source.startsWith('@')) return source.split('/').slice(0, 2).join('/');
  return source.split('/')[0]!;
}

type Node = acorn.AnyNode & { parent?: Node };

function walk(node: Node, visitors: Partial<Record<string, (n: Node) => void>>) {
  if (!node || typeof node !== 'object') return;
  visitors[node.type]?.(node);
  for (const key of Object.keys(node)) {
    if (key === 'parent') continue;
    const child = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(child)) {
      for (const item of child) {
        if (item && typeof item === 'object' && typeof (item as Node).type === 'string') {
          (item as Node).parent = node;
          walk(item as Node, visitors);
        }
      }
    } else if (child && typeof child === 'object' && typeof (child as Node).type === 'string') {
      (child as Node).parent = node;
      walk(child as Node, visitors);
    }
  }
}

function isInsideAnyCall(node: Node): boolean {
  const p = node.parent;
  if (!p || p.type !== 'CallExpression') return false;
  return (p as acorn.CallExpression).arguments.some((a) => a === (node as acorn.AnyNode));
}

function loc(node: Node) {
  const n = node as { loc?: { start: { line: number; column: number }; end: { line: number; column: number } } };
  return {
    line: n.loc?.start.line ?? 1,
    column: (n.loc?.start.column ?? 0) + 1,
    endLine: n.loc?.end.line,
    endColumn: n.loc?.end.column != null ? n.loc.end.column + 1 : undefined,
  };
}

export function lint(code: string, options: PluginOptions): LintMessage[] {
  const messages: LintMessage[] = [];

  let ast: acorn.Program;
  try {
    ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'module', locations: true });
  } catch {
    try {
      ast = acorn.parse(code, { ecmaVersion: 2022, sourceType: 'script', locations: true });
    } catch {
      return [];
    }
  }

  const libs = options.libs ?? DEFAULT_LIBS;
  const nativeLibs = options.nativeLibs ?? DATE_NATIVE_LIBS;
  const allowAsArgument = options.allowAsArgument ?? false;
  const checkStaticMethods = options.checkStaticMethods ?? false;
  const banNativeDate = options.banNativeDate ?? false;
  const deprecated = options.deprecated ?? DEFAULT_DEPRECATED;
  const alternatives = { ...DEFAULT_ALTERNATIVES };
  const preferred = options.preferred;

  // A wrapper lib takes precedence over a native-Date lib when both are
  // imported — mirrors the real rule.
  let detectedWrapperLib: string | null = null;
  let detectedNativeLib: string | null = null;

  function registerLib(pkg: string): void {
    if (!libs.includes(pkg)) return;
    if (nativeLibs.includes(pkg)) {
      detectedNativeLib ??= pkg;
    } else {
      detectedWrapperLib ??= pkg;
    }
  }

  // Mirror of no-deprecated-date-lib's checkSource — flags a deprecated lib
  // imported via either `import` or `require()`. (The require path used to be
  // missed here, so require('moment') diverged from the real rule.)
  function checkDeprecated(pkg: string, node: Node): void {
    if (!deprecated.includes(pkg)) return;
    const alt = alternatives[pkg] ?? null;
    messages.push({
      ruleId: 'date-consistency/no-deprecated-date-lib',
      message: alt
        ? `'${pkg}' is in maintenance mode. Consider migrating to ${alt}.`
        : `'${pkg}' is in maintenance mode. Consider using an actively maintained date library.`,
      severity: 1,
      ...loc(node),
    });
  }

  // Mirror of no-mixed-date-libs — flags a file that imports more than one
  // date library, or (with `preferred` set) any library other than the
  // preferred one. The first watched library seen becomes the "chosen" one;
  // each conflicting package is reported once, at its first import site.
  let chosenLib: string | null = null;
  const reportedMixed = new Set<string>();

  function checkMixed(pkg: string, node: Node): void {
    if (!libs.includes(pkg)) return;

    if (preferred != null) {
      if (pkg === preferred) return;
      if (reportedMixed.has(pkg)) return;
      reportedMixed.add(pkg);
      messages.push({
        ruleId: 'date-consistency/no-mixed-date-libs',
        message: `'${pkg}' is not the preferred date library ('${preferred}'). Use '${preferred}' consistently.`,
        severity: 1,
        ...loc(node),
      });
      return;
    }

    if (chosenLib === null) {
      chosenLib = pkg;
      return;
    }
    if (pkg === chosenLib) return;
    if (reportedMixed.has(pkg)) return;
    reportedMixed.add(pkg);
    messages.push({
      ruleId: 'date-consistency/no-mixed-date-libs',
      message: `'${pkg}' is mixed with '${chosenLib}' in the same file. Stick to a single date library for consistency.`,
      severity: 1,
      ...loc(node),
    });
  }

  // Pass 1: collect imports + check deprecated / mixed libs
  walk(ast as Node, {
    ImportDeclaration(node) {
      const n = node as unknown as acorn.ImportDeclaration;
      const source = n.source.value as string;
      const pkg = normalizePackageName(source);
      registerLib(pkg);
      checkDeprecated(pkg, node);
      checkMixed(pkg, node);
    },
    CallExpression(node) {
      const n = node as unknown as acorn.CallExpression;
      if (
        n.callee.type === 'Identifier' &&
        (n.callee as acorn.Identifier).name === 'require' &&
        n.arguments.length === 1 &&
        n.arguments[0].type === 'Literal' &&
        typeof (n.arguments[0] as acorn.Literal).value === 'string'
      ) {
        const source = (n.arguments[0] as acorn.Literal).value as string;
        const pkg = normalizePackageName(source);
        registerLib(pkg);
        checkDeprecated(pkg, node);
        checkMixed(pkg, node);
      }
    },
  });

  // Only a single string/template-literal argument is a parse call
  // (new Date(string)); with more arguments, the first one is a numeric
  // date component (new Date(year, month, ...)), not a parsed string.
  function isUnreliableParseCall(args: (acorn.Expression | acorn.SpreadElement)[]): boolean {
    if (args.length !== 1) return false;
    const [arg] = args;
    if (arg.type === 'Literal') return typeof (arg as acorn.Literal).value === 'string';
    return arg.type === 'TemplateLiteral';
  }

  function report(node: Node, message: string): void {
    messages.push({
      ruleId: 'date-consistency/no-new-date-with-lib',
      message,
      severity: 1,
      ...loc(node),
    });
  }

  // Pass 2: check Date usage (detected libs are now fully resolved)
  walk(ast as Node, {
    NewExpression(node) {
      const n = node as unknown as acorn.NewExpression;
      if (n.callee.type !== 'Identifier' || (n.callee as acorn.Identifier).name !== 'Date') return;
      if (allowAsArgument && isInsideAnyCall(node)) return;

      if (detectedWrapperLib) {
        if (n.arguments.length === 0) {
          report(
            node,
            `'${detectedWrapperLib}' is already imported. Use ${wrapperReplacement(detectedWrapperLib)} instead of 'new Date()'.`,
          );
        } else {
          report(
            node,
            `'${detectedWrapperLib}' is already imported. Replace 'new Date(...)' with an equivalent ${detectedWrapperLib} call that preserves the same arguments.`,
          );
        }
        return;
      }

      if (detectedNativeLib) {
        if (isUnreliableParseCall(n.arguments)) {
          report(
            node,
            `Parsing date strings with new Date(string) is unreliable across engines. Use ${parseAlternative(detectedNativeLib)} instead.`,
          );
        } else if (banNativeDate) {
          report(
            node,
            "Avoid ad-hoc 'new Date()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.",
          );
        }
        return;
      }

      if (banNativeDate) {
        report(
          node,
          `Avoid using native 'new Date()'. Use a date library instead (e.g. ${libs.join(', ')}).`,
        );
      }
    },
    MemberExpression(node) {
      const n = node as unknown as acorn.MemberExpression;
      if (
        n.object.type !== 'Identifier' ||
        (n.object as acorn.Identifier).name !== 'Date' ||
        n.property.type !== 'Identifier' ||
        !['now', 'parse', 'UTC'].includes((n.property as acorn.Identifier).name) ||
        node.parent?.type !== 'CallExpression' ||
        (node.parent as unknown as acorn.CallExpression).callee !== (node as unknown as acorn.AnyNode)
      ) return;
      if (allowAsArgument && node.parent && isInsideAnyCall(node.parent)) return;
      const method = (n.property as acorn.Identifier).name;
      const callArgs = (node.parent as unknown as acorn.CallExpression).arguments;

      if (detectedWrapperLib) {
        if (!checkStaticMethods) return;
        if (callArgs.length === 0) {
          report(
            node,
            `'${detectedWrapperLib}' is already imported. Use ${wrapperReplacement(detectedWrapperLib)} instead of 'Date.${method}'.`,
          );
        } else {
          report(
            node,
            `'${detectedWrapperLib}' is already imported. Replace 'Date.${method}(...)' with an equivalent ${detectedWrapperLib} call that preserves the same arguments.`,
          );
        }
        return;
      }

      // Date.parse() is a string-parsing trap, so — like new Date(string) —
      // it is flagged regardless of checkStaticMethods. Date.now()/UTC() are
      // idiomatic bare creation for native-Date libs and are only flagged
      // when checkStaticMethods AND banNativeDate are both set.
      if (detectedNativeLib) {
        if (method === 'parse') {
          report(
            node,
            `Parsing date strings with Date.parse() is unreliable across engines. Use ${parseAlternative(detectedNativeLib)} instead.`,
          );
        } else if (banNativeDate && checkStaticMethods) {
          report(
            node,
            `Avoid ad-hoc 'Date.${method}()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.`,
          );
        }
        return;
      }

      if (banNativeDate && checkStaticMethods) {
        report(
          node,
          `Avoid using native 'Date.${method}()'. Use a date library instead (e.g. ${libs.join(', ')}).`,
        );
      }
    },
  });

  return messages;
}
