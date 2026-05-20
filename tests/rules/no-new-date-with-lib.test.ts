import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noNewDateWithLib } from '../../src/rules/no-new-date-with-lib';

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

ruleTester.run('no-new-date-with-lib', noNewDateWithLib, {
  valid: [
    // 날짜 라이브러리 import 없이 new Date() 사용
    { code: `const d = new Date();` },
    { code: `const d = new Date('2024-01-01');` },

    // libs 목록에 없는 라이브러리 import 후 new Date()
    {
      code: `
        import axios from 'axios';
        const d = new Date();
      `,
    },
    {
      code: `
        import axios from 'axios';
        const d = new Date();
      `,
      options: [{ libs: ['dayjs'] }],
    },

    // type-only import는 허용
    {
      code: `
        import type { Dayjs } from 'dayjs';
        const d = new Date();
      `,
    },

    // instanceof Date — BinaryExpression이라 감지 안 됨
    {
      code: `
        import dayjs from 'dayjs';
        if (value instanceof Date) {}
      `,
    },

    // Date.now() — checkStaticMethods: false (기본값)
    {
      code: `
        import dayjs from 'dayjs';
        const ts = Date.now();
      `,
    },

    // allowAsArgument: true 인 경우 dayjs(new Date()) 허용
    {
      code: `
        import dayjs from 'dayjs';
        const d = dayjs(new Date());
      `,
      options: [{ allowAsArgument: true }],
    },

    // allowAsArgument: true + 멤버 표현식 호출
    {
      code: `
        import dayjs from 'dayjs';
        const d = dayjs.utc(new Date());
      `,
      options: [{ allowAsArgument: true }],
    },

    // ignorePatterns: *.test.ts 파일에서 new Date() 허용
    {
      filename: '/project/src/utils/date.test.ts',
      code: `
        import dayjs from 'dayjs';
        const d = new Date('2024-01-01');
      `,
      options: [{ ignorePatterns: ['**/*.test.ts'] }],
    },

    // ignorePatterns: *.spec.js 파일에서 허용
    {
      filename: '/project/src/utils/date.spec.js',
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      options: [{ ignorePatterns: ['**/*.spec.js'] }],
    },

    // ignorePatterns: __tests__ 디렉토리 내 파일 허용
    {
      filename: '/project/src/__tests__/date.ts',
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      options: [{ ignorePatterns: ['**/__tests__/**'] }],
    },

    // ignorePatterns: 여러 패턴 동시 지정
    {
      filename: '/project/src/utils/date.spec.ts',
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      options: [{ ignorePatterns: ['**/*.test.*', '**/*.spec.*'] }],
    },
  ],

  invalid: [
    // 기본: dayjs import + new Date()
    {
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // named import
    {
      code: `
        import { format } from 'date-fns';
        const d = new Date();
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // 서브패스 import
    {
      code: `
        import { format } from 'date-fns/format';
        const d = new Date();
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // CJS require
    {
      code: `
        const dayjs = require('dayjs');
        const d = new Date();
      `,
      languageOptions: { parserOptions: { sourceType: 'script' } },
      errors: [{ messageId: 'noNewDate' }],
    },

    // new Date(인수 있음)
    {
      code: `
        import dayjs from 'dayjs';
        const d = new Date('2024-01-01');
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // 함수 내부
    {
      code: `
        import dayjs from 'dayjs';
        function getDate() {
          return new Date();
        }
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // dayjs(new Date()) — allowAsArgument: false (기본값)
    {
      code: `
        import dayjs from 'dayjs';
        const d = dayjs(new Date());
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // Date.now() — checkStaticMethods: true
    {
      code: `
        import dayjs from 'dayjs';
        const ts = Date.now();
      `,
      options: [{ checkStaticMethods: true }],
      errors: [{ messageId: 'noStaticDate', data: { detectedLib: 'dayjs', method: 'now' } }],
    },

    // Date.parse() — checkStaticMethods: true
    {
      code: `
        import dayjs from 'dayjs';
        const ts = Date.parse('2024-01-01');
      `,
      options: [{ checkStaticMethods: true }],
      errors: [{ messageId: 'noStaticDate', data: { detectedLib: 'dayjs', method: 'parse' } }],
    },

    // 커스텀 libs 설정
    {
      code: `
        import myDate from 'my-date-lib';
        const d = new Date();
      `,
      options: [{ libs: ['my-date-lib'] }],
      errors: [{ messageId: 'noNewDate' }],
    },

    // luxon
    {
      code: `
        import { DateTime } from 'luxon';
        const d = new Date();
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // ignorePatterns 설정이 있어도 패턴 밖의 파일은 여전히 경고
    {
      filename: '/project/src/utils/date.ts',
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      options: [{ ignorePatterns: ['**/*.test.ts'] }],
      errors: [{ messageId: 'noNewDate' }],
    },

    // banNativeDate: true — 라이브러리 import 없어도 new Date() 금지
    {
      code: `const d = new Date();`,
      options: [{ banNativeDate: true }],
      errors: [{ messageId: 'noNewDateBanned' }],
    },

    // banNativeDate: true — 라이브러리 import 없어도 new Date('...') 금지
    {
      code: `const d = new Date('2024-01-01');`,
      options: [{ banNativeDate: true }],
      errors: [{ messageId: 'noNewDateBanned' }],
    },

    // banNativeDate: true + checkStaticMethods: true — Date.now() 금지
    {
      code: `const ts = Date.now();`,
      options: [{ banNativeDate: true, checkStaticMethods: true }],
      errors: [{ messageId: 'noStaticDateBanned' }],
    },

    // banNativeDate: true + 라이브러리 import 있음 — noNewDate (banned 아님)
    {
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      options: [{ banNativeDate: true }],
      errors: [{ messageId: 'noNewDate' }],
    },
  ],
});
