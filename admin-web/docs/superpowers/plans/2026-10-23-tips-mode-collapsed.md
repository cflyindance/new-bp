# 小费池计算模式默认折叠 Implementation Plan

**Goal:** 仅标题默认可见，用户展开后查看原选项及说明，不改当前模式。
**Architecture:** rule-editor.html的allocationModeSection改为无open的details，原标题改summary。复用红框与圆角，CSS为标题添加折叠箭头，打开时恢复间距。不新增持久化、监听保存或自动改选。
**Tech Stack:** 原生HTML details/summary、项目CSS、Node专项及真实浏览器。
**Spec:** 用户本次明确要求；main@440289d5独立分支，不携带前批未提交按钮样式／文案。

- [x] verify-tipout-mode-collapse.mjs先断言details默认无open、标题summary及原radio、hint保留；初始应失败。
- [x] 修改src/team/tips/templates/rule-editor.html与tips-page.css，仅折叠容器及箭头。
- [x] 浏览器新建默认收起、点击／键盘开关、选值不随开关变化；保留红框；原参与资格、工时专项回归。
- [x] 产品V4.10／研发V3.10／个人V2.8，共同TIPOUT-MODE-COLLAPSE-20261023-01，截图就近说明。没有覆盖的编辑恢复／重入截图明确缺口。
- [x] diff检查并交付，不自动提交、合并或推送。

验收结果：默认open=false、两radio不可见；展开open=true、两radio可见；Enter重新收起，legacy_pool不变；红框184,50,50保留。默认及展开截图在assets/tips-mode-collapsed-20261023，编辑回填／重入页面图缺口保留。原生折叠、参与资格及工时专项通过。未提交／合并／推送。
