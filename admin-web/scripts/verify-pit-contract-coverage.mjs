import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const specText = readFileSync(path.join(root, "docs/superpowers/specs/2026-08-31-pit-requirement-pool-design.md"), "utf8");
const routerText = readFileSync(path.join(root, "server/pit/pit-router.mjs"), "utf8");
const clientText = readFileSync(path.join(root, "src/pit/pit-api.ts"), "utf8");
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
function codeMask(source) {
  const chars=[...source],out=[...source];let quote=null,escaped=false,lineComment=false,blockComment=false;
  for(let i=0;i<chars.length;i+=1){const c=chars[i],n=chars[i+1];if(lineComment){if(c!=="\n")out[i]=" ";else lineComment=false;continue;}if(blockComment){out[i]=" ";if(c==="*"&&n==="/"){out[i+1]=" ";i+=1;blockComment=false;}continue;}if(quote){out[i]=" ";if(escaped)escaped=false;else if(c==="\\")escaped=true;else if(c===quote)quote=null;continue;}if(c==="/"&&n==="/"){out[i]=out[i+1]=" ";i+=1;lineComment=true;continue;}if(c==="/"&&n==="*"){out[i]=out[i+1]=" ";i+=1;blockComment=true;continue;}if(c==='"'||c==="'"||c==="`"){out[i]=" ";quote=c;}}
  return out.join("");
}
const key = (method, route) => `${method.toUpperCase()} ${route.replace(/^\/api\/v1\/pit/, "").replace(/\?.*$/, "").replace(/\/+$/, "") || "/"}`;
function expectedContracts(spec) {
  const section = spec.slice(spec.indexOf("### 9.2"), spec.indexOf("## 10.")); const contracts = new Set();
  for (const line of section.split(/\r?\n/)) {
    const row = /`((?:GET|POST|PUT|PATCH|DELETE)(?:\/(?:GET|POST|PUT|PATCH|DELETE))*)`\s*\|\s*`(\/api\/v1\/pit[^`\s]*)`/.exec(line);
    if (row) for (const method of row[1].split("/")) contracts.add(key(method, `${row[2]}${method === "PATCH" && /\/(?:dictionaries|users)$/.test(row[2]) ? "/:id" : ""}`));
  }
  for (const match of section.matchAll(/`?(GET|POST|PUT|PATCH|DELETE)`?\s+(\/api\/v1\/pit\/[A-Za-z0-9_:/-]+)/g)) contracts.add(key(match[1], match[2]));
  return contracts;
}
function balancedBlock(source, openIndex) { let depth = 0; for (let i=openIndex;i<source.length;i+=1) { if(source[i]==="{")depth+=1; if(source[i]==="}"&&--depth===0)return source.slice(openIndex+1,i); } return ""; }
function serverContracts(input) {
  const source=input,mask=codeMask(input),contracts=new Set();
  for(const marker of mask.matchAll(/\b(?:method|path)\s*===/g)){const end=source.indexOf("\n",marker.index);const line=source.slice(marker.index,end<0?source.length:end);const m=/method\s*===\s*"(GET|POST|PUT|PATCH|DELETE)"\s*&&\s*path\s*===\s*"([^"]+)"|path\s*===\s*"([^"]+)"\s*&&\s*method\s*===\s*"(GET|POST|PUT|PATCH|DELETE)"/.exec(line);if(m)contracts.add(key(m[1]??m[4],m[2]??m[3]));}
  for(const marker of mask.matchAll(/if\s*\(path\s*===/g)){const brace=mask.indexOf("{",marker.index),header=source.slice(marker.index,brace),m=/path\s*===\s*"([^"]+)"/.exec(header);if(!m)continue;const block=balancedBlock(source,brace),blockMask=codeMask(block);for(const mm of blockMask.matchAll(/method\s*===/g)){const snippet=block.slice(mm.index,mm.index+80),parsed=/method\s*===\s*"(GET|POST|PUT|PATCH|DELETE)"/.exec(snippet);if(parsed)contracts.add(key(parsed[1],m[1]));}}
  const matchers=[["dictionaryMatch","/dictionaries/:id"],["userMatch","/users/:id"],["importMatch","/imports/:id"],["exportDownloadMatch","/exports/:id/download"],["backupDownloadMatch","/backups/:id/download"],["requirementMatch","/requirements/:id"]];
  for(const [name,base] of matchers){const start=mask.indexOf(`const ${name} =`);if(start<0)continue;const ifStart=mask.indexOf(`if (${name}`,start);const brace=mask.indexOf("{",ifStart);const block=balancedBlock(source,brace),condition=source.slice(ifStart,brace),combined=`${condition}\n${block}`,combinedMask=codeMask(combined);for(const mm of combinedMask.matchAll(/method\s*===/g)){const snippet=combined.slice(mm.index,mm.index+80),parsed=/method\s*===\s*"(GET|POST|PUT|PATCH|DELETE)"/.exec(snippet);if(!parsed)continue;const nearby=combined.slice(Math.max(0,mm.index-250),mm.index+160);const noAction=new RegExp(`!action\\s*&&\\s*method\\s*===\\s*"${parsed[1]}"`).test(nearby);const action=noAction?undefined:/action\s*===\s*"([^"]+)"/.exec(nearby)?.[1];contracts.add(key(parsed[1],action?`${base}/${action}`:base));}}
  return contracts;
}
function clientContracts(input) {
  const source=input,mask=codeMask(input),contracts=new Set();
  for(const call of mask.matchAll(/\b(request|download)\b/g)){const lineEnd=source.indexOf("\n",call.index);const fragment=source.slice(call.index,lineEnd<0?source.length:lineEnd);const m=/^(?:request|download)(?:<.*>)?\s*\(\s*([`"])(.*?)\1/.exec(fragment);if(!m)continue;const route=m[2].replace(/\$\{encodeURIComponent\([^)]*\)\}/g,":id").replace(/\$\{queryString\([^}]+\)\}/g,"");if(route.includes("${"))continue;const method=/method\s*:\s*"(GET|POST|PUT|PATCH|DELETE)"/.exec(fragment)?.[1]??"GET";contracts.add(key(method,route));}
  return contracts;
}
const expected=expectedContracts(specText),server=serverContracts(routerText),client=clientContracts(clientText),failures=[];
assert(expected.size>=30,`spec parser unexpectedly found only ${expected.size} contracts`);
for(const contract of expected){if(!server.has(contract))failures.push(`server missing ${contract}`);if(!client.has(contract))failures.push(`typed client missing ${contract}`);}
const representative="POST /requirements/:id/transitions";
assert(server.has(representative)&&client.has(representative),"mutation fixture precondition missing");
assert(!serverContracts(routerText.replace('action === "transitions" && method === "POST"','action === "transitions" && method === "GET"')).has(representative),"server method mutation must fail");
assert(!clientContracts(clientText.replace('/transitions`, { method: "POST"','/transition`, { method: "POST"')).has(representative),"client path mutation must fail");
assert(!serverContracts(`// method === "POST" && path === "/requirements/:id/transitions"`).has(representative),"comments cannot satisfy server coverage");
assert(!serverContracts(`const decoy = 'method === "POST" && path === "/requirements/:id/transitions"'`).has(representative),"string literals cannot satisfy server coverage");
assert(!clientContracts(`// request("/requirements/:id/transitions", { method: "POST" })`).has(representative),"comments cannot satisfy client coverage");
assert(!clientContracts(`const decoy = 'request("/requirements/:id/transitions", { method: "POST" })'`).has(representative),"string literals cannot satisfy client coverage");
function files(dir){return readdirSync(dir).flatMap((name)=>{const target=path.join(dir,name);return statSync(target).isDirectory()?files(target):[target];});}
const sourceFiles=[...files(path.join(root,"src/pit")),...files(path.join(root,"server/pit"))].filter((file)=>/\.(?:ts|mjs)$/.test(file));
const forbidden=[ [/\b(?:alert|confirm|prompt)\s*(?:\?\.)?\s*\(|\b(?:window|globalThis|self)\s*(?:\?\.|\.)\s*(?:alert|confirm|prompt)\s*(?:\?\.)?\s*\(/,"native dialog"], [/\b(?:TODO|FIXME|HACK|XXX)\b/i,"unfinished marker"], [/(?:lorem ipsum|coming soon|待实现|下一阶段启用|unimplemented)/i,"dummy or unimplemented copy"] ];
for(const file of sourceFiles){const raw=readFileSync(file,"utf8"),code=codeMask(raw);if(forbidden[0][0].test(code))failures.push(`native dialog: ${path.relative(root,file)}`);for(const [pattern,label] of forbidden.slice(1))if(pattern.test(raw))failures.push(`${label}: ${path.relative(root,file)}`);}
for(const fixture of ["alert('x')","window . confirm ?. ('x')","globalThis?.prompt?.('x')","self . alert ('x')"])assert(forbidden[0][0].test(fixture),`native-dialog mutation escaped scanner: ${fixture}`);
assert(forbidden[1][0].test("// TODO remove stub"),"commented unfinished markers must fail");
assert.deepEqual(failures,[],`PIT contract coverage failed:\n${failures.join("\n")}`);
console.log(`PIT contract coverage passed (${expected.size} spec-derived contracts, ${sourceFiles.length} source files, mutation checks passed).`);
