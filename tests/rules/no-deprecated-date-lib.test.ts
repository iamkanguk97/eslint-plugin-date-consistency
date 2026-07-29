import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noDeprecatedDateLib } from '../../src/rules/no-deprecated-date-lib';

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
    },
  },
});

ruleTester.run('no-deprecated-date-lib', noDeprecatedDateLib, {
  valid: [
    // 비deprecated 라이브러리는 허용
    { code: `import dayjs from 'dayjs';` },
    { code: `import { format } from 'date-fns';` },
    { code: `import { DateTime } from 'luxon';` },

    // type-only import는 허용
    { code: `import type { Moment } from 'moment';` },

    // 인라인 type-only specifier도 런타임 import가 아니므로 허용
    // (선언 자체의 importKind는 'value'로 남는다)
    { code: `import { type Moment } from 'moment';` },

    // 커스텀 deprecated 목록 — moment가 목록에 없으면 허용
    {
      code: `import moment from 'moment';`,
      options: [{ deprecated: ['old-date-lib'] }],
    },
  ],

  invalid: [
    // 기본: moment는 deprecated
    {
      code: `import moment from 'moment';`,
      errors: [{ messageId: 'deprecatedLib', data: { lib: 'moment', alternative: 'dayjs or date-fns' } }],
    },

    // named import도 동일하게 감지
    {
      code: `import { utc } from 'moment';`,
      errors: [{ messageId: 'deprecatedLib', data: { lib: 'moment', alternative: 'dayjs or date-fns' } }],
    },

    // 인라인 type과 value가 섞인 import는 런타임 import이므로 감지
    {
      code: `import { type Moment, utc } from 'moment';`,
      errors: [{ messageId: 'deprecatedLib', data: { lib: 'moment', alternative: 'dayjs or date-fns' } }],
    },

    // 서브패스 import
    {
      code: `import moment from 'moment/moment';`,
      errors: [{ messageId: 'deprecatedLib', data: { lib: 'moment', alternative: 'dayjs or date-fns' } }],
    },

    // CJS require
    {
      code: `const moment = require('moment');`,
      languageOptions: { parserOptions: { sourceType: 'script' } },
      errors: [{ messageId: 'deprecatedLib', data: { lib: 'moment', alternative: 'dayjs or date-fns' } }],
    },

    // 커스텀 deprecated 목록 — 대안 없음
    {
      code: `import oldDate from 'old-date-lib';`,
      options: [{ deprecated: ['old-date-lib'], alternatives: {} }],
      errors: [{ messageId: 'deprecatedLibNoAlt', data: { lib: 'old-date-lib' } }],
    },

    // 커스텀 alternatives — moment에 다른 대안 지정
    {
      code: `import moment from 'moment';`,
      options: [{ alternatives: { moment: 'luxon' } }],
      errors: [{ messageId: 'deprecatedLib', data: { lib: 'moment', alternative: 'luxon' } }],
    },
  ],
});
