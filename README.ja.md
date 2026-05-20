# eslint-plugin-date-consistency

**Language / 언어 / 语言 / 言語:** [English](./README.md) | [한국어](./README.ko.md) | [简体中文](./README.zh.md) | [日本語](./README.ja.md)

[![npm version](https://img.shields.io/npm/v/eslint-plugin-date-consistency)](https://www.npmjs.com/package/eslint-plugin-date-consistency)
[![license](https://img.shields.io/github/license/iamkanguk97/eslint-plugin-date-consistency)](./LICENSE)

日付処理の一貫性を強制する ESLint プラグイン — 日付ライブラリがすでに使用されているプロジェクトでネイティブの `Date` オブジェクトが誤って使用されるのを防ぎ、Moment.js のような非推奨ライブラリをフラグします。

## なぜ必要なのか？

**dayjs** や **date-fns** のような日付ライブラリをプロジェクトに導入しても、開発者は習慣から `new Date()` を使い続けることがあります。これにより 2 つの問題が生じます：

1. **非一貫性** — コードベースに 2 つの日付表現が混在し、動作を推論しにくくなります。
2. **バグの再発** — ネイティブの `Date` オブジェクトには、ライブラリが解決するために設計された既知の落とし穴があります（0 から始まる月インデックス、ミュータビリティ、DST エッジケース、タイムゾーンの問題など）。

```js
// ❌ 非一貫 — dayjs とネイティブ Date の混在
import dayjs from 'dayjs';
const d = new Date(); // dayjs() を使うべきです

// ✅ 一貫
import dayjs from 'dayjs';
const d = dayjs();
```

このプラグインは、コードレビューや本番リリース前の lint 段階でこれらの問題を検出します。

---

## ルール一覧

| ルール | 説明 | 推奨 |
|--------|------|:----:|
| [`no-new-date-with-lib`](#date-consistencyno-new-date-with-lib) | 日付ライブラリがインポートされているファイルで `new Date()` を使用するとフラグを立てる | ✅ |
| [`no-deprecated-date-lib`](#date-consistencyno-deprecated-date-lib) | 非推奨ライブラリのインポートをフラグする（例: Moment.js） | ✅ |

---

## インストール

```bash
# npm
npm install --save-dev eslint-plugin-date-consistency

# yarn
yarn add --dev eslint-plugin-date-consistency

# pnpm
pnpm add --save-dev eslint-plugin-date-consistency
```

**ピア依存関係:** `eslint >= 8.0.0`

---

## セットアップ

### オプション 1 — 推奨設定（最もシンプル）

合理的なデフォルト値ですべての推奨ルールを有効にします。

```js
// eslint.config.js
import dateConsistency from 'eslint-plugin-date-consistency';

export default [dateConsistency.configs.recommended];
```

### オプション 2 — 手動 Flat Config

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

### オプション 3 — レガシー Config (`.eslintrc.js`)

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

## ルール詳細

### `date-consistency/no-new-date-with-lib`

設定された日付ライブラリがインポートされているファイルで、`new Date()`（およびオプションで `Date.now()`、`Date.parse()`）の使用を禁止します。

エラーメッセージには検出されたライブラリ名が含まれるため、代わりに何を使うべきかがすぐにわかります：

```
'dayjs' is already imported. Use it instead of 'new Date()'.
```

#### オプション

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  libs: ['dayjs', 'date-fns', 'moment', 'luxon'], // デフォルト
  allowAsArgument: false,                          // デフォルト
  checkStaticMethods: false,                       // デフォルト
  ignorePatterns: [],                              // デフォルト
  banNativeDate: false,                            // デフォルト
}]
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `libs` | `string[]` | `['dayjs', 'date-fns', 'moment', 'luxon']` | 監視する日付ライブラリのリスト。サブパスインポート（例: `date-fns/format`）とスコープドパッケージをサポートします。 |
| `allowAsArgument` | `boolean` | `false` | `true` の場合、関数呼び出しの引数として渡される `new Date()` を許可します（例: `dayjs(new Date())`）。 |
| `checkStaticMethods` | `boolean` | `false` | `true` の場合、`Date.now()`、`Date.parse()`、`Date.UTC()` も検査します。 |
| `ignorePatterns` | `string[]` | `[]` | `new Date()` を常に許可するファイルのグロブパターン。テストファイルに便利です。 |
| `banNativeDate` | `boolean` | `false` | `true` の場合、日付ライブラリをインポートしていないファイルでも `new Date()` を禁止します。 |

#### 警告が発生するケース

```js
// ESM デフォルトインポート
import dayjs from 'dayjs';
const d = new Date(); // ⚠ 'dayjs' is already imported. Use it instead of 'new Date()'.

// 名前付きインポート
import { format } from 'date-fns';
const d = new Date(); // ⚠ 'date-fns' is already imported. Use it instead of 'new Date()'.

// サブパスインポート
import { format } from 'date-fns/format';
const d = new Date(); // ⚠

// CommonJS require
const dayjs = require('dayjs');
const d = new Date(); // ⚠

// 引数付きの new Date()
import dayjs from 'dayjs';
const d = new Date('2024-01-01'); // ⚠

// 引数として渡す場合（allowAsArgument: false がデフォルト）
import dayjs from 'dayjs';
const d = dayjs(new Date()); // ⚠

// checkStaticMethods: true の場合の Date.now()
import dayjs from 'dayjs';
const ts = Date.now(); // ⚠ 'dayjs' is already imported. Use it instead of 'Date.now'.
```

#### 許可されるケース

```js
// 日付ライブラリをインポートしていない場合 — ネイティブ Date は問題なし
const d = new Date();

// 型のみのインポートはルールをトリガーしない
import type { Dayjs } from 'dayjs';
const d = new Date(); // ok

// instanceof は型チェックであり、コンストラクタ呼び出しではない
import dayjs from 'dayjs';
if (value instanceof Date) { /* ok */ }

// Date.now() はデフォルトで許可（checkStaticMethods: false）
import dayjs from 'dayjs';
const ts = Date.now(); // ok

// allowAsArgument: true の場合
import dayjs from 'dayjs';
const d = dayjs(new Date()); // allowAsArgument が true の場合 ok

// libs リストにないライブラリ
import axios from 'axios';
const d = new Date(); // ok
```

#### レシピ

**厳格モード — どこでも `new Date()` を禁止**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  banNativeDate: true,
  checkStaticMethods: true,
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**テストファイルで `new Date()` を許可**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  ignorePatterns: ['**/*.test.*', '**/*.spec.*', '**/__tests__/**'],
}]
```

**カスタムライブラリリスト**

```js
'date-consistency/no-new-date-with-lib': ['error', {
  libs: ['dayjs', 'my-internal-date-utils'],
}]
```

**マイグレーションの橋渡しとして `dayjs(new Date())` を許可**

```js
'date-consistency/no-new-date-with-lib': ['warn', {
  allowAsArgument: true,
}]
```

---

### `date-consistency/no-deprecated-date-lib`

非推奨または保守されていない日付ライブラリのインポートをフラグします。デフォルトでは、2020 年 9 月からメンテナンスモード（新機能なし、セキュリティ修正のみ）に入っている **Moment.js** を対象とします。

```
'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.
```

#### オプション

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['moment'],                         // デフォルト
  alternatives: { moment: 'dayjs or date-fns' }, // デフォルト
}]
```

| オプション | 型 | デフォルト | 説明 |
|-----------|-----|-----------|------|
| `deprecated` | `string[]` | `['moment']` | フラグを立てるライブラリのリスト。 |
| `alternatives` | `Record<string, string>` | `{ moment: 'dayjs or date-fns' }` | 各非推奨ライブラリの推奨代替案。警告メッセージに表示されます。 |

#### 警告が発生するケース

```js
import moment from 'moment';
// ⚠ 'moment' is in maintenance mode. Consider migrating to dayjs or date-fns.

const moment = require('moment');
// ⚠ 同じ警告

import moment from 'moment/moment'; // サブパスインポート
// ⚠ 同じ警告
```

#### 許可されるケース

```js
// 型のみのインポートはフラグされない
import type { Moment } from 'moment';

// 非推奨でないライブラリ
import dayjs from 'dayjs';
import { format } from 'date-fns';
import { DateTime } from 'luxon';
```

#### レシピ

**カスタム非推奨リストと代替案**

```js
'date-consistency/no-deprecated-date-lib': ['error', {
  deprecated: ['moment', 'fecha'],
  alternatives: {
    moment: 'dayjs',
    fecha: 'date-fns',
  },
}]
```

**代替案なしでフラグのみ**

```js
'date-consistency/no-deprecated-date-lib': ['warn', {
  deprecated: ['my-old-date-lib'],
  alternatives: {}, // 代替案を表示しない
}]
```

---

## 共通設定

### dayjs プロジェクト — 推奨スタート設定

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

### date-fns プロジェクト — 厳格モード

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

### Moment.js からのマイグレーション

両方のルールを組み合わせて、新しい Moment.js の使用を防ぎながら代替手段を強制します：

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

## 既知の制限事項

### CJS `require` は `new Date()` より前に記述する必要があります

ESLint は AST ノードを上から下へ一度だけ訪問します。`require()` 呼び出しが同じファイル内で `new Date()` の**後に**現れた場合、ルールはそれを検出できません：

```js
const d = new Date();          // ← フラグされない：require がまだ処理されていない
const dayjs = require('dayjs');
```

これは ESLint の単一パス訪問者モデルの固有の制約です。回避策は `require()` をファイルの先頭に置くことです — これは標準的なプラクティスでもあります。

ESM の `import` 宣言は言語仕様により常にファイルの先頭に巻き上げられるため、この制限は ESM には適用されません。

### `allowAsArgument` はすべての関数呼び出し内の `new Date()` を許可します

`allowAsArgument: true` の場合、`new Date()` が**どんな**関数の引数として渡されても許可されます — 日付ライブラリの関数だけでなく：

```js
import dayjs from 'dayjs';

dayjs(new Date());           // ✅ 許可 — 想定された使用ケース
someOtherFn(new Date());     // ✅ 許可 — 予期しない動作の可能性あり
```

より厳格な制御が必要な場合は `allowAsArgument: false`（デフォルト）を維持し、`dayjs(new Date())` に対しては個別に lint 無効化コメントを使用してください。

---

## 変更履歴

[CHANGELOG.md](./CHANGELOG.md) を参照してください。

## コントリビューション

[CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。

## ライセンス

[MIT](./LICENSE)
