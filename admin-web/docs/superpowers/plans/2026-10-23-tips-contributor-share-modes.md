# 员工承担方式实施计划

已确认方案：用户要求移除“沿用现有扣除方式”选项，只保留平均／自定义。新建贡献项默认平均，抽屉确定更新草稿、页面保存落盘；取消不写入。历史无配置项不迁移，打开默认平均但取消仍保持历史，明确确定才转换。

基线：main@745d7030，已fetch，远端无新增；独立codex/tips-contributor-share-modes-20261023。未授权提交／合并／推送。

## 文件与步骤

- [ ] 先写 scripts/verify-tipout-contributor-share-modes.mjs，RED覆盖三人平均100元精确分币、人员新增动态平均、余额不足不转嫁、旧自定义兼容和非法mode。
- [ ] tipout-funding.js.txt：employeeShares.mode=average/custom；缺mode保留历史custom。average不固化员工百分比，只存角色，计算时按事实员工ID排序和等权split分配应扣；快照保存方式及实际人员，校验等权应扣。custom沿用两位百分数合计100%。
- [ ] contributor-shares-editor.js.txt／rule-editor.html／rule-editor.js.txt：两项radio；平均显示只读比例预览与动态说明，自定义逐人输入；新添加贡献项默认average；历史加载不填默认；保存前检查范围和兼容边界。
- [ ] details.js.txt：展示平均／自定义方式，不将平均展示的约33.33%当作金额计算依据。
- [ ] 同步三份正文、版本、算例、覆盖清单；历史截图标明已替换，新状态截图就近配图，未覆盖操作如实登记。
- [ ] 执行目标测试、既有贡献／编辑／快照回归、tsc、diff检查；功能分支预览实际测试平均、自定义、取消及保存后回显。

平均算例：D100元，A/B/C各应扣33.34/33.33/33.33；A仅20元时实扣20/33.33/33.33，C86.66，P100补13.34。新增D后D100元四人各25元。多角色共同分担，接收方资格不参与过滤。适用普通非时段角色贡献，旧资金／计提／时段兼容限制不扩展。

验证命令：node scripts/verify-tipout-contributor-share-modes.mjs；node scripts/verify-tipout-contributor-shares.mjs；node scripts/verify-tipout-contributor-shares-editor.mjs；node scripts/verify-tipout-contributor-shares-docs.mjs；node node_modules/typescript/bin/tsc --noEmit；git diff --check。未改构建边界，不执行eMenu构建。

执行结果：新增平均测试RED（旧实现拒绝average结构）→GREEN；平均动态人数、三人分币、不转嫁、快照以及既有自定义回归通过。实际功能预览65124验证平均保存及回显、自定义40/60保存、取消保留平均；截图average.png/custom.png，其他操作图缺口见三文档与覆盖清单。类型／diff检查通过。未提交、合并或推送；主线服务未替换。
