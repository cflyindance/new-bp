/** 解析 docs/配置归类-终版.md 表格（与 build-module-settings-catalog 共用） */

export function parseMarkdownTableRow(line) {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);

  const cells = [];
  let cur = "";
  let esc = false;
  for (const ch of s) {
    if (esc) {
      cur += ch;
      esc = false;
      continue;
    }
    if (ch === "\\") {
      esc = true;
      continue;
    }
    if (ch === "|") {
      cells.push(cur.trim());
      cur = "";
      continue;
    }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

export function parseConfigMd(text) {
  const lines = text.split(/\r?\n/).filter((l) => {
    const t = l.trim();
    return t.startsWith("|") && !t.includes("---");
  });
  if (lines.length < 2) return [];

  const header = parseMarkdownTableRow(lines[0]);
  const col = (name) => header.indexOf(name);

  const rows = [];
  let lastHub = "";
  let lastModule = "";
  let lastNav = "";

  for (let lineIdx = 1; lineIdx < lines.length; lineIdx++) {
    const cells = parseMarkdownTableRow(lines[lineIdx]);
    while (cells.length < header.length) cells.push("");

    const nav = (cells[col("导航")] ?? "").trim();
    const moduleName = (cells[col("功能模块")] ?? "").trim();
    const title = cells[col("功能设置")] ?? "";
    const feature = cells[col("功能")] ?? "";
    const scene = (cells[col("功能场景描述")] ?? "").trim();
    const settingGroup = (cells[col("设置中分类")] ?? "").trim();
    let rawHub = cells[col("B平台一级导航")] ?? "";

    if (nav) lastNav = nav;
    if (moduleName) lastModule = moduleName;

    if (rawHub && rawHub !== "（未填写）") {
      lastHub = rawHub;
    } else if (!rawHub || rawHub === "（未填写）") {
      rawHub = lastHub;
    }

    const hub = rawHub || "（未填写）";

    rows.push({
      seq: lineIdx,
      nav: lastNav,
      moduleName: lastModule,
      title,
      feature,
      sceneDesc: scene,
      settingGroup: settingGroup && settingGroup !== "（未填写）" ? settingGroup : "",
      hub,
    });
  }

  return rows;
}

export function slugify(s) {
  return (
    s
      .replace(/[^\w\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "item"
  );
}
