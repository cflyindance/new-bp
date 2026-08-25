import {
  callKposSoap,
  kposSoapTag as tag,
  loadKposFloorPlan,
  loadKposKtvSaleItems,
} from "./kpos-floor-plan-client";
import type {
  DurationBillingRate,
  DurationBillingPricingMode,
  DurationBillingRule,
} from "./duration-billing-rules-store";

export type KposHourlyRate = {
  id: string;
  from: number;
  to: number | null;
  step: number | null;
  price: number | null;
  fixPrice: number | null;
  saleItemId: string;
};

export type KposHourlyRateRule = DurationBillingRule & {
  hourlyRateIds: string[];
  parseError?: string;
};

function nodes(root: ParentNode, name: string): Element[] {
  return Array.from(root.querySelectorAll("*")).filter(
    (node) => node.localName.toLowerCase() === name.toLowerCase(),
  );
}

function text(root: Element, name: string): string {
  return Array.from(root.children).find(
    (node) => node.localName.toLowerCase() === name.toLowerCase(),
  )?.textContent?.trim() ?? "";
}

function optionalPositive(raw: string): number | null {
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseRate(node: Element, fallbackSaleItemId = ""): KposHourlyRate {
  const fromText = text(node, "from");
  const from = Number(fromText);
  if (!text(node, "id") || !Number.isInteger(from) || from < 0) {
    throw new Error("KPOS HourlyRate 包含无效 ID 或起始分钟");
  }
  const toText = text(node, "to");
  const to = toText ? Number(toText) : null;
  if (to !== null && (!Number.isInteger(to) || to <= from)) {
    throw new Error("KPOS HourlyRate 包含无效结束分钟");
  }
  return {
    id: text(node, "id"),
    from,
    to,
    step: optionalPositive(text(node, "step")),
    price: optionalPositive(text(node, "price")),
    fixPrice: optionalPositive(text(node, "fixPrice") || text(node, "fixprice")),
    saleItemId: text(node, "saleItemId") || fallbackSaleItemId,
  };
}

export async function listKposHourlyRates(): Promise<Map<string, KposHourlyRate[]>> {
  const doc = await callKposSoap("ListHourlyRatesBySaleItemType");
  const result = new Map<string, KposHourlyRate[]>();
  for (const saleItem of nodes(doc, "saleItems")) {
    const saleItemId = text(saleItem, "id");
    if (!saleItemId) continue;
    const rates = Array.from(saleItem.children)
      .filter((node) => node.localName.toLowerCase() === "hourlyrates")
      .map((node) => parseRate(node, saleItemId));
    if (rates.length) result.set(saleItemId, rates.sort((a, b) => a.from - b.from));
  }
  return result;
}

function pricingFromRates(rates: KposHourlyRate[]): DurationBillingPricingMode {
  const sorted = [...rates].sort((a, b) => a.from - b.from);
  let previous = 0;
  const domainRates: DurationBillingRate[] = sorted.map((rate, index) => {
    if (rate.from !== previous) throw new Error("KPOS HourlyRate 区间不连续或重叠");
    const last = index === sorted.length - 1;
    if (!last && rate.to === null) throw new Error("KPOS HourlyRate 仅最后一区间可无上限");
    const fixed = rate.fixPrice !== null && rate.price === null && rate.step === null;
    const unit = rate.fixPrice === null && rate.price !== null && rate.step !== null;
    if (!fixed && !unit) throw new Error("KPOS HourlyRate 同一区间必须且只能选择一种收费方式");
    previous = rate.to ?? previous;
    return {
      id: rate.id,
      fromMinutes: rate.from,
      toMinutes: rate.to,
      charge: fixed
        ? { type: "fixed", amount: rate.fixPrice! }
        : { type: "unit", amount: rate.price!, unitMinutes: rate.step!, roundUp: true },
    };
  });
  return { type: "rates", rates: domainRates };
}

export async function listKposHourlyRateRules(): Promise<KposHourlyRateRule[]> {
  const [groups, products] = await Promise.all([listKposHourlyRates(), loadKposKtvSaleItems()]);
  const names = new Map(products.map((item) => [String(item.id), item.name]));
  return mapKposHourlyRateGroups(groups, names);
}

export function mapKposHourlyRateGroups(
  groups: Map<string, KposHourlyRate[]>,
  names: Map<string, string>,
): KposHourlyRateRule[] {
  return Array.from(groups.entries()).map(([saleItemId, rates]) => {
    const name = names.get(String(saleItemId)) || `商品 ${saleItemId}`;
    let pricing: DurationBillingPricingMode;
    let parseError: string | undefined;
    try {
      pricing = pricingFromRates(rates);
    } catch (error) {
      pricing = { type: "unit", amount: 0, unitMinutes: 1, roundUp: true };
      parseError = error instanceof Error ? error.message : "KPOS HourlyRate 数据无效";
    }
    return {
      id: saleItemId,
      name,
      scenes: [],
      enabled: parseError === undefined,
      pricing,
      productBinding: {
        productId: saleItemId,
        productNameSnapshot: name,
        requiredTag: "KTV",
        snapshotUpdatedAt: new Date().toISOString(),
      },
      storeIds: [],
      lines: ["emenu"],
      createdAt: "",
      updatedAt: "",
      hourlyRateIds: rates.map((rate) => rate.id),
      ...(parseError ? { parseError } : {}),
    };
  });
}

function targetRates(saleItemId: string, pricing: DurationBillingPricingMode): Omit<KposHourlyRate, "id">[] {
  if (pricing.type === "rates") {
    return pricing.rates.map((rate) => ({
      from: rate.fromMinutes,
      to: rate.toMinutes,
      step: rate.charge.type === "unit" ? rate.charge.unitMinutes : null,
      price: rate.charge.type === "unit" ? rate.charge.amount : null,
      fixPrice: rate.charge.type === "fixed" ? rate.charge.amount : null,
      saleItemId,
    }));
  }
  if (pricing.type === "unit") {
    return [{ from: 0, to: null, step: pricing.unitMinutes, price: pricing.amount, fixPrice: null, saleItemId }];
  }
  if (pricing.type !== "interval") throw new Error("旧版时段计价规则不能写入 KPOS");
  let from = 0;
  return pricing.intervals.map((interval) => {
    const rate = { from, to: interval.endMinutes, step: null, price: null, fixPrice: interval.amount, saleItemId };
    if (interval.endMinutes !== null) from = interval.endMinutes;
    return rate;
  });
}

async function saveRate(rate: Omit<KposHourlyRate, "id"> & { id?: string }): Promise<void> {
  const fields = `${tag("id", rate.id || undefined)}${tag("from", rate.from)}${tag("to", rate.to ?? undefined)}${tag("step", rate.step ?? undefined)}${tag("price", rate.price ?? undefined)}${tag("fixPrice", rate.fixPrice ?? undefined)}${tag("saleItemId", rate.saleItemId)}`;
  await callKposSoap("SaveHourlyRateType", `<app:hourlyRate>${fields}</app:hourlyRate>`);
}

async function deleteRate(id: string): Promise<void> {
  await callKposSoap("DeleteHourlyRateType", tag("id", id));
}

export async function saveKposHourlyRateRule(
  saleItemId: string,
  pricing: DurationBillingPricingMode,
): Promise<void> {
  const before = (await listKposHourlyRates()).get(String(saleItemId)) ?? [];
  const target = targetRates(String(saleItemId), pricing);
  const sortedBefore = [...before].sort((a, b) => a.from - b.from);
  const sameTopology = sortedBefore.length === target.length && sortedBefore.every((rate, index) =>
    rate.from === target[index].from && rate.to === target[index].to &&
    ((rate.price !== null) === (target[index].price !== null)) &&
    ((rate.fixPrice !== null) === (target[index].fixPrice !== null)),
  );
  if (sameTopology) {
    for (let index = 0; index < target.length; index += 1) {
      await saveRate({ ...target[index], id: sortedBefore[index].id });
    }
  } else {
    for (const rate of [...before].sort((a, b) => b.from - a.from)) await deleteRate(rate.id);
    for (const rate of target) await saveRate(rate);
  }
  const after = (await listKposHourlyRates()).get(String(saleItemId)) ?? [];
  if (JSON.stringify(after.map(({ id: _id, ...rate }) => rate)) !== JSON.stringify(target)) {
    throw new Error("KPOS 保存后回读与目标规则不一致，请刷新后重试");
  }
}

export async function deleteKposHourlyRateRule(saleItemId: string): Promise<void> {
  const bound = (await loadKposFloorPlan()).flatMap((area) => area.tables)
    .filter((table) => String(table.defaultSaleItemId || "") === String(saleItemId));
  if (bound.length) throw new Error(`仍有桌台绑定该商品：${bound.map((table) => table.name).join("、")}`);
  const rates = (await listKposHourlyRates()).get(String(saleItemId)) ?? [];
  for (const rate of [...rates].sort((a, b) => b.from - a.from)) await deleteRate(rate.id);
  const [after, floorPlan] = await Promise.all([listKposHourlyRates(), loadKposFloorPlan()]);
  const rebound = floorPlan.flatMap((area) => area.tables)
    .filter((table) => String(table.defaultSaleItemId || "") === String(saleItemId));
  if (rebound.length) throw new Error("删除期间桌台绑定发生变化，请重新配置相关桌台");
  if ((after.get(String(saleItemId)) ?? []).length) throw new Error("KPOS 仍有未删除区间，请刷新后重试");
}
