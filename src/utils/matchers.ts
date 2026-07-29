import { TSESTree } from '@typescript-eslint/utils';

// Date libraries watched by default, shared by every rule that accepts a
// `libs` option.
export const DEFAULT_DATE_LIBS = ['dayjs', 'date-fns', 'moment', 'luxon'];

export function normalizePackageName(source: string): string {
  if (source.startsWith('@')) {
    const parts = source.split('/');
    return parts.slice(0, 2).join('/');
  }
  return source.split('/')[0];
}

export function isDateLibImport(source: string, libs: string[]): boolean {
  return libs.includes(normalizePackageName(source));
}

// Returns the module source of a static `require('...')` call, or null for
// any other call (including dynamic requires, whose source is unknowable).
export function getRequireSource(node: TSESTree.CallExpression): string | null {
  if (
    node.callee.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments.length === 1 &&
    node.arguments[0].type === 'Literal' &&
    typeof node.arguments[0].value === 'string'
  ) {
    return node.arguments[0].value;
  }
  return null;
}

// A declaration is type-only either at the declaration level
// (`import type { X } from '...'`) or when every named specifier is an inline
// type import (`import { type X } from '...'`) — the latter leaves the
// declaration's own importKind as 'value'. Both forms are erased at compile
// time, so they add no runtime dependency on the library. A default/namespace
// binding or a bare side-effect import (`import '...'`) is a real runtime
// import and must not be skipped.
export function isTypeOnlyImport(node: TSESTree.ImportDeclaration): boolean {
  if (node.importKind === 'type') return true;
  return (
    node.specifiers.length > 0 &&
    node.specifiers.every(
      (specifier) =>
        specifier.type === 'ImportSpecifier' &&
        specifier.importKind === 'type',
    )
  );
}
