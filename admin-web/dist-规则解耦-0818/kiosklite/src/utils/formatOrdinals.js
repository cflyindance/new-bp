const formatOrdinals = (n) => {
  try {
    const pr = new Intl.PluralRules("en-US", { type: "ordinal" });

    const suffixes = new Map([
      ["one", "st"],
      ["two", "nd"],
      ["few", "rd"],
      ["other", "th"],
    ]);

    const rule = pr.select(n);
    const suffix = suffixes.get(rule);
    return `${n}${suffix}`;
  } catch (e) {
    return `${n}`
  }
};

export default formatOrdinals
