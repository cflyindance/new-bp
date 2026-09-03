# 移除小费分配明细摘要栏

## 目标

移除“小费分配明细”页面右侧的日期、门店和分配规则摘要卡，使明细内容使用完整内容宽度。

## 设计

- 从明细页源 HTML 删除 `detailContextRail` 摘要节点，并去除工作区的 `has-aside` 双栏标记。
- 删除仅服务于该摘要卡的 `renderDetailContextRail` 函数及调用，日期、门店和规则仍由现有筛选控件与页面状态管理。
- 仅删除 `.tipout-page-detail` 下摘要栏与双栏网格相关 CSS，保留顶部 context bar、规则编辑页及其他页面的独立样式。
- 重新生成主项目原生化模板、脚本和样式，保证 `dist/TipOut` 源页面与 `src/team/tips` 嵌入页面一致。

## 验收

- 明细页不再存在摘要卡及其空白布局列。
- 明细内容横向填满工作区。
- 日期/门店切换、明细渲染、保存和返回功能不受影响。
- 自动校验同时检查源 `dist/TipOut/detail.html`、生成模板 `src/team/tips/templates/details.html` 与生成脚本 `src/team/tips/programs/details.js.txt`，阻止 `detailContextRail`、明细页 `has-aside` 及 `renderDetailContextRail` 的调用或定义回归。
- 自动校验正向确认 `detailDate`、`storeSelect`、`detailRulesContainer`、返回汇总、保存、保存并跳转下一天等业务入口仍存在。
- 明细页摘要栏专属 CSS 不再存在，顶部 context bar 与规则编辑页独立样式仍保留。
