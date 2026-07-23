# eslint-plugin-date-consistency

**Language / 언어:** [English](./README.md) | [한국어](./README.ko.md)

[![npm version](https://img.shields.io/npm/v/eslint-plugin-date-consistency)](https://www.npmjs.com/package/eslint-plugin-date-consistency)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)
[![Playground](https://img.shields.io/badge/온라인으로%20체험-Playground-7c6af7)](https://iamkanguk97.github.io/eslint-plugin-date-consistency/)

날짜 처리의 일관성을 강제하는 ESLint 플러그인 — 날짜 라이브러리를 이미 사용 중인 프로젝트에서 네이티브 `Date` 객체를 실수로 사용하는 경우를 감지하고, Moment.js처럼 더 이상 유지보수되지 않는 라이브러리 사용을 경고합니다.

## Playground

설치 없이 브라우저에서 바로 규칙을 체험해보세요.

**[→ Playground 열기](https://iamkanguk97.github.io/eslint-plugin-date-consistency/)**

- 코드를 입력하면 린트 경고를 실시간으로 확인
- 옵션 토글 (`banNativeDate`, `checkStaticMethods`, `allowAsArgument` 등)
- dayjs, date-fns, moment 등 예제 버튼으로 즉시 로드
- 현재 코드 + 설정을 URL로 공유

자세한 사용법은 [Playground 가이드](./docs/playground.ko.md)를 참고하세요.

---

## 왜 필요한가요?

프로젝트에서 **dayjs**나 **date-fns** 같은 날짜 라이브러리를 도입했더라도, 개발자가 습관적으로 `new Date()`를 사용하는 경우가 있습니다. 이로 인해 두 가지 문제가 발생합니다:

1. **일관성 부재** — 코드베이스에 두 가지 날짜 표현이 혼재하여 동작을 추론하기 어려워집니다.
2. **버그 재유입** — 네이티브 `Date` 객체에는 라이브러리가 해결하도록 설계된 잘 알려진 함정들이 있습니다 (0부터 시작하는 월 인덱스, 가변성, DST 엣지 케이스, 타임존 문제 등).

```js
// ❌ 일관성 없음 — dayjs와 네이티브 Date 혼용
import dayjs from 'dayjs';
const d = new Date(); // dayjs()를 사용해야 합니다

// ✅ 일관성 있음
import dayjs from 'dayjs';
const d = dayjs();
```

이 플러그인은 코드 리뷰나 프로덕션 배포 전, 린트 단계에서 이러한 문제를 잡아냅니다.

> **더 깊이 알아보기:** [Why Avoid `new Date()`?](./docs/why-avoid-new-date.md) — "Date를 쓰지 말라"는 조언 뒤에 숨은 구체적 함정(문자열 파싱, 시스템 시계, 0-index 월, 가변성)과 각 규칙이 이에 어떻게 대응하는지 설명합니다. (영문)

---

## 규칙 목록

| 규칙 | 설명 | 권장 |
|------|------|:----:|
| [`no-new-date-with-lib`](#date-consistencyno-new-date-with-lib) | 날짜 라이브러리가 임포트된 파일에서 `new Date()` 사용을 경고 | ✅ |
| [`no-deprecated-date-lib`](#date-consistencyno-deprecated-date-lib) | 더 이상 유지보수되지 않는 라이브러리 임포트를 경고 (예: Moment.js) | ✅ |

---

## 사용 조건

| 항목 | 최소 버전 |
|------|:---------:|
| Node.js | `>= 20.0.0` |
| ESLint | `>= 8.0.0` |

**패키지 매니저:** npm, pnpm, yarn 모두 지원합니다.

**TypeScript:** 필수가 아닙니다. JavaScript 및 TypeScript 프로젝트 모두에서 동작합니다.

---

## 설치

```bash
# npm
npm install --save-dev eslint-plugin-date-consistency

# yarn
yarn add --dev eslint-plugin-date-consistency

# pnpm
pnpm add --save-dev eslint-plugin-date-consistency
```

**피어 디펜던시:** `eslint >= 8.0.0`

---

## 설정

### 옵션 1 — 권장 설정 (가장 간단)

합리적인 기본값으로 모든 권장 규칙을 활성화합니다.

```js
// eslint.config.js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [dateConsistency.configs.recommended];
```

### 옵션 2 — 수동 Flat Config

```js
// eslint.config.js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: {
      'date-consistency': dateConsistency,
    },
    rules: {
      'date-consistency/no-new-date-with-lib': 'warn',
      'date-consistency/no-deprecated-date-lib': 'warn',
    },
  },
];
```

### 옵션 3 — 레거시 Config (`.eslintrc.js`)

```js
module.exports = {
  plugins: ['date-consistency'],
  rules: {
    'date-consistency/no-new-date-with-lib': 'warn',
    'date-consistency/no-deprecated-date-lib': 'warn',
  },
};
```

---

## 규칙 상세

### `date-consistency/no-new-date-with-lib`

설정된 날짜 라이브러리가 임포트된 파일에서 `new Date()` (및 선택적으로 `Date.now()`, `Date.parse()`)의 사용을 금지합니다.

에러 메시지에는 감지된 라이브러리 이름과 구체적인 대체 표현이 포함됩니다:

```
'dayjs' is already imported. Use 'dayjs()' instead of 'new Date()'.
```

> **참고:** date-fns는 다른 라이브러리와 다르게 처리됩니다 — 아래 [date-fns 처리 방식](#date-fns-처리-방식)을 참고하세요.

#### 옵션

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  libs: ['dayjs', 'date-fns', 'moment', 'luxon'], // 기본값
  nativeLibs: ['date-fns'],                        // 기본값
  allowAsArgument: false,                          // 기본값
  checkStaticMethods: false,                       // 기본값
  ignorePatterns: [],                              // 기본값
  banNativeDate: false,                            // 기본값
}]
```

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `libs` | `string[]` | `['dayjs', 'date-fns', 'moment', 'luxon']` | 감시할 날짜 라이브러리 목록. 서브패스 임포트(예: `date-fns/format`)와 스코프 패키지를 지원합니다. |
| `nativeLibs` | `string[]` | `['date-fns']` | `libs` 중 네이티브 `Date` 객체를 기반으로 동작하는 라이브러리 — `Date` 생성이 관용구인 라이브러리입니다. [date-fns 처리 방식](#date-fns-처리-방식)을 참고하세요. |
| `allowAsArgument` | `boolean` | `false` | `true`이면 함수 호출의 인수로 전달되는 `new Date()`를 허용합니다 (예: `dayjs(new Date())`). |
| `checkStaticMethods` | `boolean` | `false` | `true`이면 `Date.now()`, `Date.UTC()`도 검사합니다. 네이티브 Date 기반 라이브러리의 `Date.parse()`는 이 옵션과 무관하게 항상 검사됩니다 (아래 참고). |
| `ignorePatterns` | `string[]` | `[]` | `new Date()`를 항상 허용할 파일의 글로브 패턴. 테스트 파일에 유용합니다. |
| `banNativeDate` | `boolean` | `false` | `true`이면 날짜 라이브러리를 임포트하지 않은 파일에서도 `new Date()`를 금지합니다. |

#### 경고가 발생하는 경우

```js
// ESM 기본 임포트
import dayjs from 'dayjs';
const d = new Date(); // ⚠ 'dayjs' is already imported. Use 'dayjs()' instead of 'new Date()'.

// 명명된 임포트
import { DateTime } from 'luxon';
const d = new Date(); // ⚠ 'luxon' is already imported. Use 'DateTime.now()' instead of 'new Date()'.

// 서브패스 임포트
import utc from 'dayjs/plugin/utc';
const d = new Date(); // ⚠

// CommonJS require
const dayjs = require('dayjs');
const d = new Date(); // ⚠

// 인수가 있는 new Date() — 'dayjs()'처럼 인자를 버리는 대체 표현을 제안하지 않음
import dayjs from 'dayjs';
const d = new Date('2024-01-01'); // ⚠ 'dayjs' is already imported. Replace 'new Date(...)' with an equivalent dayjs call that preserves the same arguments.

// 인수로 전달 (allowAsArgument: false가 기본값)
import dayjs from 'dayjs';
const d = dayjs(new Date()); // ⚠

// checkStaticMethods: true일 때 Date.now()
import dayjs from 'dayjs';
const ts = Date.now(); // ⚠ 'dayjs' is already imported. Use 'dayjs()' instead of 'Date.now'.

// date-fns: 신뢰할 수 없는 문자열 파싱만 경고
import { format } from 'date-fns';
const a = new Date('2024-01-01');    // ⚠ Parsing date strings with new Date(string) is unreliable across engines. Use 'parseISO()' from date-fns instead.
const b = Date.parse('2024-01-01');  // ⚠ 동일한 경고 (checkStaticMethods 없이도 발생)
```

#### 허용되는 경우

```js
// 날짜 라이브러리를 임포트하지 않은 경우 — 네이티브 Date 사용 가능
const d = new Date();

// 타입 전용 임포트는 규칙을 트리거하지 않음
import type { Dayjs } from 'dayjs';
const d = new Date(); // ok

// instanceof는 타입 체크이므로 허용
import dayjs from 'dayjs';
if (value instanceof Date) { /* ok */ }

// Date.now()는 기본적으로 허용 (checkStaticMethods: false)
import dayjs from 'dayjs';
const ts = Date.now(); // ok

// allowAsArgument: true인 경우
import dayjs from 'dayjs';
const d = dayjs(new Date()); // allowAsArgument가 true이면 ok

// 설정된 libs 목록에 없는 라이브러리
import axios from 'axios';
const d = new Date(); // ok

// date-fns는 네이티브 Date를 기반으로 동작 — Date 생성은 관용구
import { format } from 'date-fns';
const now = new Date();                  // ok
const label = format(now, 'yyyy-MM-dd'); // ok

// date-fns: 다중 인자 생성자는 문자열 파싱이 아님
import { addDays } from 'date-fns';
const d = new Date('2024', 0, 1); // ok — year/month/day 구성 요소이지 new Date(string)가 아님

// date-fns: checkStaticMethods와 banNativeDate가 모두 설정되지 않으면 Date.now()/Date.UTC()는 허용
import { format } from 'date-fns';
const ts = Date.now(); // ok
```

#### date-fns 처리 방식

기본 감지 대상 라이브러리는 두 부류로 나뉩니다:

| 부류 | 라이브러리 | 날짜 표현 방식 |
|------|-----------|---------------|
| **래퍼(wrapper)형** | dayjs, moment, luxon | 네이티브 `Date`를 대체하는 자체 객체(`Dayjs`, `Moment`, `DateTime`)를 제공 |
| **네이티브 Date 기반** | date-fns | 네이티브 `Date`를 입력받고 반환하는 순수 함수 모음 |

래퍼형 라이브러리에서는 `new Date()`가 두 가지 날짜 표현을 섞는 것이므로 항상 경고합니다.

**date-fns**에서는 네이티브 `Date`가 곧 날짜 표현입니다 — `format(new Date(), 'yyyy-MM-dd')`는 라이브러리의 공식 관용구이며, date-fns에는 `new Date()`를 대체하는 함수가 없습니다. 따라서 date-fns를 임포트한 파일에서는 실제로 위험한 패턴만 경고합니다:

- `new Date('2024-01-01')` (문자열/템플릿 리터럴 인자 1개) — 문자열 파싱은 엔진마다 결과가 다름. `parseISO()`를 사용하세요. `new Date('2024', 0, 1)`처럼 인자가 여러 개면 year/month/day 숫자 생성자이지 문자열 파싱이 아니므로 경고하지 않습니다.
- `Date.parse('2024-01-01')` — `new Date(string)`과 같은 함정이므로 `checkStaticMethods`와 무관하게 항상 경고됩니다.

인자 없는 `new Date()`, `new Date(timestamp)`, `new Date(y, m, d)`, `Date.now()`/`Date.UTC()`는 기본적으로 허용됩니다 — 이들은 인자 없는 `new Date()`와 같은 부류의 관용적인 임의 생성입니다.

date-fns 프로젝트에서도 임의의 날짜 생성을 금지하고 싶다면(예: mock 가능한 clock 헬퍼로 중앙화), `banNativeDate: true`를 사용하세요. `Date.now()`/`Date.UTC()`까지 검사하려면 `checkStaticMethods: true`도 함께 설정해야 합니다 (모든 라이브러리에서 static method를 검사하기 위한 공통 전제 조건입니다) — `new Date()`/`Date.parse()`는 `checkStaticMethods`와 무관하게 항상 검사되므로 영향받지 않습니다.

```js
'date-consistency/no-new-date-with-lib': ['warn', { banNativeDate: true }]
// ⚠ Avoid ad-hoc 'new Date()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.

'date-consistency/no-new-date-with-lib': ['warn', { banNativeDate: true, checkStaticMethods: true }]
// ⚠ Avoid ad-hoc 'Date.now()'. Centralize date creation (e.g. in a clock helper) so it can be mocked in tests.
```

`nativeLibs`를 사용하면 사내에서 만든 네이티브 Date 기반 유틸리티도 date-fns와 동일하게 취급할 수 있습니다:

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  libs: ['dayjs', 'my-internal-date-utils'],
  nativeLibs: ['my-internal-date-utils'],
}]
```

한 파일에서 래퍼 라이브러리와 네이티브 Date 기반 라이브러리를 함께 임포트하면 래퍼 기준으로 동작합니다 — 래퍼의 자체 객체가 있는 이상 `new Date()`는 다시 비일관성이 되기 때문입니다.

#### 사용 예시

**엄격 모드 — 어디서든 `new Date()` 금지**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  banNativeDate: true,
  checkStaticMethods: true,
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**테스트 파일에서 `new Date()` 허용**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**커스텀 라이브러리 목록**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  libs: ['dayjs', 'my-internal-date-utils'],
}]
```

**마이그레이션 브리지로 `dayjs(new Date())` 허용**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  allowAsArgument: true,
}]
```

---

### `date-consistency/no-deprecated-date-lib`

더 이상 유지보수되지 않거나 deprecated된 날짜 라이브러리의 임포트를 감지합니다. 기본적으로 2020년 9월부터 유지보수 모드(신규 기능 없음, 보안 수정만)에 들어간 **Moment.js**를 대상으로 합니다.

```
'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.
```

#### 옵션

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['moment'],                         // 기본값
  alternatives: { moment: 'dayjs or date-fns' }, // 기본값
}]
```

| 옵션 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `deprecated` | `string[]` | `['moment']` | 경고할 라이브러리 목록. |
| `alternatives` | `Record<string, string>` | `{ moment: 'dayjs or date-fns' }` | 각 deprecated 라이브러리에 대한 대안 제안. 경고 메시지에 표시됩니다. |

#### 경고가 발생하는 경우

```js
import moment from 'moment';
// ⚠ 'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.

const moment = require('moment');
// ⚠ 동일한 경고

import moment from 'moment/moment'; // 서브패스 임포트
// ⚠ 동일한 경고
```

#### 허용되는 경우

```js
// 타입 전용 임포트는 경고 없음
import type { Moment } from 'moment';

// deprecated가 아닌 라이브러리
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { DateTime } from 'luxon';
```

#### 사용 예시

**커스텀 deprecated 목록과 대안 지정**

```js
'date-consistency/no-deprecated-date-lib': ['error', {
  deprecated: ['moment', 'fecha'],
  alternatives: {
    moment: 'dayjs',
    fecha: 'date-fns',
  },
}]
```

**대안 제안 없이 경고만**

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['my-old-date-lib'],
  alternatives: {}, // 대안 제안 없음
}]
```

---

## 공통 설정 예시

### dayjs 프로젝트 — 권장 시작점

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['warn', {
        libs: ['dayjs'],
        ignorePatterns: ['**/*.test.*', '**/*.spec.*'],
      }],
      'date-consistency/no-deprecated-date-lib': 'warn',
    },
  },
];
```

### date-fns 프로젝트

관용적인 `new Date()`는 허용되고, 신뢰할 수 없는 문자열 파싱(`new Date('...')`, `Date.parse()`)은 자동으로 경고됩니다:

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['error', {
        libs: ['date-fns'],
        ignorePatterns: ['**/*.test.*'],
      }],
      'date-consistency/no-deprecated-date-lib': 'error',
    },
  },
];
```

임의의 날짜 생성까지 금지하려면(mock 가능한 clock 헬퍼로 중앙화) `banNativeDate: true`를 추가하세요. `new Date()`뿐 아니라 `Date.now()`/`Date.UTC()`까지 포함하려면 `checkStaticMethods: true`도 함께 추가하세요:

```js
'date-consistency/no-new-date-with-lib': ['error', {
  libs: ['date-fns'],
  banNativeDate: true,
  checkStaticMethods: true,
  ignorePatterns: ['**/*.test.*'],
}],
```

### Moment.js에서 마이그레이션

두 규칙을 함께 사용하여 새로운 Moment.js 사용을 막으면서 대안을 강제합니다:

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-deprecated-date-lib': ['error', {
        deprecated: ['moment'],
        alternatives: { moment: 'dayjs' },
      }],
      'date-consistency/no-new-date-with-lib': ['warn', {
        libs: ['dayjs'],
      }],
    },
  },
];
```

---

## 알려진 제한사항

### CJS `require`는 `new Date()` 앞에 위치해야 합니다

ESLint는 AST 노드를 위에서 아래로 한 번만 방문합니다. `require()` 호출이 `new Date()` **뒤에** 나타나면 규칙이 이를 감지하지 못합니다:

```js
const d = new Date();          // ← 감지 안 됨: require가 아직 처리되지 않음
const dayjs = require('dayjs');
```

이는 ESLint의 단일 패스 방문자 모델의 본질적인 제약입니다. 해결책은 `require()`를 파일 상단에 두는 것인데, 이는 어차피 표준 관행입니다.

ESM `import` 선언은 언어 스펙상 항상 파일 상단으로 호이스팅되므로, 이 제한사항이 적용되지 않습니다.

### `allowAsArgument`는 모든 함수 호출 내의 `new Date()`를 허용합니다

`allowAsArgument: true`이면, `new Date()`가 **어떤** 함수의 인수로 전달되든 허용합니다 — 날짜 라이브러리 함수만이 아닙니다:

```js
import dayjs from 'dayjs';

dayjs(new Date());           // ✅ 허용 — 의도된 사용 사례
someOtherFn(new Date());     // ✅ 허용 — 예상치 못한 동작일 수 있음
```

더 엄격한 제어가 필요하면 `allowAsArgument: false`(기본값)를 유지하고, 필요한 경우 `dayjs(new Date())`에 대해 개별적으로 lint 비활성화 주석을 사용하세요.

---

## 변경 로그

[CHANGELOG.md](./CHANGELOG.md)를 참고하세요.

## 기여하기

[CONTRIBUTING.md](./CONTRIBUTING.md)를 참고하세요.

## 라이선스

[MIT](./LICENSE)
