# Kiosk 促销活动标题与活动标签实施计划

**目标：** 为 Kiosk 本地促销增加中英文活动标题、活动标签，并让 `configMap.id_64` 统一控制本地与云端促销在食客端的识别名称。

**设计规格：** `docs/superpowers/specs/2026-08-19-kiosk-promotion-title-label-design.md`

**技术栈：** React 17、Redux、Ant Design 5、i18next、Vitest、Vite 8

**实施原则：**

- 权威修改、依赖操作、测试和构建均在 `wt/kiosk-promotion-labels` worktree 完成。
- 每完成一组可验证变更，同步相同文件到主工作区。
- 不自动执行 commit、push、PR 或发布。
- 先完成解析器与测试，再接表单和展示面，避免各组件继续复制判断逻辑。

---

## 文件地图

### 新增

- `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/resolvePromotionDisplayName.js`
- `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/resolvePromotionDisplayName.test.js`
- `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/getPromotionCenterDisplayText.test.js`
- `admin-web/dist/kiosklite/src/component/PromotionDealList/promotionPresentation.js`
- `admin-web/dist/kiosklite/src/component/PromotionDealList/promotionPresentation.test.js`
- `admin-web/scripts/verify-kiosk-promotion-title-label.mjs`

### 核心修改

- `admin-web/dist/kiosklite/src/constants/selfConfig.js`
- `admin-web/dist/kiosklite/src/container/configApp/Promotion/components/AddActivity.js`
- `admin-web/dist/kiosklite/src/container/configApp/serviceSetting/serviceItem/index.js`
- `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/getPromotionCenterDisplayText.js`
- `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/index.js`
- `admin-web/dist/kiosklite/src/component/PromotionDealList/index.js`
- `admin-web/dist/kiosklite/src/component/OrderDiscountInfo/index.js`
- `admin-web/dist/kiosklite/src/component/PromotionTagsWrap/index.js`
- `admin-web/dist/kiosklite/src/container/app/CrmPromotionMutual.js`
- `admin-web/dist/kiosklite/src/container/orderReview/index.js`（仅活动识别名称调用点）
- `admin-web/dist/kiosklite/src/hooks/useAddOnPromotion.js`
- `admin-web/dist/kiosklite/src/component/RewardCenter/ItemsDrawer.js`
- `admin-web/dist/kiosklite/src/component/CloudPromotionCenter/ItemPromotionModal.js`
- `admin-web/dist/kiosklite/selfConfigList配置说明文档.md`

### 国际化

`admin-web/dist/kiosklite/src/assets/i18n/locale/` 下：

- `ZH-CN.json`
- `ZH-traditional.json`
- `En.json`
- `Jan.json`
- `Korean.json`
- `French.json`
- `Spanish.json`
- `Russian.json`
- `Thai.json`
- `Vietnamese.json`

### 构建产物

- `admin-web/dist/kiosklite/.embed-build/**`（由 `npm run build:kiosklite-embed` 生成，不手改）

---

## Task 1：先用测试锁定统一解析规则

**Files**

- Create: `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/resolvePromotionDisplayName.test.js`

### 步骤

- [ ] 编写表驱动测试，覆盖：
  - `source` 的 `0 / 1 / 2` 及数字字符串；
  - 本地活动按中文取 `activityTitle.zh / activityTag.zh`；
  - 英文及非中文语言取 `.en`；
  - `zh`、`zh_cn`、`zh-CN`、`zh-TW`、`ZH-HK` 均判为中文；
  - 云端在 `1 / 2` 时均取 `promotionName`；
  - 旧数据字段缺失、`null`、非字符串、纯空格、结构异常时回退；
  - 未知配置值按 `0`；
  - `ruleText` 为 `string[]` 时原样回退，不隐式转字符串。
- [ ] 运行定向测试，确认因解析器尚不存在而失败：

```powershell
npm test -- src/utils/PromotionCenterIntegration/resolvePromotionDisplayName.test.js
```

**预期：** 测试失败，原因仅为目标模块或函数尚未实现。

- [ ] 失败确认后立即将测试文件同步到主工作区，保持本批变更双写。

---

## Task 2：实现纯函数解析器并让测试通过

**Files**

- Create: `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/resolvePromotionDisplayName.js`
- Modify: `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/index.js`

### 步骤

- [ ] 实现 `normalizePromotionDisplaySource`：
  - 按设计规格先执行 `Number(source)`；
  - 有效值仅 `0 / 1 / 2`；
  - 其他输入按 `0`；
  - 测试明确覆盖空值、布尔值、空数组和带空格字符串的实际 `Number()` 行为，保证规格与实现一致。
- [ ] 实现 `isChinesePromotionLanguage`：
  - 小写化；
  - `_` 转 `-`；
  - 等于 `zh` 或以 `zh-` 开头。
- [ ] 实现候选字符串清洗：仅接受字符串，`trim()` 后为空视为缺失。
- [ ] 实现 `resolvePromotionDisplayName({ source, language, origin, promotion, ruleText })`：
  - `origin: local` 从顶层 `activityTitle / activityTag` 取值；
  - `origin: cloud` 在来源 `1 / 2` 时取 `promotionName`；
  - 非法 `origin` 或候选缺失时回退 `ruleText`；
  - 回退时保持 `string | string[]` 原类型。
- [ ] 从聚合入口导出解析器。
- [ ] 运行 Task 1 定向测试并修正至通过。
- [ ] 同步新增文件到主工作区。

---

## Task 3：扩展本地促销数据模型与双语表单

**Files**

- Modify: `admin-web/dist/kiosklite/src/constants/selfConfig.js`
- Modify: `admin-web/dist/kiosklite/src/container/configApp/Promotion/components/AddActivity.js`
- Modify: 10 个 locale JSON

### 步骤

- [ ] 在 `promotionItem` 顶层增加：

```js
activityTitle: { zh: '', en: '' },
activityTag: { zh: '', en: '' },
```

- [ ] 在 `AddActivity` 的【活动类型】后加入【活动标题】和【活动标签】两组输入，每组包含中文、英文两个 `Form.Item`。
- [ ] 使用嵌套字段：
  - `['activityTitle', 'zh']`
  - `['activityTitle', 'en']`
  - `['activityTag', 'zh']`
  - `['activityTag', 'en']`
- [ ] 为四项增加必填及空白字符串校验；错误落在对应输入处。
- [ ] `handleConfirmAdd` 保存前规范化四项首尾空格。
- [ ] 保持 `changeActivity` 只重置 `activityRule`，不清空标题和标签。
- [ ] `getInitialValues` 兼容旧活动：字段缺失时补空对象供表单显示；旧活动再次保存时必须补齐。
- [ ] 增加中英文表单标签、语言标签和校验提示的 i18n key；所有 locale 都存在对应 key，非中英文后台语言可使用准确翻译或英文文案，不能显示 key。
- [ ] 手动验证：
  - 四项缺任一项不能保存；
  - 纯空格不能保存；
  - 切换活动类型字段不丢失；
  - 保存后编辑可回填；
  - 旧活动可打开但未补齐不能再次保存。
- [ ] 同步该批文件到主工作区。

---

## Task 4：展示设置增加【活动标签】

**Files**

- Modify: `admin-web/dist/kiosklite/src/container/configApp/serviceSetting/serviceItem/index.js`
- Modify: 10 个 locale JSON
- Modify: `admin-web/dist/kiosklite/selfConfigList配置说明文档.md`

### 步骤

- [ ] 将 `map['promotion-center-activity-name']` 的 Radio 数量从 `2` 改为 `3`。
- [ ] 为全部 locale 增加 `promotion-center-activity-name-2`，中文为【活动标签】，英文为 `Activity Tag`。
- [ ] 保持默认值 `id_64 = 0`，不迁移现有配置。
- [ ] 更新配置说明：
  - `0` 系统默认；
  - `1` 活动名称；
  - `2` 活动标签；
  - 明确同时控制本地和云端；
  - 明确本地、云端回退及语言规则。
- [ ] 在主工作区设置页确认三个 Radio 均可选、保存后能回读。
- [ ] 同步该批文件到主工作区。

---

## Task 5：让云端现有解析 API 委托统一解析器

**Files**

- Modify: `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/getPromotionCenterDisplayText.js`
- Create: `admin-web/dist/kiosklite/src/utils/PromotionCenterIntegration/getPromotionCenterDisplayText.test.js`
- Modify: 必要的云端调用点

### 步骤

- [ ] 保留两个现有导出，但严格拆分职责：
  - `getPromotionCenterActivityRuleText` 负责活动识别名称，可委托统一解析器；
  - `getPromotionCenterTextFromTextObject` 继续只解析 `text.i18nKey` 交易条件，不读取 `id_64`、标题或标签，确保订单确认页“下一档条件”永不被 `promotionName` 替换。
- [ ] `getPromotionCenterActivityRuleText` 的最终文案选择委托给 `resolvePromotionDisplayName`，显式传：
  - `origin: 'cloud'`
  - `source: selfConfig?.configMap?.id_64`
  - 当前 `i18n.language`
  - 完整或最小云端 promotion 数据
  - 已生成的 `ruleText`
- [ ] 阶梯规则先沿用现有匹配逻辑生成匹配档位或数组，再交给解析器。
- [ ] 为包装 API 增加单测：
  - 云端 `source 0 / 1 / 2`；
  - 匹配阶梯与数组回退；
  - `getPromotionCenterTextFromTextObject` 在任意 `id_64` 下始终返回规则条件文案。
- [ ] 运行解析器和包装 API 定向测试。
- [ ] 同步该批文件到主工作区。

---

## Task 6：接入菜单「优惠活动」与本地抽屉

**Files**

- Modify: `admin-web/dist/kiosklite/src/component/PromotionDealList/index.js`
- Modify: `admin-web/dist/kiosklite/src/component/OrderDiscountInfo/index.js`
- Create: `admin-web/dist/kiosklite/src/component/PromotionDealList/promotionPresentation.js`
- Create: `admin-web/dist/kiosklite/src/component/PromotionDealList/promotionPresentation.test.js`

### 步骤

- [ ] 本地满减、M 件 N 折、买赠、加价换购派生条目统一保留 `promotion: row`。
- [ ] 新增纯展示模型帮助函数，统一产出：

```js
{
  promotion,
  displayName,
  ruleText,
  // 保留现有类型、适用范围等字段
}
```

- [ ] 先按当前逻辑计算 `ruleText`，再通过统一解析器生成 `displayName`；禁止继续用含义模糊的同一个 `text` 同时承担名称和条件。
- [ ] `source = 0` 保持当前展示。
- [ ] 卡片标题和本地商品选择抽屉 `displayName` 使用解析结果。
- [ ] 修改 `OrderDiscountInfo` 的数据契约与渲染：
  - 标题位置读取 `displayName`；
  - 条件说明读取 `ruleText`；
  - `ruleText` 为数组时沿用现有多档渲染；
  - `source = 0` 时如名称与条件相同，按现有视觉避免无意义重复，但不得隐藏条件。
- [ ] 为展示模型帮助函数增加测试：
  - 四类本地活动均保留完整 `promotion`；
  - `displayName` 随 `source / language` 变化；
  - `ruleText` 始终保持原条件；
  - 多档数组不丢失。
- [ ] 验证四类本地促销与云端促销在 `0 / 1 / 2` 下均正确。
- [ ] 同步文件到主工作区。

---

## Task 7：接入菜品促销标签

**Files**

- Modify: `admin-web/dist/kiosklite/src/component/PromotionTagsWrap/index.js`

### 步骤

- [ ] 本地满减、M 件 N 折、买赠标签保留完整活动对象，不再只映射为规则字符串。
- [ ] 每个本地标签先生成规则文案，再以 `origin: 'local'` 调解析器。
- [ ] 云端标签继续通过统一后的云端 API。
- [ ] 过滤空结果，保证异常数据不渲染空标签。
- [ ] 验证简体、繁体、英文及任一非中英文语言。
- [ ] 同步文件到主工作区。

---

## Task 8：接入互斥提示、购物车及订单确认的活动识别名称

**Files**

- Modify: `admin-web/dist/kiosklite/src/container/app/CrmPromotionMutual.js`
- Modify: `admin-web/dist/kiosklite/src/container/orderReview/index.js`（按实际识别名称调用点）
- Modify: `admin-web/dist/kiosklite/src/hooks/useAddOnPromotion.js`
- Modify: `admin-web/dist/kiosklite/src/component/RewardCenter/ItemsDrawer.js`
- Modify: `admin-web/dist/kiosklite/src/component/CloudPromotionCenter/ItemPromotionModal.js`

### 步骤

- [ ] 将本地 `haveJoin`、互斥提示中的 `activeTxt` 改为统一解析结果。
- [ ] 移除标题/标签后不再合理的硬编码 `${t('activity')}` 拼接；提示句式本身保持现有 i18n。
- [ ] 购物车、订单确认中仅替换明确承担“活动名称”的插值。
- [ ] 以下交易条件不改：
  - 满减进度；
  - 下一档门槛；
  - 金额、折扣比例、赠品数量；
  - 促销码有效性说明。
- [ ] `useAddOnPromotion`：凑单抽屉 `displayName` 使用活动识别名称，门槛和奖励条件保持规则文案。
- [ ] `ItemsDrawer`：标题/活动标签使用识别名称，商品与奖励说明不变。
- [ ] `ItemPromotionModal`：弹窗活动标题使用识别名称，商品级优惠条件不变。
- [ ] `orderReview` 的 `getPromotionCenterTextFromTextObject` 下一档条件调用保持原样，并加入专项回归断言。
- [ ] 验证同一活动在列表、标签、抽屉、购物车和互斥提示中的识别名称一致。
- [ ] 同步该批文件到主工作区。

---

## Task 9：完整自动化验证

**工作目录：** worktree 的 `admin-web/dist/kiosklite`

### 步骤

- [ ] 运行解析器定向测试：

```powershell
npm test -- src/utils/PromotionCenterIntegration/resolvePromotionDisplayName.test.js
```

- [ ] 运行 kiosklite 全量测试：

```powershell
npm test
```

- [ ] 新增并运行 `admin-web/scripts/verify-kiosk-promotion-title-label.mjs`：
  - 解析全部 locale JSON；
  - 断言第三个设置选项和表单 key 齐全；
  - 断言主要展示文件接入统一解析器或展示模型；
  - 断言 `getPromotionCenterTextFromTextObject` 未接入活动名称选择；
  - 断言本地展示模型同时保留 `displayName` 与 `ruleText`。

```powershell
Set-Location ..\..
node scripts/verify-kiosk-promotion-title-label.mjs
```

- [ ] 搜索并人工分类残余本地活动名称内联生成点；只保留纯交易条件文案，并将清单记录在验收结果中。
- [ ] 检查改动文件中没有新增原生 `alert / confirm / prompt`。
- [ ] 检查 IDE lints，修复本次引入的问题。

---

## Task 10：构建、同步与手动验收

**工作目录：** worktree 的 `admin-web`

### 步骤

- [ ] 执行：

```powershell
npm run build:kiosklite-embed
```

- [ ] 将相同源码、文档及 `.embed-build` 产物同步到主工作区。
- [ ] 确认主工作区 Vite 已 reload；未运行时在主工作区执行 `npm run dev`。
- [ ] 在 Kiosk 本地配置后台验收：
  1. 展示设置出现【系统默认 / 活动名称 / 活动标签】。
  2. 新建活动出现四个必填输入。
  3. 编辑、保存、回填正常。
  4. `id_64 = 0 / 1 / 2` 分别展示规则、标题、标签。
  5. 简体和繁体使用中文；英文及其他语言使用英文。
  6. 旧本地活动回退规则文案。
  7. 云端选择活动标签时回退 `promotionName`。
  8. 各食客展示面的活动识别名称一致，交易条件完整。
- [ ] 比对 worktree 与主工作区的本任务文件内容，确保双写一致。
- [ ] 汇报变更、测试结果、构建结果和两处工作区状态；不提交 Git。

---

## 完成标准

- 设计规格中的三种展示来源、双语必填、语言回退和旧数据兼容均有测试或明确验收记录。
- 本地与云端促销共用同一个纯函数解析规则。
- 本地促销派生数据不丢失标题、标签或稳定活动身份。
- 所有食客可见的活动识别名称一致切换，交易条件不被标题或标签覆盖。
- kiosklite 测试通过，embed 构建成功。
- worktree 与主工作区镜像文件一致。
- 未创建 commit、未 push、未创建 PR。
