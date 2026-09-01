import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "scripts", "lib", "emenu-local-seasoning-api-handler.mjs");
const outputPath = path.join(root, "src", "emenu-local", "seasoning", "generated", "seasoning-browser-handler.ts");

let source = fs.readFileSync(sourcePath, "utf8");
source = source
  .replace(/import crypto from "node:crypto";\r?\n/, "")
  .replace(/import fs from "node:fs";\r?\n/, "")
  .replace(/import path from "node:path";\r?\n/, "")
  .replace('from "./emenu-local-seasoning-seed.mjs";', 'from "../../../../scripts/lib/emenu-local-seasoning-seed.mjs";')
  .replace(
    /import \{ createLiveMenuProvider \} from "\.\/emenu-local-seasoning-menu-provider\.mjs";\r?\n/,
    `function createLiveMenuProvider() {
  return {
    async resolve() {
      return {
        menuGroups: [],
        products: [],
        categories: [],
        fingerprint: "static",
        sourceMenuVersion: null,
        fromCache: false,
        source: "static",
        product: "EMENU",
      };
    },
  };
}
`,
  );

const banner = `// @ts-nocheck\n// Generated from scripts/lib/emenu-local-seasoning-api-handler.mjs. Do not edit directly.\nimport { browserCrypto as crypto, browserFs as fs, browserPath as path, BrowserBuffer as Buffer, BROWSER_PROCESS as process } from "../seasoning-browser-runtime";\n`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${banner}${source}`, "utf8");
console.log(`Generated ${path.relative(root, outputPath)}`);
