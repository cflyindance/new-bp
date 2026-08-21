# 菜单路由配置完整商家后台示例数据设计

## 背景

菜单路由配置当前使用手写的简化 `demoNodes`，仅包含首页、运营中心和商品中心，无法覆盖商家后台现有目录，也不足以验证完整树结构、项目内路由、iframe、三级菜单及服务权限关联选择。

## 目标

- 默认测试数据直接覆盖当前商家后台完整菜单目录。
- 示例目录尽量复用商家后台现有导航配置，避免重复维护后失真。
- 输出仍严格使用参考菜单 JSON 已有字段。
- 覆盖一级、二级、三级、项目内页面、iframe、服务和权限等测试场景。
- 不删除用户浏览器中既有的 `v2` 演示数据。

## 数据来源

以 `navigation.ts` 导出的 `NAV_MODULES` 为一级目录来源。二级和三级使用以下确定映射：

- `product-center-main`：三个二级分组分别使用 `BRAND_PRODUCTS_SUBNAV`、`BRAND_MENU_SUBNAV`、`STORE_MENU_SUBNAV` 生成三级。
- `marketing`：使用 `MARKETING_SHEET_SUBNAV`。
- `promotions`：使用 `PROMOTIONS_MGMT_SUBNAV`。
- `members`：合并 `MEMBERS_SHEET_SUBNAV` 与 `MEMBERS_SHEET_SETTINGS_SUBNAV`。
- `gift-cards`：合并 `GIFT_CARDS_SHEET_MAIN_SUBNAV` 与 `GIFT_CARDS_SHEET_SETTINGS_SUBNAV`。
- `reservations`：使用 `RESERVATIONS_SHEET_SUBNAV`。
- `reports-finance`：使用 `REPORTS_SHEET_SUBNAV`。
- `finance-center`：合并 `FINANCE_SHEET_SUBNAV` 与 `FINANCE_SHEET_SETTINGS_SUBNAV`。
- `print-templates`：使用 `PRINT_SHEET_SUBNAV`。
- 其余模块：严格使用对应 `NAV_MODULES.children`。

验证时为每个模块构建“源可点击路由集合”。专用常量覆盖模块的源集合来自该常量及其 `sidebarChildren`；其他模块来自 `NAV_MODULES.children`。生成后的叶子路由集合必须与源集合等价，重复别名路径按集合去重。

转换器放在菜单路由配置领域内，输入导航模型，输出 `MenuNode[]`，不修改商家后台导航源数据。

## 转换规则

### 一级菜单

- `NavModule.id` 作为一级节点的源身份段，最终 `MenuNode.id` 与 `key` 统一使用下述全层级唯一算法生成。
- `title`、`titleEn` → `name` 与 `i18nInfo`。
- 图标标识映射到现有 `icon` 字段。
- 有子项时作为目录，只输出 `children`，不输出页面类型、路径或 URL。
- 无子项时使用模块 `path`，输出 `type: "inner"`。

### 二级与三级菜单

- 可点击导航项使用真实 `path`，输出 `type: "inner"`。
- 有下级目录的导航项作为目录，不输出页面字段。若该项自身 `path` 与首个子项路径相同，视为默认入口别名，不重复生成；若自身路径与所有子项均不同，则在其下生成“概览”叶子保留该路径。
- 菜单路由编辑器最多支持三级。商家后台实际结构超过三级时，将更深层的可点击项压平到三级，并使用“父分组 · 子项”的名称保留归属关系。
- 所有层级使用同一稳定唯一算法。原始命名空间由完整祖先源身份段与当前源身份段组成；有源 ID 时使用 `id:<源ID>`，没有源 ID 时使用 `path:<完整路由>`。同一父级出现完全相同身份段时，按源数组顺序追加 `occurrence:<序号>`。
- 生成值由“可读规范化前缀 + 原始命名空间 UTF-8 Base64URL 无损编码”组成：`id` 以 `demo-` 开头，`key` 以 `demo_` 开头。Base64URL 部分无损参与唯一性，不使用可能碰撞的截断哈希。重复路径只对路由覆盖集合去重，不允许覆盖不同命名空间节点。

### iframe 示例

- “礼品卡中心 → 礼品卡工厂”作为 iframe 测试节点。
- `path` 保留商家后台内部路由 `/gift-cards/cards`。
- `url` 固定使用 `https://example.com/menusifu-gift-card-demo`，只作为配置值示例，不伪装为生产服务地址。
- 节点只使用 `type`、`path`、`url` 等参考 JSON 已有字段。
- 菜单编辑器预览不得请求 iframe URL；该示例数据不自动发布到真实商家后台。验证拒绝 HTTP 和非该固定演示来源。实际商家后台 iframe 隔离策略不在本次测试数据变更范围内。

### 服务与权限示例

在以下代表性叶子节点中写入 `accessControl: { bool: true, serviceName, permission: { rule: "some", value } }`：

- `/brand-products/products`：`m_master` + `permission.value: ["brand_item_menu_manage"]`。
- `/brand-menu/menus`：`m_master` + `permission.value: ["merchant_item_menu_manage"]`。
- `/menu/store-menu`：`m_master` + `permission.value: ["store_item_menu_manage"]`。
- `/promotions/campaigns`：`promotion` + `permission.value: ["promotion_campaign_view_access", "promotion_campaign_edit_access"]`。
- `/promotions/lottery`：`promotion` + `permission.value: ["promotion_lottery_manage_access"]`。
- `/reports/revenue`：`cloud_report_service` + `permission.value: ["report_revenue_view_access"]`。
- `/reports/sales/orders`：`cloud_report_service` + `permission.value: ["report_sales_view_access"]`。
- `/reports/products/ranking`：`cloud_report_service` + `permission.value: ["report_product_view_access"]`。
- `/print-templates/decoration`：`print` + `permission.value: ["print_template_view_access", "print_template_edit_access"]`。

同一服务在多个节点出现不同权限，用于验证编辑器能从同节点共现关系归纳服务下的权限集合。不得增加服务权限目录字段。

## 演示存储版本

- 发布存储键固定为 `menusifu:json-menu-editor:published-v3`，草稿存储键固定为 `menusifu:json-menu-editor:draft-v3`。
- `v3` 首次读取不到数据时生成新的完整默认示例。
- 不读取、不覆盖、不删除 `v2` 键，因此旧示例和用户本地旧数据仍保留在浏览器存储中。
- 新版的保存、发布与放弃草稿只操作 `v3` 键。

## 验证

- 默认示例一级菜单数量与 `NAV_MODULES` 一致，每个一级模块均存在。
- 每个模块的源可点击路由集合与生成后的叶子路由集合等价，包含专用常量、`sidebarChildren`、默认入口别名和三级压平结果。
- 菜单深度不超过三级。
- 所有节点 ID、Key 在示例内唯一。
- 覆盖跨模块重复源 ID、同名子项、同父级重复身份段、相同可读规范化前缀和重复路径，验证无损命名空间编码及 occurrence 序号不会覆盖节点。
- 所有项目内页面路径以 `/` 开头。
- iframe 节点同时具有有效 `path` 与固定 HTTPS 演示 URL；HTTP、其他来源和格式错误 URL 均不进入默认示例。
- 服务与权限示例只使用 `accessControl.serviceName`、`bool` 和 `permission`。
- 序列化和参考 JSON 兼容性校验通过。
- 验证同一服务多节点权限并集、去重，以及不同服务之间互不混入。
- 仅存在 `v2` 时读取生成 `v3` 默认值且 `v2` 字节不变；已有合法 `v3` 时不重置。
- 保存草稿、发布、放弃草稿只改变对应 `v3` 键；损坏的 `v3` 按现有容错规则回退默认示例，空草稿返回 `null`。
- HTTP 仓储模式不使用任何演示存储键。
