import { readFileSync } from "node:fs";
for (const path of ["src/config/deployment-seed.ts", "src/config/dual-pricing-upstream.ts"]) {
  const source = readFileSync(path, "utf8");
  if (source.includes("guangzhou-tzh") || source.includes("南京演示店")) throw new Error(`duplicate store catalog remains in ${path}`);
}
console.log("demo store support adapter: ok");
