# 分轮次额度文案实施计划

用户确认范围：分轮次配置额度文案带当前区间；1–2 轮显示第1-2轮每轮最多、单轮显示第2轮最多、6轮起显示第6轮起每轮最多；普通每轮和整单保持原文案，不改变计算。

基线 main@fadde445，独立分支 codex/buffet-round-quota-label-20261104；main 含两条已合入未推送小费提交，保留且不自动推送。本任务未授权提交、合并、推送。

- [x] 在 verify-buffet-quota-labeled-columns.mjs 增加闭区间、单轮、开放区间、每人／整桌及普通周期不变的断言，先验证失败（原结果每轮最多）。
- [x] buffetQuotaPeriodLabels(combo, draft) 读取 roundRanges[combo.roundIndex]，仅 multi_round 生成区间前缀；表头、批量、菜品集份／种共享额度及商品保护复用文案，保留原字段映射和单位。
- [x] 全部 83 项自助餐脚本通过；增强共享额度、缺失区间和不修改草稿断言通过；JS 语法与 git diff --check 通过。浏览器当前场景商品表格 scrollWidth=clientWidth=1008，无横向溢出。
- [x] 独立服务 7984、外部 Chrome 实际验证第1–2、第3–5、第6轮起及批量设置文案，保存四张真实截图。
- [x] 同步产品 V1.4、研发 V1.3、个人 V1.3，编号 BUFFET-20261104-01。

截图覆盖：分轮次模板按菜品、按桌口径的三个区间和批量展开。单轮、人均、整单＋分轮次、菜品集按份／按种共享和商品保护由单元回归覆盖，尚未逐一补独立浏览器截图；不得声称全部模板截图完整。没有发布规则或修改生产数据。

功能目录：C:/Users/27273/.codex/worktrees/buffet-round-quota-label-20261104/new-bp/admin-web。静态页面、CSS 和 JS 均来自该目录的 dist/Configuration center，不混用其他检出资源。
