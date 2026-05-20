import { ESLintUtils } from '@typescript-eslint/utils';

export const createRule = ESLintUtils.RuleCreator(
  (_name) =>
    `https://github.com/iamkanguk97/eslint-plugin-date-consistency#rules`,
);
