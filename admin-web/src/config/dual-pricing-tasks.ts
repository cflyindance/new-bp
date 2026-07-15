/**
 * Dual Pricing 任务列表（设置页「配置失败」旁入口弹层用）。
 * 对齐原型：任务ID / case number / 类型 / rate / 状态 / 更新时间 / 操作。
 */

export type DpTaskListType = "open" | "close";

/** 与设置行「配置失败」及原型状态文案对齐 */
export type DpTaskListStatus = "config_failed" | "dispatch_ok" | "dispatch_failed";

export type DpTaskListItem = {
  taskId: string;
  caseNumber: string;
  type: DpTaskListType;
  rate: number;
  status: DpTaskListStatus;
  updatedAt: string;
};

export const DP_TASK_TYPE_LABEL_ZH: Record<DpTaskListType, string> = {
  open: "开启",
  close: "关闭",
};

export const DP_TASK_STATUS_LABEL_ZH: Record<DpTaskListStatus, string> = {
  config_failed: "配置失败",
  dispatch_ok: "下发成功",
  dispatch_failed: "下发失败",
};

const seedTasks: DpTaskListItem[] = [
  {
    taskId: "12241432",
    caseNumber: "00253912",
    type: "open",
    rate: 3.65,
    status: "config_failed",
    updatedAt: "2026-06-06 10:00:00",
  },
  {
    taskId: "4141414",
    caseNumber: "00253913",
    type: "close",
    rate: 3.65,
    status: "dispatch_ok",
    updatedAt: "2026-06-05 10:00:00",
  },
  {
    taskId: "1411441",
    caseNumber: "00253914",
    type: "open",
    rate: 3.65,
    status: "dispatch_ok",
    updatedAt: "2026-06-02 10:00:00",
  },
];

let tasks: DpTaskListItem[] = seedTasks.map((t) => ({ ...t }));

export function listDualPricingTasks(): DpTaskListItem[] {
  return tasks.slice().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : a.updatedAt > b.updatedAt ? -1 : 0));
}

export function isDpTaskRetryable(task: Pick<DpTaskListItem, "status">): boolean {
  return task.status === "config_failed" || task.status === "dispatch_failed";
}

/** 演示：失败任务「更新」→ 下发成功 */
export function retryDualPricingTask(taskId: string): DpTaskListItem | null {
  const idx = tasks.findIndex((t) => t.taskId === taskId);
  if (idx < 0) return null;
  const current = tasks[idx]!;
  if (!isDpTaskRetryable(current)) return null;
  const stamp = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  const updatedAt = `${stamp.getFullYear()}-${p(stamp.getMonth() + 1)}-${p(stamp.getDate())} ${p(stamp.getHours())}:${p(stamp.getMinutes())}:${p(stamp.getSeconds())}`;
  const next: DpTaskListItem = {
    ...current,
    status: "dispatch_ok",
    updatedAt,
  };
  tasks[idx] = next;
  return next;
}

export function resetDualPricingTasksSeed(): void {
  tasks = seedTasks.map((t) => ({ ...t }));
}
