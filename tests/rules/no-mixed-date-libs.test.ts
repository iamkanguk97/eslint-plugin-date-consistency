import { RuleTester } from '@typescript-eslint/rule-tester';
import { afterAll, describe, it } from 'vitest';
import { noMixedDateLibs } from '../../src/rules/no-mixed-date-libs';

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

ruleTester.run('no-mixed-date-libs', noMixedDateLibs, {
  valid: [
    // 라이브러리 하나만 사용 — 허용
    { code: `import dayjs from 'dayjs';` },
    { code: `import { format } from 'date-fns';` },

    // 같은 라이브러리를 서브패스로 여러 번 import — 혼용 아님
    { code: `import dayjs from 'dayjs';\nimport utc from 'dayjs/plugin/utc';` },

    // 날짜 라이브러리가 아닌 것들은 무시
    { code: `import axios from 'axios';\nimport _ from 'lodash';` },

    // 두 번째가 type-only import이면 값 사용이 아니므로 허용
    {
      code: `import dayjs from 'dayjs';\nimport type { DateTime } from 'luxon';`,
    },

    // 인라인 type-only specifier도 런타임 import가 아니므로 허용
    // (선언 자체의 importKind는 'value'로 남는다)
    {
      code: `import dayjs from 'dayjs';\nimport { type DateTime } from 'luxon';`,
    },

    // 인라인 type-only가 먼저 와도 chosenLib를 오염시키지 않음
    {
      code: `import { type DateTime } from 'luxon';\nimport dayjs from 'dayjs';`,
    },

    // 커스텀 libs 목록 — 목록 밖 라이브러리는 무시 (luxon은 감시 대상 아님)
    {
      code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
      options: [{ libs: ['dayjs'] }],
    },

    // preferred 지정 — 선호 라이브러리만 import하면 허용
    {
      code: `import dayjs from 'dayjs';\nimport utc from 'dayjs/plugin/utc';`,
      options: [{ preferred: 'dayjs' }],
    },
  ],

  invalid: [
    // 래퍼 라이브러리 두 개 — 두 번째가 경고 대상
    {
      code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'luxon', chosen: 'dayjs' } },
      ],
    },

    // 래퍼 + 네이티브 Date 라이브러리도 혼용으로 감지
    {
      code: `import dayjs from 'dayjs';\nimport { format } from 'date-fns';`,
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'date-fns', chosen: 'dayjs' } },
      ],
    },

    // 세 개 — 첫 번째를 기준으로 나머지 둘을 각각 경고 (소스 순서)
    {
      code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';\nimport moment from 'moment';`,
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'luxon', chosen: 'dayjs' } },
        { messageId: 'mixedLibs', data: { lib: 'moment', chosen: 'dayjs' } },
      ],
    },

    // 같은 충돌 라이브러리를 여러 번 import — 첫 import 위치에서 한 번만 경고
    {
      code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';\nimport { Duration } from 'luxon';`,
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'luxon', chosen: 'dayjs' } },
      ],
    },

    // CJS require 혼용도 동일하게 감지
    {
      code: `const dayjs = require('dayjs');\nconst { DateTime } = require('luxon');`,
      languageOptions: { parserOptions: { sourceType: 'script' } },
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'luxon', chosen: 'dayjs' } },
      ],
    },

    // preferred 지정 — 선호 라이브러리와 함께 있어도 비선호 라이브러리는 경고
    {
      code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
      options: [{ preferred: 'dayjs' }],
      errors: [
        {
          messageId: 'nonPreferredLib',
          data: { lib: 'luxon', preferred: 'dayjs' },
        },
      ],
    },

    // preferred 지정 — 선호 라이브러리가 없어도 비선호 라이브러리 단독 import를 경고
    // (파일 단위로 프로젝트 전역 단일 라이브러리를 강제)
    {
      code: `import { DateTime } from 'luxon';`,
      options: [{ preferred: 'dayjs' }],
      errors: [
        {
          messageId: 'nonPreferredLib',
          data: { lib: 'luxon', preferred: 'dayjs' },
        },
      ],
    },

    // 커스텀 libs 목록으로 두 라이브러리 모두 감시
    {
      code: `import dayjs from 'dayjs';\nimport { DateTime } from 'luxon';`,
      options: [{ libs: ['dayjs', 'luxon'] }],
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'luxon', chosen: 'dayjs' } },
      ],
    },

    // 인라인 type과 value가 섞인 import는 런타임 import이므로 혼용으로 감지
    {
      code: `import dayjs from 'dayjs';\nimport { type DateTime, Duration } from 'luxon';`,
      errors: [
        { messageId: 'mixedLibs', data: { lib: 'luxon', chosen: 'dayjs' } },
      ],
    },
  ],
});
