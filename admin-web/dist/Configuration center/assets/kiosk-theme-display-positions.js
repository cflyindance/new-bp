/* Original screensaver flow: position selections are scoped to one theme. */
(function(root) {
  'use strict';
  var key = 'selected_display_positions_for_distribute';
  var options = [{ value: 'screensaver', label: '屏保' }, { value: 'home', label: '首页' }];
  function registered(code) {try{return !!root.KioskAdSlots && root.KioskAdSlots.readCatalog(root.localStorage).some(function(s){return s.code===code;});}catch(e){return false;}}
  function normalize(value) {
    if (!Array.isArray(value)) return [];
    var values = value.filter(function(v){return typeof v === 'string' && /^[a-z][a-z0-9._-]{0,63}$/.test(v) && (options.some(function(o){return o.value===v;}) || registered(v));});
    return options.map(function(o){return o.value;}).filter(function(v){return values.indexOf(v)>=0;}).concat(values.filter(function(v,i){return options.every(function(o){return o.value!==v;})&&values.indexOf(v)===i;}).sort());
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
    return savedForTheme(theme);
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
  function mediaSpec(position, role) {
    var home = position === 'home';
    if (role === 'portrait') return home ? {width:1080,height:1250,ratio:'108∶125',box:'w-[7.5rem] aspect-[108/125]'} : {width:1080,height:1920,ratio:'9∶16',box:'w-[5.625rem] aspect-[9/16]'};
    return home ? {width:1440,height:1080,ratio:'4∶3',box:'w-[10rem] aspect-[4/3]'} : {width:1920,height:1080,ratio:'16∶9',box:'w-[10rem] aspect-video'};
  }
  root.KioskThemePositions = { mediaSpec: mediaSpec, options: options, normalize: normalize, read: read, write: write, clear: clear, savedForTheme: savedForTheme };
})(window);
