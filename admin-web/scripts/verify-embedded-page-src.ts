import assert from "node:assert/strict";
import { embeddedPageSrc } from "../src/shell/embedded-page-src";

assert.equal(
  embeddedPageSrc(
    "./emenu-pro/index.html",
    "20260909",
    "http://127.0.0.1:5173/",
  ),
  "http://127.0.0.1:5173/emenu-pro/index.html?embedded=1&v=20260909",
);

assert.equal(
  embeddedPageSrc(
    "./Configuration%20center/order-limit.html",
    "build stamp",
    "https://cflyindance.github.io/new-bp/admin-web/dist/index.html",
  ),
  "https://cflyindance.github.io/new-bp/admin-web/dist/Configuration%20center/order-limit.html?embedded=1&v=build+stamp",
);

assert.equal(
  embeddedPageSrc(
    "./TipOut/index.html",
    "abc",
    "https://cflyindance.github.io/new-bp/admin-web/dist/index.html#/operations/queue-call/tips",
  ),
  "https://cflyindance.github.io/new-bp/admin-web/dist/TipOut/index.html?embedded=1&v=abc",
);

console.log("embedded page src verification passed");
