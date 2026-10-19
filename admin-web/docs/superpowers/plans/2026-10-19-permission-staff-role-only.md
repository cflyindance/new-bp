# 员工仅角色授权实现计划

基线main@7de9d465，分支codex/permission-staff-role-only-20261019。用户明确选择方案2：清除全部个人例外，按角色和门店范围生效；不生成专用角色，不提交/合并/推送。

## 边界

仅本地权限工作台。保留角色定义、绑定及stores/brands/regions范围、账号状态和旧业务RBAC。清除全部员工/全部门店（含失效门店键）的overrides。先备份原始快照，再写新状态，版本递增并记录迁移审计；失败不返回已迁移状态。已清理数据再次读取不写入。

## 实现和校验

- [x] scripts/verify-permission-staff-role-only.ts先RED，覆盖有/无例外、幂等、备份失败、写入失败、过期版本保存、防止旧例外复活及不同角色/范围；补充真实存储读取路径的合成快照联测。
- [x] 新增center-role-only.ts迁移器，center-store读取/初始种子接入；CENTER_KEY保留，备份键用before-roles-only:v<旧版本>，备份冲突拒绝覆盖。
- [x] CenterState.employeeAuthorization标记roles-only；resolveAccess仅该模式忽略异常残留；旧模式仅供兼容测试和历史备份解释。
- [x] validateCenterState拒绝roles-only非空例外，persistCenterChange拒绝降级该标记，过期窗口沿用版本冲突保护。
- [x] center-ui移除例外入口、数量和写入事件，员工权限面板恒只读；角色分配/移除/账号状态及草稿保护保留。
- [x] 权限产品/研发/个人文档更新为V3.30/V2.30/V2.30，同一PERM-STAFF-ROLE-ONLY-20261019-01。
- [x] 24项专项/既有权限回归、TypeScript、diff检查通过；独立预览58206。实页E2E受限，未操作用户当前main浏览器数据，不以登录页替代验收。无需本地Build（无构建边界改动）。
