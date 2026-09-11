import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/team/tips/legacy/tipout-summary-date-sort.js.txt', 'utf8');
const context = { window: {} };
vm.runInNewContext(source, context);
const dateSort = context.window.TipOutSummaryDateSort;

assert.deepEqual(
  { ...dateSort.defaultDateRange(new Date(2026, 2, 31, 23, 30)) },
  { startDate: '2026-02-28', endDate: '2026-03-31' }
);
assert.deepEqual(
  { ...dateSort.defaultDateRange(new Date(2024, 2, 31, 8, 0)) },
  { startDate: '2024-02-29', endDate: '2024-03-31' }
);
assert.deepEqual(
  { ...dateSort.defaultDateRange(new Date(2026, 4, 31)) },
  { startDate: '2026-04-30', endDate: '2026-05-31' }
);
assert.deepEqual(
  { ...dateSort.defaultDateRange(new Date(2026, 0, 31)) },
  { startDate: '2025-12-31', endDate: '2026-01-31' }
);

assert.equal(dateSort.isValidDateRange('2026-01-25', '2026-01-28'), true);
assert.equal(dateSort.isValidDateRange('2026-02-30', '2026-03-01'), false);
assert.equal(dateSort.isValidDateRange('2026-01-28', '2026-01-25'), false);

const rows = [{ dateKey: '2026-01-25' }, { dateKey: '2026-01-28' }, { dateKey: '2026-01-27' }];
assert.deepEqual(dateSort.sortRows(rows, 'desc').map((row) => row.dateKey), ['2026-01-28', '2026-01-27', '2026-01-25']);
assert.deepEqual(dateSort.sortRows(rows, 'asc').map((row) => row.dateKey), ['2026-01-25', '2026-01-27', '2026-01-28']);
assert.deepEqual(rows.map((row) => row.dateKey), ['2026-01-25', '2026-01-28', '2026-01-27']);

const memory = new Map();
const storage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };
assert.equal(dateSort.readDirection(storage), 'desc');
assert.equal(dateSort.writeDirection('asc', storage), 'asc');
assert.equal(dateSort.readDirection(storage), 'asc');
assert.equal(dateSort.readDirection({ getItem() { return 'invalid'; } }), 'desc');
assert.equal(dateSort.readDirection({ getItem() { throw new Error('blocked'); } }), 'desc');
assert.equal(dateSort.writeDirection('asc', { setItem() { throw new Error('blocked'); } }), 'asc');

const template = fs.readFileSync('src/team/tips/templates/distribution.html', 'utf8');
const distribution = fs.readFileSync('src/team/tips/programs/distribution.js.txt', 'utf8');
const styles = fs.readFileSync('src/team/tips/tips-page.css', 'utf8');
assert.match(template, /id="dateSortField"/);
assert.match(template, /<option value="desc">日期倒序<\/option>/);
assert.match(template, /<option value="asc">日期顺序<\/option>/);
assert.match(distribution, /TipOutSummaryDateSort\.sortRows\(dailyRows, summaryDateSort\)/);
assert.match(distribution, /dateSortField\.hidden = employeeActive/);
assert.match(styles, /\.tipout-page-summary \.tipout-date-sort-field\[hidden\]\s*\{\s*display:\s*none/);
assert.doesNotMatch(distribution, /dateSort[^\n]*buildSummaryHistoryState/i);

console.log('team tips summary date sort verification passed');
