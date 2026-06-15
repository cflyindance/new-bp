/**
 * 导航模块检索（P2）— 与 AI 助手 / 全局搜索联动，仅索引可见模块
 */
import { getVisibleNavModules, isL2FeatureVisible } from "./feature-visibility";
import type { NavModule } from "./navigation";

export interface NavSearchEntry {
  moduleId: string;
  featureId?: string;
  title: string;
  titleEn?: string;
  path: string;
  searchable: string;
}

function buildNavSearchIndex(): NavSearchEntry[] {
  const rows: NavSearchEntry[] = [];
  for (const mod of getVisibleNavModules()) {
    rows.push({
      moduleId: mod.id,
      title: mod.title,
      titleEn: mod.titleEn,
      path: mod.defaultChildPath,
      searchable: `${mod.title} ${mod.titleEn ?? ""} ${mod.id}`.toLowerCase(),
    });
    for (const child of mod.children) {
      if (!isL2FeatureVisible(child.id)) continue;
      rows.push({
        moduleId: mod.id,
        featureId: child.id,
        title: child.title,
        titleEn: child.titleEn,
        path: child.path,
        searchable: `${mod.title} ${child.title} ${child.titleEn ?? ""} ${child.id}`.toLowerCase(),
      });
    }
  }
  return rows;
}

function scoreNavEntry(entry: NavSearchEntry, phrase: string): number {
  const q = phrase.toLowerCase().trim();
  if (!q) return 0;
  if (entry.searchable.includes(q)) return 80;
  if (entry.title.toLowerCase().includes(q)) return 60;
  let score = 0;
  for (const token of q.split(/\s+/).filter((t) => t.length >= 2)) {
    if (entry.searchable.includes(token)) score += 15;
  }
  return score;
}

export function searchVisibleNavEntries(phrase: string, limit = 5): NavSearchEntry[] {
  const index = buildNavSearchIndex();
  return index
    .map((row) => ({ row, score: scoreNavEntry(row, phrase) }))
    .filter((x) => x.score >= 15)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.row);
}

export function getVisibleModuleById(moduleId: string): NavModule | undefined {
  return getVisibleNavModules().find((m) => m.id === moduleId);
}
