# 列表字段验证

- 变更编号：BUFFET-LIST-FIELDS-20261113-01。
- 开发基线：origin/main@919bf82b；独立分支codex/buffet-list-fields-20261113。用户已授权本地提交与合并，标识以Git历史为准。
- 目录：C:/Users/27273/.codex/worktrees/buffet-list-fields-20261113/new-bp/admin-web。
- Vite功能预览端口5314，宿主与静态业务资源均来自该目录。未替换main服务。
- 新断言RED为12列不等于9列；实现后GREEN。
- 88项verify-buffet-*.mjs通过，涵盖原规则计算／配置回归及新策略、列偏好与渠道断言。
- 原生Chrome：verify-buffet-list-fields-browser.cjs验证四段策略、跨店渠道、9字段及旧偏好过滤；verify-buffet-period-column-browser.cjs改测剩余可选授权列，保留取消、确认、刷新、恢复默认、存储失败重试断言。均通过，无pageerror。
- 类型检查：直接运行node node_modules/typescript/bin/tsc --noEmit通过。npx最初误解析到非TypeScript的tsc包，未将其成功退出视为类型检查通过，未安装依赖。
- 图片来源：同一功能服务隔离Chrome上下文的测试规则，不改用户已有浏览器存储；列表图按名称筛选至测试规则以展示完整策略及渠道。
- 合并前重新fetch，远端main@12ae1cb9；该基线之后未修改本任务列表源码或配对文档。保留主线其他任务成果后正常合并。不推送、构建或部署。生产门店实时目录、真实POS执行未验证；既有其他文档章节的截图与实现缺口不因本任务宣称全部闭合。
