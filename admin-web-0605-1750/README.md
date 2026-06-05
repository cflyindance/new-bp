# 餐饮商家后台（导航壳）

基于《餐饮商家后台-导航与目录结构建议》中的**整合导航树**生成的 **Vite + TypeScript + Tailwind CSS v4** 管理端壳工程。

## 设计说明

- **Tailwind Design System（v4）**：`src/styles/app.css` 使用 `@import "tailwindcss"`、`@theme` OKLCH 语义色、`@custom-variant dark`。
- **UI/UX**：跳过主内容链接、可见焦点环、`min-h-11` 触摸目标、`prefers-reduced-motion`、标题层级、侧栏 `aria-current` / `aria-expanded`。

## 命令

```bash
cd admin-web
npm install
npm run dev
```

浏览器打开提示的本地地址（默认 `http://localhost:5173`），使用 Hash 切换子页面（如 `#/orders/all`）。

### 为什么不能双击 `index.html` 或用「打开文件」运行？

根目录的 `index.html` 里写的是：

```html
<script type="module" src="/src/main.ts"></script>
```

- **浏览器不认识 TypeScript**，不能直接执行 `.ts` 文件。
- 路径 `/src/main.ts` 只有在你运行 **`npm run dev`** 时，由 **Vite 开发服务器** 拦截请求、把 TS 编译成 JS 再交给浏览器，这样页面才能跑起来。
- 若用 `file://` 打开根目录 `index.html`，或普通静态服务器只托管根目录而不经过 Vite，就会出现 **`GET /src/main.ts` 失败** 或脚本无法执行——这是预期行为，不是「编译坏了」。

## 构建

```bash
npm run build
npm run preview
```

- **`npm run build`** 会生成 **`dist/`**：里面的 `index.html` 引用的是已打包的 **`/assets/*.js`**，不再引用 `src/main.ts`。
- 预览或上线时请 **`npm run preview`**（或把 **`dist` 整目录** 交给 Nginx / 静态托管），**不要**再用根目录那份 `index.html` 当入口。

## 配置导航

编辑 `src/config/navigation.ts` 中的 `NAV_MODULES` 即可调整模块与子路由；`chainOnly: true` 表示连锁向入口，侧栏与 Tab 均会显示，Tab 上带「连锁」角标。
