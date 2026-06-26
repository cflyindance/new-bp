import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import { attachPayrollMockApi } from "./scripts/lib/payroll-mock-api-handler.mjs";

/** 开发态提供 dist 内嵌静态资源（TipOut / Configuration center / emenu-pro） */
const EMBEDDED_STATIC_ROUTES = [
  { route: "TipOut", dir: path.join("dist", "TipOut") },
  { route: "Configuration center", dir: path.join("dist", "Configuration center") },
  { route: "emenu-pro", dir: path.join("dist", "emenu-pro") },
] as const;

const MIME_BY_EXT: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function serveStaticFile(
  res: import("http").ServerResponse,
  filePath: string,
): boolean {
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return false;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.setHeader("Content-Type", MIME_BY_EXT[ext] ?? "application/octet-stream");
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function resolveEmenuProBlockIcon(root: string, fileName: string): string | null {
  const imagesDir = path.join(root, "dist", "emenu-pro", "images");
  const svgPath = path.join(imagesDir, fileName.replace(/\.png$/i, ".svg"));
  if (fs.existsSync(svgPath) && fs.statSync(svgPath).isFile()) {
    return svgPath;
  }
  const directPath = path.join(imagesDir, fileName);
  if (fs.existsSync(directPath) && fs.statSync(directPath).isFile()) {
    return directPath;
  }
  return null;
}

function attachEmbeddedStaticMiddleware(
  middlewares: { use: (fn: (req: import("http").IncomingMessage, res: import("http").ServerResponse, next: () => void) => void) => void },
): void {
  const root = process.cwd();
  middlewares.use((req, res, next) => {
    try {
      const raw = (req.url ?? "/").split("?")[0];
      const pathname = decodeURIComponent(raw);

      const emenuIconMatch = pathname.match(/^\/kpos\/emenuPro\/images\/([^/]+)$/i);
      if (emenuIconMatch) {
        const iconPath = resolveEmenuProBlockIcon(root, emenuIconMatch[1]);
        if (iconPath && serveStaticFile(res, iconPath)) {
          return;
        }
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      for (const { route, dir } of EMBEDDED_STATIC_ROUTES) {
        const prefix = `/${route}`;
        if (
          pathname === prefix ||
          pathname === `${prefix}/` ||
          pathname.startsWith(`${prefix}/`)
        ) {
          const rel = pathname.slice(prefix.length).replace(/^\//, "") || "index.html";
          const filePath = path.join(root, dir, rel);
          if (!serveStaticFile(res, filePath)) {
            res.statusCode = 404;
            res.end("Not found");
          }
          return;
        }
      }
    } catch {
      /* fall through */
    }
    next();
  });
}

const usePayrollApiProxy = process.env.PAYROLL_USE_API_PROXY === "1";

function serveEmbeddedStaticDirs(): Plugin {
  return {
    name: "serve-embedded-static-dirs",
    configureServer(server) {
      attachEmbeddedStaticMiddleware(server.middlewares);
      if (!usePayrollApiProxy) {
        attachPayrollMockApi(server.middlewares, process.cwd());
      }
    },
    configurePreviewServer(server) {
      attachEmbeddedStaticMiddleware(server.middlewares);
      if (!usePayrollApiProxy) {
        attachPayrollMockApi(server.middlewares, process.cwd());
      }
    },
  };
}

export default defineConfig({
  /** 构建产物使用相对路径，便于子目录部署或本地直接打开 dist/index.html（仍建议用静态服务器） */
  base: "./",
  plugins: [tailwindcss(), serveEmbeddedStaticDirs()],
  server: {
    port: 5173,
    /** 避免仅监听 127.0.0.1 时局域网/部分预览工具无法访问 */
    host: true,
    /** 启动后自动打开系统浏览器（无需再猜端口） */
    open: true,
    strictPort: false,
    ...(usePayrollApiProxy
      ? {
          proxy: {
            "/api/v1/payroll": {
              target: "http://127.0.0.1:3010",
              changeOrigin: true,
            },
          },
        }
      : {}),
  },
  preview: {
    port: 4173,
    host: true,
    open: true,
    strictPort: false,
  },
});
