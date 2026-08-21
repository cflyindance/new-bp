import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const htmlPath = new URL("../dist/Configuration%20center/order-limit.html", import.meta.url);
const source = await readFile(htmlPath, "utf8");

["Persons", "Round", "Time", "Store", "Status", "Reset"].forEach((name) => {
  assert.match(source, new RegExp(`id=["']ruleFilter${name}["']`), `应提供 ${name} 筛选控件`);
});
assert.doesNotMatch(source, /id=["']ruleFilterQuery["']/, "不应继续提供规则关键词筛选");
assert.match(source, /id="ruleFilterStore"[\s\S]*?id="ruleFilterStatus"[\s\S]*?id="ruleFilterPersons"[\s\S]*?id="ruleFilterRound"[\s\S]*?id="ruleFilterTime"[\s\S]*?id="ruleFilterReset"/, "筛选项应按门店、状态、人数、轮次、时间、重置排列");
assert.match(source, /function filteredRules\(\)[\s\S]*?filters\.persons[\s\S]*?filters\.round[\s\S]*?filters\.time[\s\S]*?filters\.storeId[\s\S]*?filters\.status/, "规则筛选条件应组合生效");
assert.match(source, /筛选 " \+ visibleRules\.length \+ " \/ 共 " \+ state\.rules\.length \+ " 条"/, "数量角标应展示筛选结果数和总数");
assert.match(source, /state\.ruleFilters = \{ persons: "", round: "", time: "", storeId: "", status: "" \}/, "应支持重置全部筛选条件");

console.log("Menu order limit rule filters verification passed");
