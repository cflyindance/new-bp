# 项目级开发规则

## eMenu 嵌入包构建与发布

- 修改 `vendor/emenu-new` 下的任何源码后，不得只执行 eMenu 子项目中的 `npm run build`。
- 必须从本项目根目录执行以下命令，构建并发布 eMenu 嵌入包：

  ```bash
  npm run build:emenu-new-embed -- --skip-install
  ```

- 上述命令必须把最新产物发布到 `dist/emenu-new`；仅生成 `vendor/emenu-new/build` 不视为完成。
- 构建完成后，必须检查：

  1. `dist/emenu-new/index.html` 已更新并引用本次构建生成的哈希资源。
  2. `dist/emenu-new/.emenu-embed-build.json` 存在，且 `builtAt` 已更新为本次构建时间。
  3. 构建命令成功退出；如有错误，必须修复后重新构建。

- 对 eMenu 页面进行浏览器验证前，必须重新加载 eMenu iframe。若页面仍使用旧资源，应执行浏览器强制刷新后再验证。
- 未完成嵌入包构建、发布及上述产物校验时，不得将相关 eMenu 代码修改汇报为已完成。
