# Phone Number Entry Layout Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 `PhoneNumberField` 基础上新增薄的 `PhoneNumberEntryLayout`，统一所有手机号输入场景的基本结构、间距、手机号输入框位置、Policy 位置和按钮区域容器。

**Architecture:** `PhoneNumberField` 继续只负责手机号输入、格式化、`+1` country code、竖屏数字键盘。新增 `PhoneNumberEntryLayout` 只负责无业务语义的布局：标题区、手机号输入区、Policy 区、扩展内容区、按钮区；确认、取消、查询、跳验证码、保存订单等业务逻辑仍留在各页面内部。

**Tech Stack:** React 17、CSS Modules、Sass、react-i18next、现有 `Policy`、现有 `PhoneNumberField`、Yarn、CRA Jest。

---

## 当前基线

当前代码已经完成：

- `src/utils/phoneNumber.js`
- `src/component/PhoneNumberField/index.js`
- `src/component/PhoneNumberField/PhoneNumberField.module.scss`
- `src/component/PhoneNumberField/PhoneNumberField.test.js`

本计划从当前基线继续，不重做 `PhoneNumberField`。如果执行前发现这些文件不存在，先停止并同步当前分支，不要重新创造另一套手机号组件。

## Execution Start

从 **Task 1: 新增 PhoneNumberEntryLayout** 开始执行。

执行者需要先确认“当前基线”列出的文件已经存在，但不要把这些文件当作待办重新实现。`PhoneNumberField`、手机号格式化工具、`+1` country code 默认展示、以及原生 input `maxLength` 修复都属于已完成事项；后续任务只在这个基线上新增 layout wrapper，并逐页迁移到 `PhoneNumberEntryLayout`。

如果使用 `superpowers:subagent-driven-development`，推荐拆分为：

- Worker A 先完成 Task 1，负责 `src/component/PhoneNumberEntryLayout/*`。
- Task 1 通过后，Worker B/C/D/E 可以分别执行 Task 2/3/4/5。
- 所有页面迁移完成后，再执行 Task 6 做全量清理和验证。

## Wrapper 边界

`PhoneNumberEntryLayout` 可以承载：

- 标题区统一结构：icon + title。
- 手机号输入区：内部使用 `PhoneNumberField`。
- Policy 区：统一展示位置和间距。
- `afterField` 插槽：例如礼品卡查询方式切换。
- `actions` 插槽：例如取消/确认、跳过/确认、查询按钮。
- 页面级宽度、上下间距、横竖屏输入框布局。
- `PhoneNumberField` 所需事件透传：`inputRef`、`value`、`placeholder`、`isVertical`、`onPhoneChange`、`onFocus`、`onBlur`、`onClick`、`onKeyUp`、`onKeyDown`。

`PhoneNumberEntryLayout` 不承载：

- CRM 登录/注册接口。
- 礼品卡查询接口。
- 购买礼品卡二次确认。
- 订单保存、支付路由、跳转。
- 按钮是否可点击的业务判断。
- 手机号以外的 Email/Card Number 输入逻辑。

## 目标文件结构

新增：

- `src/component/PhoneNumberEntryLayout/index.js`
- `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.module.scss`
- `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js`

修改：

- `src/container/phoneInput/index.js`
- `src/container/phoneInput/phoneInput.module.scss`
- `src/component/CRM/LoginCRM/components/LoginModal.js`
- `src/component/CRM/LoginCRM/components/LoginModal.module.scss`
- `src/component/GiftCardPayment/QueryGiftCard.js`
- `src/component/GiftCardPayment/QueryGiftCard.module.scss`
- `src/container/orderPage/bannerPro/components/buyGiftCard.js`
- `src/container/orderPage/bannerPro/components/buyGiftCard.module.scss`

---

## Task 1: 新增 PhoneNumberEntryLayout

**预计耗时:** 45-60 分钟  
**独立性:** 独立；只新增 layout wrapper 和测试。  
**Files:**

- Create: `src/component/PhoneNumberEntryLayout/index.js`
- Create: `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.module.scss`
- Create: `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js`

- [ ] **Step 1: 写失败测试**

创建 `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js`：

```js
import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import PhoneNumberEntryLayout from './index';

describe('PhoneNumberEntryLayout', () => {
  let container;

  beforeAll(() => {
    if (!i18n.isInitialized) {
      i18n.use(initReactI18next).init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {},
        interpolation: { escapeValue: false },
      });
    }
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
    container = null;
  });

  test('renders title, phone field, policy, after field content, and actions', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberEntryLayout
          title="Phone login"
          value="1234567890"
          placeholder="Phone number"
          isVertical={false}
          isPrivacyConfirm
          changePrivacyConfirm={() => {}}
          afterField={<div data-testid="after-field">after</div>}
          actions={<button type="button">Confirm</button>}
        />,
        container
      );
    });

    expect(container.textContent).toContain('Phone login');
    expect(container.textContent).toContain('+1');
    expect(container.textContent).toContain('(123) 456-7890');
    expect(container.querySelector('[data-testid="after-field"]')).not.toBeNull();
    expect(container.textContent).toContain('Confirm');
  });

  test('can hide policy when showPolicy is false', () => {
    act(() => {
      ReactDOM.render(
        <PhoneNumberEntryLayout
          title="Phone login"
          value=""
          placeholder="Phone number"
          isVertical={false}
          showPolicy={false}
          actions={<button type="button">Confirm</button>}
        />,
        container
      );
    });

    expect(container.querySelector('[data-testid="phone-entry-policy"]')).toBeNull();
  });
});
```

- [ ] **Step 2: 运行测试确认失败**

Run:

```bash
yarn react-scripts test src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js --watchAll=false --runInBand
```

Expected: FAIL，原因是 `Cannot find module './index'`。

- [ ] **Step 3: 新增 layout 组件**

创建 `src/component/PhoneNumberEntryLayout/index.js`：

```js
import React from 'react';
import PhoneNumberField from '@/component/PhoneNumberField';
import Policy from '@/component/CRM/LoginCRM/components/Policy';
import jingleBell from '@/assets/images/jingleBell.png';
import styles from './PhoneNumberEntryLayout.module.scss';

const PhoneNumberEntryLayout = ({
  title,
  titleIcon = jingleBell,
  value,
  placeholder,
  inputRef,
  isVertical,
  onPhoneChange,
  onKeyDown,
  onKeyUp,
  onFocus,
  onBlur,
  onClick,
  showPolicy = true,
  isPrivacyConfirm,
  changePrivacyConfirm,
  afterField,
  actions,
  className = '',
}) => {
  return (
    <div className={`${styles.entryLayout} ${className}`}>
      <div className={styles.titleWrapper}>
        {titleIcon ? <img src={titleIcon} className={styles.titleIcon} /> : null}
        <div className={styles.title}>{title}</div>
      </div>

      <div className={styles.fieldWrapper}>
        <PhoneNumberField
          inputRef={inputRef}
          value={value}
          placeholder={placeholder}
          isVertical={isVertical}
          onChange={onPhoneChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
          onClick={onClick}
        />
      </div>

      {afterField ? <div className={styles.afterField}>{afterField}</div> : null}

      {showPolicy ? (
        <div className={styles.policyWrapper} data-testid="phone-entry-policy">
          <Policy
            isPrivacyConfirm={isPrivacyConfirm}
            changePrivacyConfirm={changePrivacyConfirm}
          />
        </div>
      ) : null}

      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </div>
  );
};

export default PhoneNumberEntryLayout;
```

- [ ] **Step 4: 新增统一样式**

创建 `src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.module.scss`：

```scss
.entryLayout {
  width: 76rem;
  margin: 0 auto;
  box-sizing: border-box;
}

.titleWrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0 10rem;
  color: #000;
  font-weight: 700;
  text-align: center;
}

.titleIcon {
  width: 5rem;
  margin-right: 4rem;
}

.title {
  font-size: 4rem;
}

.fieldWrapper {
  position: relative;
}

.afterField {
  margin-top: 4rem;
}

.policyWrapper {
  margin: 6rem auto 5rem;
}

.actions {
  display: flex;
  justify-content: space-between;
}
```

- [ ] **Step 5: 运行测试确认通过**

Run:

```bash
yarn react-scripts test src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js --watchAll=false --runInBand
```

Expected: PASS。

- [ ] **Step 6: 格式化**

Run:

```bash
yarn prettier --write "src/component/PhoneNumberEntryLayout/**/*.{js,scss}"
```

Expected: 命令成功。允许 `.prettierrc` 现有 `seTabs` warning。

---

## Task 2: 迁移 CRM 登录弹窗到 layout wrapper

**预计耗时:** 45-60 分钟  
**独立性:** 依赖 Task 1；只修改 CRM 登录弹窗。  
**Files:**

- Modify: `src/component/CRM/LoginCRM/components/LoginModal.js`
- Modify: `src/component/CRM/LoginCRM/components/LoginModal.module.scss`

- [ ] **Step 1: 引入 layout**

在 `LoginModal.js` 添加：

```js
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
```

删除不再直接使用的：

```js
import PhoneNumberField from '@/component/PhoneNumberField';
import Policy from './Policy';
```

- [ ] **Step 2: 用 actions 变量保留业务按钮**

在 `render()` 中、`return` 前添加：

```js
const actions = (
  <>
    <div className={styles.never} onClick={onClose}>
      {t('cancel')}
    </div>
    <div
      className={classNames(
        styles.confirmBtn,
        !isPhoneValid || !isPrivacyConfirm
          ? styles.disableConfirm
          : 'linear-animate-btn'
      )}
      onClick={this.onConfirmPhone}
    >
      {t('confirm')}
    </div>
  </>
);
```

- [ ] **Step 3: 替换 step 0 的输入结构**

将 `step === 0` 内的 `.loginModal` 内容替换为：

```jsx
<div className={styles.loginModal}>
  <PhoneNumberEntryLayout
    title={t('phoneLogin')}
    titleIcon={null}
    value={phoneNum}
    placeholder={t('inputPhone')}
    inputRef={(el) => (this.phoneInputRef = el)}
    isVertical={isVertical}
    onPhoneChange={this.keyboardChange}
    onKeyUp={this.handleKeyUp}
    onFocus={() => {
      if (!isVertical && !isOpenVtkeyboadrd()) {
        if (this.keyboardManager) {
          this.keyboardManager.forceCheck();
          setTimeout(() => {
            this.keyboardManager.handleKeyboardChange();
          }, 300);
        }
      } else if (isOpenVtkeyboadrd() && !isVertical) {
        this.showKeyboard();
      }
    }}
    onBlur={() => {
      if (!isVertical && !isOpenVtkeyboadrd()) {
        setTimeout(() => {
          if (this.keyboardManager) {
            this.keyboardManager.handleKeyboardClose();
          }
        }, 300);
      }
    }}
    onClick={() => {
      if (isOpenVtkeyboadrd() && !isVertical) {
        this.showKeyboard();
      }
    }}
    isPrivacyConfirm={isPrivacyConfirm}
    changePrivacyConfirm={this.changePrivacyConfirm}
    actions={actions}
  />
</div>
```

- [ ] **Step 4: 清理重复样式**

在 `LoginModal.module.scss` 中删除 `.loginModal .numTitle`、`.loginModal .numPad`、`.loginModal .policyWrapper`、`.loginModal .phoneBtnBox`。保留按钮类：

```scss
.never {
  margin-right: 2.5rem;
  background-color: var(--background-grey);
}

.confirmBtn {
  background-color: var(--primary-selected-color);
}

.disableConfirm {
  background: var(--primary-color-disabled);
  color: #0000004d;
}
```

如果按钮宽高样式原本挂在 `.phoneBtnBox div` 上，把它移动到 `.never` 和 `.confirmBtn` 共同规则：

```scss
.never,
.confirmBtn {
  color: var(--text-color-black);
  font-size: 3rem;
  width: 40rem;
  height: 10rem;
  line-height: 10rem;
  text-align: center;
  border-radius: 10rem;
  flex: 1;
  font-weight: bold;
}
```

- [ ] **Step 5: 验证**

Run:

```bash
yarn prettier --write "src/component/CRM/LoginCRM/components/LoginModal.js" "src/component/CRM/LoginCRM/components/LoginModal.module.scss"
yarn react-scripts test src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js src/component/PhoneNumberField/PhoneNumberField.test.js --watchAll=false --runInBand
```

Expected: PASS。

---

## Task 3: 迁移订单手机号输入页到 layout wrapper

**预计耗时:** 45-60 分钟  
**独立性:** 依赖 Task 1；只修改订单手机号页。  
**Files:**

- Modify: `src/container/phoneInput/index.js`
- Modify: `src/container/phoneInput/phoneInput.module.scss`

- [ ] **Step 1: 引入 layout**

在 `phoneInput/index.js` 添加：

```js
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
```

删除不再直接使用的：

```js
import PhoneNumberField from '@/component/PhoneNumberField';
import Policy from '@/component/CRM/LoginCRM/components/Policy';
import jingleBell from '@/assets/images/jingleBell.png';
```

- [ ] **Step 2: 抽出 title node**

在 `render()` 中创建：

```js
const title = (
  <>
    <span>{t('input-phone-SMS-0')}</span>
    {!isCRMDisabled && loginType !== 'active' && (
      <span>{t('input-phone-SMS-1')}</span>
    )}
  </>
);
```

- [ ] **Step 3: 抽出 actions node**

在 `render()` 中创建：

```js
const actions = (
  <>
    {!isRequire && (
      <div className={styles.never} onClick={this.handleSkip}>
        {t('skip')}
      </div>
    )}
    <div
      className={[
        isPhoneValid && isPrivacyConfirm
          ? `${styles.btnConfirm} linear-animate-btn`
          : styles.btnNoConfirm,
      ].join(' ')}
      onClick={this.handleContinue}
    >
      {t('confirm')}
    </div>
  </>
);
```

- [ ] **Step 4: 替换 `.numPadContainer` 内结构**

将标题、输入框、Policy、按钮结构替换为：

```jsx
<PhoneNumberEntryLayout
  title={title}
  value={customNumber}
  placeholder={t('inputPhone')}
  inputRef={(el) => (this.phoneInputRef = el)}
  isVertical={isVertical}
  onPhoneChange={this.onPhoneChange}
  onKeyUp={this.handleKeyUp}
  onFocus={() => {
    if (!isVertical && !isOpenVtkeyboadrd()) {
      if (this.keyboardManager) {
        this.keyboardManager.forceCheck();
        setTimeout(() => {
          this.keyboardManager.handleKeyboardChange();
        }, 300);
      }
    } else if (isOpenVtkeyboadrd() && !isVertical) {
      this.showKeyboard();
    }
  }}
  onBlur={() => {
    if (!isVertical && !isOpenVtkeyboadrd()) {
      setTimeout(() => {
        if (this.keyboardManager) {
          this.keyboardManager.handleKeyboardClose();
        }
      }, 300);
    }
  }}
  onClick={() => {
    if (isOpenVtkeyboadrd() && !isVertical) {
      this.showKeyboard();
    }
  }}
  isPrivacyConfirm={isPrivacyConfirm}
  changePrivacyConfirm={this.changePrivacyConfirm}
  actions={actions}
/>
```

- [ ] **Step 5: 清理重复样式**

在 `phoneInput.module.scss` 中删除 `.numTitleWrapper`、`.jingleBell`、`.tipsMsgTitle`、`.numPad`、`.policyWrapper`、`.phoneBtnBox`。保留按钮类并补齐共同按钮样式：

```scss
.never,
.btnConfirm,
.btnNoConfirm {
  color: var(--text-color-black);
  font-size: 3rem;
  width: 40rem;
  height: 10rem;
  line-height: 10rem;
  text-align: center;
  border-radius: 10rem;
  flex: 1;
  font-weight: bold;
}
```

- [ ] **Step 6: 验证**

Run:

```bash
yarn prettier --write "src/container/phoneInput/index.js" "src/container/phoneInput/phoneInput.module.scss"
yarn react-scripts test src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js src/component/PhoneNumberField/PhoneNumberField.test.js --watchAll=false --runInBand
```

Expected: PASS。

---

## Task 4: 迁移礼品卡手机号查询到 layout wrapper

**预计耗时:** 45-60 分钟  
**独立性:** 依赖 Task 1；只修改礼品卡查询。  
**Files:**

- Modify: `src/component/GiftCardPayment/QueryGiftCard.js`
- Modify: `src/component/GiftCardPayment/QueryGiftCard.module.scss`

- [ ] **Step 1: 引入 layout**

添加：

```js
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
```

删除不再直接用于手机号分支的：

```js
import PhoneNumberField from '@/component/PhoneNumberField';
import Policy from '@/component/CRM/LoginCRM/components/Policy';
import jingleBell from '@/assets/images/jingleBell.png';
```

保留非手机号输入的 `.queryInput` 样式和 Email/Card Number 分支。

- [ ] **Step 2: 抽出手机号分支 actions**

在 `render()` 中创建：

```js
const queryAction = (
  <button
    type="button"
    className={classNames(
      styles.queryButton,
      isQueryDisabled ? styles.disableQueryButton : styles.enableQueryButton
    )}
    onClick={this.onConfirm}
  >
    {t('query')}
  </button>
);
```

如果当前按钮文案不是 `t('query')`，使用现有文案，不新增硬编码。

- [ ] **Step 3: 手机号查询分支使用 layout**

当 `cardSearchType === PHONE_NUMBER` 时，渲染：

```jsx
<PhoneNumberEntryLayout
  title={t(titleKey)}
  value={phoneNum}
  placeholder={t('inputPhone')}
  inputRef={(el) => (this.phoneInputRef = el)}
  isVertical={IS_VERTICAL}
  onPhoneChange={this.keyboardChange}
  onKeyUp={this.handleKeyUp}
  onFocus={() => {
    if (!IS_VERTICAL && !isOpenVtkeyboadrd()) {
      if (this.keyboardManager) {
        this.keyboardManager.forceCheck();
        setTimeout(() => {
          this.keyboardManager.handleKeyboardChange();
        }, 300);
      }
    } else if (isOpenVtkeyboadrd() && !IS_VERTICAL) {
      this.showKeyboard();
    }
  }}
  onBlur={() => {
    if (!IS_VERTICAL && !isOpenVtkeyboadrd()) {
      setTimeout(() => {
        if (this.keyboardManager) {
          this.keyboardManager.handleKeyboardClose();
        }
      }, 300);
    }
  }}
  onClick={() => {
    if (isOpenVtkeyboadrd() && !IS_VERTICAL) {
      this.showKeyboard();
    }
  }}
  afterField={this.renderQueryMethodOptions()}
  isPrivacyConfirm={isPrivacyConfirm}
  changePrivacyConfirm={this.changePrivacyConfirm}
  actions={queryAction}
/>
```

- [ ] **Step 4: 非手机号分支保持原结构**

当 `cardSearchType === EMAIL` 或 `CARD_NUMBER` 时，继续使用当前 `.queryInput`，不要把 Email/Card Number 塞进 `PhoneNumberEntryLayout`。

- [ ] **Step 5: 清理样式**

在 `QueryGiftCard.module.scss` 中删除手机号标题、手机号 field、Policy、按钮容器的重复布局样式。保留：

- `.queryMethodWrapper`
- `.queryMethodItem`
- `.queryInput`
- `.queryButton`
- `.enableQueryButton`
- `.disableQueryButton`

- [ ] **Step 6: 验证**

Run:

```bash
yarn prettier --write "src/component/GiftCardPayment/QueryGiftCard.js" "src/component/GiftCardPayment/QueryGiftCard.module.scss"
yarn react-scripts test src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js src/component/PhoneNumberField/PhoneNumberField.test.js --watchAll=false --runInBand
```

Expected: PASS。

---

## Task 5: 迁移购买礼品卡绑定手机号到 layout wrapper

**预计耗时:** 45-60 分钟  
**独立性:** 依赖 Task 1；只修改购买礼品卡手机号绑定。  
**Files:**

- Modify: `src/container/orderPage/bannerPro/components/buyGiftCard.js`
- Modify: `src/container/orderPage/bannerPro/components/buyGiftCard.module.scss`

- [ ] **Step 1: 引入 layout 和 Policy 状态**

添加：

```js
import PhoneNumberEntryLayout from '@/component/PhoneNumberEntryLayout';
```

删除：

```js
import PhoneNumberField from '@/component/PhoneNumberField';
```

新增状态：

```js
const [isPrivacyConfirm, setIsPrivacyConfirm] = useState(
  selfConfig?.configMap?.id_49
);
```

- [ ] **Step 2: 按钮启用条件加入 Policy**

将按钮 class 判断从：

```js
step === 'input' ? isPhoneValid : isConfirmValid
```

改为：

```js
step === 'input'
  ? isPhoneValid && isPrivacyConfirm
  : isConfirmValid && isPrivacyConfirm
```

在 `handleNext` 和 `handleConfirm` 开头加入：

```js
if (!isPrivacyConfirm) {
  Toast.info(t('confirm-policy'), 1000);
  return;
}
```

- [ ] **Step 3: 抽出 title node**

保留现有文案逻辑：

```js
const title =
  step === 'input' ? (
    <Trans
      t={t}
      i18nKey="gift_card_bind_phone_title"
      components={[<div></div>]}
    />
  ) : (
    t('gift_card_confirm_phone_title')
  );
```

- [ ] **Step 4: 抽出 action node**

```jsx
const actions = (
  <button
    type="button"
    className={`${styles.queryButton} ${
      step === 'input'
        ? isPhoneValid && isPrivacyConfirm
          ? styles.enableQueryButton
          : styles.disableQueryButton
        : isConfirmValid && isPrivacyConfirm
          ? styles.enableQueryButton
          : styles.disableQueryButton
    }`}
    onClick={step === 'input' ? handleNext : handleConfirm}
  >
    {step === 'input'
      ? t('gift_card_bind_next')
      : t('gift_card_bind_confirm')}
  </button>
);
```

- [ ] **Step 5: 替换输入结构**

将标题、手机号输入、按钮替换为：

```jsx
<PhoneNumberEntryLayout
  title={title}
  value={step === 'input' ? phone : confirmPhone}
  placeholder={t('inputPhone')}
  isVertical={isVertical}
  onPhoneChange={(nextValue) => handlePhoneChange(nextValue, step)}
  onKeyDown={handleButtonEnter}
  isPrivacyConfirm={isPrivacyConfirm}
  changePrivacyConfirm={setIsPrivacyConfirm}
  actions={actions}
/>
```

- [ ] **Step 6: 清理样式**

在 `buyGiftCard.module.scss` 中删除 `.numTitleWrapper`、`.numTitle`、`.jingleBell`、`.numPad` 等重复布局样式。保留：

- `.queryButton`
- `.enableQueryButton`
- `.disableQueryButton`
- `.fullScreenWrapper`
- `.loginWrapper`
- `.loginModal`

- [ ] **Step 7: 验证**

Run:

```bash
yarn prettier --write "src/container/orderPage/bannerPro/components/buyGiftCard.js" "src/container/orderPage/bannerPro/components/buyGiftCard.module.scss"
yarn react-scripts test src/component/PhoneNumberEntryLayout/PhoneNumberEntryLayout.test.js src/component/PhoneNumberField/PhoneNumberField.test.js --watchAll=false --runInBand
```

Expected: PASS。

---

## Task 6: 全量清理和验证

**预计耗时:** 45-60 分钟  
**独立性:** 依赖 Task 2-5。  
**Files:**

- Modify as needed: Task 2-5 touched files

- [ ] **Step 1: 搜索重复结构残留**

Run:

```powershell
Select-String -Path src\container\phoneInput\index.js,src\component\CRM\LoginCRM\components\LoginModal.js,src\component\GiftCardPayment\QueryGiftCard.js,src\container\orderPage\bannerPro\components\buyGiftCard.js -Pattern 'PhoneNumberField|Policy|jingleBell|numTitleWrapper|showPhone|displayPhone|formatUSPhoneNumber|formatPhone|NumPad' -CaseSensitive
```

Expected:

- 4 个页面不再直接 import `PhoneNumberField`。
- 4 个页面不再直接 import `Policy` 用于手机号输入区。
- 4 个页面不再有手机号输入区的 `showPhone/displayPhone/NumPad`。
- `QueryGiftCard.js` 可以保留非手机号输入的 `.queryInput`。
- `jingleBell` 只应由 `PhoneNumberEntryLayout` 统一 import。

- [ ] **Step 2: 搜索 layout 使用点**

Run:

```powershell
Select-String -Path src\container\phoneInput\index.js,src\component\CRM\LoginCRM\components\LoginModal.js,src\component\GiftCardPayment\QueryGiftCard.js,src\container\orderPage\bannerPro\components\buyGiftCard.js -Pattern '<PhoneNumberEntryLayout'
```

Expected: 4 个手机号场景都能搜到 `PhoneNumberEntryLayout`。

- [ ] **Step 3: 全量测试**

Run:

```bash
yarn react-scripts test --watchAll=false --runInBand
```

Expected: PASS，包含 `PhoneNumberField` 和 `PhoneNumberEntryLayout` 测试。

- [ ] **Step 4: 构建验证**

Run:

```bash
yarn build:dev
```

Expected: exit code 0。允许项目既有的 CSS order、Browserslist、baseline 数据 warning。

- [ ] **Step 5: Vercel React 规范自查**

检查：

- `PhoneNumberEntryLayout` 不引入业务 API 和 Redux。
- 不在 layout 中保存可由 props 派生的 state。
- 不在 render 中创建昂贵计算。
- `PhoneNumberField` 的 `PHONE_KEYS` 保持组件外常量。
- 不新增 barrel import。
- 事件处理仍由页面业务组件持有。

- [ ] **Step 6: diff 检查**

Run:

```bash
git diff -- src/component/PhoneNumberEntryLayout src/component/PhoneNumberField src/utils/phoneNumber.js src/container/phoneInput src/component/CRM/LoginCRM/components/LoginModal.js src/component/CRM/LoginCRM/components/LoginModal.module.scss src/component/GiftCardPayment/QueryGiftCard.js src/component/GiftCardPayment/QueryGiftCard.module.scss src/container/orderPage/bannerPro/components/buyGiftCard.js src/container/orderPage/bannerPro/components/buyGiftCard.module.scss
```

Expected:

- 没有业务接口改名。
- 没有新增硬编码文案。
- 没有修改验证码输入逻辑。
- 没有修改 Email/Card Number 查询逻辑。
- 没有与手机号布局统一无关的文件变更。

---

## 并行执行建议

顺序：

1. Task 1 必须先完成。
2. Task 2、Task 3、Task 4、Task 5 可并行执行，写入文件互不重叠。
3. Task 6 最后执行。

文件所有权：

- Worker A: `src/component/PhoneNumberEntryLayout/*`
- Worker B: `src/component/CRM/LoginCRM/components/LoginModal.*`
- Worker C: `src/container/phoneInput/*`
- Worker D: `src/component/GiftCardPayment/QueryGiftCard.*`
- Worker E: `src/container/orderPage/bannerPro/components/buyGiftCard.*`

所有 Worker 必须保留 `PhoneNumberField` 和 `PhoneNumberEntryLayout` 的公开接口，不要回滚其他任务的改动。
