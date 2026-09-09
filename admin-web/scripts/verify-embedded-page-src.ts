import assert from "node:assert/strict";
import { embeddedPageSrc } from "../src/shell/embedded-page-src";

assert.equal(
  embeddedPageSrc("./emenu-pro/index.html", "20260909"),
  "/emenu-pro/index.html?embedded=1&v=20260909",
);

assert.equal(
  embeddedPageSrc("./Configuration%20center/order-limit.html", "build stamp"),
  "/Configuration%20center/order-limit.html?embedded=1&v=build%20stamp",
);

assert.equal(
  embeddedPageSrc("/TipOut/index.html", "abc"),
  "/TipOut/index.html?embedded=1&v=abc",
);

console.log("embedded page src verification passed");
