# GitHub Pages Actions 部署设计

## 目标

将 GitHub Pages 发布产物限定为管理端构建目录，避免 Pages 的分支式 Jekyll 构建扫描仓库根目录并失败；旧 URL 兼容由前端构建产物提供，不依赖部署目录结构。

## 方案

保留 `.github/workflows/build-pages.yml` 负责安装依赖、构建 Kiosk embed 与管理端 dist，并提交更新后的构建产物。新增独立 Pages 部署工作流：

1. 仅在 `main` 推送且 `admin-web/dist/**` 变化时运行；
2. 使用 `actions/configure-pages`、`actions/upload-pages-artifact` 与 `actions/deploy-pages`；
3. 上传目录固定为 `admin-web/dist`；
4. post-build 生成 `dist/admin-web/dist/index.html` 跳转页，将旧 URL 保留的 hash 转到当前入口；
5. 使用最小权限：构建任务读取仓库并写入 Pages，部署任务只使用 Pages 与 OIDC 权限；
6. 通过并发组取消过期部署，确保最新提交最终上线。

## 验收

- 新工作流的 YAML 可解析，artifact 路径为 `admin-web/dist`；
- GitHub Pages 设置的 Source 选择 GitHub Actions 后，推送构建产物可成功产生 Pages 部署；
- `https://cflyindance.github.io/new-bp/admin-web/dist/index.html` 返回成功；
- 不再触发失败的 `pages-build-deployment` Jekyll 根目录构建。
