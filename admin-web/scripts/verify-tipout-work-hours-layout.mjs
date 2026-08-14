import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const ruleAddPath = path.resolve(scriptDir, '../dist/TipOut/rule-add.html');
const html = fs.readFileSync(ruleAddPath, 'utf8');

const hoursOptionIndex = html.indexOf('value="hours"');
const configPanelIndex = html.indexOf('id="workHoursConfigPanel"');
const ordersOptionIndex = html.indexOf('id="distributionOrdersRow"');

if (hoursOptionIndex < 0 || configPanelIndex < 0 || ordersOptionIndex < 0) {
  throw new Error('TipOut 分配方式或工时配置节点缺失');
}

if (!(hoursOptionIndex < configPanelIndex && configPanelIndex < ordersOptionIndex)) {
  throw new Error(
    `工时配置面板必须位于“按工作时长占比分配”与“按订单占比分配”之间；当前位置：hours=${hoursOptionIndex}, panel=${configPanelIndex}, orders=${ordersOptionIndex}`,
  );
}

console.log('TipOut 工时配置面板位于“按工作时长占比分配”选项下方。');
