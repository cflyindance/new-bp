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

  var LINE_TO_PRODUCT = {
    kiosk: "KIOSK",
    emenu: "EMENU",
    pos: "POS",
    sdi: "SDI",
  };
  var LIVE_TREES_BY_LINE = {};
  var LIVE_SOURCE_BY_LINE = {};

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
    if (Object.prototype.hasOwnProperty.call(LIVE_TREES_BY_LINE, lineId)) {
      return LIVE_TREES_BY_LINE[lineId];
    }
    return TREES_BY_LINE[lineId] || TREES_BY_LINE[DEFAULT_LINE];
  }

  function lineCatalogLoaded(lineId) {
    return Object.prototype.hasOwnProperty.call(LIVE_SOURCE_BY_LINE, lineId);
  }

  function applyCatalogTree(lineId, catalog) {
    if (catalog && (catalog.source === "live" || catalog.source === "cache") && Array.isArray(catalog.tree)) {
      LIVE_TREES_BY_LINE[lineId] = catalog.tree;
    } else {
      delete LIVE_TREES_BY_LINE[lineId];
    }
    LIVE_SOURCE_BY_LINE[lineId] = (catalog && catalog.source) || "static";
  }

  function clearCatalogResults() {
    LIVE_TREES_BY_LINE = {};
    LIVE_SOURCE_BY_LINE = {};
  }

  function hasKposHostCookie() {
    if (typeof document === "undefined" || !document.cookie) return false;
    return /(?:^|;\s*)menusifu-emenu-kpos-target=/.test(document.cookie);
  }

  function pickerMenuNotice(source) {
    if (source === "cache") return "菜单服务暂不可用，正在使用缓存菜单";
    if (source === "static" && hasKposHostCookie()) return "无法连接菜单服务，正在使用系统预设菜单";
    return "";
  }

  function fetchBrandMenuCatalog(product) {
    if (typeof fetch !== "function") {
      return Promise.resolve({ tree: null, source: "static" });
    }
    return fetch("/api/v1/emenu-local/menu-catalog?product=" + encodeURIComponent(product), {
      credentials: "same-origin",
    })
      .then(function (response) {
        if (!response.ok) return { tree: null, source: "static" };
        return response.json().then(function (body) {
          if ((body.source === "live" || body.source === "cache") && Array.isArray(body.tree)) {
            return { tree: body.tree, source: body.source };
          }
          return { tree: null, source: body.source || "static" };
        });
      })
      .catch(function () {
        return { tree: null, source: "static" };
      });
  }

  function fetchCatalogForLine(lineId) {
    return fetchBrandMenuCatalog(LINE_TO_PRODUCT[lineId] || "EMENU").then(function (catalog) {
      applyCatalogTree(lineId, catalog);
      return catalog;
    });
  }

  function loadAllLineCatalogs() {
    return Promise.all(
      LINE_OPTIONS.map(function (line) {
        return fetchCatalogForLine(line.id);
      }),
    );
  }

  function dispatchCatalogReady(fromEl) {
    var target =
      fromEl && fromEl.isConnected
        ? fromEl
        : typeof document !== "undefined"
          ? document
          : null;
    if (!target || typeof target.dispatchEvent !== "function") return;
    target.dispatchEvent(new CustomEvent("brand-menu-catalog-ready", { bubbles: true }));
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

  function collectTreeKeys(tree) {
    var keys = {};
    (tree || []).forEach(function (g) {
      keys[gKey(g.id)] = true;
      (g.categories || []).forEach(function (c) {
        keys[cKey(g.id, c.id)] = true;
        (c.dishes || []).forEach(function (d) {
          keys[dKey(g.id, c.id, d.id)] = true;
        });
      });
    });
    return keys;
  }

  function mergeKeysOutsideTree(prevKeys, nextKeys, tree) {
    var inTree = collectTreeKeys(tree);
    var seen = {};
    var out = [];
    (prevKeys || []).concat(nextKeys || []).forEach(function (k) {
      if (!k || seen[k]) return;
      if (inTree[k] && (nextKeys || []).indexOf(k) < 0) return;
      seen[k] = true;
      out.push(k);
    });
    return out;
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

  function listSelectedTargets(byLine, leafLevel) {
    var out = [];
    var targetType = leafLevel === "category" ? "category" : "dish";
    byLine = normalizeByLine(byLine);
    LINE_OPTIONS.forEach(function (line) {
      var tree = resolveTree(line.id);
      var selection = keysToSelection(byLine[line.id] || [], tree);
      tree.forEach(function (g) {
        g.categories.forEach(function (c) {
          var categoryKey = cKey(g.id, c.id);
          if (targetType === "category") {
            if (!selection[categoryKey]) return;
            out.push({
              lineId: line.id,
              lineLabel: line.label,
              groupId: g.id,
              groupName: g.name,
              categoryId: c.id,
              categoryName: c.name,
              targetKey: categoryKey,
              targetType: "category",
              dishId: "",
              dishName: "",
              dishCount: c.dishes.length,
              dishNames: c.dishes.map(function (d) { return d.name; }),
            });
            return;
          }
          c.dishes.forEach(function (d) {
            var dishKey = dKey(g.id, c.id, d.id);
            if (!selection[dishKey]) return;
            out.push({
              lineId: line.id,
              lineLabel: line.label,
              groupId: g.id,
              groupName: g.name,
              categoryId: c.id,
              categoryName: c.name,
              targetKey: dishKey,
              targetType: "dish",
              dishId: d.id,
              dishName: d.name,
              dishCount: 1,
              dishNames: [d.name],
            });
          });
        });
      });
    });
    return out;
  }

  function listAllDishes() {
    var out = [];
    LINE_OPTIONS.forEach(function (line) {
      resolveTree(line.id).forEach(function (g) {
        g.categories.forEach(function (c) {
          c.dishes.forEach(function (d) {
            out.push({
              lineId: line.id,
              lineLabel: line.label,
              groupId: g.id,
              groupName: g.name,
              categoryId: c.id,
              categoryName: c.name,
              dishId: d.id,
              dishName: d.name,
              dishKey: dKey(g.id, c.id, d.id),
              categoryKey: cKey(g.id, c.id),
            });
          });
        });
      });
    });
    return out;
  }

  function nodeExists(key, tree) {
    if (typeof key !== "string" || !key) return false;
    if (key.indexOf("g:") === 0) return !!findGroup(key.slice(2), tree);
    var parts = key.split(":");
    if (key.indexOf("c:") === 0) return !!findCategory(parts[1] || "", parts[2] || "", tree);
    if (key.indexOf("d:") !== 0) return false;
    var category = findCategory(parts[1] || "", parts[2] || "", tree);
    return !!category && category.dishes.some(function (dish) { return dish.id === (parts[3] || ""); });
  }

  function setNodeSelected(byLine, lineId, nodeKey, checked) {
    var next = normalizeByLine(byLine);
    if (!isLineId(lineId)) return next;
    var tree = resolveTree(lineId);
    if (!nodeExists(nodeKey, tree)) return next;
    var prevKeys = next[lineId] || [];
    var selection = keysToSelection(prevKeys, tree);
    next[lineId] = mergeKeysOutsideTree(
      prevKeys,
      selectionToKeys(cascade(selection, nodeKey, !!checked, tree)),
      tree,
    );
    return next;
  }

  function isNodeSelected(byLine, lineId, nodeKey) {
    if (!isLineId(lineId)) return false;
    var tree = resolveTree(lineId);
    if (!nodeExists(nodeKey, tree)) return false;
    var normalized = normalizeByLine(byLine);
    return !!keysToSelection(normalized[lineId] || [], tree)[nodeKey];
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

  function normalizePickerOptions(opts) {
    opts = opts || {};
    var source = opts.menuSource || "";
    return {
      leafLevel: opts.leafLevel === "category" ? "category" : "dish",
      catalogReady: !!opts.catalogReady,
      menuSource:
        source === "live" || source === "cache" || source === "static" || source === "snapshot" || source === "fixture"
          ? source
          : "",
    };
  }

  function readPickerOptions(pickerEl) {
    if (!pickerEl || !pickerEl.getAttribute) return normalizePickerOptions({});
    return normalizePickerOptions({
      leafLevel: pickerEl.getAttribute("data-leaf-level") || "dish",
      catalogReady: pickerEl.getAttribute("data-brand-menu-catalog-ready") === "1",
      menuSource: pickerEl.getAttribute("data-menu-source") || "",
    });
  }

  function renderHtml(byLine, activeLineId, activeGroupId, activeCategoryId, opts) {
    opts = normalizePickerOptions(opts);
    var leafCategory = opts.leafLevel === "category";
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
            return renderItem(cKey(activeG, c.id), c.name, !leafCategory && c.id === activeC, sel, tree, {
              childCount: c.dishes.length,
            });
          })
          .join("")
      : "";

    var col3 = "";
    if (!leafCategory) {
      col3 = category
        ? category.dishes
            .map(function (d) {
              return renderItem(dKey(activeG, activeC, d.id), d.name, false, sel, tree);
            })
            .join("")
        : "";
    }

    var empty = function (t) {
      return '<p class="bmsp-empty">' + esc(t) + "</p>";
    };
    var menuSource = opts.menuSource || LIVE_SOURCE_BY_LINE[activeLine] || "";
    var catalogReady = opts.catalogReady || lineCatalogLoaded(activeLine);
    var notice = pickerMenuNotice(menuSource);

    return (
      '<div class="bmsp-root" data-brand-menu-structure-picker data-enable-lines="1"' +
      ' data-leaf-level="' +
      esc(opts.leafLevel) +
      '"' +
      (menuSource ? ' data-menu-source="' + esc(menuSource) + '"' : "") +
      (catalogReady ? ' data-brand-menu-catalog-ready="1"' : "") +
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
      (notice ? '<p class="bmsp-notice">' + esc(notice) + "</p>" : "") +
      '<div class="bmsp-grid' +
      (leafCategory ? " bmsp-grid--no-dish" : "") +
      '">' +
      '<div class="bmsp-col"><p class="bmsp-col-title">产线</p><div data-brand-menu-col="line">' +
      colLine +
      "</div></div>" +
      '<div class="bmsp-col"><p class="bmsp-col-title">组</p><div data-brand-menu-col="group">' +
      (col1 || empty("暂无分组")) +
      "</div></div>" +
      '<div class="bmsp-col"><p class="bmsp-col-title">类</p><div data-brand-menu-col="category">' +
      (col2 || empty("请选择组")) +
      "</div></div>" +
      (leafCategory
        ? ""
        : '<div class="bmsp-col"><p class="bmsp-col-title">菜</p><div data-brand-menu-col="dish">' +
          (col3 || empty("请选择分类")) +
          "</div></div>") +
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

  function bind(pickerEl, opts) {
    if (!pickerEl || pickerEl.dataset.brandMenuStructureBound === "1") return;
    pickerEl.dataset.brandMenuStructureBound = "1";
    var pickerOpts = normalizePickerOptions(opts || readPickerOptions(pickerEl));
    if (!pickerOpts.menuSource && lineCatalogLoaded(pickerEl.dataset.activeLine || DEFAULT_LINE)) {
      pickerOpts.menuSource = LIVE_SOURCE_BY_LINE[pickerEl.dataset.activeLine || DEFAULT_LINE] || "";
      pickerOpts.catalogReady = true;
    }

    function navIdsForLine(lineId, preferredG, preferredC) {
      var tree = resolveTree(lineId);
      var gid = preferredG || "";
      var cid = preferredC || "";
      if (!findGroup(gid, tree)) {
        gid = tree[0] ? tree[0].id : "";
        cid = tree[0] && tree[0].categories[0] ? tree[0].categories[0].id : "";
      } else {
        var group = findGroup(gid, tree);
        if (!findCategory(gid, cid, tree)) {
          cid = group && group.categories[0] ? group.categories[0].id : "";
        }
      }
      return { groupId: gid, categoryId: cid };
    }

    function applyLoadedCatalog(lineId, notify) {
      pickerOpts.catalogReady = true;
      pickerOpts.menuSource = LIVE_SOURCE_BY_LINE[lineId] || "static";
      var nav = navIdsForLine(lineId, pickerEl.dataset.activeGroup, pickerEl.dataset.activeCategory);
      rerender(readByLine(pickerEl), nav.groupId, nav.categoryId, lineId, !!notify);
    }

    function rerender(byLine, activeG, activeC, activeLine, notify) {
      var scrollTops = Array.prototype.map.call(
        pickerEl.querySelectorAll(".bmsp-col > div"),
        function (el) { return el.scrollTop; }
      );
      var pageScrollY = window.scrollY || window.pageYOffset || 0;
      var focusKey = null;
      var activeEl = document.activeElement;
      if (activeEl && pickerEl.contains(activeEl) && activeEl.getAttribute) {
        focusKey = activeEl.getAttribute("data-brand-menu-enable");
      }
      var wrap = document.createElement("div");
      wrap.innerHTML = renderHtml(byLine, activeLine, activeG, activeC, pickerOpts).trim();
      var next = wrap.firstElementChild;
      if (!next) return;
      pickerEl.replaceWith(next);
      var nextCols = next.querySelectorAll(".bmsp-col > div");
      scrollTops.forEach(function (top, index) {
        if (nextCols[index]) nextCols[index].scrollTop = top;
      });
      if (focusKey) {
        var focusEl = null;
        Array.prototype.some.call(next.querySelectorAll("[data-brand-menu-enable]"), function (el) {
          if (el.getAttribute("data-brand-menu-enable") === focusKey) {
            focusEl = el;
            return true;
          }
          return false;
        });
        if (focusEl && typeof focusEl.focus === "function") {
          try { focusEl.focus({ preventScroll: true }); }
          catch (err) { focusEl.focus(); }
        }
      }
      window.scrollTo(0, pageScrollY);
      syncIndeterminate(next);
      bind(next, pickerOpts);
      if (notify) {
        next.dispatchEvent(
          new CustomEvent("brand-menu-structure-change", {
            bubbles: true,
            detail: {
              byLine: byLine,
              activeLine: activeLine,
              activeGroup: activeG,
              activeCategory: activeC,
            },
          }),
        );
        window.scrollTo(0, pageScrollY);
      } else {
        next.dispatchEvent(
          new CustomEvent("brand-menu-structure-nav", {
            bubbles: true,
            detail: {
              activeLine: activeLine,
              activeGroup: activeG,
              activeCategory: activeC,
            },
          }),
        );
      }
    }

    pickerEl.addEventListener("click", function (e) {
      var lineBtn = e.target.closest("[data-brand-menu-line-select]");
      if (lineBtn) {
        var lineId = lineBtn.getAttribute("data-brand-menu-line-select") || "";
        if (!isLineId(lineId)) return;
        if (lineCatalogLoaded(lineId)) {
          pickerOpts.menuSource = LIVE_SOURCE_BY_LINE[lineId] || "static";
          pickerOpts.catalogReady = true;
          var loadedTree = resolveTree(lineId);
          rerender(
            readByLine(pickerEl),
            loadedTree[0] ? loadedTree[0].id : "",
            loadedTree[0] && loadedTree[0].categories[0] ? loadedTree[0].categories[0].id : "",
            lineId,
            false,
          );
          return;
        }
        fetchCatalogForLine(lineId).then(function () {
          if (!pickerEl.isConnected) return;
          applyLoadedCatalog(lineId, false);
        });
        return;
      }
      var btn = e.target.closest("[data-brand-menu-col-select]");
      if (!btn || e.target.closest("[data-brand-menu-enable]")) return;
      var key = btn.getAttribute("data-brand-menu-col-select") || "";
      var activeLine = isLineId(pickerEl.dataset.activeLine) ? pickerEl.dataset.activeLine : DEFAULT_LINE;
      var treeNav = resolveTree(activeLine);
      var byLine = readByLine(pickerEl);
      if (key.indexOf("g:") === 0) {
        var gid = key.slice(2);
        var g = findGroup(gid, treeNav);
        rerender(byLine, gid, g && g.categories[0] ? g.categories[0].id : "", activeLine, false);
      } else if (key.indexOf("c:") === 0) {
        if (pickerOpts.leafLevel === "category") return;
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
      var prevKeys = byLine[activeLine] || [];
      var prev = keysToSelection(prevKeys, tree);
      var nextSel = cascade(prev, key, input.checked, tree);
      byLine[activeLine] = mergeKeysOutsideTree(prevKeys, selectionToKeys(nextSel), tree);
      rerender(byLine, pickerEl.dataset.activeGroup || "", pickerEl.dataset.activeCategory || "", activeLine, true);
    });

    syncIndeterminate(pickerEl);

    var startLine = isLineId(pickerEl.dataset.activeLine) ? pickerEl.dataset.activeLine : DEFAULT_LINE;
    if (pickerEl.getAttribute("data-brand-menu-catalog-ready") !== "1") {
      if (lineCatalogLoaded(startLine)) {
        pickerEl.setAttribute("data-brand-menu-catalog-ready", "1");
        if (LIVE_SOURCE_BY_LINE[startLine]) {
          pickerEl.setAttribute("data-menu-source", LIVE_SOURCE_BY_LINE[startLine]);
        }
      } else {
        loadAllLineCatalogs().then(function () {
          if (pickerEl.isConnected) {
            var activeLine = isLineId(pickerEl.dataset.activeLine) ? pickerEl.dataset.activeLine : startLine;
            applyLoadedCatalog(activeLine, false);
          }
          dispatchCatalogReady(pickerEl);
        });
      }
    }
  }

  global.BrandMenuStructurePicker = {
    LINE_OPTIONS: LINE_OPTIONS,
    emptyByLine: emptyByLine,
    normalizeByLine: normalizeByLine,
    countDishes: countDishes,
    formatSummary: formatSummary,
    listSelectedDishes: listSelectedDishes,
    listSelectedCategories: listSelectedCategories,
    listSelectedTargets: listSelectedTargets,
    listAllDishes: listAllDishes,
    setNodeSelected: setNodeSelected,
    isNodeSelected: isNodeSelected,
    renderHtml: renderHtml,
    bind: bind,
    readByLine: readByLine,
    syncIndeterminate: syncIndeterminate,
    applyCatalogResult: applyCatalogTree,
    clearCatalogResults: clearCatalogResults,
    mergeKeysOutsideTree: mergeKeysOutsideTree,
  };
})(typeof window !== "undefined" ? window : this);
