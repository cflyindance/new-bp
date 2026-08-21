import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const REDIRECT_HTML = `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>正在跳转…</title>
  </head>
  <body>
    <p>正在跳转至管理后台… <a href="../../../index.html">如果未自动跳转，请点击这里。</a></p>
    <script>
      const target = "../../../index.html";
      window.location.replace(target + window.location.search + window.location.hash);
    </script>
  </body>
</html>
`;

export function writeLegacyPagesRedirect(distDir) {
  const outputFile = path.join(distDir, "admin-web", "dist", "index.html");
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, REDIRECT_HTML, "utf8");
  return outputFile;
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  const outputFile = writeLegacyPagesRedirect(path.join(projectRoot, "dist"));
  console.log(`[generate-github-pages-legacy-route] Wrote: ${path.relative(projectRoot, outputFile)}`);
}
