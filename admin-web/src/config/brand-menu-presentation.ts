import type { MenuChoice } from './brand-access-store';

/** Presentation only: retain all underlying keys for grants, validation and persistence. */
export function compactBrandMenuRows(choices: MenuChoice[]): MenuChoice[] {
  const byKey = new Map(choices.map(choice => [choice.key, choice]));
  const redundant = new Set(choices.filter(choice => {
    if (choice.isPage || choice.level === 1) return false;
    let parent = choice.parent;
    const seen = new Set<string>();
    while (parent && !seen.has(parent)) {
      seen.add(parent);
      const ancestor = byKey.get(parent);
      if (!ancestor) break;
      if (ancestor.title === choice.title) return true;
      if (ancestor.isPage || ancestor.level === 1) break;
      parent = ancestor.parent;
    }
    return false;
  }).map(choice => choice.key));
  return choices.filter(choice => !redundant.has(choice.key)).map(choice => {
    let parent = choice.parent, level = choice.level;
    const seen = new Set<string>();
    while (parent && !seen.has(parent)) {
      seen.add(parent);
      if (redundant.has(parent)) level--;
      parent = byKey.get(parent)?.parent;
    }
    return { ...choice, level };
  });
}
