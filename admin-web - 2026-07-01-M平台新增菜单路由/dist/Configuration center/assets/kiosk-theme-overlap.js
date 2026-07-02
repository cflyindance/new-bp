/**
 * 与 effective-time / kiosk-theme-list 一致：门店×渠道 + 生效时间段 vs 已上架且「已生效」主题。
 * 供屏保新建/编辑保存前提示使用。
 */
(function(global) {
  'use strict';

  /** 将 effectTime 拆成「开始 / 结束」两段，兼容 ` - `、单横杠、全角横杠等 */
  function splitEffectTimeRangeString(et) {
    var s = String(et).trim();
    var ix = s.indexOf(' - ');
    if (ix >= 0) return [s.slice(0, ix).trim(), s.slice(ix + 3).trim()];
    var m = s.match(/^(.+?)\s[-–—]\s(.+)$/);
    if (m) return [m[1].trim(), m[2].trim()];
    var parts = s.split(/\s+-\s+/);
    if (parts.length === 2) return [parts[0].trim(), parts[1].trim()];
    return null;
  }

  function parseStoredThemeEffectRange(theme) {
    var et = theme && theme.effectTime;
    if (!et || et === '--') return null;
    if (et === '立即生效') {
      var dist = theme.distributeTime;
      if (dist && dist !== '--') {
        var d = new Date(String(dist).replace(/\//g, '-'));
        if (!isNaN(d.getTime())) return { start: d.getTime(), end: Infinity };
      }
      return { start: Date.now(), end: Infinity };
    }
    var parts = splitEffectTimeRangeString(et);
    if (!parts) return null;
    var start = new Date(parts[0].replace(/\//g, '-'));
    var end = new Date(parts[1].replace(/\//g, '-'));
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return { start: start.getTime(), end: end.getTime() };
  }

  function rangesOverlap(a, b) {
    if (!a || !b) return false;
    return a.start < b.end && b.start < a.end;
  }

  function getThemeStoreChannelPairs(theme) {
    var pairs = [];
    var seen = {};
    var stores = theme && theme.distributedStores ? theme.distributedStores : [];
    stores.forEach(function(store) {
      var mid = store && store.mid != null ? String(store.mid) : '';
      var arr = store && Array.isArray(store.channelStatuses) ? store.channelStatuses : [];
      arr.forEach(function(cs) {
        var ch = cs && cs.channel != null ? String(cs.channel) : '';
        if (!mid || !ch) return;
        var key = mid + '\x1e' + ch;
        if (seen[key]) return;
        seen[key] = true;
        pairs.push({ mid: mid, channel: ch });
      });
    });
    return pairs;
  }

  function hasStoreChannelPair(theme, mid, channel) {
    var m = String(mid);
    var c = String(channel);
    var stores = theme && theme.distributedStores ? theme.distributedStores : [];
    for (var i = 0; i < stores.length; i++) {
      var st = stores[i];
      if (String(st.mid) !== m) continue;
      var arr = st.channelStatuses || [];
      for (var j = 0; j < arr.length; j++) {
        if (String(arr[j].channel || '') === c) return true;
      }
    }
    return false;
  }

  function computeEffectStatus(effectTime) {
    if (!effectTime || effectTime === '--') return null;
    var now = new Date();
    if (effectTime === '立即生效') return { text: '已生效' };
    var parts = splitEffectTimeRangeString(effectTime);
    if (!parts) return null;
    var startDt = new Date(parts[0].replace(/\//g, '-'));
    var endDt = new Date(parts[1].replace(/\//g, '-'));
    if (isNaN(startDt.getTime()) || isNaN(endDt.getTime())) return null;
    if (now < startDt) return { text: '待生效' };
    if (now > endDt) return { text: '已失效' };
    return { text: '已生效' };
  }

  /** localStorage 门店/渠道 + 草稿上的生效时间与门店（与 effective-time buildOverlapCandidateTheme 对齐） */
  function buildOverlapCandidateFromDraft(themeId, baseTheme) {
    if (!themeId) return null;
    var selectedStores = [];
    var selectedChannels = [];
    try { selectedStores = JSON.parse(localStorage.getItem('selected_stores_for_distribute') || '[]'); } catch (e) {}
    try { selectedChannels = JSON.parse(localStorage.getItem('selected_channels_for_distribute') || '[]'); } catch (e2) {}
    var channelsForStores = (Array.isArray(selectedChannels) && selectedChannels.length) ? selectedChannels : ['Kiosk'];

    function effectTimeFromPrefs(p) {
      if (!p || !p.startDate || !p.startTime || !p.endDate || !p.endTime) return null;
      return String(p.startDate).replace(/-/g, '/') + ' ' + p.startTime + ' - ' +
        String(p.endDate).replace(/-/g, '/') + ' ' + p.endTime;
    }

    var effectTime = '--';
    if (baseTheme) {
      if (baseTheme.effectTime && baseTheme.effectTime !== '' && baseTheme.effectTime !== '--') {
        effectTime = baseTheme.effectTime;
      }
      if (effectTime === '--' || !parseStoredThemeEffectRange({ effectTime: effectTime, distributeTime: baseTheme.distributeTime })) {
        if (baseTheme.lastDistributePrefs) {
          var fromPrefs = effectTimeFromPrefs(baseTheme.lastDistributePrefs);
          if (fromPrefs) effectTime = fromPrefs;
        }
      }
    }

    var distributedStores;
    if (Array.isArray(selectedStores) && selectedStores.length) {
      distributedStores = selectedStores.map(function(store) {
        return {
          name: store.name,
          mid: store.mid,
          channelStatuses: channelsForStores.map(function(chName) {
            return { channel: chName };
          })
        };
      });
    } else if (baseTheme && baseTheme.distributedStores && baseTheme.distributedStores.length) {
      distributedStores = baseTheme.distributedStores;
    } else {
      distributedStores = [];
    }

    return {
      id: themeId,
      name: baseTheme && baseTheme.name ? baseTheme.name : '',
      effectTime: effectTime,
      distributeTime: baseTheme && baseTheme.distributeTime,
      distributedStores: distributedStores,
      distributeChannels: Array.isArray(selectedChannels) ? selectedChannels : [],
      publishStatus: baseTheme && baseTheme.publishStatus
    };
  }

  function findActivePublishedOverlaps(themeId, baseTheme) {
    var candidate = buildOverlapCandidateFromDraft(themeId, baseTheme);
    if (!candidate) return { conflicts: [], candidate: null };
    var myRange = parseStoredThemeEffectRange(candidate);
    if (!myRange) return { conflicts: [], candidate: candidate };
    var myPairs = getThemeStoreChannelPairs(candidate);
    if (!myPairs.length) return { conflicts: [], candidate: candidate };

    var themes = [];
    try { themes = JSON.parse(localStorage.getItem('kiosk_themes') || '[]'); } catch (e) {
      return { conflicts: [], candidate: candidate };
    }
    var conflicts = [];
    var seen = {};
    for (var i = 0; i < themes.length; i++) {
      var other = themes[i];
      if (!other || other.id === candidate.id) continue;
      if (other.publishStatus !== 'published') continue;
      var eff = computeEffectStatus(other.effectTime);
      if (!eff || eff.text !== '已生效') continue;
      var otherRange = parseStoredThemeEffectRange(other);
      if (!otherRange) continue;
      if (!rangesOverlap(myRange, otherRange)) continue;
      var tname = other.name ? String(other.name) : '未命名主题';
      for (var p = 0; p < myPairs.length; p++) {
        var pair = myPairs[p];
        if (!hasStoreChannelPair(other, pair.mid, pair.channel)) continue;
        var key = String(other.id) + '\x1e' + pair.mid + '\x1e' + pair.channel;
        if (seen[key]) continue;
        seen[key] = true;
        conflicts.push({
          themeId: other.id,
          themeName: tname,
          effectTime: other.effectTime,
          distributeTime: other.distributeTime,
          mid: pair.mid,
          channel: pair.channel
        });
      }
    }
    return { conflicts: conflicts, candidate: candidate };
  }

  /** 保存前重叠确认弹窗：首段说明 + 冲突的已生效主题名称与生效时间（按主题去重） */
  function formatOverlapSaveConfirmText(conflicts) {
    var head = '在相同门店、相同渠道下,当前主题与已生效主题存在生效时间重叠。';
    if (!conflicts || !conflicts.length) return head;

    function timeLine(r) {
      var et = r.effectTime;
      if (!et || et === '--') return '生效时间：—';
      if (et === '立即生效') {
        if (r.distributeTime && r.distributeTime !== '--') {
          return '生效时间：立即生效（记录时间 ' + r.distributeTime + '）';
        }
        return '生效时间：立即生效';
      }
      return '生效时间：' + et;
    }

    var byTheme = {};
    conflicts.forEach(function(c) {
      var id = c.themeId != null ? String(c.themeId) : '';
      var key = id || (String(c.themeName || '') + '\x1e' + String(c.effectTime || ''));
      if (byTheme[key]) return;
      byTheme[key] = {
        themeName: c.themeName || '未命名主题',
        effectTime: c.effectTime,
        distributeTime: c.distributeTime
      };
    });
    var lines = [head, '', '冲突的已生效主题：'];
    var keys = Object.keys(byTheme).sort(function(a, b) {
      return String(byTheme[a].themeName).localeCompare(String(byTheme[b].themeName), 'zh-CN');
    });
    keys.forEach(function(k) {
      var row = byTheme[k];
      lines.push('·「' + row.themeName + '」');
      lines.push('  ' + timeLine(row));
    });
    return lines.join('\n');
  }

  global.KioskThemeOverlap = {
    findActivePublishedOverlaps: findActivePublishedOverlaps,
    parseStoredThemeEffectRange: parseStoredThemeEffectRange,
    formatOverlapSaveConfirmText: formatOverlapSaveConfirmText,
    CONFIRM_MESSAGE: '在相同门店、相同渠道下,当前主题与已生效主题存在生效时间重叠。'
  };
})(typeof window !== 'undefined' ? window : this);
