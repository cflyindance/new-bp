/**
 * Task 1 收尾：仅校验 embed-ui-locale helper。
 * Task 6 会换成完整壳层/控件断言。
 */
import assert from "node:assert/strict";
import {
  uiLocaleToEmbedLanguage,
  uiLocaleToEmenuLang,
  withEmbedLanguageParam,
} from "../src/shell/embed-ui-locale";

assert.equal(uiLocaleToEmbedLanguage("zh"), "zh-cn");
assert.equal(uiLocaleToEmbedLanguage("en"), "en");
assert.equal(uiLocaleToEmenuLang("zh"), "zh");
assert.equal(uiLocaleToEmenuLang("en"), "en");
assert.ok(withEmbedLanguageParam("./x?a=1#/h", "en").includes("language=en"));
assert.ok(withEmbedLanguageParam("./x?a=1#/h", "en").endsWith("#/h"));
assert.equal(
  withEmbedLanguageParam("./emenu-new/index.html?embedded=1&v=1", "zh"),
  "./emenu-new/index.html?embedded=1&v=1&language=zh-cn",
);
assert.equal(
  withEmbedLanguageParam("./emenu-new/index.html?embedded=1&v=1#/setting", "en"),
  "./emenu-new/index.html?embedded=1&v=1&language=en#/setting",
);
assert.equal(
  withEmbedLanguageParam(
    "./kpos/kiosklite/index.html?embedded=1&language=zh-cn&v=1#/configApp",
    "en",
  ),
  "./kpos/kiosklite/index.html?embedded=1&language=en&v=1#/configApp",
);

console.log("embed-ui-locale helper verification passed.");
