# Emoji 输入过滤 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 `emoji-regex` 精准过滤姓名、订单备注、菜备注中的 emoji，避免保存或提交文本时携带 emoji。

**Architecture:** 新增一个小型输入清洗工具 `removeEmoji`，在本次范围内的 `onChange`/`keyboardChange` handler 中调用。顾客姓名接口增加一次提交前兜底，保证 `saveCustomerInfo` payload 不再携带 emoji。

**Tech Stack:** React 17、Jest、Yarn、emoji-regex。

---

### Task 1: 添加依赖和输入清洗工具

**Files:**

- Modify: `package.json`
- Create: `src/utils/sanitizeInput.js`
- Test: `src/utils/sanitizeInput.test.js`

- [ ] **Step 1: 添加直接依赖**

在 `package.json` 的 `dependencies` 中添加：

```json
"emoji-regex": "^10.4.0"
```

执行：

```bash
yarn install
```

Expected: `yarn.lock` 更新，项目依赖安装成功。

- [ ] **Step 2: 新增工具函数**

创建 `src/utils/sanitizeInput.js`：

```js
import emojiRegex from 'emoji-regex';

export function removeEmoji(value = '') {
  return String(value).replace(emojiRegex(), '');
}
```

- [ ] **Step 3: 新增单测**

创建 `src/utils/sanitizeInput.test.js`：

```js
import { removeEmoji } from './sanitizeInput';

describe('removeEmoji', () => {
  test('removes common emoji characters and preserves normal text', () => {
    expect(removeEmoji('Kodi🤩')).toBe('Kodi');
    expect(removeEmoji('Hi👍🏽')).toBe('Hi');
    expect(removeEmoji('Family👨‍👩‍👧‍👦')).toBe('Family');
    expect(removeEmoji('Love❤️')).toBe('Love');
    expect(removeEmoji('Flag🇺🇸')).toBe('Flag');
    expect(removeEmoji('Key1️⃣')).toBe('Key');
    expect(removeEmoji('中文ABC123')).toBe('中文ABC123');
  });
});
```

- [ ] **Step 4: 跑工具函数测试**

Run:

```bash
yarn test sanitizeInput
```

Expected: `removeEmoji` 测试通过。

---

### Task 2: 处理姓名输入和保存顾客接口

**Files:**

- Modify: `src/container/enterName/index.js`
- Modify: `src/api/index.js`

- [ ] **Step 1: 在姓名页引入工具函数**

在 `src/container/enterName/index.js` 顶部增加：

```js
import { removeEmoji } from '@/utils/sanitizeInput';
```

- [ ] **Step 2: 过滤姓名输入框 onChange**

将 `keyboardChange` 中的：

```js
let value = event.target.value;
```

改为：

```js
let value = removeEmoji(event.target.value);
```

保留现有 `maxLen` 截断和 `this.setState({ enterNameStr: value })`。

- [ ] **Step 3: 在 API 层兜底过滤 firstName**

在 `src/api/index.js` 顶部增加：

```js
import { removeEmoji } from '@/utils/sanitizeInput';
```

将 `saveCustomerInfo` payload 中的：

```js
firstName,
```

改为：

```js
firstName: removeEmoji(firstName),
```

- [ ] **Step 4: 验证姓名链路**

手工验证：

```text
姓名输入 Kodi🤩
页面状态/提交 payload 中 firstName 应为 Kodi
```

---

### Task 3: 处理订单备注

**Files:**

- Modify: `src/container/orderReview/index.js`

- [ ] **Step 1: 引入工具函数**

在 `src/container/orderReview/index.js` 顶部增加：

```js
import { removeEmoji } from '@/utils/sanitizeInput';
```

- [ ] **Step 2: 过滤订单备注 keyboardChange**

将：

```js
keyboardChange = (value) => {
  if (value.length > 255) {
    value = value.substr(0, 255);
  }
  this.setState({
    keyboardValue: value,
  });
  this.props.notes(value);
};
```

改为：

```js
keyboardChange = (value) => {
  value = removeEmoji(value);
  if (value.length > 255) {
    value = value.substr(0, 255);
  }
  this.setState({
    keyboardValue: value,
  });
  this.props.notes(value);
};
```

- [ ] **Step 3: 验证订单备注**

手工验证：

```text
订单备注输入 please call me👍
页面状态和订单备注值应为 please call me
```

---

### Task 4: 处理菜备注

**Files:**

- Modify: `src/container/orderPage/orderDetailModal/index.js`
- Modify: `src/container/orderPage/bannerPro/components/detail.js`
- Modify: `src/container/orderPage/bannerPro/components/combo/itemInfo.js`
- Modify: `src/container/comboPanel/fullComboPanel/comboItem/index.js`
- Modify: `src/container/comboPanel/comboSelectionModal/index.js`

- [ ] **Step 1: 为五个菜备注组件引入工具函数**

每个文件顶部增加：

```js
import { removeEmoji } from '@/utils/sanitizeInput';
```

- [ ] **Step 2: 修改只接收字符串的 keyboardChange**

对以下文件：

```text
src/container/orderPage/orderDetailModal/index.js
src/container/orderPage/bannerPro/components/detail.js
src/container/orderPage/bannerPro/components/combo/itemInfo.js
src/container/comboPanel/fullComboPanel/comboItem/index.js
```

在 `keyboardChange = (value) => {` 内第一行增加：

```js
value = removeEmoji(value);
```

并保留现有 255 长度限制、`setState` 和 `currentItem.remark` 逻辑。

- [ ] **Step 3: 修改 comboSelectionModal 的 event/string 双形态 handler**

在 `src/container/comboPanel/comboSelectionModal/index.js` 中，将：

```js
let value = isVKboard ? event : event.target.value;
```

改为：

```js
let value = isVKboard ? event : removeEmoji(event.target.value);
```

说明：`VtKeyboard` 本身不支持 emoji，此处不处理 `isVKboard` 路径，避免额外改动虚拟键盘输入。

- [ ] **Step 4: 验证菜备注**

手工验证：

```text
菜备注输入 no onion❤️
页面状态和 item remark 应为 no onion
```

---

### Task 5: 最终验证

**Files:**

- No code changes

- [ ] **Step 1: 跑单测**

Run:

```bash
yarn test sanitizeInput
```

Expected: 测试通过。

- [ ] **Step 2: 搜索确认没有误改范围**

Run:

```bash
git diff -- src/utils/sanitizeInput.js src/utils/sanitizeInput.test.js src/container/enterName/index.js src/api/index.js src/container/orderReview/index.js src/container/orderPage/orderDetailModal/index.js src/container/orderPage/bannerPro/components/detail.js src/container/orderPage/bannerPro/components/combo/itemInfo.js src/container/comboPanel/fullComboPanel/comboItem/index.js src/container/comboPanel/comboSelectionModal/index.js package.json yarn.lock
```

Expected: diff 只包含 emoji 过滤、依赖、测试相关改动。

- [ ] **Step 3: 手工回归**

验证：

```text
姓名 Kodi🤩 -> Kodi
订单备注 please call me👍 -> please call me
菜备注 no onion❤️ -> no onion
电话、金额、数量、Numpad 相关输入未被修改
```
