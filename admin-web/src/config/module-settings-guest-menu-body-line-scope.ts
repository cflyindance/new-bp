export const GUEST_MENU_BODY_PRODUCT_LINE_IDS_BY_SEQ = {
  516: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  518: ["emenu", "sdi", "kiosk", "online-order"],
  606: ["emenu", "sdi", "kiosk", "online-order"],
  517: ["emenu", "sdi", "kiosk", "online-order"],
  520: ["kiosk"],
  608: ["emenu", "sdi", "kiosk", "online-order"],
  515: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  528: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  618: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  616: ["emenu", "sdi"],
  524: ["emenu", "sdi", "kiosk", "online-order"],
  607: ["emenu", "sdi", "kiosk", "online-order"],
  519: ["pos", "pos-go", "paypad", "emenu", "sdi", "kiosk", "online-order"],
  645: ["emenu", "sdi", "kiosk", "online-order"],
  509: ["emenu", "sdi", "kiosk", "online-order", "cds"],
  525: ["emenu", "sdi", "kiosk", "online-order"],
  526: ["emenu", "sdi", "kiosk", "online-order"],
  617: ["emenu", "sdi", "kiosk", "online-order"],
} as const;

export type GuestMenuBodySeq = keyof typeof GUEST_MENU_BODY_PRODUCT_LINE_IDS_BY_SEQ;
export type GuestMenuBodyProductLineId =
  (typeof GUEST_MENU_BODY_PRODUCT_LINE_IDS_BY_SEQ)[GuestMenuBodySeq][number];

export interface GuestMenuBodyProductLine {
  id: GuestMenuBodyProductLineId;
  label: string;
}

const PRODUCT_LINE_LABELS: Record<GuestMenuBodyProductLineId, string> = {
  pos: "POS",
  "pos-go": "POS GO",
  paypad: "PayPad",
  emenu: "eMenu",
  sdi: "SDI",
  kiosk: "Kiosk",
  "online-order": "Online Order",
  cds: "CDS",
};

export function getGuestMenuBodyProductLines(seq: number): readonly GuestMenuBodyProductLine[] {
  const ids = GUEST_MENU_BODY_PRODUCT_LINE_IDS_BY_SEQ[seq as GuestMenuBodySeq];
  if (!ids) return [];
  return ids.map((id) => ({ id, label: PRODUCT_LINE_LABELS[id] }));
}

export function getGuestMenuBodyProductLineIds(seq: number): GuestMenuBodyProductLineId[] {
  return getGuestMenuBodyProductLines(seq).map((line) => line.id);
}

export function isFohLinesToggleMirrorExcludedSeq(seq: number): boolean {
  return seq === 607 || seq === 674;
}
