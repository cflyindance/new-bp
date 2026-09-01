import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/27273/Downloads/CF-周边产品-PIT-需求池.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

const summary = await workbook.inspect({
  kind: "workbook,sheet,table,region",
  maxChars: 30000,
  tableMaxRows: 15,
  tableMaxCols: 30,
  tableMaxCellChars: 160,
});
console.log("===SUMMARY===");
console.log(summary.ndjson);

const sheets = workbook.worksheets.items;
for (const sheet of sheets) {
  const used = sheet.getUsedRange();
  console.log(`===SHEET:${sheet.name}===`);
  console.log(JSON.stringify({ address: used?.address ?? null, rowCount: used?.rowCount ?? null, columnCount: used?.columnCount ?? null }));
  if (used) {
    const rowLimit = Math.min(used.rowCount, 40);
    const colLimit = Math.min(used.columnCount, 30);
    const range = sheet.getRangeByIndexes(0, 0, rowLimit, colLimit);
    console.log(JSON.stringify(range.values));
    const preview = await workbook.render({
      sheetName: sheet.name,
      range: range.address,
      scale: 1,
      format: "png",
    });
    const safe = sheet.name.replace(/[\\/:*?"<>|]/g, "_");
    await fs.writeFile(`./${safe}.png`, new Uint8Array(await preview.arrayBuffer()));
  }
}
