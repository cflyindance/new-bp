import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlPath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);
const dialogsPath = new URL("../dist/Configuration%20center/assets/app-dialogs.js", import.meta.url);
const html = await readFile(htmlPath, "utf8");
const dialogs = await readFile(dialogsPath, "utf8");

assert.match(html, /src=["']\.\/assets\/app-dialogs\.js["']/, "列表页应引入自定义对话框脚本");
assert.doesNotMatch(
  html,
  /action === ["']delete["'][\s\S]{0,120}window\.confirm\(/,
  "删除规则不得使用原生 confirm"
);
assert.match(
  html,
  /action === ["']delete["'][\s\S]{0,220}AppDialogs\.confirm\([\s\S]{0,180}确认删除[\s\S]{0,120}danger:\s*true/,
  "删除规则应使用全屏自定义确认对话框"
);
assert.match(dialogs, /\.appd-overlay\{position:fixed;inset:0/, "确认对话框应使用全屏遮罩");
assert.match(dialogs, /function confirm\(/, "应提供 AppDialogs.confirm");
assert.match(dialogs, /data-appd="cancel"/, "确认对话框应提供取消按钮");
assert.match(dialogs, /Escape/, "Esc 应可取消确认对话框");

// iframe 嵌入态：遮罩必须铺满顶层窗口，而不是只覆盖 iframe 面板区域
assert.match(dialogs, /function hostDocument\(\)/, "应提供顶层文档解析");
assert.match(dialogs, /window\.top[\s\S]{0,160}return topWindow\.document/, "同源时应取顶层文档作为挂载点");
assert.match(dialogs, /catch \(e\) \{\}\s*return document;/, "跨域取不到顶层文档时应退回本文档");
assert.match(dialogs, /function ensureStyles\(doc\)/, "样式应注入到挂载文档");
assert.match(dialogs, /doc\.head\.appendChild\(style\)/, "样式应挂到挂载文档 head");
assert.doesNotMatch(
  dialogs,
  /document\.body\.appendChild|document\.head\.appendChild|document\.createElement|document\.getElementById/,
  "不应再向本文档挂载遮罩/样式，否则 iframe 内只能覆盖局部区域"
);
const confirmBody = dialogs.slice(dialogs.indexOf("function confirm("), dialogs.indexOf("function prompt("));
assert.match(confirmBody, /doc\.body\.appendChild\(overlay\)/, "确认遮罩应挂到顶层文档 body");
assert.match(confirmBody, /if \(doc !== document\) doc\.addEventListener\("keydown", onKey\)/, "顶层文档也应响应 Esc");
assert.match(confirmBody, /window\.addEventListener\("pagehide", onPageHide\)/, "iframe 卸载时应清理顶层遮罩");

console.log("Order limit delete confirm verification passed");
