import {readProviderState} from '../permissions/provider-access-store';
import {canProviderEnter} from '../permissions/provider-access-store';
import {M_PAGES,mPageKey} from '../permissions/m-platform-catalog';
import {currentMAccount,currentMAccess} from '../permissions/m-platform-store';
import { withImpersonationContextChange } from "./impersonation-transition";
/**
 * M 平台 · 代登录商家后台（演示）
 */
import { getAuthenticatedEmail } from "../auth/login";
import { providerHasAnyMenu } from '../auth/brand-access-runtime';
import { ONBOARDING_PATH } from "./platform-preset-onboarding";
import {
  appendImpersonationLogEnd,
  appendImpersonationLogStart,
  getMerchantById,
  getStoreById,
} from "./enterprise-merchant-store";
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
  operatorEmployeeId?:string;
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
  return merchant.status === "active"&&canProviderEnter(merchant.merchantId);
}

export function canImpersonateStore(storeId:string):boolean{
 const store=getStoreById(storeId),merchant=store&&getMerchantById(store.merchantId);
 return !!(merchant&&merchant.status==='active'&&canProviderEnter(merchant.merchantId,storeId));
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

function prepareMerchantImpersonation(
  merchantId: string,
  operatorEmail: string | null = getAuthenticatedEmail(),
  returnPath?: string,
  storeId?:string,
): MerchantImpersonationSession | null {
  if(!getAuthenticatedEmail()||!location.hash.startsWith('#/m-platform/')||readActiveImpersonation())return null;
  const merchant = getMerchantById(merchantId);
  if (!merchant) return null;
  const store=storeId?getStoreById(storeId):undefined;
  if(storeId&&(!store||store.merchantId!==merchantId||!canImpersonateStore(storeId)))return null;
  if(storeId?!canImpersonateStore(storeId):!canImpersonateMerchant(merchant))return null;

  const account=currentMAccount();if(!account?.enabled||!providerHasAnyMenu(merchantId,storeId))return null;
  const operator=account.loginEmail;
  const impersonatedAsEmail=operator;
  const session: MerchantImpersonationSession = {
    sessionId: genSessionId(),
    ...(store?{storeId:store.storeId,storeName:store.name}:{}),
    merchantId: merchant.merchantId,
    merchantName: merchant.name,
    operatorEmail: operator,
    operatorEmployeeId:account.employeeId,
    impersonatedAsEmail,
    startedAt: new Date().toISOString(),
    returnPath: returnPath ?? merchantDetailHref(merchantId),
  };

  appendImpersonationLogStart(session);
  applyImpersonationScopeLock(merchant);
  // Delegated access does not provision or impersonate a brand administrator.
  writeImpersonationSession(session);
  if(store){
    writeSidebarNavLayoutPreset('store');
    writeChainDataPerspective('store',{brandId:merchantId,storeId:store.storeId});
    writeScopeFilters({brand:merchantId,region:store.regionId,store:store.storeId});
  }
  return session;
}

export function startMerchantImpersonation(
  merchantId: string,
  operatorEmail: string | null = getAuthenticatedEmail(),
  returnPath?: string,
  storeId?: string,
): MerchantImpersonationSession | null {
  return withImpersonationContextChange(() => prepareMerchantImpersonation(merchantId, operatorEmail, returnPath, storeId));
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
  writeImpersonationSession(null);
  appendImpersonationLogEnd(session.sessionId, reason);
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
        按员工授权访问
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

let providerRevalidationBound=false;
export function bindProviderSessionRevalidation(onMount:()=>void):void {
 if(providerRevalidationBound)return;providerRevalidationBound=true;
 let signature='',checking=false;
 const check=(refresh=false,force=false)=>{
  if(checking)return;checking=true;
  try{
  const session=readActiveImpersonation();if(!session){signature='';return;}
  const account=currentMAccount();
  if(!session.operatorEmployeeId||account?.employeeId!==session.operatorEmployeeId||!canProviderEnter(session.merchantId,session.storeId)||getMerchantById(session.merchantId)?.status!=='active'){
   endMerchantImpersonation();const fallback=M_PAGES.find(p=>currentMAccess(mPageKey(p.id))!=='hidden')?.path??'/m-platform/permissions/overview';location.hash='#'+fallback;sessionStorage.setItem('menusifu:provider-access-notice','商户访问授权已失效，请联系管理员。');onMount();return;
  }
  let next='';try{const state=readProviderState(),employee=state.employees.find(e=>e.employeeId===account.employeeId);next=JSON.stringify([account.enabled,employee,state.systemEmployeeIds.includes(account.employeeId),state.roles.filter(r=>employee?.bindings.some(b=>b.roleId===r.id))]);}catch{next='invalid';}
  const changed=signature&&signature!==next;signature=next;
  if(refresh&&(changed||force))onMount();
  }finally{checking=false;}
 };
 for(const type of ['click','submit','beforeinput','change'])document.addEventListener(type,event=>{if(!readActiveImpersonation())return;const session=readActiveImpersonation();check();if(session&&!readActiveImpersonation()){event.preventDefault();event.stopImmediatePropagation();}},true);
 for(const type of ['menusifu:provider-access-changed','m-platform-permissions-changed','menusifu:enterprise-merchant-snapshot-changed'])window.addEventListener(type,()=>check(true,type==='menusifu:enterprise-merchant-snapshot-changed'));
 window.addEventListener('storage',e=>{if(e.key===null||['menusifu:provider-merchant-access:v1','menusifu:m-platform-permissions:v1','menusifu:enterprise-staff-login-accounts:v1'].includes(e.key))check(true);});
 window.addEventListener('hashchange',()=>check());check();
}
