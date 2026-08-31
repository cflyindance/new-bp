export type PitFormErrors = Record<string, string>;

export function validatePitLoginInput(input: { username: string; password: string }): PitFormErrors {
  const errors: PitFormErrors = {};
  if (!input.username.trim()) errors.username = "请输入用户名。";
  if (!input.password) errors.password = "请输入密码。";
  return errors;
}

export function validatePitSetupInput(input: {
  token: string;
  username: string;
  displayName: string;
  password: string;
}): PitFormErrors {
  const errors: PitFormErrors = {};
  if (!input.token.trim()) errors.token = "请输入一次性初始化令牌。";
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(input.username.trim().toLowerCase())) {
    errors.username = "用户名须为 3-64 位字母、数字或 ._-。";
  }
  const displayName = input.displayName.trim();
  if (!displayName || displayName.length > 100) errors.displayName = "显示名称须为 1-100 个字符。";
  if (input.password.length < 12) errors.password = "密码至少需要 12 个字符。";
  else if (input.password.length > 256) errors.password = "密码不能超过 256 个字符。";
  return errors;
}

export function pickPitFieldErrors(fields: Record<string, unknown> | undefined, allowedFields: readonly string[]): PitFormErrors {
  if (!fields) return {};
  const allowed = new Set(allowedFields);
  const errors: PitFormErrors = {};
  for (const [field, message] of Object.entries(fields)) {
    if (!allowed.has(field) || typeof message !== "string" || !message.trim()) continue;
    errors[field] = message.trim().slice(0, 300);
  }
  return errors;
}

export function hasPitFormErrors(errors: PitFormErrors): boolean {
  return Object.keys(errors).length > 0;
}
