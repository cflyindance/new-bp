/**
 * M 平台 · 代登录商家后台（演示）
 */
import { getAuthenticatedEmail } from "../auth/login";
import { brandPrimaryAdminEmail } from '../auth/brand-access-runtime';
import { markPlatformPresetOnboardingComplete, ONBOARDING_PATH, resetPlatformPresetOnboarding } from "./platform-preset-onboarding";
import {
  appendImpersonationLogEnd,
  appendImpersonationLogStart,
  getMerchantById,
  getStoreById,
  syncMerchantCapabilityPresets,
} from "./enterprise-merchant-store";
import { syncChainBrandOrgForMerchant, bindChainBrandOrgSyncListener } from "./merchant-chain-brand-sync";
import type { EnterpriseMerchant } from "./enterprise-merchant-types";
import { exitMPlatformShell, enterMPlatformShell } from "../shell/app-shell-mode";
import { merchantDetailHref } from "./enterprise-merchant-scope";
import { writeChainDataPerspective } from "../auth/merchant-scope-context";
import {
  ensureScopeFiltersForLayoutPreset,
  resetScopeFiltersForPerspectiveChange,
  writeScopeFilters,
} from "../auth/session-scope";
import { writeSidebarNavLayoutPreset } from "./sidebar-nav-order";
import { clearActiveMerchantGroupOverride } from "./merchant-chain-brand-sync";

const IMPERSONATION_SESSION_KEY = "menusifu:merchant-impersonation-v1";
const APP_NAV_HOME_PATH = "/nav-home";

export interface MerchantImpersonationSession {
  sessionId: string;
  storeId?:string;
  storeName?:string;
  merchantId: string;
  merchantName: string;
  operatorEmail: string;
  impersonatedAsEmail: string;
  startedAt: string;
  returnPath: string;
}

function genSessionId(): string {
  return `imp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function readActiveImpersonation(): MerchantImpersonationSession | null {
  try {
    const raw = sessionStorage.getItem(IMPERSONATION_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MerchantImpersonationSession;
    if (!parsed?.merchantId || !parsed?.sessionId) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeImpersonationSession(session: MerchantImpersonationSession | null): void {
  try {
    if (!session) sessionStorage.removeItem(IMPERSONATION_SESSION_KEY);
    else sessionStorage.setItem(IMPERSONATION_SESSION_KEY, JSON.stringify(session));
  } catch {
    /* ignore */
  }
}

export function canImpersonateMerchant(merchant: EnterpriseMerchant): boolean {
  if(merchant.accountProvisioningRequired && !brandPrimaryAdminEmail(merchant.merchantId))return false;
  return merchant.status === "active";
}

export function canImpersonateStore(storeId:string):boolean{
 const store=getStoreById(storeId),merchant=store&&getMerchantById(store.merchantId);
 return !!(merchant&&canImpersonateMerchant(merchant)&&brandPrimaryAdminEmail(merchant.merchantId).trim());
}

function resolveEntryPath(merchant: EnterpriseMerchant): string {
  if (merchant.status === "onboarding") return ONBOARDING_PATH;
  return APP_NAV_HOME_PATH;
}

function applyImpersonationScopeLock(merchant: EnterpriseMerchant): void {
  clearActiveMerchantGroupOverride();
  writeSidebarNavLayoutPreset("chain");
  writeChainDataPerspective("brand", { brandId: merchant.merchantId });
  ensureScopeFiltersForLayoutPreset("chain");
  resetScopeFiltersForPerspectiveChange();
}

function prepareImpersonatedMerchantContext(merchant: EnterpriseMerchant): void {
  const email = brandPrimaryAdminEmail(merchant.merchantId).trim();
  if (!email) return;
  if (merchant.status === "onboarding") {
    resetPlatformPresetOnboarding(email);
    return;
  }
  markPlatformPresetOnboardingComplete(email);
  syncMerchantCapabilityPresets(merchant.merchantId, false);
  syncChainBrandOrgForMerchant(merchant.merchantId);
}

export function startMerchantImpersonation(
  merchantId: string,
  operatorEmail: string | null = getAuthenticatedEmail(),
  returnPath?: string,
  storeId?:string,
): MerchantImpersonationSession | null {
  if(storeId&&(!getAuthenticatedEmail()||!location.hash.startsWith('#/m-platform/')||readActiveImpersonation()))return null;
  const merchant = getMerchantById(merchantId);
  if (!merchant) return null;
  const store=storeId?getStoreById(storeId):undefined;
  if(storeId&&(!store||store.merchantId!==merchantId||!canImpersonateStore(storeId)))return null;
  if (!canImpersonateMerchant(merchant)) return null;

  const operator = operatorEmail?.trim() || "hq.admin@menusifu.cn";
  const impersonatedAsEmail = brandPrimaryAdminEmail(merchant.merchantId).trim() || operator;
  const session: MerchantImpersonationSession = {
    sessionId: genSessionId(),
    ...(store?{storeId:store.storeId,storeName:store.name}:{}),
    merchantId: merchant.merchantId,
    merchantName: merchant.name,
    operatorEmail: operator,
    impersonatedAsEmail,
    startedAt: new Date().toISOString(),
    returnPath: returnPath ?? merchantDetailHref(merchantId),
  };

  appendImpersonationLogStart(session);
  applyImpersonationScopeLock(merchant);
  prepareImpersonatedMerchantContext(merchant);
  writeImpersonationSession(session);
  if(store){
    writeSidebarNavLayoutPreset('store');
    writeChainDataPerspective('store',{brandId:merchantId,storeId:store.storeId});
    writeScopeFilters({brand:merchantId,region:store.regionId,store:store.storeId});
  }
  return session;
}

export function enterMerchantBackendAsImpersonator(merchantId: string, returnPath?: string): boolean {
  const session = startMerchantImpersonation(merchantId, getAuthenticatedEmail(), returnPath);
  if (!session) return false;
  const merchant = getMerchantById(merchantId);
  if (!merchant) return false;
  exitMPlatformShell();
  location.hash = `#${resolveEntryPath(merchant)}`;
  return true;
}

export function enterStoreBackendAsImpersonator(storeId:string,returnPath:string):boolean{
 if(!getAuthenticatedEmail()||!location.hash.startsWith('#/m-platform/')||readActiveImpersonation())return false;
 const store=getStoreById(storeId);if(!store||!canImpersonateStore(storeId))return false;
 const session=startMerchantImpersonation(store.merchantId,getAuthenticatedEmail(),returnPath,storeId);if(!session)return false;
 exitMPlatformShell();location.hash='#'+APP_NAV_HOME_PATH;return true;
}

export function endMerchantImpersonation(reason: "manual" = "manual"): void {
  const session = readActiveImpersonation();
  if (!session) return;
  appendImpersonationLogEnd(session.sessionId, reason);
  writeImpersonationSession(null);
  enterMPlatformShell();
  location.hash = session.returnPath.startsWith("#") ? session.returnPath : `#${session.returnPath}`;
}

export function renderImpersonationBanner(): string {
  const session = readActiveImpersonation();
  if (!session) return "";
  return `
    <div
      class="z-50 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm text-amber-950 dark:text-amber-100"
      data-merchant-impersonation-banner
      role="status"
    >
      <p class="min-w-0">
        <span class="font-medium">代管模式</span>
        <span class="mx-1.5 text-amber-800/70 dark:text-amber-200/70">·</span>
        ${session.storeId?'门店 '+escapeHtml(session.storeName??session.storeId)+' · '+escapeHtml(session.storeId)+' · ':''}品牌 <strong>${escapeHtml(session.merchantName)}</strong>
        <span class="mx-1.5 text-amber-800/70 dark:text-amber-200/70">·</span>
        操作人 ${escapeHtml(session.operatorEmail)}
        <span class="mx-1.5 text-amber-800/70 dark:text-amber-200/70">·</span>
        模拟 ${escapeHtml(session.impersonatedAsEmail)}
        <span class="mx-1.5 text-amber-800/70 dark:text-amber-200/70">·</span>
        <span class="text-xs">${session.storeId?'已锁定门店视角':'已锁定品牌视角'}</span>
      </p>
      <button
        type="button"
        data-merchant-impersonation-exit
        class="inline-flex h-8 shrink-0 items-center rounded-md border border-amber-600/40 bg-background/80 px-3 text-xs font-medium hover:bg-background"
      >退出代管</button>
    </div>`;
}

export function bindImpersonationBanner(onMount: () => void): void {
  document.querySelectorAll<HTMLButtonElement>("[data-merchant-personation-exit], [data-merchant-impersonation-exit]").forEach((btn) => {
    if (btn.dataset.bound === "1") return;
    btn.dataset.bound = "1";
    btn.addEventListener("click", () => {
      endMerchantImpersonation("manual");
      onMount();
    });
  });
}
