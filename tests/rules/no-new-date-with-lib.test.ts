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

    // 인라인 type-only specifier도 런타임 import가 아니므로 허용
    // (선언 자체의 importKind는 'value'로 남는다)
    {
      code: `
        import { type Dayjs } from 'dayjs';
        const d = new Date();
      `,
    },

    // date-fns는 네이티브 Date 기반 라이브러리 — 인자 없는 new Date()는 관용구
    {
      code: `
        import { format } from 'date-fns';
        const now = new Date();
        const formatted = format(now, 'yyyy-MM-dd');
      `,
    },

    // date-fns + 서브패스 import — 마찬가지로 허용
    {
      code: `
        import { format } from 'date-fns/format';
        const d = new Date();
      `,
    },

    // date-fns + 타임스탬프/연월일 생성자 — 문자열 파싱이 아니므로 허용
    {
      code: `
        import { addDays } from 'date-fns';
        const a = new Date(1720000000000);
        const b = new Date(2024, 0, 1);
      `,
    },

    // date-fns + 다중 인자 생성자의 첫 인자가 문자열이어도 파싱 호출이 아니므로 허용
    // (new Date(year, month, ...) 형태 — new Date(string) 단일 인자 파싱과 다름)
    {
      code: `
        import { addDays } from 'date-fns';
        const d = new Date('2024', 0, 1);
      `,
    },

    // date-fns + Date.now() — checkStaticMethods여도 파싱 함정이 아니므로 허용
    {
      code: `
        import { format } from 'date-fns';
        const ts = Date.now();
      `,
      options: [{ checkStaticMethods: true }],
    },

    // date-fns + allowAsArgument: true — 인수로 전달된 문자열 파싱은 옵션 존중
    {
      code: `
        import { format } from 'date-fns';
        const d = format(new Date('2024-01-01'), 'yyyy-MM-dd');
      `,
      options: [{ allowAsArgument: true }],
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

    // allowAsArgument: true + banNativeDate: true — 함수 인수 안에서는 허용
    {
      code: `someHelper(new Date());`,
      options: [{ banNativeDate: true, allowAsArgument: true }],
    },

    // allowAsArgument: true + checkStaticMethods: true — Date.now()가 인수로 전달되면 허용
    {
      code: `
        import dayjs from 'dayjs';
        const d = dayjs(Date.now());
      `,
      options: [{ checkStaticMethods: true, allowAsArgument: true }],
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

    // nativeLibs: 사용자 정의 native-Date 라이브러리 — 인자 없는 new Date()는 관용구로 허용
    {
      code: `
        import { formatDate } from 'my-native-date-utils';
        const now = new Date();
      `,
      options: [{ libs: ['my-native-date-utils'], nativeLibs: ['my-native-date-utils'] }],
    },
  ],

  invalid: [
    // 기본: dayjs import + new Date() — 구체적 대체 표현 포함
    {
      code: `
        import dayjs from 'dayjs';
        const d = new Date();
      `,
      errors: [
        {
          messageId: 'noNewDate',
          data: { detectedLib: 'dayjs', replacement: "'dayjs()'" },
        },
      ],
    },

    // named import (래퍼 라이브러리)
    {
      code: `
        import { DateTime } from 'luxon';
        const d = new Date();
      `,
      errors: [
        {
          messageId: 'noNewDate',
          data: { detectedLib: 'luxon', replacement: "'DateTime.now()'" },
        },
      ],
    },

    // 인라인 type과 value가 섞인 import는 런타임 import이므로 감지
    {
      code: `
        import { type Dayjs, isDayjs } from 'dayjs';
        const d = new Date();
      `,
      errors: [
        {
          messageId: 'noNewDate',
          data: { detectedLib: 'dayjs', replacement: "'dayjs()'" },
        },
      ],
    },

    // 서브패스 import
    {
      code: `
        import utc from 'dayjs/plugin/utc';
        const d = new Date();
      `,
      errors: [{ messageId: 'noNewDate' }],
    },

    // date-fns + new Date(문자열) — 파싱 함정으로 경고
    {
      code: `
        import { format } from 'date-fns';
        const d = new Date('2024-01-01');
      `,
      errors: [
        {
          messageId: 'unreliableParsing',
          data: {
            construct: 'new Date(string)',
            alternative: "'parseISO()' from date-fns",
          },
        },
      ],
    },

    // date-fns + new Date(템플릿 리터럴) — 문자열 파싱으로 취급
    {
      code: `
        import { format } from 'date-fns';
        const d = new Date(\`2024-01-\${day}\`);
      `,
      errors: [{ messageId: 'unreliableParsing' }],
    },

    // date-fns + Date.parse() — checkStaticMethods 없이도 경고 (new Date(string)와 동일한 파싱 함정)
    {
      code: `
        import { format } from 'date-fns';
        const ts = Date.parse('2024-01-01');
      `,
      errors: [
        {
          messageId: 'unreliableParsing',
          data: {
            construct: 'Date.parse()',
            alternative: "'parseISO()' from date-fns",
          },
        },
      ],
    },

    // date-fns + banNativeDate: true — 인자 없는 new Date()도 중앙화 안내로 경고
    {
      code: `
        import { format } from 'date-fns';
        const now = new Date();
      `,
      options: [{ banNativeDate: true }],
      errors: [
        {
          messageId: 'centralizeCreation',
          data: { construct: 'new Date()' },
        },
      ],
    },

    // date-fns + banNativeDate + checkStaticMethods — Date.now()도 중앙화 안내
    {
      code: `
        import { format } from 'date-fns';
        const ts = Date.now();
      `,
      options: [{ banNativeDate: true, checkStaticMethods: true }],
      errors: [
        {
          messageId: 'centralizeCreation',
          data: { construct: 'Date.now()' },
        },
      ],
    },

    // 래퍼(dayjs)와 date-fns를 함께 import — 래퍼 기준으로 경고 (NewExpression)
    {
      code: `
        import dayjs from 'dayjs';
        import { format } from 'date-fns';
        const d = new Date();
      `,
      errors: [
        {
          messageId: 'noNewDate',
          data: { detectedLib: 'dayjs', replacement: "'dayjs()'" },
        },
      ],
    },

    // 래퍼(dayjs)와 date-fns를 함께 import — 래퍼 기준으로 경고 (MemberExpression, 우선순위 대칭 테스트)
    {
      code: `
        import dayjs from 'dayjs';
        import { format } from 'date-fns';
        const ts = Date.parse('2024-01-01');
      `,
      options: [{ checkStaticMethods: true }],
      errors: [
        {
          messageId: 'noStaticDateWithArgs',
          data: { detectedLib: 'dayjs', method: 'parse' },
        },
      ],
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

    // new Date(인수 있음) — 인자를 무시하는 'dayjs()' 대신 인자 보존 안내
    {
      code: `
        import dayjs from 'dayjs';
        const d = new Date('2024-01-01');
      `,
      errors: [
        {
          messageId: 'noNewDateWithArgs',
          data: { detectedLib: 'dayjs' },
        },
      ],
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
      errors: [
        {
          messageId: 'noStaticDate',
          data: { detectedLib: 'dayjs', method: 'now', replacement: "'dayjs()'" },
        },
      ],
    },

    // Date.parse() — checkStaticMethods: true, 인자가 있으므로 인자 보존 안내
    {
      code: `
        import dayjs from 'dayjs';
        const ts = Date.parse('2024-01-01');
      `,
      options: [{ checkStaticMethods: true }],
      errors: [
        {
          messageId: 'noStaticDateWithArgs',
          data: { detectedLib: 'dayjs', method: 'parse' },
        },
      ],
    },

    // Date.UTC() — checkStaticMethods: true, 인자가 있으므로 인자 보존 안내
    {
      code: `
        import dayjs from 'dayjs';
        const ts = Date.UTC(2024, 0, 1);
      `,
      options: [{ checkStaticMethods: true }],
      errors: [
        {
          messageId: 'noStaticDateWithArgs',
          data: { detectedLib: 'dayjs', method: 'UTC' },
        },
      ],
    },

    // banNativeDate: true + allowAsArgument: true — standalone new Date() is still flagged
    {
      code: `const d = new Date();`,
      options: [{ banNativeDate: true, allowAsArgument: true }],
      errors: [{ messageId: 'noNewDateBanned' }],
    },

    // checkStaticMethods: true + allowAsArgument: true — standalone Date.now() still flagged
    {
      code: `
        import dayjs from 'dayjs';
        const ts = Date.now();
      `,
      options: [{ checkStaticMethods: true, allowAsArgument: true }],
      errors: [
        {
          messageId: 'noStaticDate',
          data: { detectedLib: 'dayjs', method: 'now', replacement: "'dayjs()'" },
        },
      ],
    },

    // 커스텀 libs 설정 — 대체 표현을 모르는 라이브러리는 'it'으로 안내
    {
      code: `
        import myDate from 'my-date-lib';
        const d = new Date();
      `,
      options: [{ libs: ['my-date-lib'] }],
      errors: [
        {
          messageId: 'noNewDate',
          data: { detectedLib: 'my-date-lib', replacement: 'it' },
        },
      ],
    },

    // moment (래퍼)
    {
      code: `
        import moment from 'moment';
        const d = new Date();
      `,
      errors: [
        {
          messageId: 'noNewDate',
          data: { detectedLib: 'moment', replacement: "'moment()'" },
        },
      ],
    },

    // nativeLibs: 사용자 정의 native-Date 라이브러리 — 문자열 파싱은 여전히 경고
    {
      code: `
        import { formatDate } from 'my-native-date-utils';
        const d = new Date('2024-01-01');
      `,
      options: [{ libs: ['my-native-date-utils'], nativeLibs: ['my-native-date-utils'] }],
      errors: [
        {
          messageId: 'unreliableParsing',
          data: {
            construct: 'new Date(string)',
            alternative: 'a dedicated parsing function',
          },
        },
      ],
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
