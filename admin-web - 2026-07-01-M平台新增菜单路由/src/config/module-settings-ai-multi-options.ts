/**
 * AI 助手 ·「一项多功能」子选项注册表（多选 / 勾选类，非简单主开关）
 */

import {
  AVIATO_SERVICE_SCOPE_OPTIONS,
  AVIATO_SERVICE_SEQ,
} from "./module-settings-advanced-service-switches-ui";
import {
  DURATION_BILLING_SCENE_OPTIONS,
  DURATION_BILLING_SEQ,
  durationBillingSceneCheckboxFieldId,
} from "./module-settings-duration-billing-scenes-ui";
import {
  kitchenOrderTypeCheckboxFieldId,
  KITCHEN_STANDARD_ORDER_TYPES,
} from "./module-settings-kitchen-order-type-ui";
import { listModuleSettingFormFieldDescriptors } from "./module-settings-form-ui";
import {
  NOTIFICATION_CENTER_TOPICS_SEQ,
  NOTIFICATION_CENTER_TOPIC_OPTIONS,
  notificationCenterTopicCheckboxFieldId,
} from "./module-settings-notification-topics-ui";
import {
  ORDER_VOID_INVALIDATION_REASON_SEQ,
  ORDER_VOID_INVALIDATION_REASONS,
  orderVoidInvalidationReasonFieldId,
} from "./module-settings-order-void-ui";
import {
  ORDER_PICKUP_SMS_CHANNEL_PRODUCT_LINES,
  orderPickupSmsChannelCheckboxFieldId,
} from "./module-settings-order-pickup-messages-ui";
import {
  PACKING_SLIP_ORDER_TYPE_OPTIONS,
  PACKING_SLIP_ORDER_TYPE_SEQ,
  packingSlipOrderTypeCheckboxFieldId,
} from "./module-settings-packing-slip-order-type-ui";
import {
  PRINT_LOGO_BY_TICKET_SEQ,
  PRINT_LOGO_TICKET_OPTIONS,
  printLogoTicketCheckboxFieldId,
} from "./module-settings-print-foundation-ui";
import {
  TICKET_NUMBER_SLIP_TRIGGER_OPTIONS,
  TICKET_NUMBER_SLIP_TRIGGER_SEQ,
  ticketNumberSlipTriggerCheckboxFieldId,
} from "./module-settings-ticket-number-slip-ui";
// TRIGGER_SEQ = 291（触发场景多选）；292 为份数输入，非子选项

export type SubOptionStorageKind = "checkbox" | "aviato-scope";

export type SubOptionDef = {
  fieldId: string;
  label: string;
  aliases: string[];
  storage: SubOptionStorageKind;
  /** aviato-scope 时用于 JSON 存储 */
  scopeId?: string;
};

const KITCHEN_ORDER_TYPE_SEQ = 36;

const ORDER_TYPE_ALIASES: Readonly<Record<string, string[]>> = {
  "dine-in": ["堂食", "堂吃", "dine in", "dinein"],
  "to-go": ["外带", "to go", "togo"],
  "pick-up": ["自取", "来取", "pick up", "pickup"],
  delivery: ["外送", "外卖", "delivery"],
  "to-go-pack": ["外带", "to go"],
};

function optionEntry(
  seq: number,
  code: string,
  label: string,
  fieldId: string,
  extraAliases: string[] = [],
): SubOptionDef {
  return {
    fieldId,
    label,
    aliases: [code, label, ...extraAliases, ...(ORDER_TYPE_ALIASES[code] ?? [])],
    storage: "checkbox",
  };
}

function buildRegistry(): Map<number, SubOptionDef[]> {
  const map = new Map<number, SubOptionDef[]>();

  const add = (seq: number, options: SubOptionDef[]) => {
    const prev = map.get(seq) ?? [];
    map.set(seq, [...prev, ...options]);
  };

  for (const f of listModuleSettingFormFieldDescriptors()) {
    if (f.kind !== "checkbox") continue;
    add(f.seq, [
      {
        fieldId: f.fieldId,
        label: f.label,
        aliases: [f.label, f.fieldId],
        storage: "checkbox",
      },
    ]);
  }

  add(
    KITCHEN_ORDER_TYPE_SEQ,
    KITCHEN_STANDARD_ORDER_TYPES.map((o) =>
      optionEntry(KITCHEN_ORDER_TYPE_SEQ, o.code, o.label, kitchenOrderTypeCheckboxFieldId(KITCHEN_ORDER_TYPE_SEQ, o.code)),
    ),
  );

  add(
    PACKING_SLIP_ORDER_TYPE_SEQ,
    PACKING_SLIP_ORDER_TYPE_OPTIONS.map((o) =>
      optionEntry(
        PACKING_SLIP_ORDER_TYPE_SEQ,
        o.code,
        o.label,
        packingSlipOrderTypeCheckboxFieldId(PACKING_SLIP_ORDER_TYPE_SEQ, o.code),
      ),
    ),
  );

  add(
    ORDER_VOID_INVALIDATION_REASON_SEQ,
    ORDER_VOID_INVALIDATION_REASONS.map((o) =>
      optionEntry(
        ORDER_VOID_INVALIDATION_REASON_SEQ,
        o.code,
        o.label,
        orderVoidInvalidationReasonFieldId(ORDER_VOID_INVALIDATION_REASON_SEQ, o.code),
        [o.code.replace(/-/g, " ")],
      ),
    ),
  );

  add(
    DURATION_BILLING_SEQ,
    DURATION_BILLING_SCENE_OPTIONS.map((o) =>
      optionEntry(
        DURATION_BILLING_SEQ,
        o.code,
        o.label,
        durationBillingSceneCheckboxFieldId(DURATION_BILLING_SEQ, o.code),
      ),
    ),
  );

  add(
    NOTIFICATION_CENTER_TOPICS_SEQ,
    NOTIFICATION_CENTER_TOPIC_OPTIONS.map((o) =>
      optionEntry(
        NOTIFICATION_CENTER_TOPICS_SEQ,
        o.code,
        o.label,
        notificationCenterTopicCheckboxFieldId(NOTIFICATION_CENTER_TOPICS_SEQ, o.code),
      ),
    ),
  );

  for (const seq of [334, 335]) {
    add(
      seq,
      ORDER_PICKUP_SMS_CHANNEL_PRODUCT_LINES.map((o) =>
        optionEntry(
          seq,
          o.code,
          o.label,
          orderPickupSmsChannelCheckboxFieldId(seq, o.code),
          [o.code.replace(/-/g, " "), o.code.replace(/_/g, " ")],
        ),
      ),
    );
  }

  add(
    TICKET_NUMBER_SLIP_TRIGGER_SEQ,
    TICKET_NUMBER_SLIP_TRIGGER_OPTIONS.map((o) =>
      optionEntry(
        TICKET_NUMBER_SLIP_TRIGGER_SEQ,
        o.code,
        o.label,
        ticketNumberSlipTriggerCheckboxFieldId(TICKET_NUMBER_SLIP_TRIGGER_SEQ, o.code),
      ),
    ),
  );

  add(
    PRINT_LOGO_BY_TICKET_SEQ,
    PRINT_LOGO_TICKET_OPTIONS.map((o) =>
      optionEntry(
        PRINT_LOGO_BY_TICKET_SEQ,
        o.code,
        o.label,
        printLogoTicketCheckboxFieldId(o.code),
        [o.label.replace(/收据/g, "小票")],
      ),
    ),
  );

  add(
    AVIATO_SERVICE_SEQ,
    AVIATO_SERVICE_SCOPE_OPTIONS.map((o) => ({
      fieldId: `190-aviato-scope-${o.id}`,
      label: o.label,
      aliases: [o.id, o.label],
      storage: "aviato-scope" as const,
      scopeId: o.id,
    })),
  );

  return map;
}

const SUB_OPTIONS_BY_SEQ = buildRegistry();

export function hasSubOptionsForSeq(seq: number): boolean {
  return (SUB_OPTIONS_BY_SEQ.get(seq)?.length ?? 0) > 0;
}

export function getSubOptionsForSeq(seq: number): readonly SubOptionDef[] {
  return SUB_OPTIONS_BY_SEQ.get(seq) ?? [];
}

function normalizeMatchText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").trim();
}

/** 从短语中匹配子选项（标签 / 别名 / 部分包含） */
export function matchSubOption(seq: number, phrase: string): SubOptionDef | undefined {
  const options = getSubOptionsForSeq(seq);
  if (options.length === 0) return undefined;
  const p = normalizeMatchText(phrase);
  if (!p) return undefined;

  let best: { opt: SubOptionDef; score: number } | undefined;
  for (const opt of options) {
    for (const alias of opt.aliases) {
      const a = normalizeMatchText(alias);
      if (!a) continue;
      let score = 0;
      if (p === a) score = 100;
      else if (p.includes(a) || a.includes(p)) score = 70;
      else if (a.length >= 2 && p.split(/\s+/).some((w) => w === a || a.includes(w))) score = 50;
      if (score > 0 && (!best || score > best.score)) best = { opt, score };
    }
  }
  return best?.opt;
}

/** 从「父项 + 子项」合并短语中剥离父标题，得到子项提示 */
export function extractSubOptionPhrase(combined: string, parentTitle: string): string {
  let rest = combined;
  const title = parentTitle.trim();
  if (title && rest.includes(title)) {
    rest = rest.replace(title, " ");
  }
  return rest
    .replace(/^(的|里|中|下|内|选项|设置|配置|功能|项)+/u, "")
    .replace(/(的|里|中|下|内|选项|设置|配置|功能|项)+$/u, "")
    .replace(/\s+/g, " ")
    .trim();
}
