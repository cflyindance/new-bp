export type PayrollLocale = "zh" | "en";
export type PayrollMessages = Record<string, { zh: string; en: string }>;

export interface PayrollTranslator {
  locale(): PayrollLocale;
  text(key: string, variables?: Record<string, string | number>): string;
}

function interpolate(value: string, variables: Record<string, string | number>): string {
  return value.replace(/\{(\w+)\}/g, (_, key: string) => String(variables[key] ?? `{${key}}`));
}

export function createPayrollTranslator(getLocale: () => PayrollLocale, messages: PayrollMessages): PayrollTranslator {
  return {
    locale: getLocale,
    text(key, variables = {}) {
      const message = messages[key];
      const value = message ? message[getLocale()] : key;
      return interpolate(value, variables);
    },
  };
}
