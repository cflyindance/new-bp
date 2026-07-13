/**
 * TipOut 员工管理 — 整合 POS 本地档案、小费分配（TipOut）与报税报表（Payroll）
 */
(function () {
  "use strict";

  const STORAGE_KEY = "tipout-employees-roster-v1";
  const ROLES_STORAGE_KEY = "tipout-employee-role-options-v1";
  const ROLE_MULTI_SELECT_ID = "field-role";
  const ROLE_DROPDOWN_PORTAL_CLASS = "employees-role-dropdown-portal";
  const DEFAULT_STORE_NAME = "上海陆家嘴店";
  const DEFAULT_ROLE_OPTIONS = [
    "Server",
    "Bartender",
    "Kitchen",
    "Busser",
    "Cashier",
    "Runner",
    "Host",
    "Floor",
    "Manager",
    "Online",
  ];
  const EXTRA_STORES = [
    "Lone Star BBQ House - Austin, TX 78701",
    "Pacific Bowl & Grill - San Diego, CA 92101",
    "Nai Cha",
    "Downtown Branch",
    "Airport Kiosk",
  ];
  
  function canonicalStoreDisplayName(storeName) {
    if (window.TipOutGlobalScopeFilter && typeof TipOutGlobalScopeFilter.canonicalRosterStoreDisplayName === "function") {
      return TipOutGlobalScopeFilter.canonicalRosterStoreDisplayName(storeName);
    }
    const map = {
      "golden dragon chinese kitchen - dallas, tx 75231": "上海陆家嘴店",
      "sakura sushi & ramen house - dallas, tx 75247": "广州天河店",
      "张记火锅": "上海陆家嘴店",
    };
    const key = String(storeName || "").trim().toLowerCase();
    return map[key] || String(storeName || "").trim();
  }

  function isSuppressedStoreAlias(storeName) {
    if (window.TipOutGlobalScopeFilter && typeof TipOutGlobalScopeFilter.isSuppressedRosterStoreAlias === "function") {
      return TipOutGlobalScopeFilter.isSuppressedRosterStoreAlias(storeName);
    }
    const trimmed = String(storeName || "").trim();
    return !!trimmed && canonicalStoreDisplayName(trimmed) !== trimmed;
  }

  let editingEmployeeId = null;
  let pendingDeleteRow = null;

  function normalizeRoleName(value) {
    return String(value || "").trim();
  }

  function loadCustomRoles() {
    try {
      const raw = localStorage.getItem(ROLES_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeRoleName).filter(Boolean) : [];
    } catch {
      return [];
    }
  }

  function saveCustomRoles(roles) {
    localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(roles));
  }

  function parseRoleValues(raw) {
    if (Array.isArray(raw)) return raw.map(normalizeRoleName).filter(Boolean);
    const text = String(raw || "").trim();
    if (!text) return [];
    return text
      .split(/[,，、]/)
      .map(normalizeRoleName)
      .filter(Boolean);
  }

  function formatRoleValues(roles) {
    return parseRoleValues(roles).join(", ");
  }

  function getPrimaryRole(raw) {
    const roles = parseRoleValues(raw);
    return roles[0] || "";
  }

  function roleValuesEqual(a, b) {
    return normalizeRoleName(a).toLowerCase() === normalizeRoleName(b).toLowerCase();
  }

  function getRoleMultiSelectEl() {
    return document.getElementById(ROLE_MULTI_SELECT_ID);
  }

  function getRoleDropdownEl() {
    return (
      document.querySelector(`.${ROLE_DROPDOWN_PORTAL_CLASS}`) ||
      getRoleMultiSelectEl()?.querySelector(".multi-select-dropdown") ||
      null
    );
  }

  function getRoleOptionsContainer() {
    return getRoleDropdownEl()?.querySelector(".employees-role-options") || null;
  }

  function getRoleSearchInput() {
    return getRoleDropdownEl()?.querySelector(".employees-role-search") || null;
  }

  function mountRoleDropdownPortal() {
    const el = getRoleMultiSelectEl();
    const dropdown = el?.querySelector(".multi-select-dropdown");
    if (!el || !dropdown || dropdown.classList.contains(ROLE_DROPDOWN_PORTAL_CLASS)) return;
    dropdown.classList.add(ROLE_DROPDOWN_PORTAL_CLASS);
    document.body.appendChild(dropdown);
    positionRoleDropdown();
  }

  function unmountRoleDropdownPortal() {
    const el = getRoleMultiSelectEl();
    const dropdown = document.querySelector(`.${ROLE_DROPDOWN_PORTAL_CLASS}`);
    if (!el || !dropdown) return;
    dropdown.classList.remove(ROLE_DROPDOWN_PORTAL_CLASS);
    dropdown.style.top = "";
    dropdown.style.left = "";
    dropdown.style.width = "";
    dropdown.style.position = "";
    dropdown.style.zIndex = "";
    dropdown.style.display = "";
    dropdown.style.maxHeight = "";
    el.appendChild(dropdown);
  }

  function closeRoleMultiSelect() {
    const el = getRoleMultiSelectEl();
    if (!el) return;
    el.classList.remove("open");
    const trigger = el.querySelector(".multi-select-input");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    unmountRoleDropdownPortal();
    const search = getRoleSearchInput();
    if (search) search.value = "";
    filterRoleOptions("");
  }

  function positionRoleDropdown() {
    const el = getRoleMultiSelectEl();
    const dropdown = getRoleDropdownEl();
    const input = el?.querySelector(".multi-select-input");
    if (!el || !dropdown || !input || !el.classList.contains("open")) return;

    const rect = input.getBoundingClientRect();
    const viewportGap = 8;
    const preferredMaxHeight = 260;
    const spaceBelow = window.innerHeight - rect.bottom - viewportGap;
    const spaceAbove = rect.top - viewportGap;
    const openUpward = spaceBelow < 180 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(preferredMaxHeight, openUpward ? spaceAbove - 4 : spaceBelow - 4));

    dropdown.style.position = "fixed";
    dropdown.style.left = `${Math.max(viewportGap, Math.min(rect.left, window.innerWidth - rect.width - viewportGap))}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.style.zIndex = "1300";
    dropdown.style.display = "flex";
    dropdown.style.maxHeight = `${maxHeight}px`;

    if (openUpward) {
      dropdown.style.top = `${Math.max(viewportGap, rect.top - maxHeight - 4)}px`;
    } else {
      dropdown.style.top = `${rect.bottom + 4}px`;
    }
  }

  function toggleRoleMultiSelect() {
    const el = getRoleMultiSelectEl();
    if (!el) return;
    const willOpen = !el.classList.contains("open");
    closeRoleMultiSelect();
    if (!willOpen) return;
    el.classList.add("open");
    const trigger = el.querySelector(".multi-select-input");
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    mountRoleDropdownPortal();
    setTimeout(() => getRoleSearchInput()?.focus(), 0);
  }

  function refreshRoleMultiTags() {
    const el = getRoleMultiSelectEl();
    if (!el) return;
    const tagsEl = el.querySelector(".multi-select-tags");
    if (!tagsEl) return;
    const checked = Array.from(getRoleOptionsContainer()?.querySelectorAll("input[type='checkbox']:checked") || []);
    const placeholder = (el.dataset && el.dataset.placeholder) || "请选择岗位";
    tagsEl.innerHTML = "";
    if (checked.length === 0) {
      tagsEl.innerHTML = `<span class="multi-select-placeholder">${escapeHtml(placeholder)}</span>`;
      return;
    }
    checked.forEach((cb) => {
      const tag = document.createElement("span");
      tag.className = "multi-select-tag";
      tag.appendChild(document.createTextNode(cb.value + "\u00a0"));
      const close = document.createElement("i");
      close.textContent = "×";
      close.setAttribute("aria-label", `移除 ${cb.value}`);
      close.addEventListener("click", (ev) => {
        ev.stopPropagation();
        cb.checked = false;
        cb.closest(".multi-select-option")?.classList.remove("is-checked");
        refreshRoleMultiTags();
      });
      tag.appendChild(close);
      tagsEl.appendChild(tag);
    });
  }

  function getSelectedRoles() {
    const el = getRoleMultiSelectEl();
    if (!el) return [];
    return Array.from(getRoleOptionsContainer()?.querySelectorAll("input[type='checkbox']:checked") || []).map((cb) => cb.value);
  }

  function filterRoleOptions(query) {
    const optionsContainer = getRoleOptionsContainer();
    const dropdown = getRoleDropdownEl();
    if (!optionsContainer || !dropdown) return;
    const q = String(query || "")
      .trim()
      .toLowerCase();
    let visible = 0;
    optionsContainer.querySelectorAll(".multi-select-option").forEach((opt) => {
      const label = String(opt.textContent || "").trim().toLowerCase();
      const show = !q || label.includes(q);
      opt.style.display = show ? "" : "none";
      if (show) visible += 1;
    });
    let emptyEl = dropdown.querySelector(".employees-role-empty");
    if (visible === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement("div");
        emptyEl.className = "employees-role-empty";
        optionsContainer.appendChild(emptyEl);
      }
      emptyEl.textContent = q ? "没有匹配的岗位" : "暂无岗位选项";
      emptyEl.style.display = "";
    } else if (emptyEl) {
      emptyEl.style.display = "none";
    }
  }

  function buildRoleOptionsHtml(roles, selectedRoles) {
    if (!roles.length) {
      return '<div class="employees-role-empty">暂无岗位选项</div>';
    }
    return roles
      .map((r) => {
        const checked = selectedRoles.some((s) => roleValuesEqual(s, r));
        const checkedAttr = checked ? " checked" : "";
        const checkedClass = checked ? " is-checked" : "";
        return `<label class="multi-select-option${checkedClass}"><input type="checkbox" value="${escapeHtml(r)}"${checkedAttr}> ${escapeHtml(r)}</label>`;
      })
      .join("");
  }

  function collectRolesFromRoster(list) {
    const roles = [];
    const seen = {};
    (list || []).forEach((e) => {
      parseRoleValues(e && e.role).forEach((r) => {
        if (r && !seen[r]) {
          seen[r] = 1;
          roles.push(r);
        }
      });
    });
    return roles;
  }

  function getRoleOptions() {
    const seen = {};
    const out = [];
    const push = (r) => {
      const name = normalizeRoleName(r);
      if (!name || seen[name]) return;
      seen[name] = 1;
      out.push(name);
    };
    DEFAULT_ROLE_OPTIONS.forEach(push);
    loadCustomRoles().forEach(push);
    collectRolesFromRoster(loadRoster()).forEach(push);
    return out.sort((a, b) => a.localeCompare(b, "en"));
  }

  function populateRoleSelect(selected) {
    const el = getRoleMultiSelectEl();
    if (!el) return;
    const roles = getRoleOptions();
    let selectedRoles = parseRoleValues(selected);
    if (selectedRoles.length === 0 && roles.length) {
      selectedRoles = [roles.includes("Server") ? "Server" : roles[0]];
    }
    selectedRoles.forEach((r) => {
      if (r && !roles.some((x) => roleValuesEqual(x, r))) roles.push(r);
    });
    roles.sort((a, b) => a.localeCompare(b, "en"));
    const dropdown = getRoleDropdownEl();
    const optionsEl = dropdown?.querySelector(".employees-role-options");
    if (optionsEl) optionsEl.innerHTML = buildRoleOptionsHtml(roles, selectedRoles);
    const search = getRoleSearchInput();
    if (search) search.value = "";
    refreshRoleMultiTags();
    filterRoleOptions("");
  }

  function addCustomRole(name) {
    const role = normalizeRoleName(name);
    if (!role) return "";
    const custom = loadCustomRoles();
    if (!custom.some((r) => r.toLowerCase() === role.toLowerCase())) {
      custom.push(role);
      saveCustomRoles(custom);
    }
    return role;
  }

  function hideRoleAddModal() {
    const input = $("#field-new-role");
    if (input) input.value = "";
    const modal = $("#employeeRoleAddModal");
    if (modal) modal.classList.remove("show");
    if ($("#addEmployeeModal")?.classList.contains("show")) {
      document.body.style.overflow = "hidden";
    } else if (!document.querySelector(".modal-overlay.show")) {
      document.body.style.overflow = "";
    }
  }

  function showRoleAddModal() {
    const input = $("#field-new-role");
    if (input) {
      input.value = "";
    }
    if (typeof openModal === "function") openModal("employeeRoleAddModal");
    else $("#employeeRoleAddModal")?.classList.add("show");
    setTimeout(() => input?.focus(), 0);
  }

  function confirmNewRole() {
    const input = $("#field-new-role");
    const name = normalizeRoleName(input && input.value);
    if (!name) {
      if (typeof showNotification === "function") showNotification("请输入岗位名称", "error");
      else alert("请输入岗位名称");
      return;
    }
    const exists = getRoleOptions().some((r) => roleValuesEqual(r, name));
    if (exists) {
      const current = getSelectedRoles();
      if (!current.some((r) => roleValuesEqual(r, name))) current.push(name);
      populateRoleSelect(formatRoleValues(current));
      hideRoleAddModal();
      if (typeof showNotification === "function") showNotification("该岗位已存在，已为您选中", "info");
      return;
    }
    addCustomRole(name);
    const current = getSelectedRoles();
    current.push(name);
    populateRoleSelect(formatRoleValues(current));
    hideRoleAddModal();
    if (typeof showNotification === "function") showNotification(`已添加岗位「${name}」`, "success");
  }

  function bindRoleQuickAdd() {
    $("#btn-add-role-option")?.addEventListener("click", showRoleAddModal);
    $("#btn-confirm-new-role")?.addEventListener("click", confirmNewRole);
    $("#btn-cancel-new-role")?.addEventListener("click", hideRoleAddModal);
    $("#btn-employee-role-add-close")?.addEventListener("click", hideRoleAddModal);
    const overlay = $("#employeeRoleAddModal");
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) hideRoleAddModal();
    });
    $("#field-new-role")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        confirmNewRole();
      } else if (e.key === "Escape") {
        hideRoleAddModal();
      }
    });
  }

  function bindRoleMultiSelect() {
    const el = getRoleMultiSelectEl();
    if (!el || el.dataset.roleMultiBound === "1") return;
    el.dataset.roleMultiBound = "1";

    el.querySelector(".multi-select-input")?.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleRoleMultiSelect();
    });
    el.querySelector(".multi-select-input")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleRoleMultiSelect();
      } else if (e.key === "Escape") {
        closeRoleMultiSelect();
      }
    });
    const dropdown = getRoleDropdownEl();
    dropdown?.querySelector(".employees-role-search")?.addEventListener("input", (e) => {
      filterRoleOptions(e.target.value);
    });
    dropdown?.querySelector(".employees-role-search")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });
    dropdown?.querySelector(".employees-role-options")?.addEventListener("change", (e) => {
      const cb = e.target;
      if (!cb || cb.type !== "checkbox") return;
      cb.closest(".multi-select-option")?.classList.toggle("is-checked", cb.checked);
      refreshRoleMultiTags();
    });
    dropdown?.querySelector(".employees-role-options")?.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    document.addEventListener("click", (e) => {
      const target = e.target;
      if (
        target.closest(`#${ROLE_MULTI_SELECT_ID}`) ||
        target.closest(`.${ROLE_DROPDOWN_PORTAL_CLASS}`)
      ) {
        return;
      }
      closeRoleMultiSelect();
    });
    window.addEventListener("resize", () => {
      if (el.classList.contains("open")) positionRoleDropdown();
    });
    window.addEventListener(
      "scroll",
      () => {
        if (el.classList.contains("open")) positionRoleDropdown();
      },
      true
    );
  }

  function filterListByGlobalScope(list, scopeOverride) {
    if (window.TipOutGlobalScopeFilter && typeof TipOutGlobalScopeFilter.filterRosterByGlobalScope === "function") {
      return TipOutGlobalScopeFilter.filterRosterByGlobalScope(list, scopeOverride);
    }
    return list;
  }

  function shouldShowEmployeesStoreFilter() {
    if (!window.TipOutGlobalScopeFilter) return false;
    const options =
      typeof TipOutGlobalScopeFilter.listScopedStoreOptions === "function"
        ? TipOutGlobalScopeFilter.listScopedStoreOptions()
        : [];
    if (options.length > 1) return true;
    if (typeof TipOutGlobalScopeFilter.usesInPageStorePicker === "function") {
      return TipOutGlobalScopeFilter.usesInPageStorePicker();
    }
    return false;
  }

  function syncEmployeesStoreFilterUi() {
    const wrap = $("#employeesStoreFilter");
    const select = $("#employees-store-select");
    const addBtn = $("#btn-add-employee");
    if (!wrap || !select) return;

    const show = shouldShowEmployeesStoreFilter();
    wrap.hidden = !show;
    if (!show) {
      if (addBtn) addBtn.disabled = false;
      return;
    }

    const options =
      typeof TipOutGlobalScopeFilter.listScopedStoreOptions === "function"
        ? TipOutGlobalScopeFilter.listScopedStoreOptions()
        : [];
    const scoped =
      typeof TipOutGlobalScopeFilter.readGlobalScopeFilter === "function"
        ? TipOutGlobalScopeFilter.readGlobalScopeFilter()
        : { storeId: "", storeLabel: "", isAllStores: true };

    const prev = select.value;
    select.innerHTML =
      options
        .map((o) => {
          const label = escapeHtml(canonicalStoreDisplayName(o.labelZh || o.value));
          return '<option value="' + escapeHtml(o.value) + '">' + label + "</option>";
        })
        .join("") || '<option value="">请选择门店</option>';

    // 优先保留当前下拉选中值，避免切换后门店被旧 scope 覆盖回去
    const selected =
      prev && options.some((o) => o.value === prev)
        ? prev
        : scoped.storeId && options.some((o) => o.value === scoped.storeId)
          ? scoped.storeId
          : options[0]
            ? options[0].value
            : "";
    select.value = selected;
    if (addBtn) addBtn.disabled = !selected;

    if (selected && selected !== scoped.storeId) {
      const opt = options.find((o) => o.value === selected);
      const label = opt ? canonicalStoreDisplayName(String(opt.labelZh || opt.value)) : selected;
      if (
        window.TipOutGlobalScopeFilter &&
        typeof TipOutGlobalScopeFilter.writeGlobalStoreFilter === "function"
      ) {
        TipOutGlobalScopeFilter.writeGlobalStoreFilter(selected, label);
      }
    }
  }

  function bindEmployeesStoreFilter() {
    const select = $("#employees-store-select");
    if (!select || select.dataset.bound === "1") return;
    select.dataset.bound = "1";
    select.addEventListener("change", () => {
      const storeId = select.value;
      if (!storeId) return;
      const opt = select.options[select.selectedIndex];
      const label = canonicalStoreDisplayName(opt ? String(opt.textContent || "").trim() : "");
      if (
        window.TipOutGlobalScopeFilter &&
        typeof TipOutGlobalScopeFilter.writeGlobalStoreFilter === "function"
      ) {
        TipOutGlobalScopeFilter.writeGlobalStoreFilter(storeId, label);
      }
      renderTable();
    });
  }

  function resolveEmployeesListFilterScope() {
    if (shouldShowEmployeesStoreFilter()) {
      const select = $("#employees-store-select");
      const storeId = select && select.value ? String(select.value).trim() : "";
      if (!storeId) {
        return { storeId: "", storeLabel: "", isAllStores: true };
      }
      const opt = select.options[select.selectedIndex];
      const storeLabel = canonicalStoreDisplayName(opt ? String(opt.textContent || "").trim() : "");
      if (
        window.TipOutGlobalScopeFilter &&
        typeof TipOutGlobalScopeFilter.scopeFromStoreSelection === "function"
      ) {
        return TipOutGlobalScopeFilter.scopeFromStoreSelection(storeId, storeLabel);
      }
      return { storeId, storeLabel, isAllStores: false };
    }
    if (window.TipOutGlobalScopeFilter && typeof TipOutGlobalScopeFilter.readGlobalScopeFilter === "function") {
      return TipOutGlobalScopeFilter.readGlobalScopeFilter();
    }
    return { storeId: "", storeLabel: "", isAllStores: true };
  }

  function resolveLockedStoreForForm() {
    const stores = getFormStoreOptions();
    if (window.TipOutGlobalScopeFilter) {
      const scoped =
        typeof TipOutGlobalScopeFilter.readGlobalScopeFilter === "function"
          ? TipOutGlobalScopeFilter.readGlobalScopeFilter()
          : null;
      if (scoped && scoped.storeLabel && String(scoped.storeLabel).trim()) {
        const label = canonicalStoreDisplayName(String(scoped.storeLabel).trim());
        if (stores.includes(label)) return label;
        if (scoped.storeId && String(scoped.storeId).indexOf("roster-store:") === 0) {
          try {
            const decoded = decodeURIComponent(String(scoped.storeId).slice("roster-store:".length));
            if (decoded) {
              const canon = canonicalStoreDisplayName(decoded);
              if (stores.includes(canon)) return canon;
              return canon || label;
            }
          } catch (_) {
            /* ignore */
          }
        }
        return label;
      }
      // 页内门店筛选当前选中
      const filterSelect = $("#employees-store-select");
      if (filterSelect && filterSelect.value) {
        const opt = filterSelect.options[filterSelect.selectedIndex];
        const fromFilter = canonicalStoreDisplayName(opt ? String(opt.textContent || "").trim() : "");
        if (fromFilter && stores.includes(fromFilter)) return fromFilter;
        if (fromFilter) return fromFilter;
      }
      if (typeof TipOutGlobalScopeFilter.resolveDefaultRosterStore === "function") {
        return TipOutGlobalScopeFilter.resolveDefaultRosterStore(stores, DEFAULT_STORE_NAME);
      }
    }
    return stores[0] || DEFAULT_STORE_NAME;
  }

  function getFormStoreOptions() {
    const seen = {};
    const stores = [];
    const push = (name) => {
      const raw = String(name || "").trim();
      if (!raw || isSuppressedStoreAlias(raw)) return;
      const t = canonicalStoreDisplayName(raw);
      if (!t || seen[t]) return;
      seen[t] = 1;
      stores.push(t);
    };
    getTipOutStores().forEach(push);
    if (
      window.TipOutGlobalScopeFilter &&
      typeof TipOutGlobalScopeFilter.listScopedStoreOptions === "function"
    ) {
      TipOutGlobalScopeFilter.listScopedStoreOptions().forEach((o) => {
        push(o && (o.labelZh || o.value));
      });
    }
    try {
      loadRoster().forEach((e) => push(e && e.store));
    } catch (_) {
      /* ignore */
    }
    push(DEFAULT_STORE_NAME);
    return stores;
  }

  /** 填充新增/编辑员工门店下拉 */
  function populateStoreSelect(selectedStore) {
    const select = $("#field-store");
    if (!select || select.tagName !== "SELECT") return;
    const stores = getFormStoreOptions();
    const preferred = canonicalStoreDisplayName(String(selectedStore || "").trim());
    if (preferred && !stores.includes(preferred)) stores.unshift(preferred);
    select.innerHTML =
      '<option value="">请选择门店</option>' +
      stores.map((s) => '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + "</option>").join("");
    select.value = preferred && stores.includes(preferred) ? preferred : "";
  }

  function setFormStoreValue(storeName) {
    populateStoreSelect(storeName || resolveLockedStoreForForm());
  }

  function setFormStoreLocked(storeName) {
    setFormStoreValue(storeName);
  }

  function addDays(date, days) {
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + days);
    return d;
  }

  function formatMdyDate(date) {
    const m = date.getMonth() + 1;
    const day = date.getDate();
    const y = date.getFullYear();
    return `${m}/${day}/${y}`;
  }

  function demoHireDateForSeedIndex(idx) {
    const base = new Date(2019, 2, 15);
    return formatMdyDate(addDays(base, (Number(idx) || 0) * 47));
  }

  function demoSsnForSeedIndex(idx) {
    const n = 1000 + (Number(idx) || 0);
    return `123-45-${String(n).slice(-4)}`;
  }

  function mdyToIsoDateInput(dateStr) {
    const m = String(dateStr || "").trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return "";
    const mm = String(m[1]).padStart(2, "0");
    const dd = String(m[2]).padStart(2, "0");
    return `${m[3]}-${mm}-${dd}`;
  }

  function isoDateInputToMdy(isoStr) {
    const m = String(isoStr || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "";
    return `${Number(m[2])}/${Number(m[3])}/${m[1]}`;
  }

  function normalizeSsnInput(raw) {
    const digits = String(raw || "").replace(/\D/g, "").slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
  }

  function formatSsnDisplay(raw) {
    const s = normalizeSsnInput(raw);
    return s || "—";
  }

  function enrichRosterEntry(entry, idx) {
    if (!entry || typeof entry !== "object") return entry;
    if (!entry.hireDate || String(entry.hireDate).trim() === "") {
      entry.hireDate = demoHireDateForSeedIndex(idx);
    }
    if (!entry.ssn || String(entry.ssn).trim() === "") {
      entry.ssn = demoSsnForSeedIndex(idx);
    }
    if (!entry.payType) entry.payType = "hourly";
    if (entry.payAmount == null || Number.isNaN(Number(entry.payAmount))) {
      entry.payAmount = Number(entry.rate) || 0;
    }
    if (!entry.earliestClockIn) entry.earliestClockIn = "06:00";
    if (entry.requireClockIn == null) entry.requireClockIn = getPrimaryRole(entry.role) !== "Manager";
    if (entry.requireBatchClose == null) entry.requireBatchClose = parseRoleValues(entry.role).some((r) => r === "Cashier");
    if (entry.requireCashTipReport == null) {
      entry.requireCashTipReport = parseRoleValues(entry.role).some((r) => ["Server", "Bartender", "Floor"].includes(r));
    }
    if (!entry.phone && idx % 3 === 0) entry.phone = `(555) ${String(200 + idx).padStart(3, "0")}-${String(1000 + idx).slice(-4)}`;
    if (!entry.email || String(entry.email).trim() === "") {
      const slug = String(entry.name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ".")
        .replace(/^\.+|\.+$/g, "");
      if (slug) entry.email = `${slug}@menusifu.demo`;
    }
    return entry;
  }

  const PAY_TYPE_LABELS = {
    hourly: "时薪",
    weekly: "周薪",
    biweekly: "双周薪",
    monthly: "月薪",
  };

  const BASE_PAY_LABELS = {
    hourly: "基本时薪",
    weekly: "基本周薪",
    biweekly: "基本双周薪",
    monthly: "基本月薪",
  };

  function payTypeLabel(type) {
    return PAY_TYPE_LABELS[type] || PAY_TYPE_LABELS.hourly;
  }

  function updateBasePayLabel() {
    const payType = ($("#field-pay-type") && $("#field-pay-type").value) || "hourly";
    const labelEl = $("#field-rate-label");
    if (labelEl) labelEl.textContent = BASE_PAY_LABELS[payType] || BASE_PAY_LABELS.hourly;
  }

  function maybeSyncOtFromBaseRate() {
    const payType = ($("#field-pay-type") && $("#field-pay-type").value) || "hourly";
    if (payType !== "hourly") return;
    const amount = Number($("#field-rate") && $("#field-rate").value) || 0;
    if (amount > 0 && $("#field-ot-rate") && !$("#field-ot-rate").value) {
      $("#field-ot-rate").value = String(+(amount * 1.5).toFixed(2));
    }
    if (amount > 0 && $("#field-ot2-rate") && !$("#field-ot2-rate").value) {
      $("#field-ot2-rate").value = String(+(amount * 2).toFixed(2));
    }
  }

  function bindPayTypeRateLinkage() {
    $("#field-pay-type")?.addEventListener("change", () => {
      updateBasePayLabel();
      maybeSyncOtFromBaseRate();
    });
    $("#field-rate")?.addEventListener("input", maybeSyncOtFromBaseRate);
  }

  function formatPayAmount(emp) {
    const amount = Number(emp && emp.payAmount != null ? emp.payAmount : emp && emp.rate);
    if (Number.isNaN(amount)) return "—";
    const suffix = emp && emp.payType === "hourly" ? "/hr" : "";
    return `$${amount.toFixed(2)}${suffix}`;
  }

  function boolBadge(on, onLabel, offLabel) {
    const cls = on ? "employee-badge--on" : "employee-badge--off";
    const text = on ? onLabel : offLabel;
    return `<span class="employee-badge ${cls}">${escapeHtml(text)}</span>`;
  }

  function readCheckbox(id, fallback) {
    const el = $(id);
    if (!el) return fallback;
    return !!el.checked;
  }

  function setCheckbox(id, value) {
    const el = $(id);
    if (el) el.checked = !!value;
  }

  function syncPayrollRatesFromPayAmount(payType, payAmount, existing) {
    const amount = Number(payAmount) || 0;
    let rate = Number(existing && existing.rate) || 0;
    let otRate = Number(existing && existing.otRate) || 0;
    let ot2Rate = Number(existing && existing.ot2Rate) || 0;
    if (payType === "hourly" && amount > 0) {
      rate = amount;
      if (!otRate) otRate = +(amount * 1.5).toFixed(2);
      if (!ot2Rate) ot2Rate = +(amount * 2).toFixed(2);
    }
    return { rate, otRate, ot2Rate };
  }

  function resolveTipOutFields(existing) {
    return {
      tipType: (existing && existing.tipType) || "deduct",
      baseTip: existing && existing.baseTip != null ? Number(existing.baseTip) || 0 : 0,
      tipRate: existing && existing.tipRate != null ? Number(existing.tipRate) || 0.15 : 0.15,
    };
  }

  function collectFormPayload(existing) {
    const name = ($("#field-name") && $("#field-name").value.trim()) || "";
    const selectedRoles = getSelectedRoles();
    const role = selectedRoles.length ? formatRoleValues(selectedRoles) : "Server";
    const tipOut = resolveTipOutFields(existing);
    const store = ($("#field-store") && $("#field-store").value.trim()) || DEFAULT_STORE_NAME;
    const department = (existing && existing.department) || "";
    const adpFile = ($("#field-adp") && $("#field-adp").value.trim()) || "";
    const hireDate = isoDateInputToMdy($("#field-hire-date") && $("#field-hire-date").value);
    const ssn = normalizeSsnInput(($("#field-ssn") && $("#field-ssn").value) || "");
    const payType = ($("#field-pay-type") && $("#field-pay-type").value) || "hourly";
    const manualRate = Number($("#field-rate") && $("#field-rate").value) || 0;
    const manualOtRate = Number($("#field-ot-rate") && $("#field-ot-rate").value) || 0;
    const manualOt2Rate = Number($("#field-ot2-rate") && $("#field-ot2-rate").value) || 0;
    const syncedRates = syncPayrollRatesFromPayAmount(payType, manualRate, {
      rate: manualRate || (existing && existing.rate),
      otRate: manualOtRate || (existing && existing.otRate),
      ot2Rate: manualOt2Rate || (existing && existing.ot2Rate),
    });
    const passwordInput = ($("#field-password") && $("#field-password").value) || "";
    const payload = {
      name,
      store,
      role,
      tipType: tipOut.tipType,
      baseTip: tipOut.baseTip,
      tipRate: tipOut.tipRate,
      department,
      adpFile,
      hireDate,
      ssn,
      payType,
      payAmount: manualRate,
      rate: manualRate || syncedRates.rate,
      otRate: manualOtRate || syncedRates.otRate,
      ot2Rate: manualOt2Rate || syncedRates.ot2Rate,
      phone: ($("#field-phone") && $("#field-phone").value.trim()) || "",
      email: ($("#field-email") && $("#field-email").value.trim()) || "",
      phone2: ($("#field-phone2") && $("#field-phone2").value.trim()) || "",
      age: ($("#field-age") && $("#field-age").value) ? Number($("#field-age").value) : undefined,
      notes: ($("#field-notes") && $("#field-notes").value.trim()) || "",
      street: ($("#field-street") && $("#field-street").value.trim()) || "",
      city: ($("#field-city") && $("#field-city").value.trim()) || "",
      state: ($("#field-state") && $("#field-state").value.trim()) || "",
      zip: ($("#field-zip") && $("#field-zip").value.trim()) || "",
      cardSwipeData: ($("#field-card-swipe") && $("#field-card-swipe").value.trim()) || "",
      earliestClockIn: ($("#field-earliest-clock-in") && $("#field-earliest-clock-in").value) || "06:00",
      requireClockIn: readCheckbox("#field-require-clock-in", true),
      requireBatchClose: readCheckbox("#field-require-batch-close", false),
      requireCashTipReport: readCheckbox("#field-require-cash-tip", false),
    };
    if (passwordInput) payload.password = passwordInput;
    else if (existing && existing.password) payload.password = existing.password;
    return payload;
  }

  function fillFormFromEmployee(emp) {
    if (!emp) return;
    if ($("#field-name")) $("#field-name").value = emp.name || "";
    setFormStoreValue(emp.store || resolveLockedStoreForForm());
    if ($("#field-role")) populateRoleSelect(emp.role || "Server");
    if ($("#field-adp")) $("#field-adp").value = emp.adpFile || "";
    if ($("#field-hire-date")) $("#field-hire-date").value = mdyToIsoDateInput(emp.hireDate || "");
    if ($("#field-ssn")) $("#field-ssn").value = normalizeSsnInput(emp.ssn || "");
    if ($("#field-pay-type")) $("#field-pay-type").value = emp.payType || "hourly";
    if ($("#field-rate")) {
      const basePay = emp.rate != null ? emp.rate : emp.payAmount;
      $("#field-rate").value = basePay != null ? String(basePay) : "";
    }
    updateBasePayLabel();
    if ($("#field-ot-rate")) $("#field-ot-rate").value = emp.otRate != null ? String(emp.otRate) : "";
    if ($("#field-ot2-rate")) $("#field-ot2-rate").value = emp.ot2Rate != null ? String(emp.ot2Rate) : "";
    if ($("#field-phone")) $("#field-phone").value = emp.phone || "";
    if ($("#field-email")) $("#field-email").value = emp.email || "";
    if ($("#field-phone2")) $("#field-phone2").value = emp.phone2 || "";
    if ($("#field-age")) $("#field-age").value = emp.age != null ? String(emp.age) : "";
    if ($("#field-notes")) $("#field-notes").value = emp.notes || "";
    if ($("#field-street")) $("#field-street").value = emp.street || "";
    if ($("#field-city")) $("#field-city").value = emp.city || "";
    if ($("#field-state")) $("#field-state").value = emp.state || "";
    if ($("#field-zip")) $("#field-zip").value = emp.zip || "";
    if ($("#field-password")) $("#field-password").value = "";
    if ($("#field-card-swipe")) $("#field-card-swipe").value = emp.cardSwipeData || "";
    if ($("#field-earliest-clock-in")) $("#field-earliest-clock-in").value = emp.earliestClockIn || "06:00";
    setCheckbox("#field-require-clock-in", emp.requireClockIn !== false);
    setCheckbox("#field-require-batch-close", !!emp.requireBatchClose);
    setCheckbox("#field-require-cash-tip", !!emp.requireCashTipReport);
  }

  /** @type {typeof DEFAULT_ROSTER} */
  const DEFAULT_ROSTER = [
    {
      id: "roster-seed-1",
      name: "小飞鸽",
      store: "上海陆家嘴店",
      role: "Floor",
      tipType: "deduct",
      baseTip: 160,
      tipRate: 0.15,
      department: "Floor",
      adpFile: "924",
      rate: 48.07,
      otRate: 72.11,
      ot2Rate: 96.14,
    },
    {
      id: "roster-seed-2",
      name: "Maria Garcia",
      store: "上海陆家嘴店",
      role: "Server",
      tipType: "deduct",
      baseTip: 185,
      tipRate: 0.15,
      department: "Floor",
      adpFile: "101",
      rate: 15.5,
      otRate: 23.25,
      ot2Rate: 31,
    },
    {
      id: "roster-seed-3",
      name: "Jason Chen",
      store: "广州天河店",
      role: "Server",
      tipType: "deduct",
      baseTip: 168,
      tipRate: 0.15,
      department: "Floor",
      adpFile: "102",
      rate: 16.2,
      otRate: 24.3,
      ot2Rate: 32.4,
    },
    {
      id: "roster-seed-4",
      name: "Emily Watson",
      store: "广州天河店",
      role: "Server",
      tipType: "deduct",
      baseTip: 155,
      tipRate: 0.15,
      department: "Floor",
      adpFile: "103",
      rate: 15.8,
      otRate: 23.7,
      ot2Rate: 31.6,
    },
    {
      id: "roster-seed-5",
      name: "Mike Johnson",
      store: "上海陆家嘴店",
      role: "Bartender",
      tipType: "deduct",
      baseTip: 156,
      tipRate: 0.15,
      department: "Bar",
      adpFile: "104",
      rate: 18.5,
      otRate: 27.75,
      ot2Rate: 37,
    },
    {
      id: "roster-seed-6",
      name: "Tom Wilson",
      store: "广州天河店",
      role: "Kitchen",
      tipType: "receive",
      baseTip: 0,
      tipRate: 0,
      department: "Kitchen",
      adpFile: "105",
      rate: 22.5,
      otRate: 33.75,
      ot2Rate: 45,
    },
    {
      id: "roster-seed-7",
      name: "Carlos Lopez",
      store: "Lone Star BBQ House - Austin, TX 78701",
      role: "Busser",
      tipType: "receive",
      baseTip: 0,
      tipRate: 0,
      department: "Floor",
      adpFile: "106",
      rate: 14.2,
      otRate: 21.3,
      ot2Rate: 28.4,
    },
    {
      id: "roster-seed-8",
      name: "Linda Nguyen",
      store: "Lone Star BBQ House - Austin, TX 78701",
      role: "Cashier",
      tipType: "deduct",
      baseTip: 45,
      tipRate: 0.15,
      department: "Front",
      adpFile: "107",
      rate: 17.1,
      otRate: 25.65,
      ot2Rate: 34.2,
    },
    {
      id: "roster-seed-9",
      name: "Daniel Ortiz",
      store: "Pacific Bowl & Grill - San Diego, CA 92101",
      role: "Runner",
      tipType: "receive",
      baseTip: 0,
      tipRate: 0,
      department: "Floor",
      adpFile: "108",
      rate: 15.1,
      otRate: 22.65,
      ot2Rate: 30.2,
    },
    {
      id: "roster-seed-10",
      name: "Rachel Scott",
      store: "Pacific Bowl & Grill - San Diego, CA 92101",
      role: "Host",
      tipType: "receive",
      baseTip: 0,
      tipRate: 0,
      department: "Front",
      adpFile: "109",
      rate: 16.4,
      otRate: 24.6,
      ot2Rate: 32.8,
    },
  ];

  /** 员工报表演示花名册（与 admin-web team-employee-roster.ts 对齐） */
  const REPORTS_ROSTER_SEEDS = [
    { id: "rpt-emp-aiym", name: "aiym aitaza", store: "Nai Cha", role: "Cashier", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Front", adpFile: "201", rate: 15, otRate: 22.5, ot2Rate: 30 },
    { id: "rpt-emp-alice", name: "alice wang", store: "Nai Cha", role: "Cashier", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Front", adpFile: "202", rate: 15, otRate: 22.5, ot2Rate: 30 },
    { id: "rpt-emp-kai", name: "kai zheng", store: "Nai Cha", role: "Cashier", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Front", adpFile: "203", rate: 14.5, otRate: 21.75, ot2Rate: 29 },
    { id: "rpt-emp-lu", name: "lu yang", store: "Nai Cha", role: "Cashier", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Front", adpFile: "204", rate: 15, otRate: 22.5, ot2Rate: 30 },
    { id: "rpt-emp-online", name: "online", store: "Nai Cha", role: "Online", tipType: "receive", baseTip: 0, tipRate: 0, department: "Online", adpFile: "", rate: 0, otRate: 0, ot2Rate: 0 },
    { id: "rpt-emp-rui", name: "rui song", store: "Nai Cha", role: "Cashier", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Front", adpFile: "205", rate: 15, otRate: 22.5, ot2Rate: 30 },
    { id: "rpt-emp-zemou", name: "zemou huang", store: "Nai Cha", role: "Server", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Floor", adpFile: "206", rate: 12, otRate: 18, ot2Rate: 24 },
    { id: "rpt-emp-lucy", name: "lucy boss yang", store: "Nai Cha", role: "Manager", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Management", adpFile: "207", rate: 22, otRate: 33, ot2Rate: 44 },
    { id: "rpt-emp-anthony", name: "anthony liu", store: "Nai Cha", role: "Cashier", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Front", adpFile: "208", rate: 15, otRate: 22.5, ot2Rate: 30 },
    { id: "rpt-emp-cash-in-out", name: "cash in/out", store: "Nai Cha", role: "Manager", tipType: "receive", baseTip: 0, tipRate: 0, department: "Management", adpFile: "", rate: 0, otRate: 0, ot2Rate: 0 },
    { id: "rpt-emp-copilot", name: "copilot", store: "Nai Cha", role: "", tipType: "receive", baseTip: 0, tipRate: 0, department: "", adpFile: "", rate: 0, otRate: 0, ot2Rate: 0 },
    { id: "rpt-emp-doordash", name: "doordash", store: "Nai Cha", role: "", tipType: "receive", baseTip: 0, tipRate: 0, department: "Online", adpFile: "", rate: 0, otRate: 0, ot2Rate: 0 },
    { id: "rpt-emp-dd-delivery", name: "doordash_d_delivery", store: "Nai Cha", role: "Online", tipType: "receive", baseTip: 0, tipRate: 0, department: "Online", adpFile: "", rate: 0, otRate: 0, ot2Rate: 0 },
    { id: "rpt-emp-maria", name: "Maria Garcia", store: "Downtown Branch", role: "Server", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Floor", adpFile: "301", rate: 13, otRate: 19.5, ot2Rate: 26 },
    { id: "rpt-emp-jason", name: "Jason Chen", store: "Nai Cha", role: "Kitchen", tipType: "receive", baseTip: 0, tipRate: 0, department: "Kitchen", adpFile: "209", rate: 18, otRate: 27, ot2Rate: 36 },
    { id: "rpt-emp-mike", name: "Mike Johnson", store: "Downtown Branch", role: "Bartender", tipType: "deduct", baseTip: 0, tipRate: 0.15, department: "Bar", adpFile: "302", rate: 18.5, otRate: 27.75, ot2Rate: 37 },
    { id: "rpt-emp-tom", name: "Tom Wilson", store: "Airport Kiosk", role: "Kitchen", tipType: "receive", baseTip: 0, tipRate: 0, department: "Kitchen", adpFile: "401", rate: 20, otRate: 30, ot2Rate: 40 },
  ];

  function $(sel) {
    return document.querySelector(sel);
  }

  function getTipOutStores() {
    const rules = window.ruleData && typeof ruleData.getRules === "function" ? ruleData.getRules() : [];
    const seen = {};
    const stores = [];
    const push = (name) => {
      const raw = String(name || "").trim();
      if (!raw || isSuppressedStoreAlias(raw)) return;
      const t = canonicalStoreDisplayName(raw);
      if (!t || seen[t]) return;
      seen[t] = 1;
      stores.push(t);
    };
    rules.forEach((r) => push(r && r.store));
    EXTRA_STORES.forEach(push);
    push(DEFAULT_STORE_NAME);
    return stores;
  }
  function loadRoster() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_ROSTER);
      const parsed = JSON.parse(raw);
      const list = Array.isArray(parsed) && parsed.length ? parsed : structuredClone(DEFAULT_ROSTER);
      let changed = false;
      const idSet = new Set(list.map((e) => String((e && e.id) || "")));
      DEFAULT_ROSTER.forEach((seed) => {
        if (!idSet.has(seed.id)) {
          list.push(structuredClone(seed));
          changed = true;
        }
      });
      REPORTS_ROSTER_SEEDS.forEach((seed) => {
        if (!idSet.has(seed.id)) {
          list.push(structuredClone(seed));
          idSet.add(seed.id);
          changed = true;
        }
      });
      list.forEach((e, idx) => {
        if (!e.store || String(e.store).trim() === "") {
          e.store = DEFAULT_STORE_NAME;
          changed = true;
        }
        const beforeHire = e.hireDate;
        const beforeSsn = e.ssn;
        enrichRosterEntry(e, idx);
        if (beforeHire !== e.hireDate || beforeSsn !== e.ssn) changed = true;
      });
      if (changed) saveRoster(list);
      return list;
    } catch {
      return structuredClone(DEFAULT_ROSTER);
    }
  }

  function saveRoster(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("tipout-roster-updated"));
  }

  function renderTable() {
    const tbody = $("#employeesTableBody");
    if (!tbody) return;
    syncEmployeesStoreFilterUi();
    const fullList = loadRoster();
    const inPagePicker = shouldShowEmployeesStoreFilter();
    const scoped = resolveEmployeesListFilterScope();
    if (inPagePicker && scoped.isAllStores) {
      tbody.innerHTML =
        '<tr><td colspan="12" style="padding:48px;text-align:center;color:var(--text-tertiary)">请先在上方选择门店，再查看与管理该店员工。</td></tr>';
      return;
    }
    const list = filterListByGlobalScope(fullList, scoped);
    if (fullList.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="12" style="padding:48px;text-align:center;color:var(--text-tertiary)">暂无员工，请点击「新增员工」添加</td></tr>';
      return;
    }
    if (list.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="12" style="padding:48px;text-align:center;color:var(--text-tertiary)">当前门店筛选下暂无员工数据，请切换门店或新增员工。</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map((e) => {
        const adp = e.adpFile != null && String(e.adpFile).trim() !== "" ? escapeHtml(String(e.adpFile)) : "—";
        const hireDate = e.hireDate && String(e.hireDate).trim() !== "" ? escapeHtml(String(e.hireDate)) : "—";
        const phone = e.phone && String(e.phone).trim() !== "" ? escapeHtml(String(e.phone)) : "—";
        const storeLabel = canonicalStoreDisplayName(e.store || DEFAULT_STORE_NAME);
        return '<tr data-id="' + escapeHtml(e.id) + '">' +
          '<td><strong>' + escapeHtml(e.name) + '</strong></td>' +
          '<td>' + escapeHtml(storeLabel) + '</td>' +
          '<td>' + escapeHtml(e.role || "—") + '</td>' +
          '<td>' + phone + '</td>' +
          '<td>' + hireDate + '</td>' +
          '<td>' + escapeHtml(payTypeLabel(e.payType)) + '</td>' +
          '<td style="text-align:right">' + escapeHtml(formatPayAmount(e)) + '</td>' +
          '<td>' + boolBadge(e.requireClockIn !== false, "是", "否") + '</td>' +
          '<td>' + boolBadge(!!e.requireBatchClose, "是", "否") + '</td>' +
          '<td>' + boolBadge(!!e.requireCashTipReport, "是", "否") + '</td>' +
          '<td style="font-family:ui-monospace,Menlo,monospace">' + adp + '</td>' +
          '<td class="action-links" style="text-align:right;white-space:nowrap">' +
            '<a href="javascript:void(0)" data-act="edit">编辑</a>' +
            '<span style="color:var(--text-tertiary);margin:0 4px">|</span>' +
            '<a href="javascript:void(0)" data-act="del">删除</a>' +
          '</td>' +
        '</tr>';
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function fmtNum(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return "—";
    return String(x);
  }

  function fmtPct(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return "—";
    return (x * 100).toFixed(0) + "%";
  }

  function fmtMoney(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return "—";
    return x.toFixed(2);
  }

  function openAddModal() {
    openEmployeeModal(null);
  }

  function openEmployeeModal(id) {
    editingEmployeeId = id || null;
    const titleEl = $("#employee-modal-title");
    const submitBtn = $("#btn-submit-employee");
    if (titleEl) titleEl.textContent = editingEmployeeId ? "编辑员工" : "新增员工";
    if (submitBtn) submitBtn.textContent = editingEmployeeId ? "保存" : "保存";

    const f = $("#form-add-employee");
    if (f) f.reset();

    hideRoleAddModal();
    closeRoleMultiSelect();

    if (editingEmployeeId) {
      const emp = loadRoster().find((e) => e.id === editingEmployeeId);
      populateRoleSelect(emp && emp.role ? emp.role : "Server");
      fillFormFromEmployee(emp);
    } else {
      setFormStoreValue(resolveLockedStoreForForm());
      populateRoleSelect("Server");
      setCheckbox("#field-require-clock-in", true);
      setCheckbox("#field-require-batch-close", false);
      setCheckbox("#field-require-cash-tip", false);
      if ($("#field-earliest-clock-in")) $("#field-earliest-clock-in").value = "06:00";
      if ($("#field-pay-type")) $("#field-pay-type").value = "hourly";
      updateBasePayLabel();
    }

    if (typeof openModal === "function") openModal("addEmployeeModal");
  }

  function submitAdd() {
    const name = ($("#field-name") && $("#field-name").value.trim()) || "";
    if (!name) {
      if (typeof showNotification === "function") showNotification("请填写姓名", "error");
      else alert("请填写姓名");
      return;
    }
    const store = ($("#field-store") && $("#field-store").value.trim()) || "";
    if (!store) {
      if (typeof showNotification === "function") showNotification("请选择门店", "error");
      else alert("请选择门店");
      $("#field-store")?.focus();
      return;
    }

    const list = loadRoster();
    const existing = editingEmployeeId ? list.find((e) => e.id === editingEmployeeId) : null;
    const payload = collectFormPayload(existing);
    const wasEdit = !!editingEmployeeId;

    if (editingEmployeeId) {
      const idx = list.findIndex((e) => e.id === editingEmployeeId);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...payload };
      }
    } else {
      const id = `roster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      list.push({ id, ...payload });
    }

    editingEmployeeId = null;
    saveRoster(list);
    renderTable();
    if (typeof closeModal === "function") closeModal("addEmployeeModal");
    if (typeof showNotification === "function") showNotification(wasEdit ? "已更新员工" : "已添加员工");
    else alert(wasEdit ? "已更新员工" : "已添加员工");
  }

  function closeEmployeeDeleteConfirm() {
    pendingDeleteRow = null;
    if (typeof closeModal === "function") closeModal("employeeDeleteConfirmModal");
  }

  function openEmployeeDeleteConfirm(tr) {
    const id = tr.getAttribute("data-id");
    if (!id) return;
    const emp = loadRoster().find((e) => e.id === id);
    pendingDeleteRow = tr;
    const nameEl = $("#employee-delete-confirm-name");
    if (nameEl) {
      const name = emp && emp.name ? String(emp.name).trim() : "";
      nameEl.textContent = name ? `员工：${name}` : "";
      nameEl.style.display = name ? "block" : "none";
    }
    if (typeof openModal === "function") openModal("employeeDeleteConfirmModal");
  }

  function confirmEmployeeDelete() {
    if (!pendingDeleteRow) return;
    deleteByRow(pendingDeleteRow);
    closeEmployeeDeleteConfirm();
  }

  function bindEmployeeDeleteConfirm() {
    $("#btn-employee-delete-confirm")?.addEventListener("click", confirmEmployeeDelete);
    $("#btn-employee-delete-cancel")?.addEventListener("click", closeEmployeeDeleteConfirm);
    $("#btn-employee-delete-close")?.addEventListener("click", closeEmployeeDeleteConfirm);
    const overlay = $("#employeeDeleteConfirmModal");
    overlay?.addEventListener("click", (e) => {
      if (e.target === overlay) closeEmployeeDeleteConfirm();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (overlay && overlay.classList.contains("show")) closeEmployeeDeleteConfirm();
    });
  }

  function deleteByRow(tr) {
    const id = tr.getAttribute("data-id");
    if (!id) return;
    const list = loadRoster().filter((e) => e.id !== id);
    saveRoster(list);
    renderTable();
    if (typeof showNotification === "function") showNotification("已删除");
  }

  document.body.addEventListener("click", (e) => {
    const edit = e.target.closest("[data-act=edit]");
    if (edit) {
      e.preventDefault();
      const tr = edit.closest("tr");
      const id = tr && tr.getAttribute("data-id");
      if (id) openEmployeeModal(id);
      return;
    }
    const del = e.target.closest("[data-act=del]");
    if (del) {
      e.preventDefault();
      const tr = del.closest("tr");
      if (tr) openEmployeeDeleteConfirm(tr);
    }
  });

  $("#field-ssn")?.addEventListener("input", (e) => {
    const input = e.target;
    const next = normalizeSsnInput(input.value);
    if (input.value !== next) input.value = next;
  });

  bindPayTypeRateLinkage();
  bindRoleQuickAdd();
  bindRoleMultiSelect();
  updateBasePayLabel();

  $("#btn-add-employee")?.addEventListener("click", openAddModal);
  $("#btn-submit-employee")?.addEventListener("click", submitAdd);

  bindEmployeesStoreFilter();
  syncEmployeesStoreFilterUi();

  if (window.TipOutGlobalScopeFilter && typeof TipOutGlobalScopeFilter.bindGlobalScopeFilterListener === "function") {
    TipOutGlobalScopeFilter.bindGlobalScopeFilterListener(() => {
      renderTable();
    });
  }

  window.addEventListener("tipout-roster-updated", () => {
    renderTable();
  });
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) renderTable();
  });

  bindEmployeeDeleteConfirm();
  const addEmployeeModal = $("#addEmployeeModal");
  if (addEmployeeModal && addEmployeeModal.dataset.roleDropdownLifecycleBound !== "1") {
    addEmployeeModal.dataset.roleDropdownLifecycleBound = "1";
    addEmployeeModal.addEventListener("click", (e) => {
      if (e.target === addEmployeeModal) closeRoleMultiSelect();
    });
    const modalObserver = new MutationObserver(() => {
      if (!addEmployeeModal.classList.contains("show")) closeRoleMultiSelect();
    });
    modalObserver.observe(addEmployeeModal, { attributes: true, attributeFilter: ["class"] });
  }
  renderTable();
})();
