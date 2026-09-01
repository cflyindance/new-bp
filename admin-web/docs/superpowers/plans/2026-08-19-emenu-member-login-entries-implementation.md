# eMenu 会员登录入口独立控制实施计划

**设计依据**：`docs/superpowers/specs/2026-08-19-emenu-member-login-entries-design.md`

## 1. 建立配置定义与兼容读取

- 在 `vendor/emenu-new/src/constants/systemConfig.js` 新增 `showMenuMemberLoginEntry`，优先使用 id 94；实施前再次确认 id 未被占用。
- 默认值设为 `{ open: true }`，并加入 `ALL_CONFIG_ITEM`，保证旧设备缺省行为与现状一致。
- 保留 id 40 `isCrmNeedAuthLogin` 的存储极性：`open: true` 仍表示关闭点单前登录页，不迁移历史数据。
- 新增集中式会员入口策略 helper，统一计算：
  - 点单前是否展示：id 34 必须登录开启时恒为 `true`，否则为 `!id40.open`。
  - 菜单页入口是否展示：id 94 缺失时默认为 `true`。
- 不在各组件继续散写 id、默认值或反向布尔逻辑。

## 2. 重构后台「用户设置」卡片

- 修改 `vendor/emenu-new/src/pages/GlobalSetting/components/UserSetting.jsx`：
  - 保留 id 34 独立卡片。
  - 将原 id 40 独立开关替换为无总开关的「展示会员登录入口」分组卡。
  - 分组内渲染「点单前弹出登录/注册页」和「菜单页展示登录入口」两个子开关。
  - 第一个子开关显示值使用 `!id40.open`，保存时再反向写回。
  - 第二个子开关直接读写 id 94。
- 修改 `UserSetting.module.less`，复用现有子项布局，仅补齐标题、说明、间距和禁用态所需样式。
- 调整 `userSettingMap`，避免 id 40 与 id 94再次作为普通独立卡片渲染。

## 3. 完成互斥与非法状态兜底

- id 34「必须登录」开启时：
  - 强制点单前展示登录页；
  - 「点单前弹出」子开关显示为开并置灰。
- 「点单前弹出」已关时开启「必须登录」，拦截并提示先打开点单前入口。
- 「必须登录」已开时尝试关闭「点单前弹出」，拦截并提示先关闭必须登录。
- 使用页面已有 Material UI 自定义对话框，不引入浏览器原生弹窗。
- 后台读到非法组合 `id34.open=true && id40.open=true` 时，将 id 40 纠正为 `open:false`；食客端 helper 同时以必须登录优先，避免纠正写入前绕过登录。

## 4. 接入点单前登录流程

- 修改 `vendor/emenu-new/src/pages/SetupOrder/index.jsx`，改用集中式 helper 判断是否弹出会员登录页。
- 保持海报、人数选择、会员权益海报及「稍后登录/注册」现有步骤顺序不变。
- 验证 id 40 旧值无需迁移：
  - `open:false` → 点单前弹出；
  - `open:true` → 点单前不弹；
  - id 34 开启时覆盖上述结果并弹出。

## 5. 接入普通菜单页入口

- 修改 `vendor/emenu-new/src/hooks/useIsMemberLogin.js`，返回统一的菜单页入口可见状态，并让 `isHideBar` 同时考虑 id 94，避免横幅关闭后残留顶部间距。
- 修改 `vendor/emenu-new/src/components/CRMLogin/Banner.jsx`，菜单页入口关闭时隐藏登录引导横幅。
- 修改 `vendor/emenu-new/src/components/CRMLogin/index.jsx`：
  - 未登录且入口关闭时隐藏默认头像；
  - 已登录时仍显示头像并可进入会员中心；
  - 无论头像是否隐藏，保留 `Dialog`/`Drawer` 宿主，使积分兑换等业务触发仍可打开登录。

## 6. 接入 eMenu Pro 登录按钮

- 修改 `vendor/emenu-new/src/pages/Order/components/emenuProOrder/dynamicComponents/MemberLoginButton.jsx`。
- 未登录且菜单页入口关闭时，仅让 `renderButton` 不输出按钮。
- 禁止卸载整个 `CRMLogin`；Pro 页面没有普通 TopBar，该组件仍需承载积分兑换等业务触发的登录 Dialog。
- 已登录时继续展示主题中的会员按钮并进入会员中心。

## 7. 补齐多语言文案

- 更新 `vendor/emenu-new/src/locales/*.json`：
  - 分组标题、副文案；
  - 两个子开关标题和说明；
  - 两个方向的互斥提示。
- `zh.json`、`zh-Hant.json` 使用设计规格中的明确文案；`en.json` 使用确认的英文语义；其余现有语言补齐等价翻译。
- 后台停止引用旧 `limit_isCrmNeedAuthLogin_title/subtitle`，但不必删除旧 key，避免其它版本或缓存引用出错。

## 8. 验证

- 静态检查：
  - 搜索确认新 id 唯一、id 40 极性未被翻转；
  - 对改动文件运行 ESLint/Prettier 检查，避免使用会批量改写无关文件的 `npm run lint --fix`；
  - 运行 `npm run build` 验证 Vite 构建。
- 手工回归普通菜单与 eMenu Pro：
  - 验证两个子开关四种组合；
  - 验证未登录头像、横幅、Pro MemberLogin 按钮；
  - 验证已登录头像/会员中心始终可用；
  - 验证积分兑换等业务触发仍可弹登录；
  - 验证 CRM 未开通时无入口；
  - 验证两种互斥操作、置灰态和非法历史组合兜底；
  - 验证浏览器控制台无新增错误。
- 权威改动和验证在 worktree 完成；每批业务文件同步到主工作区 `admin-web/vendor/emenu-new/`，供本地 Vite HMR 预览。

## 9. 交付边界

- 不修改商家后台 seq 623。
- 不修改 Kiosk、SDI、Online Order。
- 不拆分菜单头像和横幅开关。
- 不关闭积分兑换等业务动作触发的登录能力。
- 不提交、不推送；完成后仅汇报改动、验证结果和工作区状态，等待用户明确要求。
