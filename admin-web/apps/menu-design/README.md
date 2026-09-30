# 菜单设计 · 独立后台

唯一主目标：静态电子菜单设计与PNG/JPG/PDF导出。独立入口、免登录，不运行商家启动程序；共享宿主全局悬浮球源码。商品及设计草稿保存在本机，不是多用户云端服务。

## 运行

在仓库根目录：

```powershell
npm run build:menu-design
npm run dev
```

访问 `http://localhost:5173/menu-design/`。商家后台悬浮球“周边产品 → 菜单设计”在新标签页打开同一路径，原页面不导航。其他后台仍按既有规则要求登录。

独立开发：`npm run dev:menu-design`，入口 `http://localhost:5174/menu-design/`；返回其他产品使用宿主5173。构建只输出 `apps/menu-design/build`，根目录发布命令再复制到 `dist/menu-design`，不清空宿主产物。既有宿主构建会复制最近一次独立build，因此修改菜单项目或共享组件后先重新执行独立构建。部署时将构建内容放在站点 `menu-design/`，与宿主同域同站点根目录；iframe只是工作区样式隔离，不引用旧原型59317。

AI：本机终端执行 `npm run ai:menu-design`；要求已安装官方Codex CLI并完成登录，或以MENU_CODEX_BIN指定CLI路径。服务仅监听127.0.0.1:59319，允许localhost/127.0.0.1的5173、5174、4173、4174；不对公网开放。旧原型59318服务不会被替换。页面免登录不等于免除AI资料发送确认，模型也不保证与当前聊天完全相同。服务不可用时调用明确报错，不回退模拟。

## 开发入口

- `src/main.ts`：独立壳层、共享悬浮球与宿主导航适配。
- `public/workspace`：本项目自有三步设计、SVG编辑/渲染及导出；迁移基线为原型v0.6，后续在本目录维护。
- `server`：独立本机Codex桥接及Schema校验；不包含账户凭据。
- `tests`：独立入口、导航、权限保留与本地下载契约。
- `src/global-fab.css`：只扫描共享悬浮球相关源码，避免引入整个商家后台样式。

草稿键 `menu-design-draft-v1`，与旧原型分开；不同域名/端口之间不自动迁移。文件在浏览器渲染：本机开发/预览通过独立 `/menu-design/exports` 临时接口下载，以兼容内置浏览器；非本机静态部署直接使用Blob，不上传到远端。临时接口只允许指定本机来源、单文件40MB、最多6个文件、1小时过期，重启清空。PDF为栅格预览，不承诺字体嵌入和专业印刷。内置插画与商品为演示资料，交付前请替换/核实。

## 验证

`npm run test:menu-design`；`npx tsc --noEmit -p apps/menu-design/tsconfig.json`；`npm run build:menu-design`。

产品和研发权威文档分别为 `docs/superpowers/specs/2026-09-29-static-emenu-design-export-authoritative.md`（当前第0节）与 `docs/superpowers/specs/菜单设计业务规格说明书（研发交付版）.md`。
