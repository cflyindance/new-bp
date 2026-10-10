# Payroll Export Task Center Implementation Plan

Goal: 多任务排队、阶段进度、成功后自动下载、当前会话任务记录。
Architecture: queue 独立负责串行执行和冻结输入；task-center 负责提示条、抽屉、下载及重试；controller 负责原有员工选择校验与任务提交。
Tech Stack: TypeScript、原生 DOM、现有 PDF 生成器。
Spec: 用户 2026-10-10 确认方案；配对需求文档 V1.18。

- [x] 建立 scripts/verify-payroll-export-queue.ts：用受控 Promise 校验任务严格串行、排队上下文冻结、失败无文件、重试完整输入。
- [x] 新建 payroll-export-queue.ts，在提交时复制输入并固定每名员工打印 HTML；任务顺序执行，不依赖后来切换的员工与周期。
- [x] 新建 payroll-export-task-center.ts：常驻任务入口、提交提示、右侧记录，按提交时间倒序；下载只允许 completed，partial/failed 提供重试。
- [x] 修改 controller 去掉单任务阻塞，保留人数和上下文校验；成功入队立即关闭选择弹框。
- [x] 添加作用域 CSS；更新 UI 结构检查；运行 tsc 和队列测试。
- [x] 真实浏览器验证空记录抽屉及单员工精简 PDF 生成成功，截图已记录；未验证下载文件落盘及多任务真实 PDF 连续下载。
- [x] 用户授权提交；本次不合并或推送。
