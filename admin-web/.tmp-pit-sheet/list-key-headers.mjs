import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("C:/Users/27273/Downloads/CF-周边产品-PIT-需求池.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const keys = new Set(["Kiosk", "E-Menu", "TipOut", "PayRoll", "云报表", "重点需求", "壳子", "PayPad", "新B平台", "其他"]);
for (const sheet of workbook.worksheets.items) {
  if (!keys.has(sheet.name)) continue;
  const used = sheet.getUsedRange();
  const headers = (used?.values?.[0] ?? []).map((value) => value == null ? "" : String(value).trim());
  console.log(`${sheet.name}\t${JSON.stringify(headers)}`);
}
