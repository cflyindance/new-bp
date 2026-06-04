import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  /** 构建产物使用相对路径，便于子目录部署或本地直接打开 dist/index.html（仍建议用静态服务器） */
  base: "./",
  plugins: [tailwindcss()],
  server: {
    port: 5173,
    /** 避免仅监听 127.0.0.1 时局域网/部分预览工具无法访问 */
    host: true,
    /** 启动后自动打开系统浏览器（无需再猜端口） */
    open: true,
    strictPort: false,
  },
  preview: {
    port: 4173,
    host: true,
    open: true,
    strictPort: false,
  },
});
