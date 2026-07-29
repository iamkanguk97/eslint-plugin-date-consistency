# Playground 가이드

**[→ Playground 열기](https://iamkanguk97.github.io/eslint-plugin-date-consistency/)**

Playground는 `eslint-plugin-date-consistency` 규칙을 브라우저에서 바로 체험할 수 있는 인터랙티브 환경입니다 — 설치나 설정 파일이 전혀 필요 없습니다.

---

## 전체 레이아웃

```
┌─────────────────────────────────────────────────────┐
│  헤더 — 타이틀, npm 뱃지, GitHub 링크               │
├─────────────────────────────────────────────────────┤
│  옵션 패널 — 규칙 옵션 토글                          │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   코드 에디터        │   Lint 결과                  │
│   (Monaco)           │   (경고 목록)                │
│                      │                              │
├──────────────────────┴──────────────────────────────┤
│  예제 버튼                         [🔗 Share]       │
└─────────────────────────────────────────────────────┘
```

---

## 각 영역 설명

### 코드 에디터

왼쪽 패널은 VS Code와 동일한 엔진인 Monaco Editor입니다.

- JavaScript 코드를 직접 입력하거나 붙여넣을 수 있습니다
- 경고가 발생한 줄에 **노란 밑줄**이 실시간으로 표시됩니다
- 밑줄 위에 마우스를 올리면 경고 메시지가 인라인으로 나타납니다

> 에디터는 순수 JavaScript만 지원합니다. TypeScript 문법(타입 어노테이션, 제네릭 등)은 Playground에서 지원되지 않습니다.

---

### Lint 결과

오른쪽 패널에 두 규칙이 생성한 모든 경고가 나열됩니다.

각 항목에는 다음 정보가 표시됩니다:

| 항목 | 설명 |
|------|------|
| **Line, Col** | 에디터에서 문제가 발생한 정확한 위치 |
| **Rule ID** | 어떤 규칙이 발동했는지 (`date-consistency/no-new-date-with-lib` 또는 `date-consistency/no-deprecated-date-lib`) |
| **Message** | 감지된 라이브러리 이름을 포함한 전체 경고 메시지 |

문제가 없으면 초록색 **✓ No issues found** 메시지가 표시됩니다.

---

### 옵션 패널

설정 파일 없이 규칙 옵션을 직접 켜고 끌 수 있습니다.

#### `no-new-date-with-lib` 옵션

| 옵션 | 기본값 | 켰을 때 동작 |
|------|:------:|-------------|
| `banNativeDate` | 꺼짐 | 날짜 라이브러리 import 없이도 `new Date()` 사용을 경고 |
| `checkStaticMethods` | 꺼짐 | `Date.now()`, `Date.parse()`, `Date.UTC()`도 추가로 경고 |
| `allowAsArgument` | 꺼짐 | 함수의 인수로 전달되는 경우 `new Date()` 허용 (예: `dayjs(new Date())`) |

#### `libs` (감시할 라이브러리)

기본 4개 라이브러리의 체크박스: **dayjs**, **date-fns**, **moment**, **luxon**

- 체크를 해제하면 해당 라이브러리가 import되어도 규칙이 동작하지 않습니다
- 예: dayjs만 사용하는 프로젝트라면 date-fns, moment, luxon의 체크를 해제하세요

> `no-deprecated-date-lib`의 `deprecated` 옵션은 Playground UI에 노출되지 않습니다. Playground에서는 항상 기본값(`moment`)이 적용됩니다.

---

### 예제 버튼

6개의 프리셋 예제가 코드와 옵션을 함께 자동으로 로드합니다:

| 버튼 | 시연 내용 |
|------|----------|
| **dayjs** | `import dayjs` + `new Date()` → `noNewDate` 경고 |
| **date-fns** | 인자 없는 `new Date()`는 허용(date-fns 관용구), `new Date('...')` / `Date.parse()` → 파싱 경고 |
| **moment (deprecated)** | `import moment from 'moment'` → `deprecatedLib` 경고 |
| **banNativeDate** | 라이브러리 import 없이 `new Date()` 사용 → 경고 (banNativeDate + checkStaticMethods 활성화) |
| **checkStaticMethods** | dayjs와 함께 `Date.now()`, `Date.UTC()` 사용 → 경고 |
| **allowAsArgument** | `dayjs(new Date())`는 허용, 단독 `new Date()`는 여전히 경고 |

예제 버튼을 클릭하면:
1. 에디터에 예제 코드가 로드됩니다
2. 옵션 패널이 해당 예제에 맞는 설정으로 변경됩니다
3. 클릭한 버튼이 활성화 상태로 강조됩니다

예제 로드 후 코드나 옵션을 수정하면 활성화 강조가 해제됩니다.

---

### Share 버튼

**🔗 Share** 버튼은 현재 에디터 코드와 옵션 상태를 Base64 문자열로 인코딩하여 URL에 담습니다.

```
https://iamkanguk97.github.io/eslint-plugin-date-consistency/?s=<인코딩된 값>
```

- **Share** 클릭 → URL이 클립보드에 자동 복사됩니다
- Slack, GitHub 이슈, PR 코멘트 등 어디든 붙여넣으면 동일한 코드와 설정을 그대로 열 수 있습니다
- URL은 Share 클릭 시에만 갱신됩니다. 코드를 입력하는 동안 자동으로 변경되지 않습니다

> 인코딩된 상태에는 코드와 옵션 토글 값만 포함됩니다. 개인 정보는 포함되지 않습니다.

---

## 빠른 시작 예제

### 1. 기본 규칙 테스트

```js
import dayjs from 'dayjs';

const now = new Date();  // ⚠ 여기에 경고가 표시됩니다
```

에디터에 붙여넣으면 Results 패널에 경고 1개가 즉시 나타납니다.

---

### 2. `banNativeDate` 테스트

옵션 패널에서 **banNativeDate**를 활성화한 후 입력:

```js
const now = new Date();  // ⚠ 라이브러리 import 없이도 경고
```

---

### 3. `checkStaticMethods` 테스트

옵션 패널에서 **checkStaticMethods**를 활성화한 후 입력:

```js
import dayjs from 'dayjs';

const ts = Date.now();         // ⚠ 경고
const utc = Date.UTC(2024, 0); // ⚠ 경고
```

---

### 4. `allowAsArgument` 테스트

옵션 패널에서 **allowAsArgument**를 활성화한 후 입력:

```js
import dayjs from 'dayjs';

const ok  = dayjs(new Date());  // ✓ 허용 — 함수 인수로 전달
const bad = new Date();         // ⚠ 여전히 경고 — 단독 사용
```

---

### 5. deprecated 규칙 테스트

```js
import moment from 'moment';
// ⚠ 'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.
```

---

## Playground의 알려진 제한사항

| 제한사항 | 상세 내용 |
|---------|----------|
| JavaScript만 지원 | TypeScript 문법은 지원되지 않습니다. 순수 `.js` 스타일 코드를 사용하세요. |
| `ignorePatterns` 미지원 | `ignorePatterns` 옵션은 파일 경로가 필요하므로 Playground UI에 노출되지 않습니다. |

---

## 실제 플러그인과의 차이점

Playground는 ESLint의 브라우저 호환 `Linter`(`eslint/universal`)를 통해 **실제 플러그인 규칙을 그대로** 브라우저에서 실행하며, ESLint가 JavaScript에 사용하는 것과 동일한 espree 파서로 코드를 파싱합니다. 파싱 가능한 코드에 한해 린트 결과, 메시지, 엣지 케이스 동작(CJS `require()` 순서, `eslint-disable` 디렉티브 주석 포함)이 배포된 npm 패키지와 정확히 일치합니다.

남아 있는 차이점 두 가지:

- **JavaScript 전용**: 실제 플러그인은 `@typescript-eslint/parser`를 통해 TypeScript 파일도 지원하지만, Playground의 espree 파서는 TypeScript 문법을 파싱하지 못합니다.
- **노출되는 옵션**: `ignorePatterns` 옵션은 Playground UI에서 사용할 수 없습니다(위 제한사항 표 참고).
