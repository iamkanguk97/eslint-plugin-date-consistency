import { Linter } from 'eslint';
// Vite handles CJS → ESM interop: `export = plugin` compiles to module.exports, loaded as default.
import plugin from 'eslint-plugin-date-consistency';

export interface PluginOptions {
  libs?: string[];
  allowAsArgument?: boolean;
  checkStaticMethods?: boolean;
  banNativeDate?: boolean;
  ignorePatterns?: string[];
  deprecated?: string[];
}

const linter = new Linter({ configType: 'flat' });

export function lint(code: string, options: PluginOptions): Linter.LintMessage[] {
  const {
    libs,
    allowAsArgument,
    checkStaticMethods,
    banNativeDate,
    ignorePatterns,
    deprecated,
  } = options;

  const noNewDateOpts: Record<string, unknown> = {};
  if (libs !== undefined) noNewDateOpts.libs = libs;
  if (allowAsArgument !== undefined) noNewDateOpts.allowAsArgument = allowAsArgument;
  if (checkStaticMethods !== undefined) noNewDateOpts.checkStaticMethods = checkStaticMethods;
  if (banNativeDate !== undefined) noNewDateOpts.banNativeDate = banNativeDate;
  if (ignorePatterns !== undefined) noNewDateOpts.ignorePatterns = ignorePatterns;

  const noDeprecatedOpts: Record<string, unknown> = {};
  if (deprecated !== undefined) noDeprecatedOpts.deprecated = deprecated;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return linter.verify(code, [{ plugins: { 'date-consistency': plugin as any }, rules: { 'date-consistency/no-new-date-with-lib': ['warn', noNewDateOpts], 'date-consistency/no-deprecated-date-lib': ['warn', noDeprecatedOpts] }, languageOptions: { ecmaVersion: 2022, sourceType: 'module' } }] as any);
}
