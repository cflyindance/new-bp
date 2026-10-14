# 多级导航独立权限 Implementation Plan

> **For agentic workers:** 按用户已批准的规则在当前会话逐项执行；本任务不自动提交、推送或扩大到生产鉴权。

**Goal:** 所有真实导航层级独立配置查看权限，父关闭阻断下级且不清配置，同级互不影响。

**Architecture:** 真实菜单树生成 module → navigation → page → action/setting 资源链。保留原页面/动作键，通过一次性、无扩权的内存兼容迁移补齐旧数据的导航门控，正常保存时持久化。

**Tech Stack:** TypeScript、原生 DOM、Vite、Node assert、agent-browser。

**Spec:** [产品权威](../specs/2026-09-23-permission-management-center-authoritative.md)（本轮同步 PERM-20261014-01）。

## Global Constraints

- 同人不同门店分别计算；角色先并集再应用个人覆盖及完整祖先门控。
- 不改页面、按钮、设置既有资源键，不自动允许新增动作或页面。
- 保留仅用于组织的门店管理公共目录，集团/品牌授权不合并。
- 编辑、员工权限、预览共用目录；保留滚动及展开状态。
- 生产 API、登录、邮件服务不在本轮范围；不修改 eMenu vendor。

## Task 1：目录和旧授权兼容

Files: `src/permissions/center-domain.ts`、`center-catalog.ts`、`center-navigation-migration.ts`、`center-store.ts`；Test: `scripts/verify-permission-navigation.ts`。

Interfaces: `navigationKey(moduleId, id)` 生成稳定键；`migrateNavigationPermissions(state, resources, stores)` 返回兼容后的 CenterState，不执行写入。

- [x] RED：商品管理、调味管理、标签管理均存在独立资源；叶子 parent 是直接导航父级。
  ```ts
  assert.equal(catalog.resources.get(navigationKey('product-center-main','bp-seasoning-mgmt'))?.parent,
    navigationKey('product-center-main','pcm-brand-products'));
  ```
- [x] RED：调味 hidden、标签 read 时仅调味子树隐藏；恢复调味后原动作恢复，角色 grants 除当前导航键不变。
- [x] GREEN：递归先创建中间导航资源，再挂直接子节点；新增 navigation 类型，其值域 hidden/read。
- [x] GREEN：`navigationVersion:1` 标记新模型；旧数据补兼容门控但保留全部旧 grants/覆盖/范围。无适用角色的个人允许只补必要导航祖先。读取不写，正常保存时写入；标记后新增资源仍默认拒绝。
- [x] 验证：所有非虚拟树节点有唯一资源，所有树父子关系与 resource.parent 一致；以旧扁平父级目录比较每个角色/员工在所有门店的旧页面、动作、设置结果完全相等；迁移重复执行不变。

## Task 2：编辑、个人覆盖及预览

Files: `src/permissions/center-editor.ts`、`center-ui.ts`、`center.css`；Test: 上述导航回归及现有权限回归。

- [x] RED：所有中间节点有独立控件；只读员工展示状态；预览隐藏整个拒绝子树但保留可见同级。
- [x] GREEN：导航标题可选中，展开箭头独立；右侧展示完整面包屑、当前导航门控和直接子导航权限。叶子仍展示真实动作/设置。
- [x] GREEN：完整祖先阻断时下级禁用，展示已配置值并提供禁用原因；允许父级不批量改子级。
- [x] 验证：搜索父导航能显示其子树，选中、滚动与展开状态保持；预览关闭不改变编辑选择。

## Task 3：三份文档及实际页面验证

Files: 现有产品、研发、个人版；Assets: `docs/superpowers/specs/assets/permission-navigation/`。

- [x] 同步 V2.7/V1.7/V1.7、PERM-20261014-01，修正仅模块/页面门控的旧定义；写明数据兼容、正常/边界/异常算例。
- [x] 执行 `scripts/verify-permission-navigation.ts`、`scripts/verify-permission-center.ts`、`tsc --noEmit`、独立 Vite build。
- [x] 独立浏览器测试：在测试角色草稿配置调味不可见、标签可见，验证预览、关闭父级/恢复、同级不变、保存及刷新；不改变用户已有角色。
- [x] 保存真实页面截图，三份文档就近引用；仅关闭本轮已实际验证的缺口，不宣称全站安全接入完成。
- [x] 自审 diff、互链、版本及范围；未获本轮 Git 授权时不提交或推送。

## 实际验证记录

2026-10-14：首轮 RED 为商品管理缺少独立资源；最终导航/权限回归和类型检查通过，Vite 550 模块构建成功。浏览器实测及三张截图见配套研发版 §6；独立审阅 Approved。本次代码、测试、三份文档及配图按用户授权独立提交，不自动推送；用户原工作区不变。
