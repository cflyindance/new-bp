import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(__dirname, "../dist/emenu-pro/images");
const BG_MARKER = 'data-emenu-icon-bg="1"';
const BG_CIRCLE =
  '<circle cx="24" cy="24" r="24" fill="#FFFFFF" ' + BG_MARKER + "/>";

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
  const filePath = path.join(dir, file);
  let svg = fs.readFileSync(filePath, "utf8");

  if (svg.includes(BG_MARKER)) {
    console.log("skip (already has bg)", file);
    continue;
  }

  svg = svg.replace(/(<svg[^>]*>)/, "$1" + BG_CIRCLE);
  fs.writeFileSync(filePath, svg);
  console.log("updated", file);
}
