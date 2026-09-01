import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const input = await FileBlob.load("C:/Users/27273/Downloads/CF-周边产品-PIT-需求池.xlsx");
const workbook = await SpreadsheetFile.importXlsx(input);
const standardSheets = new Set(["Kiosk", "E-Menu", "TipOut", "PayRoll", "云报表", "壳子", "PayPad", "新B平台", "其他"]);
const tickets = new Map();
const stats = [];
for (const sheet of workbook.worksheets.items) {
  if (!standardSheets.has(sheet.name)) continue;
  const values = sheet.getUsedRange()?.values ?? [];
  const headers = (values[0] ?? []).map((value) => String(value ?? "").trim());
  const idx = Object.fromEntries(headers.map((header, index) => [header, index]));
  let records = 0;
  let missingTicket = 0;
  let missingTitleAndDescription = 0;
  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const row = values[rowIndex];
    const ticket = String(row[idx["Jira Ticket"]] ?? "").trim();
    const description = String(row[idx["需求描述"]] ?? "").trim();
    const title = String(row[idx["产品需求名称"]] ?? "").trim();
    if (!ticket && !description && !title) continue;
    records++;
    if (!ticket) missingTicket++;
    if (!description && !title) missingTitleAndDescription++;
    if (ticket) {
      const list = tickets.get(ticket) ?? [];
      list.push({ sheet: sheet.name, row: rowIndex + 1 });
      tickets.set(ticket, list);
    }
  }
  stats.push({ sheet: sheet.name, records, missingTicket, missingTitleAndDescription });
}
const duplicates = [...tickets.entries()].filter(([, rows]) => rows.length > 1);
console.log(JSON.stringify({
  stats,
  totalRecords: stats.reduce((sum, item) => sum + item.records, 0),
  uniqueTickets: tickets.size,
  duplicateTicketCount: duplicates.length,
  duplicateRows: duplicates.reduce((sum, [, rows]) => sum + rows.length, 0),
  duplicateSamples: duplicates.slice(0, 15).map(([ticket, rows]) => ({ ticket, rows })),
}, null, 2));
