/** Shared creation controls. No credentials or permissions are persisted here. */
export function accountOpeningFields(): string {
  return `<fieldset data-account-method><legend>开通方式</legend><label><input type="radio" name="openingMethod" value="invite" checked>邮箱邀请</label><label><input type="radio" name="openingMethod" value="password">设置密码</label></fieldset>`;
}
export function accountPasswordFields(): string {
  return `<fieldset data-account-passwords hidden disabled><label>登录密码<input name="password" type="password" minlength="6" required autocomplete="new-password"></label><label>确认密码<input name="confirmPassword" type="password" minlength="6" required autocomplete="new-password"></label></fieldset>`;
}
export function bindAccountOpening(dialog: HTMLDialogElement): void {
  dialog.classList.add('pc-account-opening');
  const form=dialog.querySelector('form')!;
  let header=form.querySelector<HTMLElement>(':scope > header');
  if(!header){header=document.createElement('header');header.className='pc-heading';form.prepend(header);header.append(form.querySelector('h2')!);}
  const close=dialog.querySelector<HTMLButtonElement>('[data-close],[data-cancel]')!;
  close.textContent='×';close.setAttribute('aria-label','关闭');header.prepend(close);
  header.append(dialog.querySelector('[type=submit]')!);
  dialog.querySelector('footer')?.remove();
  const sync = () => {
    const invite = dialog.querySelector<HTMLInputElement>('[name=openingMethod]:checked')?.value === 'invite';
    const panel = dialog.querySelector<HTMLFieldSetElement>('[data-account-passwords]')!;
    panel.disabled = invite; panel.hidden = invite;
    dialog.querySelector<HTMLButtonElement>('[type=submit]')!.textContent = invite ? '创建邀请' : '开通账号';
  };
  dialog.querySelector('[data-account-method]')!.addEventListener('change', sync); sync();
}
export function invitationStatus(account: { enabled: boolean; invitation?: { revoked?: boolean; expiresAt: string } }): string {
  return account.invitation ? account.invitation.revoked ? '邀请已撤销' : Date.parse(account.invitation.expiresAt) <= Date.now() ? '邀请已过期' : '待接受邀请' : account.enabled ? '已启用' : '已停用';
}
