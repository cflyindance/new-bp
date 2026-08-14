# eMenu 调味系统示例 Option 默认分类补充实施计划

## 目标

让已经升级分类结构的旧门店数据库只执行一次系统示例 Option 默认分类补充，并保护人工分类、门店自建数据及分类管理结果。

## 任务 1：集中定义系统默认分类与示例 Option 身份

文件：`scripts/lib/emenu-local-seasoning-seed.mjs`

- 导出一次性迁移标识和固定默认分类定义。
- 导出固定系统 Option `id + code -> categoryId` 映射，种子与迁移共用同一来源。
- 新建种子数据库写入 `migrations.defaultOptionCategoryBackfillV1 = true`。
- 保持当前新建数据库的 Option 分类结果不变。

## 任务 2：实现安全、幂等的旧库标准化

文件：`scripts/lib/emenu-local-seasoning-api-handler.mjs`

- 把数据库读取校验与迁移持久化错误分开，禁止迁移写入失败后回退为全新种子数据。
- 标准化始终保证系统“未分类”可用；检测固定 ID/code 冲突并返回稳定服务端错误。
- 仅当迁移标记未完成时评估默认分类补充。
- 普通默认分类按固定 ID/code 检测缺失、停用和占码冲突；不抢占门店分类。
- 仅移动当前未分类且固定 ID/code 双重匹配的系统示例 Option。
- 同一事务写入迁移标记、版本增量和一条审计；审计记录移动数量及冲突列表。
- 迁移完成后不重建普通默认分类，不重新启用分类，不再次移动 Option。

## 任务 3：补充回归验证

文件：`scripts/verify-emenu-local-seasoning-api.mjs`

- 调整旧分类迁移断言，验证三类固定映射。
- 增加未知 ID/code、同码不同 ID、同 ID 改码、人工有效分类保护测试。
- 验证迁移完成标记、版本和审计增量幂等。
- 验证迁移完成后人工移回未分类不会再次移动。
- 验证默认分类停用、删除及普通分类 code 冲突分支。
- 验证系统“未分类”ID/code 冲突时数据库不变并返回错误。
- 通过可注入持久化函数模拟原子写失败，验证原文件不变且不返回种子数据。

## 任务 4：完整验证与页面检查

- 运行 `node scripts/verify-emenu-local-seasoning-api.mjs`。
- 运行 `node scripts/verify-emenu-local-seasoning-settings.mjs`。
- 运行 `npx.cmd tsc --noEmit`。
- 刷新本地调味设置页，打开“添加 Option”，确认香辛料、基础调味、酱料下默认展示对应 Option。
- 只提交本次计划、后端种子/迁移和验证文件，不带入工作区其他改动。
