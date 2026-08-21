import assert from "node:assert/strict";
import { rerenderPreservingJsonMenuDetailScroll } from "../src/config/json-menu-editor-scroll";

interface FakeScrollHost { scrollTop: number; scrollHeight: number; clientHeight: number; }
let currentHost: FakeScrollHost = { scrollTop: 516, scrollHeight: 1500, clientHeight: 500 };
const root = { querySelector: (selector: string) => selector === "[data-jme-detail-panel]" ? currentHost : null };

rerenderPreservingJsonMenuDetailScroll(
  () => { currentHost = { scrollTop: 0, scrollHeight: 1700, clientHeight: 500 }; },
  root as unknown as ParentNode,
  (callback) => callback(),
);
assert.equal(currentHost.scrollTop, 516, "切换菜单用途后必须恢复右侧编辑区滚动位置");

currentHost = { scrollTop: 900, scrollHeight: 1400, clientHeight: 400 };
rerenderPreservingJsonMenuDetailScroll(
  () => { currentHost = { scrollTop: 0, scrollHeight: 720, clientHeight: 400 }; },
  root as unknown as ParentNode,
  (callback) => callback(),
);
assert.equal(currentHost.scrollTop, 320, "切换到较短表单时滚动位置不得超过新内容最大范围");

console.log("json-menu detail scroll preservation verification passed");
