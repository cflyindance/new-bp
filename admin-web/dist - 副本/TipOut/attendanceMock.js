/**
 * TipOut 演示考勤 — 按员工+日期确定性生成工时与打卡状态（只读展示用）
 */
(function (global) {
  'use strict';

  var HOURS_OPTIONS = [7.5, 8, 8.25];

  function hashSeed(empName, dateKey) {
    var s = String(empName || '') + '|' + String(dateKey || '');
    var h = 0;
    for (var i = 0; i < s.length; i++) {
      h = ((h * 31) + s.charCodeAt(i)) | 0;
    }
    return Math.abs(h);
  }

  /**
   * @param {string} empName
   * @param {string} dateKey YYYY-MM-DD
   * @returns {{ hours: number, clockStatus: '已打卡' | '未打卡' }}
   */
  function getDayStatus(empName, dateKey) {
    var seed = hashSeed(empName, dateKey);
    // 约 1/5 天未打卡
    if (seed % 5 === 0) {
      return { hours: 0, clockStatus: '未打卡' };
    }
    return {
      hours: HOURS_OPTIONS[seed % HOURS_OPTIONS.length],
      clockStatus: '已打卡'
    };
  }

  global.TipOutAttendance = {
    getDayStatus: getDayStatus
  };
})(typeof window !== 'undefined' ? window : this);
