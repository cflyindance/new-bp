/**
 * 模拟下发 · 状态机模拟器（定时器驱动）
 */
import { markDomainDeployed, getDeploymentBatch, rollupBatchCounts, saveDeploymentBatch } from "./deployment-store";
import type {
  DeploymentBatch,
  DeploymentItem,
  DeploymentTarget,
} from "./deployment-types";

const MOCK_ERROR_MESSAGES = [
  "设备离线，超过 30s 未响应",
  "本地版本冲突，需人工处理",
  "打印机驱动未就绪",
  "网络超时（模拟）",
  "终端存储空间不足",
];

interface SimulationOptions {
  onlyFailed?: boolean;
  reducedFailureRate?: boolean;
}

interface ActiveSimulation {
  timers: ReturnType<typeof setTimeout>[];
}

const activeSimulations = new Map<string, ActiveSimulation>();

let failureRate = 0.1;
let offlineRate = 0.05;

export function setDeploymentSimulatorRates(opts: { failureRate?: number; offlineRate?: number }): void {
  if (opts.failureRate != null) failureRate = opts.failureRate;
  if (opts.offlineRate != null) offlineRate = opts.offlineRate;
}

function stopSimulation(batchId: string): void {
  const sim = activeSimulations.get(batchId);
  if (!sim) return;
  for (const t of sim.timers) clearTimeout(t);
  activeSimulations.delete(batchId);
}

function schedule(batchId: string, fn: () => void, delayMs: number): void {
  const sim = activeSimulations.get(batchId) ?? { timers: [] };
  const timer = setTimeout(() => {
    fn();
    const idx = sim.timers.indexOf(timer);
    if (idx >= 0) sim.timers.splice(idx, 1);
  }, delayMs);
  sim.timers.push(timer);
  activeSimulations.set(batchId, sim);
}

function pickError(): string {
  return MOCK_ERROR_MESSAGES[Math.floor(Math.random() * MOCK_ERROR_MESSAGES.length)]!;
}

function advanceTarget(
  target: DeploymentTarget,
  item: DeploymentItem,
  reducedFailure: boolean,
): void {
  const fail = reducedFailure ? 0.02 : failureRate;
  const offline = reducedFailure ? 0.01 : offlineRate;
  const roll = Math.random();
  if (roll < offline) {
    target.status = "offline";
    target.errorDetail = "设备离线，超过 30s 未响应";
  } else if (roll < offline + fail) {
    target.status = "failed";
    target.errorDetail = pickError();
  } else {
    target.status = "success";
    target.localVersion = item.configVersion;
    target.ackedAt = new Date().toISOString();
  }
}

function rollupItem(item: DeploymentItem): void {
  const targets = item.targets;
  if (targets.length === 0) {
    item.status = "success";
    item.completedAt = new Date().toISOString();
    return;
  }
  const allSuccess = targets.every((t) => t.status === "success");
  const allTerminal = targets.every((t) => ["success", "failed", "offline"].includes(t.status));

  if (!allTerminal) return;

  if (allSuccess) {
    item.status = "success";
  } else {
    item.status = "failed";
    item.errorMessage =
      targets.find((t) => t.errorDetail)?.errorDetail ??
      (targets.some((t) => t.status === "offline") ? "部分终端离线" : "部分终端同步失败");
  }
  item.completedAt = new Date().toISOString();
}

function updateProgress(batch: DeploymentBatch): void {
  const totalTargets = batch.items.reduce((sum, i) => sum + i.targets.length, 0) || batch.items.length;
  let done = 0;
  for (const item of batch.items) {
    for (const t of item.targets) {
      if (["success", "failed", "offline"].includes(t.status)) done += 1;
    }
    if (item.targets.length === 0 && item.status === "success") done += 1;
  }
  const percent = totalTargets > 0 ? Math.round((done / totalTargets) * 100) : 100;
  batch.simulatorMeta = {
    ...batch.simulatorMeta,
    progressPercent: percent,
    currentPhase: batch.simulatorMeta?.currentPhase ?? "pushing",
  };
}

function completeBatch(batchId: string): void {
  const batch = getDeploymentBatch(batchId);
  if (!batch) return;
  for (const item of batch.items) {
    rollupItem(item);
    if (item.status === "success") {
      markDomainDeployed(item.storeId, item.domainKey, item.configVersion);
    }
  }
  rollupBatchCounts(batch);
  batch.simulatorMeta = {
    ...batch.simulatorMeta,
    progressPercent: 100,
    currentPhase: "done",
    completedAt: new Date().toISOString(),
  };
  saveDeploymentBatch(batch);
  stopSimulation(batchId);
  window.dispatchEvent(
    new CustomEvent("menusifu:deployment-completed", { detail: { batchId } }),
  );
}

export function startDeploymentSimulation(batchId: string, options?: SimulationOptions): void {
  stopSimulation(batchId);
  const batch = getDeploymentBatch(batchId);
  if (!batch) return;

  const reduced = options?.reducedFailureRate ?? false;
  const items = options?.onlyFailed
    ? batch.items.filter((i) => ["pending", "pushing", "failed", "timeout"].includes(i.status))
    : batch.items;

  batch.status = "in_progress";
  batch.simulatorMeta = {
    progressPercent: 2,
    currentPhase: "creating",
    startedAt: new Date().toISOString(),
  };
  saveDeploymentBatch(batch);

  schedule(batchId, () => {
    const current = getDeploymentBatch(batchId);
    if (!current) return;
    current.simulatorMeta = { ...current.simulatorMeta!, currentPhase: "pushing", progressPercent: 8 };
    saveDeploymentBatch(current);

    let delay = 400;
    for (const item of items) {
      for (const target of item.targets) {
        if (!options?.onlyFailed && target.status !== "pending") continue;
        if (options?.onlyFailed && !["pending", "failed", "offline"].includes(target.status)) continue;

        const capturedItemId = item.id;
        const capturedTargetId = target.id;
        schedule(batchId, () => {
          const b = getDeploymentBatch(batchId);
          if (!b) return;
          const it = b.items.find((i) => i.id === capturedItemId);
          if (!it) return;
          const tg = it.targets.find((t) => t.id === capturedTargetId);
          if (!tg) return;
          if (it.status === "pending") {
            it.status = "pushing";
            it.pushedAt = new Date().toISOString();
          }
          tg.status = "syncing";
          saveDeploymentBatch(b);

          schedule(batchId, () => {
            const b2 = getDeploymentBatch(batchId);
            if (!b2) return;
            const it2 = b2.items.find((i) => i.id === capturedItemId);
            if (!it2) return;
            const tg2 = it2.targets.find((t) => t.id === capturedTargetId);
            if (!tg2) return;
            advanceTarget(tg2, it2, reduced);
            rollupItem(it2);
            updateProgress(b2);
            b2.simulatorMeta = { ...b2.simulatorMeta!, currentPhase: "acking" };
            rollupBatchCounts(b2);
            saveDeploymentBatch(b2);
          }, 300 + Math.random() * 500);
        }, delay);
        delay += 350 + Math.random() * 400;
      }
      if (item.targets.length === 0) {
        schedule(batchId, () => {
          const b = getDeploymentBatch(batchId);
          if (!b) return;
          const it = b.items.find((i) => i.id === item.id);
          if (!it) return;
          it.status = "success";
          it.completedAt = new Date().toISOString();
          updateProgress(b);
          rollupBatchCounts(b);
          saveDeploymentBatch(b);
        }, delay);
        delay += 400;
      }
    }

    schedule(batchId, () => completeBatch(batchId), delay + 500);
  }, 500);
}

export function isDeploymentSimulationActive(batchId: string): boolean {
  return activeSimulations.has(batchId);
}
