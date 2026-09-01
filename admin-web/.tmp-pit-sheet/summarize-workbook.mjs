import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/27273/Downloads/CF-周边产品-PIT-需求池.xlsx";
const input = await FileBlob.load(inputPath);
const workbook = await SpreadsheetFile.importXlsx(input);

function clean(value) {
  return value == null ? "" : String(value).trim();
}

function topValues(rows, columnIndex, limit = 12) {
  const counts = new Map();
  for (const row of rows.slice(1)) {
    const value = clean(row[columnIndex]);
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "zh-CN"))
    .slice(0, limit)
    .map(([value, count]) => ({ value, count }));
}

const output = [];
for (const sheet of workbook.worksheets.items) {
  const used = sheet.getUsedRange();
  if (!used) {
    output.push({ name: sheet.name, address: null });
    continue;
  }
  const values = used.values;
  const headers = values[0]?.map(clean) ?? [];
  const nonEmptyRows = values.slice(1).filter((row) => row.some((cell) => clean(cell))).length;
  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const facets = {};
  for (const field of ["需求来源", "需求类别", "状态", "产品线", "前后端", "研发", "优先级", "问题分类", "实现月份", "实现年度", "测试", "合入POS"]) {
    const index = headerIndex.get(field);
    if (index !== undefined) facets[field] = topValues(values, index);
  }
  const samples = values.slice(1).filter((row) => row.some((cell) => clean(cell))).slice(0, 5).map((row) => {
    const ticketIndex = headerIndex.get("Jira Ticket");
    const descIndex = headerIndex.get("需求描述");
    const nameIndex = headerIndex.get("产品需求名称");
    return {
      ticket: ticketIndex === undefined ? "" : clean(row[ticketIndex]),
      description: descIndex === undefined ? "" : clean(row[descIndex]).slice(0, 120),
      productRequirementName: nameIndex === undefined ? "" : clean(row[nameIndex]).slice(0, 120),
    };
  });
  output.push({
    name: sheet.name,
    address: used.address,
    rowCount: used.rowCount,
    columnCount: used.columnCount,
    nonEmptyRows,
    headers,
    facets,
    samples,
  });
}
console.log(JSON.stringify(output, null, 2));
