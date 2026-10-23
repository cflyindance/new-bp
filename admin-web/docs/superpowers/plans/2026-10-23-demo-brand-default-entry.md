# 默认演示入口改为品牌视角

基线main@82d0d9cb（包含未推送的问号修复），已fetch远端且本地领先，保留本地主线成果；独立codex/demo-brand-default-entry-20261023。

范围：默认演示账号登录后、已认证默认演示账号新打开根地址（空hash、#/、#/home）进入品牌视角。真实员工账号、代登录、直接业务链接及明确M路径不受影响；手动视角切换仍有效，页面内重绘不反复强制品牌。

步骤：RED helper策略测试→main.ts复用switchToBrandView并在登录成功／认证login页／初始根地址三处接入→浏览器验证默认登录、M切换后重新开根、M直链、业务直链→三份演示登录文档同步、截图→tsc／聚焦回归／Vite生产bundle到隔离.cache目录（修改应用入口，需构建）。

禁止自动登录、扩大权限、清除账号／业务数据；不修改currentMAccount身份回退。非演示账号落地仍沿原逻辑。

执行结果：RED helper缺失→GREEN；浏览器以完成首次引导的隔离演示配置验证默认登录品牌首页、M直链仍可访问、M后重开根恢复品牌、业务hash保留。首次未配置环境确实继续进入原引导，未跳过引导；真实账号／代登录为策略测试而非完整浏览器账号验收。修复初始化时先离开/login再分发视角事件，避免同步重绘重入。

验证通过：node scripts/verify-demo-brand-default-entry.mjs、node scripts/verify-demo-brand-default-entry-browser.mjs、tsc --noEmit、Vite build --outDir .cache/demo-entry-build --emptyOutDir、git diff --check。Vite仍有既有大包／混合动态导入警告，无构建错误。三份演示登录文档v1.1及两张实际截图同步；未改小费文档，未提交／合并／推送或更新主线预览。
