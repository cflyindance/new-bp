/** Menusifu 企业邮箱格式校验（避免 login ↔ staff-account-store 循环依赖） */

const MENUSIFU_EMAIL_RE = /^[^\s@]+@menusifu\.(cn|com)$/i;

export function isMenusifuEmail(email: string): boolean {
  return MENUSIFU_EMAIL_RE.test(email.trim());
}
