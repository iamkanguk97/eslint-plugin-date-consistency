// Deep import instead of the '@typescript-eslint/utils' barrel: the barrel
// re-exports ts-eslint wrappers that require('eslint') (the Node build) at
// runtime, which breaks browser bundling (the playground bundles this plugin
// via eslint/universal) and drags dead weight into every Node load.
import { RuleCreator } from '@typescript-eslint/utils/eslint-utils';

export const createRule = RuleCreator(
  (_name) =>
    `https://github.com/iamkanguk97/eslint-plugin-date-consistency#rules`,
);
