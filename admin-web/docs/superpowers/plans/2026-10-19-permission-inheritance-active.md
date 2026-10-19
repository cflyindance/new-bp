# 权限继承选中状态修复计划

基线main@507616a1；独立分支codex/permission-inheritance-active-20261019。用户已批准实施，不自动提交。

根因已由最小运行实验确认：页面gate=edit但旧page=hidden，标题读取gate、子项又检查page，产生混合态；重复点击通过syncPageGrant修复旧page后才显示正常。

范围：center-domain（角色/员工有效权限）、center-editor（所有页面模式）、center-ui调用方；不改存储、不批量改写历史数据。保留明确hidden/read；仅旧page键缺失且已有明确非隐藏页面gate时承接read。默认gate本身不新增访问授权。

- 补verify-permission-inheritance-active.ts，先RED：缺失page+明确gate、明确拒绝、继承子项初始选中、无复核提示、跨门店隔离、渲染无写入。
- evaluator与renderer同源有效值；设置标题须反映真实页面状态；混合旧值以最严格有效状态展示，不产生新授权。
- 更新权限产品/研发/个人文档V3.28/V2.28/V2.28。
- 运行专项及权限回归、tsc/diff检查。Build skipped：不涉及构建边界；CI unknown。E2E required但当前真实浏览器验证受限，必须保留缺口，不报告完整fixed。
- 预览独立58204；回滚边界仅本次文件，原业务数据及历史授权不变。
