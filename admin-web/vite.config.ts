import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import httpProxy from "http-proxy";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";
import { attachPayrollMockApi } from "./scripts/lib/payroll-mock-api-handler.mjs";
import { attachEmenuSeasoningApi } from "./scripts/lib/emenu-local-seasoning-api-handler.mjs";

/** 开发态提供 dist 内嵌静态资源（TipOut / Configuration center / emenu-pro / emenu-new / kiosklite） */
const EMBEDDED_STATIC_ROUTES = [
  { route: "TipOut", dir: path.join("dist", "TipOut") },
  { route: "Configuration center", dir: path.join("dist", "Configuration center") },
  { route: "emenu-pro", dir: path.join("dist", "emenu-pro") },
  { route: "emenu-new", dir: path.join("dist", "emenu-new") },
  /** 本地构建产物；源码仍在 dist/kiosklite，开发改源码后需 rebuild embed */
  { route: "kiosklite", dir: path.join("dist", "kiosklite", ".embed-build") },
] as const;

const MIME_BY_EXT: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
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

      /**
       * emenu-new 前端包版本：读本地 dist/emenu-new/version.json（如 5.11.83），
       * 避免 /kpos 代理把 version.json 打到主机 emenu（如 5.11.79）。
       * 其余 /kpos/api、webapp 等业务数据仍走 POS 代理。
       */
      if (pathname === "/kpos/emenu/version.json") {
        const localVersion = path.join(root, "dist", "emenu-new", "version.json");
        if (serveStaticFile(res, localVersion)) {
          return;
        }
      }

      /**
       * 嵌入 Kiosk 页面挂在 /kpos/kiosklite，使 kiosklite 把 API 基址收成同源 /kpos/，
       * 从而走动态 cookie 代理（避免写死 http://localhost:22080/kpos/）。
       */
      const kioskEmbedPrefix = "/kpos/kiosklite";
      if (
        pathname === kioskEmbedPrefix ||
        pathname === `${kioskEmbedPrefix}/` ||
        pathname.startsWith(`${kioskEmbedPrefix}/`)
      ) {
        const rel =
          pathname.slice(kioskEmbedPrefix.length).replace(/^\//, "") || "index.html";
        const filePath = path.join(root, "dist", "kiosklite", ".embed-build", rel);
        if (!serveStaticFile(res, filePath)) {
          res.statusCode = 404;
          res.end("Not found");
        }
        return;
      }

      const emenuIconMatch = pathname.match(/^\/kpos\/emenuPro\/images\/([^/]+)$/i);
      if (emenuIconMatch) {
        const iconPath = resolveEmenuProBlockIcon(root, emenuIconMatch[1]);
        if (iconPath && serveStaticFile(res, iconPath)) {
          return;
        }
        /* 本地无图时交给 /kpos 代理打到 POS */
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
const useEmenuLocalApiProxy = process.env.EMENU_LOCAL_USE_API_PROXY === "1";
const usePitApiProxy = process.env.PIT_USE_API_PROXY === "1";
/** 嵌入 emenu-new / kiosklite 的 /kpos API·WS 转发到 POS（默认本机；可用 cookie / EMENU_KPOS_PROXY_TARGET 覆盖） */
const emenuKposProxyTarget = process.env.EMENU_KPOS_PROXY_TARGET || "http://localhost:22080";
const EMENU_KPOS_HOST_COOKIE = "menusifu-emenu-kpos-target";

/**
 * Vite 内置 proxy 基于 http-proxy，不支持 http-proxy-middleware 的 `router`。
 * 因此按 cookie 动态选目标必须用自定义中间件（proxy.web/ws 的 per-request target）。
 */
function resolveEmenuKposProxyTarget(req?: { headers?: { cookie?: string } }): string {
  const cookieHeader = req?.headers?.cookie ?? "";
  const match = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${EMENU_KPOS_HOST_COOKIE}=([^;]*)`),
  );
  if (match?.[1]) {
    try {
      const decoded = decodeURIComponent(match[1])
        .trim()
        .replace(/\/+$/, "")
        .replace(/\/kpos\/?$/i, "");
      if (/^https?:\/\//i.test(decoded)) {
        return decoded;
      }
    } catch {
      /* fall through */
    }
  }
  return emenuKposProxyTarget;
}

function resolveEmenuProxyUpstream(
  req: IncomingMessage,
): { target: string } | null {
  const url = req.url ?? "";
  // 本地嵌入页（勿转发到 POS）
  if (url.startsWith("/kpos/kiosklite") || url.startsWith("/kpos/emenu/version.json")) {
    return null;
  }
  if (url.startsWith("/kpos")) {
    return { target: resolveEmenuKposProxyTarget(req) };
  }
  if (url.startsWith("/img")) {
    return { target: `${resolveEmenuKposProxyTarget(req)}/kpos` };
  }
  return null;
}

function attachEmenuKposDynamicProxy(server: ViteDevServer): void {
  const proxy = httpProxy.createProxyServer({
    changeOrigin: true,
    ws: true,
  });

  proxy.on("error", (err, _req, res) => {
    const message = err instanceof Error ? err.message : String(err);
    if (res && "writeHead" in res && typeof (res as ServerResponse).writeHead === "function") {
      const httpRes = res as ServerResponse;
      if (!httpRes.headersSent) {
        httpRes.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
      }
      if (!httpRes.writableEnded) {
        httpRes.end(`Bad gateway: ${message}`);
      }
      return;
    }
    console.error(`[emenu-kpos-proxy] ${message}`);
  });

  proxy.on("proxyRes", (proxyRes, req) => {
    const upstream = resolveEmenuProxyUpstream(req);
    if (upstream) {
      proxyRes.headers["x-emenu-kpos-target"] = upstream.target;
    }
  });

  server.middlewares.use((req, res, next) => {
    const upstream = resolveEmenuProxyUpstream(req);
    if (!upstream) {
      next();
      return;
    }
    proxy.web(req, res, { target: upstream.target });
  });

  server.httpServer?.on("upgrade", (req, socket, head) => {
    const upstream = resolveEmenuProxyUpstream(req);
    if (!upstream) return;
    proxy.ws(req, socket, head, { target: upstream.target });
  });
}

function serveEmbeddedStaticDirs(): Plugin {
  return {
    name: "serve-embedded-static-dirs",
    configureServer(server) {
      attachEmbeddedStaticMiddleware(server.middlewares);
      attachEmenuKposDynamicProxy(server);
      if (!usePayrollApiProxy) {
        attachPayrollMockApi(server.middlewares, process.cwd());
      }
      if (!useEmenuLocalApiProxy) {
        attachEmenuSeasoningApi(server.middlewares, process.cwd());
      }
    },
    configurePreviewServer(server) {
      attachEmbeddedStaticMiddleware(server.middlewares);
      attachEmenuKposDynamicProxy(server as unknown as ViteDevServer);
      if (!usePayrollApiProxy) {
        attachPayrollMockApi(server.middlewares, process.cwd());
      }
      if (!useEmenuLocalApiProxy) {
        attachEmenuSeasoningApi(server.middlewares, process.cwd());
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
    /** vendor/emenu-new 与 dist/emenu-new 源码勿纳入本仓 HMR / 依赖图 */
    watch: {
      ignored: [
        "**/vendor/**",
        "**/dist/**",
        "**/.cache/**",
        "**/node_modules/**",
      ],
    },
    proxy: {
      ...(usePayrollApiProxy
        ? {
            "/api/v1/payroll": {
              target: "http://127.0.0.1:3010",
              changeOrigin: true,
            },
          }
        : {}),
      ...(useEmenuLocalApiProxy
        ? {
            "/api/v1/emenu-local/seasoning": {
              target: "http://127.0.0.1:3011",
              changeOrigin: true,
            },
          }
        : {}),
      ...(usePitApiProxy
        ? {
            "/api/v1/pit": {
              target: "http://127.0.0.1:3020",
              // Preserve the browser-facing Vite Host so PIT's strict Origin/Host
              // comparison continues to protect write requests in development.
              changeOrigin: false,
            },
          }
        : {}),
    },
  },
  preview: {
    port: 4173,
    host: true,
    open: true,
    strictPort: false,
  },
});
