# 小费分配页面内对话框 Implementation Plan

**Goal:** 保存当前分配与重新确认分配不再使用浏览器 alert/confirm。

**Architecture:** 沿用现有 modal-overlay/modal 结构，新增一个按类型呈现的异步对话框。调用方 await 用户选择，关闭返回false；提交后业务校验和快照逻辑不变。

**Tech Stack:** 原生模板、JavaScript、Node VM、实际浏览器。

**Spec:** 用户2026-10-22明确要求页面内对话框，TIPOUT-DIALOG-20261022-01。

## Global Constraints

- main基线ae7443e9，含未推送的保存功能；独立codex/tips-page-dialogs-20261022，不提交合并推送。
- 三条提示原文、全部规则范围、金额、锁定及失败保护不变。
- 取消、关闭、遮罩和Esc不写入；焦点限制在弹框内，关闭返回触发按钮。

## Tasks

- [x] 页面弹框专项覆盖三个类型、取消、确认、重复及上下文变化与焦点恢复。
- [x] 共用modal与Promise接口；取消、遮罩、关闭、Esc处理；Tab循环。
- [x] 原保存、确认、自动分配及类型检查通过。65111实际浏览器：Esc保留输入100与系统快照v1；人工保存提交manual v2；页面重分配提交system v3并恢复200；无需替换浏览器confirm即可执行。
- [x] 三份文档版本与配对同步，三种实际弹框截图已加入。保留旧综合脚本失败说明，不宣称全套测试通过。
