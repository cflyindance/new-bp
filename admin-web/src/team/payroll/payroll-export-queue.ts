import { createPayrollBatchExportTask, type BatchTaskSnapshot } from './payroll-batch-export-task';
import { createBatchArtifact } from './payroll-batch-export-artifacts';
import type { BatchExportInput, PayrollBatchBridge } from './payroll-batch-export-types';

export interface ExportJob {
  source: 'batch' | 'single';
  id: string;
  input: BatchExportInput;
  submittedAt: Date;
  snapshot: BatchTaskSnapshot;
  queued: boolean;
  bridge: PayrollBatchBridge;
}

export function createPayrollExportQueue(bridge: PayrollBatchBridge, dependencies = { createArtifact: createBatchArtifact }) {
  const jobs: ExportJob[] = [];
  const listeners = new Set<() => void>();
  let active = false, destroyed = false, sequence = 0;
  let running: ReturnType<typeof createPayrollBatchExportTask> | null = null;
  const publish = () => listeners.forEach(listener => listener());
  async function drain(): Promise<void> {
    if (active || destroyed) return;
    const job = jobs.find(item => item.queued);
    if (!job) return;
    active = true; job.queued = false;
    const task = createPayrollBatchExportTask({ bridge: job.bridge, createArtifact: dependencies.createArtifact });
    running = task;
    const unsubscribe = task.subscribe(snapshot => { job.snapshot = snapshot; publish(); });
    try { await task.run(job.input, job.snapshot.retryNumber); }
    finally { unsubscribe(); task.destroy(); running = null; active = false; if (!destroyed) { publish(); void drain(); } }
  }
  return {
    getJobs: () => [...jobs],
    hasPending: () => active || jobs.some(job => job.queued),
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    submit(input: BatchExportInput, source: 'batch' | 'single' = 'batch') {
      if (destroyed) throw new Error('任务中心已关闭');
      if (input.records.length < 1 || input.records.length > 10) throw new Error('一次请选择 1–10 名员工');
      const frozen = structuredClone(input);
      const documents = new Map<string, string | null>();
      const errors = new Map<string, unknown>();
      for (const record of frozen.records.filter(item => item.status !== 'no_data' && input.options.format === 'pdf')) {
        try { documents.set(record.employee.id, source === 'single' && bridge.getCurrentDetailPrintHtml ? bridge.getCurrentDetailPrintHtml(input.options.detailType, input.options.summaryPagination) : bridge.getDetailPrintHtml(record.employee.id, input.options.detailType, input.options.summaryPagination)); }
        catch (error) { errors.set(record.employee.id, error); }
      }
      const jobBridge: PayrollBatchBridge = { ...bridge, getDetailPrintHtml(id) { if (errors.has(id)) throw errors.get(id); return documents.get(id) ?? null; } };
      const job: ExportJob = { source, id: `payroll-export-${++sequence}`, input: frozen, bridge: jobBridge, submittedAt: new Date(), queued: true,
        snapshot: { status: 'idle', completed: 0, total: frozen.records.filter(item => item.status !== 'no_data').length, errorMessage: '', result: null, retryNumber: 0 } };
      jobs.push(job); publish(); void drain(); return job.id;
    },
    retry(id: string) {
      const job = jobs.find(item => item.id === id);
      if (!job || !['failed', 'partial', 'cancelled'].includes(job.snapshot.status) || job.queued) return;
      job.queued = true; job.snapshot = { ...job.snapshot, status: 'idle', completed: 0, result: null, errorMessage: '', retryNumber: job.snapshot.retryNumber + 1 };
      publish(); void drain();
    },
    destroy() { destroyed = true; running?.destroy(); listeners.clear(); jobs.length = 0; },
  };
}
