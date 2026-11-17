# 来源与安装范围

- 日期：2026-11-17。
- 来源：用户在当前对话提供的“选择商品”参考截图；副本为 `../assets/reference.png`。属于本地受限参考，未确认公开许可，不得自动上传或公开分发。
- 当前实现：admin-web 的 `src/config/brand-menu-structure-picker-ui.ts`、`brand-menu-structure-picker.css`；商品间隔弹框位于 `module-settings-guest-menu-order-interval-ui.ts`。
- 权威编辑源：当前项目 `.agents/skills/mb-product-picker-ui/`，与对应UI实现一起维护。
- 本机安装目标：`C:/Users/27273/.codex/skills/mb-product-picker-ui/`。本机副本用于后续自动发现；源码与安装副本需逐文件核对。
- 本机没有可用的Skillshare配置或CLI；不执行全量同步。统一公开仓位置未发现，扫描器被本机另一工具的断链中断；不能声称完成全量查重。
- 直接核对了本机现有 `mb-admin-ui-guidelines`：其负责后台通用布局，此Skill只负责商品选择器，二者组合使用，不复制业务规则。
- 状态：本地可用、未公开发布。当前用户请求授权本地创建和默认采用；Git提交与合并按用户当次明确授权执行，不自动推送项目或Skill，不声称其他设备已同步。
- 回滚：删除本次新增的默认引用及本机新Skill目录，并从项目Git历史恢复对应源。不得清理其他Skill或用户配置。
