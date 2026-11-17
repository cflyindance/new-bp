/** Shared terminology; each setting retains its own authorization boundary. */
export type AuthorizationValidity = "operation" | "order";
export const AUTHORIZATION_VALIDITY_OPTIONS = [["operation", "仅本次操作"], ["order", "本单内有效"]] as const;
export function renderAuthorizationValidityLabel(id: string, description: string): string {
  return `<span class="order-authorization-label">授权有效范围<span class="order-authorization-help"><button type="button" class="order-rule-help" aria-label="授权有效范围说明" aria-describedby="${id}" data-authorization-help aria-expanded="false">?</button><span id="${id}" role="tooltip" class="order-authorization-tooltip">${description}</span></span></span>`;
}
export const POINTS_AUTHORIZATION_VALIDITY_HELP = "仅本次操作：仅放行当前积分商品兑换操作，再次兑换需重新授权。本单内有效：授权后，当前订单、当前产线后续兑换积分商品无需重复授权；新订单需重新授权。该授权不放行其他限制。";
export const VIEWONLY_AUTHORIZATION_VALIDITY_HELP = "仅本次操作：仅放行当前可看不可点商品加购操作，再次加购需重新授权。本单内有效：授权后，当前订单、当前产线后续加购可看不可点商品无需重复授权；新订单或规则配置变化后需重新授权。该授权不放行其他限制。";
export const RULE_AUTHORIZATION_VALIDITY_HELP = "仅本次操作：授权仅放行当前操作，再次命中时需重新授权。本单内有效：仅已授权的具体规则在当前订单、当前产线内免重复授权；新命中或配置变化的规则仍需授权，新订单需重新授权。该授权不放行积分商品兑换或可看不可点商品加购限制。";
