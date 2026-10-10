import assert from 'node:assert/strict';
import { createPayrollExportQueue } from '../src/team/payroll/payroll-export-queue';
import type { BatchExportInput, PayrollBatchBridge } from '../src/team/payroll/payroll-batch-export-types';

async function main() {
  let context = 'first', active = 0, maximum = 0, fail = false;
  const releases: (() => void)[] = [], captured: string[] = [];
  const bridge = { getDetailPrintHtml: () => context, appendExportAudit() {} } as unknown as PayrollBatchBridge;
  const queue = createPayrollExportQueue(bridge, { createArtifact: async (input, frozen, _signal, progress, _retry, phase) => {
    active++; maximum = Math.max(maximum, active);
    captured.push(frozen.getDetailPrintHtml('emp', 'summary', 'single-page')!);
    await new Promise<void>(resolve => releases.push(resolve));
    active--; if (fail) throw new Error('test failure');
    progress(1, 1); phase('packaging');
    return { blob: new Blob(['PDF']), filename: 'test.pdf', succeededIds: ['emp'], skippedIds: [], failures: [] };
  } });
  const input = { options: { scope: 'selected', detailType: 'summary', format: 'pdf', organization: 'merged', summaryPagination: 'single-page' }, records: [{ employee: { id: 'emp', name: 'Test', segments: [], adjustments: {} }, status: 'ready' }], period: {}, counts: {}, createdAt: 1 } as BatchExportInput;
  queue.submit(input); const second = queue.submit(input);
  assert.equal(queue.getJobs()[1].queued, true);
  context = 'changed'; input.records[0].employee.name = 'Changed';
  releases.shift()!(); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(queue.getJobs()[0].snapshot.status, 'completed');
  assert.equal(maximum, 1); assert.deepEqual(captured, ['first', 'first']);
  assert.equal(queue.getJobs()[1].input.records[0].employee.name, 'Test');
  fail = true; releases.shift()!(); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(queue.getJobs()[1].snapshot.status, 'failed');
  assert.equal(queue.getJobs()[1].snapshot.result, null);
  fail = false; queue.retry(second); releases.shift()!(); await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(queue.getJobs()[1].snapshot.status, 'completed');
  assert.equal(queue.hasPending(), false);
  let printCalls = 0;
  const singleQueue = createPayrollExportQueue({
    ...bridge,
    getDetailPrintHtml() { printCalls++; return 'batch'; },
    getCurrentDetailPrintHtml() { printCalls++; return 'current-draft'; },
  }, { createArtifact: async (jobInput, frozen) => {
    if (jobInput.options.format === 'pdf') assert.equal(frozen.getDetailPrintHtml('emp', 'summary', 'single-page'), 'current-draft');
    return { blob: new Blob(['export']), filename: 'test.' + jobInput.options.format, succeededIds: ['emp'], skippedIds: [], failures: [] };
  } });
  singleQueue.submit(input, 'single');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(singleQueue.getJobs()[0].source, 'single');
  singleQueue.submit({ ...input, options: { ...input.options, format: 'csv' } }, 'single');
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(printCalls, 1, 'CSV must not render print HTML');
  assert.equal(singleQueue.getJobs()[1].snapshot.status, 'completed');
  assert.equal(singleQueue.getJobs()[1].snapshot.result?.filename, 'test.csv');
  singleQueue.destroy();
  queue.destroy(); console.log('Payroll export queue: serial, frozen context, failure and retry passed');
}
void main();
