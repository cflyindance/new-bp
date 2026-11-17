# 来源、治理与安装

- 日期2026-11-17，用户提供商品列表截图；保留受限参考副本，未获公开许可，不进入公开catalog。
- 决策create-skill：商品列表会在多个后台场景复用；稳定的模式边界和状态契约可避免复制参考图业务字段。
- 权威源：本项目 `.agents/skills/mb-product-list-ui/`。维护源与实现同行，提交状态以项目Git为准；本机目标 `C:/Users/27273/.codex/skills/mb-product-list-ui/`。
- 直接查重：本机Codex Skills、项目Skills及系统已提供目录；现有mb-admin负责通用布局，mb-product-picker负责树形选择，不覆盖本列表职责。没有可用Skillshare命令；统一公开仓及跨Agent聚合未核验，不声称全量查重或发布。
- 技术/UI规范，无需额外方法论调研；规则源自本次用户已确认参考和既有后台Token。
- 用户授权创建与本机使用；不推送公开源、不发布Multica、不触碰其他Agent。未安装Skillshare时采用用户本机安装路径，并核对项目源和安装副本哈希。
- 验证：结构checker、Skill评审与当前项目浏览器用例；不代表所有未来项目已兼容。
- 回退：用Git恢复本次组件与Skill源；移除本次新增的本机同名目录及引用，保留其他Skill和用户改动。
