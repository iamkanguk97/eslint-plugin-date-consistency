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
  allowAsArgument?: boolean;
  checkStaticMethods?: boolean;
  banNativeDate?: boolean;
  deprecated?: string[];
}

const DEFAULT_LIBS = ['dayjs', 'date-fns', 'moment', 'luxon'];
const DEFAULT_DEPRECATED = ['moment'];
const DEFAULT_ALTERNATIVES: Record<string, string> = { moment: 'dayjs or date-fns' };

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
  const allowAsArgument = options.allowAsArgument ?? false;
  const checkStaticMethods = options.checkStaticMethods ?? false;
  const banNativeDate = options.banNativeDate ?? false;
  const deprecated = options.deprecated ?? DEFAULT_DEPRECATED;
  const alternatives = { ...DEFAULT_ALTERNATIVES };

  let detectedLib: string | null = null;

  // Pass 1: collect imports + check deprecated libs
  walk(ast as Node, {
    ImportDeclaration(node) {
      const n = node as unknown as acorn.ImportDeclaration;
      const source = n.source.value as string;
      const pkg = normalizePackageName(source);
      if (detectedLib === null && libs.includes(pkg)) detectedLib = pkg;
      if (deprecated.includes(pkg)) {
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
        if (detectedLib === null && libs.includes(pkg)) detectedLib = pkg;
      }
    },
  });

  // Pass 2: check Date usage (detectedLib is now fully resolved)
  walk(ast as Node, {
    NewExpression(node) {
      const n = node as unknown as acorn.NewExpression;
      if (!detectedLib && !banNativeDate) return;
      if (n.callee.type !== 'Identifier' || (n.callee as acorn.Identifier).name !== 'Date') return;
      if (allowAsArgument && isInsideAnyCall(node)) return;
      messages.push({
        ruleId: 'date-consistency/no-new-date-with-lib',
        message: detectedLib
          ? `'${detectedLib}' is already imported. Use it instead of 'new Date()'.`
          : `Avoid using native 'new Date()'. Use a date library instead (e.g. ${libs.join(', ')}).`,
        severity: 1,
        ...loc(node),
      });
    },
    MemberExpression(node) {
      const n = node as unknown as acorn.MemberExpression;
      if (!checkStaticMethods) return;
      if (!detectedLib && !banNativeDate) return;
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
      messages.push({
        ruleId: 'date-consistency/no-new-date-with-lib',
        message: detectedLib
          ? `'${detectedLib}' is already imported. Use it instead of 'Date.${method}'.`
          : `Avoid using native 'Date.${method}()'. Use a date library instead (e.g. ${libs.join(', ')}).`,
        severity: 1,
        ...loc(node),
      });
    },
  });

  return messages;
}
