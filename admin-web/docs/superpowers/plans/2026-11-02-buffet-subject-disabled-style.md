# 限购主体禁用样式补齐

用户已确认：未选禁用主体灰显并取消悬停高亮；已选主体保留蓝色但不可点击。范围仅样式，不改变业务行为。基于 main@873f911e，独立分支 codex/buffet-subject-disabled-20261102，未提交。

## 实施与验证

- [x] 增加 `scripts/verify-buffet-subject-disabled-style.mjs`，先运行确认缺少灰显规则而失败。
- [x] `order-limit-flow.css`：hover 限定非 disabled；is-locked:disabled 使用默认光标；未选 opacity .56、已选 opacity 1；复用原蓝色选中样式。
- [x] 运行新增验证及 `verify-buffet-template-only.mjs` 通过。
- [x] 独立静态预览 5193，实际选择每轮／每人＋每轮，核对选中态反转、disabled 与计算后的 opacity，保存真实截图。
- [x] 同步产品 V1.2、研发 V1.1、个人 V1.1，编号 BUFFET-20261102-02，保留历史文档及缺图声明。
- [x] 最终 83 项自助餐脚本全部通过，git diff --check 通过；交付未提交状态，不自动沿用上一次 Git 授权。

实际目录：`C:/Users/27273/.codex/worktrees/buffet-subject-disabled-20261102/new-bp/admin-web`。原 5192 保持不变，5193 是本次功能预览，不是 main。
