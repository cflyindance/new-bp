/* Original screensaver flow: position selections are scoped to one theme. */
(function(root) {
  'use strict';
  var key = 'selected_display_positions_for_distribute';
  var options = [{ value: 'screensaver', label: '屏保' }, { value: 'home', label: '首页' }];
  function normalize(value) {
    return options.map(function(option) { return option.value; }).filter(function(valueKey) {
      return Array.isArray(value) && value.indexOf(valueKey) >= 0;
    });
  }
  function themeId() {
    try { return root.localStorage.getItem('current_theme_id_for_distribute') || ''; } catch (e) { return ''; }
  }
  function read() {
    var id = themeId();
    var draft;
    try { draft = JSON.parse(root.localStorage.getItem(key) || 'null'); } catch (e) {}
    if (draft && draft.themeId === id && Array.isArray(draft.positions)) return normalize(draft.positions);
    var themes;
    try { themes = JSON.parse(root.localStorage.getItem('kiosk_themes') || '[]'); } catch (e) {}
    var theme = Array.isArray(themes) && themes.filter(function(item) { return item.id === id; })[0];
    if (!theme) return [];
    var saved = theme.lastDistributePrefs && theme.lastDistributePrefs.positions;
    return normalize(Array.isArray(saved) ? saved : theme.distributePositions);
  }
  function write(values) {
    root.localStorage.setItem(key, JSON.stringify({ themeId: themeId(), positions: normalize(values) }));
  }
  function clear() { root.localStorage.removeItem(key); }
  // Cards reflect saved activity configuration, never another editing session.
  function savedForTheme(theme) {
    if (!theme || typeof theme !== 'object') return [];
    if (Object.prototype.hasOwnProperty.call(theme, 'distributePositions')) return normalize(theme.distributePositions);
    var prefs = theme.lastDistributePrefs;
    return normalize(prefs && prefs.positions);
  }
  root.KioskThemePositions = { options: options, normalize: normalize, read: read, write: write, clear: clear, savedForTheme: savedForTheme };
})(window);
