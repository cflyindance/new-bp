import assert from "node:assert/strict";
import { rerenderPreservingJsonMenuTreeScroll } from "../src/config/json-menu-editor-scroll";

interface FakeScrollHost {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
}

let currentHost: FakeScrollHost = { scrollTop: 420, scrollHeight: 1200, clientHeight: 360 };
const root = {
  querySelector: (selector: string) => selector === "[data-jme-tree-scroll]" ? currentHost : null,
};

rerenderPreservingJsonMenuTreeScroll(
  () => { currentHost = { scrollTop: 0, scrollHeight: 1200, clientHeight: 360 }; },
  root as unknown as ParentNode,
  (callback) => callback(),
);

assert.equal(currentHost.scrollTop, 420, "点击菜单触发重绘后必须恢复左侧菜单滚动位置");

currentHost = { scrollTop: 900, scrollHeight: 1000, clientHeight: 300 };
rerenderPreservingJsonMenuTreeScroll(
  () => { currentHost = { scrollTop: 0, scrollHeight: 700, clientHeight: 300 }; },
  root as unknown as ParentNode,
  (callback) => callback(),
);
assert.equal(currentHost.scrollTop, 400, "菜单缩短时恢复位置不得超过最大滚动范围");

console.log("json-menu tree scroll preservation verification passed");

