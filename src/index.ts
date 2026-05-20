import { noDeprecatedDateLib } from './rules/no-deprecated-date-lib';
import { noNewDateWithLib } from './rules/no-new-date-with-lib';

const plugin = {
  meta: {
    name: 'eslint-plugin-date-consistency',
    version: '1.0.4',
  },
  rules: {
    'no-new-date-with-lib': noNewDateWithLib,
    'no-deprecated-date-lib': noDeprecatedDateLib,
  },
  configs: {} as Record<string, unknown>,
};

plugin.configs = {
  recommended: {
    plugins: { 'date-consistency': plugin },
    rules: {
      'date-consistency/no-new-date-with-lib': 'warn',
      'date-consistency/no-deprecated-date-lib': 'warn',
    },
  },
};

export = plugin;
