import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("C:/Users/27273/Downloads/CF-周边产品-PIT-需求池.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  const values = used?.values ?? [];
  const nonEmptyRows = values.slice(1).filter((row) => row.some((cell) => cell != null && String(cell).trim())).length;
  console.log(`${sheet.name}\t${used?.address ?? ""}\t${nonEmptyRows}`);
}
