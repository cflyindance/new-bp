export const PAYROLL_RULE_DATA = {
  overtimeMultiplier: 1.5,
  overtime2Multiplier: 2,
  supportedHourTypes: ["regular", "paidBreak", "ot", "ot2"] as const,
};

export const LEGACY_PAYROLL_DECLARATION_BODY_EN = "I hereby certify that the above time and gratuity {{gratuity_amount}} and tips {{tips_amount}} are correct. I further certify, under penalty of perjury, that I have been provided rest breaks as required by California law and that any meal period or rest break missed was purely voluntary.";
