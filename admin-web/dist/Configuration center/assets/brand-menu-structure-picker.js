/**
 * 品牌菜单 · 产线 / 组 / 类 / 菜 四级选择器（Configuration center 独立脚本）
 */
(function (global) {
  "use strict";

  var LINE_OPTIONS = [
    { id: "kiosk", label: "Kiosk" },
    { id: "emenu", label: "eMenu" },
    { id: "sdi", label: "SDI" },
  ];
  var DEFAULT_LINE = "kiosk";

  var BASE_TREE = [
    {
      id: "g-hotpot",
      name: "火锅",
      categories: [
        {
          id: "c-hotpot-base",
          name: "锅底",
          dishes: [
            { id: "d-pot-single", name: "单锅" },
            { id: "d-pot-yinyang", name: "鸳鸯锅" },
          ],
        },
        {
          id: "c-hotpot-meat",
          name: "肉类",
          dishes: [
            { id: "d-beef-premium", name: "极品肥牛" },
            { id: "d-pork-belly", name: "五花肉" },
          ],
        },
      ],
    },
    {
      id: "g-chinese",
      name: "中餐",
      categories: [
        {
          id: "c-chinese-hot",
          name: "热菜",
          dishes: [
            { id: "d-kungpao", name: "宫保鸡丁" },
            { id: "d-mapo", name: "麻婆豆腐" },
          ],
        },
        {
          id: "c-chinese-cold",
          name: "冷菜",
          dishes: [{ id: "d-cucumber", name: "拍黄瓜" }],
        },
      ],
    },
    {
      id: "g-drink",
      name: "饮品",
      categories: [
        {
          id: "c-drink-hot",
          name: "热饮",
          dishes: [
            { id: "d-tea", name: "热茶" },
            { id: "d-coffee", name: "美式咖啡" },
          ],
        },
        {
          id: "c-drink-cold",
          name: "冷饮",
          dishes: [{ id: "d-cola", name: "可乐" }],
        },
      ],
    },
  ];

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function cloneTree(tree) {
    return tree.map(function (g) {
      return {
        id: g.id,
        name: g.name,
        categories: g.categories.map(function (c) {
          return {
            id: c.id,
            name: c.name,
            dishes: c.dishes.map(function (d) {
              return { id: d.id, name: d.name };
            }),
          };
        }),
      };
    });
  }

  function buildLineTree(groupIds, suffix) {
    var tree = cloneTree(BASE_TREE).filter(function (g) {
      return groupIds.indexOf(g.id) >= 0;
    });
    tree.forEach(function (g) {
      g.categories.forEach(function (c) {
        c.dishes.forEach(function (d) {
          d.name = d.name + suffix;
        });
      });
    });
    return tree;
  }

  var TREES_BY_LINE = {
    kiosk: buildLineTree(["g-hotpot", "g-drink"], "（Kiosk）"),
    emenu: buildLineTree(["g-chinese", "g-drink"], "（eMenu）"),
    sdi: buildLineTree(["g-chinese", "g-drink"], "（SDI）"),
  };

  function isLineId(v) {
    return LINE_OPTIONS.some(function (l) {
      return l.id === v;
    });
  }

  function gKey(gid) {
    return "g:" + gid;
  }
  function cKey(gid, cid) {
    return "c:" + gid + ":" + cid;
  }
  function dKey(gid, cid, did) {
    return "d:" + gid + ":" + cid + ":" + did;
  }

  function resolveTree(lineId) {
    return TREES_BY_LINE[lineId] || TREES_BY_LINE[DEFAULT_LINE];
  }

  function findGroup(gid, tree) {
    for (var i = 0; i < tree.length; i++) {
      if (tree[i].id === gid) return tree[i];
    }
    return null;
  }

  function findCategory(gid, cid, tree) {
    var g = findGroup(gid, tree);
    if (!g) return null;
    for (var i = 0; i < g.categories.length; i++) {
      if (g.categories[i].id === cid) return g.categories[i];
    }
    return null;
  }

  function descendantKeys(key, tree) {
    if (key.indexOf("g:") === 0) {
      var gid = key.slice(2);
      var g = findGroup(gid, tree);
      if (!g) return [];
      var out = [];
      g.categories.forEach(function (c) {
        out.push(cKey(gid, c.id));
        c.dishes.forEach(function (d) {
          out.push(dKey(gid, c.id, d.id));
        });
      });
      return out;
    }
    if (key.indexOf("c:") === 0) {
      var p = key.split(":");
      var g2 = p[1] || "";
      var c2 = p[2] || "";
      var cat = findCategory(g2, c2, tree);
      if (!cat) return [];
      return cat.dishes.map(function (d) {
        return dKey(g2, c2, d.id);
      });
    }
    return [];
  }

  function syncCat(sel, gid, cid, tree) {
    var cat = findCategory(gid, cid, tree);
    if (!cat) return;
    var dks = cat.dishes.map(function (d) {
      return dKey(gid, cid, d.id);
    });
    var n = dks.filter(function (k) {
      return sel[k];
    }).length;
    sel[cKey(gid, cid)] = n === dks.length && dks.length > 0;
  }

  function syncGroup(sel, gid, tree) {
    var g = findGroup(gid, tree);
    if (!g) return;
    var cks = g.categories.map(function (c) {
      return cKey(gid, c.id);
    });
    var n = cks.filter(function (k) {
      return sel[k];
    }).length;
    sel[gKey(gid)] = n === cks.length && cks.length > 0;
  }

  function keysToSelection(keys, tree) {
    var sel = {};
    keys.forEach(function (k) {
      sel[k] = true;
    });
    tree.forEach(function (g) {
      g.categories.forEach(function (c) {
        syncCat(sel, g.id, c.id, tree);
      });
      syncGroup(sel, g.id, tree);
    });
    return sel;
  }

  function selectionToKeys(sel) {
    return Object.keys(sel).filter(function (k) {
      return sel[k];
    });
  }

  function cascade(sel, key, on, tree) {
    var next = {};
    Object.keys(sel).forEach(function (k) {
      next[k] = sel[k];
    });
    next[key] = on;
    descendantKeys(key, tree).forEach(function (d) {
      next[d] = on;
    });
    if (key.indexOf("d:") === 0) {
      var pp = key.split(":");
      syncCat(next, pp[1] || "", pp[2] || "", tree);
      syncGroup(next, pp[1] || "", tree);
    } else if (key.indexOf("c:") === 0) {
      syncGroup(next, (key.split(":")[1] || ""), tree);
    }
    return next;
  }

  function cbState(key, sel, tree) {
    var self = !!sel[key];
    var desc = descendantKeys(key, tree);
    if (!desc.length) return { checked: self, indeterminate: false };
    var n = desc.filter(function (d) {
      return sel[d];
    }).length;
    if (n === desc.length) return { checked: true, indeterminate: false };
    if (n === 0) return { checked: false, indeterminate: false };
    return { checked: false, indeterminate: true };
  }

  function emptyByLine() {
    return { kiosk: [], emenu: [], sdi: [] };
  }

  function normalizeByLine(raw) {
    var out = emptyByLine();
    if (!raw || typeof raw !== "object") return out;
    LINE_OPTIONS.forEach(function (line) {
      var keys = raw[line.id];
      if (!Array.isArray(keys)) return;
      var seen = {};
      out[line.id] = keys.filter(function (k) {
        if (typeof k !== "string" || !k || seen[k]) return false;
        seen[k] = true;
        return true;
      });
    });
    return out;
  }

  function expandDishKeys(keys, tree) {
    var set = {};
    (keys || []).forEach(function (k) {
      if (k.indexOf("d:") === 0) {
        set[k] = true;
        return;
      }
      descendantKeys(k, tree).forEach(function (d) {
        if (d.indexOf("d:") === 0) set[d] = true;
      });
    });
    return Object.keys(set);
  }

  function countDishesInLine(keys, tree) {
    return expandDishKeys(keys, tree).length;
  }

  function countDishes(byLine) {
    var seen = {};
    LINE_OPTIONS.forEach(function (line) {
      expandDishKeys(byLine[line.id] || [], resolveTree(line.id)).forEach(function (k) {
        seen[k] = true;
      });
    });
    return Object.keys(seen).length;
  }

  function formatSummary(byLine) {
    var parts = [];
    LINE_OPTIONS.forEach(function (line) {
      var n = countDishesInLine(byLine[line.id] || [], resolveTree(line.id));
      if (n > 0) parts.push(line.label + " " + n + " 项");
    });
    return parts.length ? parts.join("；") : "未选商品";
  }

  function listSelectedDishes(byLine) {
    var out = [];
    byLine = normalizeByLine(byLine);
    LINE_OPTIONS.forEach(function (line) {
      var tree = resolveTree(line.id);
      var picked = {};
      expandDishKeys(byLine[line.id] || [], tree).forEach(function (k) {
        picked[k] = true;
      });
      tree.forEach(function (g) {
        g.categories.forEach(function (c) {
          c.dishes.forEach(function (d) {
            var key = dKey(g.id, c.id, d.id);
            if (!picked[key]) return;
            out.push({ key: key, name: d.name, lineId: line.id, lineLabel: line.label });
          });
        });
      });
    });
    return out;
  }

  /** 按已选菜品展开为分类（含产线），用于「按分类限购」数量配置 */
  function listSelectedCategories(byLine) {
    var out = [];
    var seen = {};
    byLine = normalizeByLine(byLine);
    LINE_OPTIONS.forEach(function (line) {
      var tree = resolveTree(line.id);
      expandDishKeys(byLine[line.id] || [], tree).forEach(function (dk) {
        var parts = dk.split(":");
        var gid = parts[1] || "";
        var cid = parts[2] || "";
        var key = cKey(gid, cid);
        var uniq = line.id + "|" + key;
        if (seen[uniq]) return;
        seen[uniq] = true;
        var cat = findCategory(gid, cid, tree);
        if (!cat) return;
        out.push({
          key: key,
          name: cat.name + "（" + line.label + "）",
          lineId: line.id,
          lineLabel: line.label,
        });
      });
    });
    return out;
  }

  function renderItem(key, title, active, sel, tree, opts) {
    opts = opts || {};
    var st = cbState(key, sel, tree);
    var badge =
      opts.childCount != null
        ? '<span class="bmsp-badge">' + opts.childCount + "</span>"
        : "";
    return (
      '<button type="button" class="bmsp-item' +
      (active ? " active" : "") +
      '" data-brand-menu-col-select="' +
      esc(key) +
      '">' +
      '<input type="checkbox" class="brand-menu-enable-cb bmsp-cb" data-brand-menu-enable="' +
      esc(key) +
      '"' +
      (st.checked ? " checked" : "") +
      (st.indeterminate ? ' data-indeterminate="1"' : "") +
      ' onclick="event.stopPropagation()" />' +
      '<span class="bmsp-label">' +
      esc(title) +
      "</span>" +
      badge +
      "</button>"
    );
  }

  function renderLineBtn(line, active, count) {
    return (
      '<button type="button" class="bmsp-item' +
      (active ? " active" : "") +
      '" data-brand-menu-line-select="' +
      esc(line.id) +
      '">' +
      '<span class="bmsp-label">' +
      esc(line.label) +
      "</span>" +
      '<span class="bmsp-badge">' +
      count +
      "</span>" +
      "</button>"
    );
  }

  function renderHtml(byLine, activeLineId, activeGroupId, activeCategoryId) {
    byLine = normalizeByLine(byLine);
    var activeLine = isLineId(activeLineId) ? activeLineId : DEFAULT_LINE;
    var tree = resolveTree(activeLine);
    var lineKeys = byLine[activeLine] || [];
    var sel = keysToSelection(lineKeys, tree);
    var activeG =
      activeGroupId && findGroup(activeGroupId, tree)
        ? activeGroupId
        : tree[0] ? tree[0].id : "";
    var group = findGroup(activeG, tree);
    var activeC =
      activeCategoryId && group && findCategory(activeG, activeCategoryId, tree)
        ? activeCategoryId
        : group && group.categories[0]
          ? group.categories[0].id
          : "";
    var category = findCategory(activeG, activeC, tree);

    var colLine = LINE_OPTIONS.map(function (line) {
      return renderLineBtn(line, line.id === activeLine, (byLine[line.id] || []).length);
    }).join("");

    var col1 = tree
      .map(function (g) {
        return renderItem(gKey(g.id), g.name, g.id === activeG, sel, tree, {
          childCount: g.categories.length,
        });
      })
      .join("");

    var col2 = group
      ? group.categories
          .map(function (c) {
            return renderItem(cKey(activeG, c.id), c.name, c.id === activeC, sel, tree, {
              childCount: c.dishes.length,
            });
          })
          .join("")
      : "";

    var col3 = category
      ? category.dishes
          .map(function (d) {
            return renderItem(dKey(activeG, activeC, d.id), d.name, false, sel, tree);
          })
          .join("")
      : "";

    var empty = function (t) {
      return '<p class="bmsp-empty">' + esc(t) + "</p>";
    };

    return (
      '<div class="bmsp-root" data-brand-menu-structure-picker data-enable-lines="1"' +
      ' data-active-line="' +
      esc(activeLine) +
      '" data-active-group="' +
      esc(activeG) +
      '" data-active-category="' +
      esc(activeC) +
      '">' +
      '<input type="hidden" data-brand-menu-structure-by-line value="' +
      esc(JSON.stringify(byLine)) +
      '" />' +
      '<div class="bmsp-grid">' +
      '<div class="bmsp-col"><p class="bmsp-col-title">产线</p><div data-brand-menu-col="line">' +
      colLine +
      "</div></div>" +
      '<div class="bmsp-col"><p class="bmsp-col-title">组</p><div data-brand-menu-col="group">' +
      (col1 || empty("暂无分组")) +
      "</div></div>" +
      '<div class="bmsp-col"><p class="bmsp-col-title">类</p><div data-brand-menu-col="category">' +
      (col2 || empty("请选择组")) +
      "</div></div>" +
      '<div class="bmsp-col"><p class="bmsp-col-title">菜</p><div data-brand-menu-col="dish">' +
      (col3 || empty("请选择分类")) +
      "</div></div>" +
      "</div></div>"
    );
  }

  function syncIndeterminate(root) {
    if (!root) return;
    root.querySelectorAll(".brand-menu-enable-cb[data-indeterminate]").forEach(function (cb) {
      cb.indeterminate = true;
    });
  }

  function readByLine(pickerEl) {
    var raw =
      (pickerEl.querySelector("[data-brand-menu-structure-by-line]") || {}).value || "{}";
    try {
      return normalizeByLine(JSON.parse(raw));
    } catch (_) {
      return emptyByLine();
    }
  }

  function bind(pickerEl) {
    if (!pickerEl || pickerEl.dataset.brandMenuStructureBound === "1") return;
    pickerEl.dataset.brandMenuStructureBound = "1";

    function rerender(byLine, activeG, activeC, activeLine, notify) {
      var wrap = document.createElement("div");
      wrap.innerHTML = renderHtml(byLine, activeLine, activeG, activeC).trim();
      var next = wrap.firstElementChild;
      if (!next) return;
      pickerEl.replaceWith(next);
      syncIndeterminate(next);
      bind(next);
      if (notify) {
        next.dispatchEvent(
          new CustomEvent("brand-menu-structure-change", {
            bubbles: true,
            detail: { byLine: byLine },
          }),
        );
      }
    }

    pickerEl.addEventListener("click", function (e) {
      var lineBtn = e.target.closest("[data-brand-menu-line-select]");
      if (lineBtn) {
        var lineId = lineBtn.getAttribute("data-brand-menu-line-select") || "";
        if (!isLineId(lineId)) return;
        var tree = resolveTree(lineId);
        rerender(readByLine(pickerEl), tree[0] ? tree[0].id : "", tree[0] && tree[0].categories[0] ? tree[0].categories[0].id : "", lineId, false);
        return;
      }
      var btn = e.target.closest("[data-brand-menu-col-select]");
      if (!btn || e.target.closest("[data-brand-menu-enable]")) return;
      var key = btn.getAttribute("data-brand-menu-col-select") || "";
      var activeLine = isLineId(pickerEl.dataset.activeLine) ? pickerEl.dataset.activeLine : DEFAULT_LINE;
      var tree = resolveTree(activeLine);
      var byLine = readByLine(pickerEl);
      if (key.indexOf("g:") === 0) {
        var gid = key.slice(2);
        var g = findGroup(gid, tree);
        rerender(byLine, gid, g && g.categories[0] ? g.categories[0].id : "", activeLine, false);
      } else if (key.indexOf("c:") === 0) {
        var pp = key.split(":");
        rerender(byLine, pp[1] || "", pp[2] || "", activeLine, false);
      }
    });

    pickerEl.addEventListener("change", function (e) {
      var input = e.target;
      if (!input.matches || !input.matches("[data-brand-menu-enable]")) return;
      e.stopPropagation();
      var key = input.getAttribute("data-brand-menu-enable");
      if (!key) return;
      var activeLine = isLineId(pickerEl.dataset.activeLine) ? pickerEl.dataset.activeLine : DEFAULT_LINE;
      var tree = resolveTree(activeLine);
      var byLine = readByLine(pickerEl);
      var prev = keysToSelection(byLine[activeLine] || [], tree);
      var nextSel = cascade(prev, key, input.checked, tree);
      byLine[activeLine] = selectionToKeys(nextSel);
      rerender(byLine, pickerEl.dataset.activeGroup || "", pickerEl.dataset.activeCategory || "", activeLine, true);
    });

    syncIndeterminate(pickerEl);
  }

  global.BrandMenuStructurePicker = {
    LINE_OPTIONS: LINE_OPTIONS,
    emptyByLine: emptyByLine,
    normalizeByLine: normalizeByLine,
    countDishes: countDishes,
    formatSummary: formatSummary,
    listSelectedDishes: listSelectedDishes,
    listSelectedCategories: listSelectedCategories,
    renderHtml: renderHtml,
    bind: bind,
    readByLine: readByLine,
    syncIndeterminate: syncIndeterminate,
  };
})(typeof window !== "undefined" ? window : this);
