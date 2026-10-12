# 更多菜单热区修正记录

范围：65023 薪资管理更多菜单，native 与 standalone CSS 共用样式；无数据或事件定义变更。沿用前次已确认菜单实施的未提交文件，不覆盖其他工作。

根因（code_supported）：菜单 padding 6px 在行左右产生不属于按钮的可见白色区域；菜单内宽158px，旧按钮宽146px。用户补充反馈为热区而非三个业务入口本身。只调整padding、按钮布局和子元素指针归属。

RED：verify-payroll-more-hit-area.mjs 断言 visible row edges must belong to the button 失败。
GREEN：该测试、hero action rows及TypeScript noEmit均通过。

浏览器：实际内置页面读取到按钮宽158px、高44px、display flex；原生AX节点点击明细菜单可见 Employees Payroll Detail。坐标点击与部分locator点击未取得对应打开结果，不能把它们算为边缘E2E通过；各边缘逐点命中仍待复核。没有保留实验性的事件延迟关闭修改。

最小计划：取消菜单横向内边距、整行border-box按钮、44px最小高度、图标与文字居中。构建跳过：未触及构建边界，CI证据未知。回滚限本次CSS热区修改。截图待补，不复用V1.28图证明热区有效。

调用链：payroll-template.html 更多菜单 → legacy/payroll.js.txt body delegated data-action → 原明细、ADP及编辑；样式消费者为src/team/payroll/payroll-page.css与dist/TipOut/payroll.css。未新增点击代理或持久化操作。Wiki沿用未配置的bypass记录。
