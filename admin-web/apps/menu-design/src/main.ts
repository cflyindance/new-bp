import './global-fab.css';
import './shell.css';
import {mountDemoSwitchFab} from '../../../src/shell/demo-switch-control';
import {bindViewSwitchControl} from '../../../src/shell/view-switch-control';
import {enterEmenuLocalShell,enterKioskLocalShell,enterPitShell} from '../../../src/shell/app-shell-mode';
import {EMENU_LOCAL_DEFAULT_PATH} from '../../../src/shell/emenu-local-routes';
import {KIOSK_LOCAL_DEFAULT_PATH} from '../../../src/shell/kiosk-local-routes';
import {PIT_DEFAULT_PATH} from '../../../src/pit/pit-routes';
import {isViewSwitchRestricted} from '../../../src/auth/session-scope';
import {APP_NAV_HOME_PATH} from '../../../src/config/app-routes';
import {LEGACY_B_DEFAULT_PATH} from '../../../src/shell/legacy-b-routes';
import {NAV_BLUEPRINT_ROUTE_PREFIX} from '../../../src/config/nav-blueprint-ui';
import {requestMenuSession} from '../../../src/auth/menu-session-bridge';
import {clearAuthenticated,setAuthenticated} from '../../../src/auth/login';

// Fixed same-site destination, never controlled by a returnUrl query parameter.
const host=new URL('../',location.href);
host.search='';host.hash='';
if(location.port==='5174')host.port='5173';
if(location.port==='4174')host.port='4173';
let leaving=false;
async function goHost(hash:string){
  if(leaving)return;
  leaving=true;
  // Only trust the original live tab, never an email or auth flag in the URL.
  if(host.origin===location.origin && new URL(location.href).searchParams.has('menuSession')){
    clearAuthenticated();
    const email=await requestMenuSession(location.href);
    if(email)setAuthenticated(email);
  }
  host.hash=hash;location.assign(host.href);
}
mountDemoSwitchFab({showVersionSwitch:false,onProductNavigate(product){
  if(product==='menu-design'){
    document.querySelector<HTMLButtonElement>('[data-demo-switch-toggle]')?.click();return;
  }
  if(product==='emenu-local'){enterEmenuLocalShell();goHost(EMENU_LOCAL_DEFAULT_PATH);}
  if(product==='kiosk-local'){enterKioskLocalShell();goHost(KIOSK_LOCAL_DEFAULT_PATH);}
  if(product==='pit'){enterPitShell();goHost(PIT_DEFAULT_PATH);}
}});
bindViewSwitchControl(()=>{});
// Shared view handlers apply the normal perspective policy first. Even a currently
// selected view must leave this independent app, rather than taking its no-op path.
document.querySelector('#demo-switch-fab-root')?.addEventListener('click',event=>{
  const button=(event.target as Element).closest<HTMLButtonElement>('[data-view-switch-option],[data-view-switch-chain-perspective]');
  if(!button||button.disabled||isViewSwitchRestricted())return;
  const view=button.dataset.viewSwitchOption;
  goHost(view==='m-platform'?NAV_BLUEPRINT_ROUTE_PREFIX:view==='legacy-b'?LEGACY_B_DEFAULT_PATH:APP_NAV_HOME_PATH);
});
// The editor is isolated from the shell stylesheet, while the real global FAB stays above it.
const frame=document.querySelector<HTMLIFrameElement>('#menu-workspace');
frame?.addEventListener('load',()=>{
  frame.contentDocument?.addEventListener('keydown',event=>{
    if(event.key==='Escape')document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}));
  });
});
