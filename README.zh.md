# eslint-plugin-date-consistency

**Language / 언어 / 语言 / 言語:** [English](./README.md) | [한국어](./README.ko.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md)

[![npm version](https://img.shields.io/npm/v/eslint-plugin-date-consistency)](https://www.npmjs.com/package/eslint-plugin-date-consistency)
[![license](https://img.shields.io/badge/license-MIT-blue)](./LICENSE)

一个强制日期处理一致性的 ESLint 插件 — 防止在已使用日期库的项目中意外使用原生 `Date` 对象，并标记已废弃的库（如 Moment.js）。

## 为什么需要它？

当项目引入了 **dayjs** 或 **date-fns** 这样的日期库后，开发者仍可能出于习惯使用 `new Date()`。这会带来两个问题：

1. **不一致性** — 代码库混用两种日期表示方式，使行为难以推断。
2. **重新引入 Bug** — 原生 `Date` 对象有许多众所周知的陷阱（从 0 开始的月份索引、可变性、夏令时边界情况、时区问题），而库正是为了解决这些问题而设计的。

```js
// ❌ 不一致 — 混用 dayjs 和原生 Date
import dayjs from 'dayjs';
const d = new Date(); // 应该使用 dayjs()

// ✅ 一致
import dayjs from 'dayjs';
const d = dayjs();
```

该插件在 lint 阶段捕获这些问题，在代码审查或上线之前发现隐患。

---

## 规则列表

| 规则 | 描述 | 推荐 |
|------|------|:----:|
| [`no-new-date-with-lib`](#date-consistencyno-new-date-with-lib) | 在已导入日期库的文件中标记 `new Date()` 的使用 | ✅ |
| [`no-deprecated-date-lib`](#date-consistencyno-deprecated-date-lib) | 标记已废弃库的导入（如 Moment.js） | ✅ |

---

## 环境要求

| 要求 | 最低版本 |
|------|:--------:|
| Node.js | `>= 20.0.0` |
| ESLint | `>= 8.0.0` |

**包管理器：** 支持 npm、pnpm 和 yarn。

**TypeScript：** 非必需。同时支持 JavaScript 和 TypeScript 项目。

---

## 安装

```bash
# npm
npm install --save-dev eslint-plugin-date-consistency

# yarn
yarn add --dev eslint-plugin-date-consistency

# pnpm
pnpm add --save-dev eslint-plugin-date-consistency
```

**对等依赖：** `eslint >= 8.0.0`

---

## 配置

### 方式一 — 推荐配置（最简单）

使用合理的默认值启用所有推荐规则。

```js
// eslint.config.js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [dateConsistency.configs.recommended];
```

### 方式二 — 手动 Flat Config

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

### 方式三 — 传统配置（`.eslintrc.js`）

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

## 规则详情

### `date-consistency/no-new-date-with-lib`

在已导入配置中指定的日期库的文件中，禁止使用 `new Date()`（以及可选的 `Date.now()`、`Date.parse()`）。

错误信息包含检测到的库名称，以便您知道应该使用什么替代：

```
'dayjs' is already imported. Use it instead of 'new Date()'.
```

#### 选项

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  libs: ['dayjs', 'date-fns', 'moment', 'luxon'], // 默认值
  allowAsArgument: false,                          // 默认值
  checkStaticMethods: false,                       // 默认值
  ignorePatterns: [],                              // 默认值
  banNativeDate: false,                            // 默认值
}]
```

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `libs` | `string[]` | `['dayjs', 'date-fns', 'moment', 'luxon']` | 要监视的日期库列表。支持子路径导入（如 `date-fns/format`）和 scoped 包。 |
| `allowAsArgument` | `boolean` | `false` | 为 `true` 时，允许将 `new Date()` 作为函数调用的参数（如 `dayjs(new Date())`）。 |
| `checkStaticMethods` | `boolean` | `false` | 为 `true` 时，同时检查 `Date.now()`、`Date.parse()` 和 `Date.UTC()`。 |
| `ignorePatterns` | `string[]` | `[]` | 始终允许 `new Date()` 的文件 glob 模式。适用于测试文件。 |
| `banNativeDate` | `boolean` | `false` | 为 `true` 时，即使文件中没有导入日期库，也禁止使用 `new Date()`。 |

#### 会触发警告的情况

```js
// ESM 默认导入
import dayjs from 'dayjs';
const d = new Date(); // ⚠ 'dayjs' is already imported. Use it instead of 'new Date()'.

// 命名导入
import { format } from 'date-fns';
const d = new Date(); // ⚠ 'date-fns' is already imported. Use it instead of 'new Date()'.

// 子路径导入
import { format } from 'date-fns/format';
const d = new Date(); // ⚠

// CommonJS require
const dayjs = require('dayjs');
const d = new Date(); // ⚠

// 带参数的 new Date()
import dayjs from 'dayjs';
const d = new Date('2024-01-01'); // ⚠

// 作为参数传递（allowAsArgument: false 为默认值）
import dayjs from 'dayjs';
const d = dayjs(new Date()); // ⚠

// checkStaticMethods: true 时的 Date.now()
import dayjs from 'dayjs';
const ts = Date.now(); // ⚠ 'dayjs' is already imported. Use it instead of 'Date.now'.
```

#### 允许的情况

```js
// 没有导入日期库 — 可以使用原生 Date
const d = new Date();

// 仅类型导入不会触发规则
import type { Dayjs } from 'dayjs';
const d = new Date(); // ok

// instanceof 是类型检查，不是构造函数调用
import dayjs from 'dayjs';
if (value instanceof Date) { /* ok */ }

// 默认允许 Date.now()（checkStaticMethods: false）
import dayjs from 'dayjs';
const ts = Date.now(); // ok

// allowAsArgument: true 时
import dayjs from 'dayjs';
const d = dayjs(new Date()); // allowAsArgument 为 true 时 ok

// 不在 libs 列表中的库
import axios from 'axios';
const d = new Date(); // ok
```

#### 使用示例

**严格模式 — 全局禁止 `new Date()`**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  banNativeDate: true,
  checkStaticMethods: true,
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**在测试文件中允许 `new Date()`**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**自定义库列表**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  libs: ['dayjs', 'my-internal-date-utils'],
}]
```

**允许 `dayjs(new Date())` 作为迁移过渡**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  allowAsArgument: true,
}]
```

---

### `date-consistency/no-deprecated-date-lib`

标记已废弃或不再维护的日期库的导入。默认针对 **Moment.js**，该库自 2020 年 9 月起进入维护模式（不再添加新功能，仅修复安全问题）。

```
'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.
```

#### 选项

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['moment'],                         // 默认值
  alternatives: { moment: 'dayjs or date-fns' }, // 默认值
}]
```

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `deprecated` | `string[]` | `['moment']` | 要标记的库列表。 |
| `alternatives` | `Record<string, string>` | `{ moment: 'dayjs or date-fns' }` | 每个废弃库的建议替代方案，显示在警告消息中。 |

#### 会触发警告的情况

```js
import moment from 'moment';
// ⚠ 'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.

const moment = require('moment');
// ⚠ 相同警告

import moment from 'moment/moment'; // 子路径导入
// ⚠ 相同警告
```

#### 允许的情况

```js
// 仅类型导入不会触发警告
import type { Moment } from 'moment';

// 非废弃库
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { DateTime } from 'luxon';
```

#### 使用示例

**自定义废弃列表和替代方案**

```js
'date-consistency/no-deprecated-date-lib': ['error', {
  deprecated: ['moment', 'fecha'],
  alternatives: {
    moment: 'dayjs',
    fecha: 'date-fns',
  },
}]
```

**仅警告，不建议替代方案**

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['my-old-date-lib'],
  alternatives: {}, // 不显示替代建议
}]
```

---

## 常用配置

### dayjs 项目 — 推荐起始配置

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

### date-fns 项目 — 严格模式

```js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [
  {
    plugins: { 'date-consistency': dateConsistency },
    rules: {
      'date-consistency/no-new-date-with-lib': ['error', {
        libs: ['date-fns'],
        checkStaticMethods: true,
        ignorePatterns: ['**/*.test.*'],
      }],
      'date-consistency/no-deprecated-date-lib': 'error',
    },
  },
];
```

### 从 Moment.js 迁移

同时使用两个规则，防止新增 Moment.js 使用的同时强制使用替代方案：

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

## 已知限制

### CJS `require` 必须出现在 `new Date()` 之前

ESLint 对 AST 节点进行从上到下的单次遍历。如果 `require()` 调用出现在同一文件中 `new Date()` **之后**，规则将无法检测到它：

```js
const d = new Date();          // ← 未被标记：require 尚未被处理
const dayjs = require('dayjs');
```

这是 ESLint 单次遍历访问者模型的固有限制。解决方法是将 `require()` 放在文件顶部 — 这本来就是标准做法。

ESM `import` 声明根据语言规范始终提升到文件顶部，因此此限制不适用于 ESM。

### `allowAsArgument` 允许在任何函数调用中使用 `new Date()`

当 `allowAsArgument: true` 时，只要 `new Date()` 作为参数传递给**任何**函数，规则就会放行 — 不仅限于日期库函数：

```js
import dayjs from 'dayjs';

dayjs(new Date());           // ✅ 允许 — 预期的使用场景
someOtherFn(new Date());     // ✅ 也允许 — 可能出乎意料
```

如果需要更严格的控制，保持 `allowAsArgument: false`（默认值），并在需要时为 `dayjs(new Date())` 单独添加 lint 禁用注释。

---

## 更新日志

请参阅 [CHANGELOG.md](./CHANGELOG.md)。

## 贡献

请参阅 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 许可证

[MIT](./LICENSE)
