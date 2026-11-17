# 额度场景标题实施计划

**Goal:** 将配置额度标题替换为配置＋当前人数／周期／轮次场景。
**Architecture:** 保留v4ScenarioTitle供原摘要与计算使用；新增quantitySceneDialogTitle，仅用于当前dialog标题并转义输出。重绘读取scene.combo，下一场景自动更新。
**Spec:** 用户2026-11-17确认：配置1 人及以上 · 1 轮、配置1–3 人 · 2–4 轮、配置4 人及以上 · 每轮、配置整单限购。门店信息保留副标题。
**基线:** origin/main@e9285ce2a，分支codex/buffet-scene-title-20261117。会员提示在另一未提交分支保留，不自动混入。

**验证结果:** RED缺少标题函数，新增后GREEN；89项verify-buffet-*.mjs全部通过。Chrome实际打开首场景并保存进入下一场景，标题、门店副标题、序号同步且无pageerror；两张实际截图已同步三份文档。初始测试夹具缺少targetIds造成商品卡片不显示，补齐夹具后通过，未修改业务门店判定。场景工作台VM测试补齐新增格式化依赖，原断言保留。JS语法及diff检查通过，不涉及TS或依赖，未执行生产构建。原生静态功能预览5316，实际目录C:/Users/27273/.codex/worktrees/buffet-scene-title-20261117/new-bp-payroll-ca/admin-web。未验证生产下发或POS运行；未提交、合并、推送。

- [x] 新增verify-buffet-scene-title.mjs，断言单轮、范围、无上限、每轮、整单及标题动态读取；先RED再GREEN。
- [x] order-limit-flow.js新增quantitySceneDialogTitle(draft,combo)，更新quantitySceneTitle的展示，不改副标题、场景位置、按钮或保存。
- [x] 原生Chrome打开人数＋轮次两场景，核验首场景标题及保存到下一场景后的新标题、门店副标题；截图更新三份文档。
- [x] 全量buffet脚本、语法／diff检查、文档版本与链接核对；不提交／合并／推送。
