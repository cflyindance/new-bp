(function (root) {
  var EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY = 'tipout-employee-reconciliation-detail-v1';

  function number(value) { return Number(value) || 0; }
  function summarizeDailyResults(records) {
    return (records || []).reduce(function (sum, item) {
      sum.before += number(item.before);
      sum.deducted += number(item.deducted);
      sum.received += number(item.received);
      sum.after += number(item.after);
      return sum;
    }, { before: 0, deducted: 0, received: 0, after: 0 });
  }
  function countPendingDates(dateKeys, allocatedDateKeys) {
    var allocated = new Set(allocatedDateKeys || []);
    return (dateKeys || []).reduce(function (count, dateKey) {
      return count + (allocated.has(dateKey) ? 0 : 1);
    }, 0);
  }
  function buildDetailUrl(context) {
    var query = ['date=' + encodeURIComponent(context.date || '')];
    if (context.store) query.push('store=' + encodeURIComponent(context.store));
    if (context.fromSummary) {
      query.push('from=summary');
      query.push('return=history');
    }
    return 'detail.html?' + query.join('&');
  }
  function buildSummaryHistoryState(values) {
    return { tipoutSummaryUiState: {
      dateStart: values.dateStart || '', dateEnd: values.dateEnd || '',
      store: values.store || '', roles: (values.roles || []).slice(),
      employees: (values.employees || []).slice(), scrollY: Number(values.scrollY) || 0,
      returnDate: values.returnDate || '',
      returnEmployeeId: values.returnEmployeeId || '',
      activeView: values.activeView === 'employee' ? 'employee' : 'date'
    } };
  }
  function readSummaryHistoryState(state) {
    return state && state.tipoutSummaryUiState ? state.tipoutSummaryUiState : null;
  }

  function isParticipatingEmployeeRecord(record) {
    return ['before', 'deducted', 'received', 'after'].some(function (key) {
      return number(record && record[key]) !== 0;
    }) || number(record && record.hours) > 0;
  }

  function resolveRequiresAttendance(rules) {
    if (!Array.isArray(rules) || rules.length === 0) return true;
    return rules.some(function (rule) { return !rule || rule.clockin !== 'noclock'; });
  }

  function aggregateEmployeeDailyDatasets(dailyRows) {
    var order = [];
    var byId = Object.create(null);
    (dailyRows || []).forEach(function (day) {
      (day.employeeResults || []).forEach(function (record) {
        if (!record || !record.employeeId || !isParticipatingEmployeeRecord(record)) return;
        var employeeId = String(record.employeeId);
        if (!byId[employeeId]) {
          byId[employeeId] = {
            employeeId: employeeId,
            name: record.name || '',
            role: record.role || '',
            shifts: 0,
            hours: 0,
            before: 0,
            deducted: 0,
            received: 0,
            after: 0,
            status: '已完成',
            missingAttendanceDays: 0,
            pendingAllocationDays: 0,
            dailyRows: []
          };
          order.push(employeeId);
        }
        var aggregate = byId[employeeId];
        var daily = Object.assign({
          dateKey: day.dateKey || '',
          allocated: !!day.allocated,
          requiresAttendance: day.requiresAttendance !== false
        }, record);
        aggregate.dailyRows.push(daily);
        aggregate.shifts += number(record.hours) > 0 ? 1 : 0;
        aggregate.hours += number(record.hours);
        aggregate.before += number(record.before);
        aggregate.deducted += number(record.deducted);
        aggregate.received += number(record.received);
        aggregate.after += number(record.after);
        if (!day.allocated) aggregate.pendingAllocationDays += 1;
        if (day.requiresAttendance !== false && record.clockStatus === '未打卡') {
          aggregate.missingAttendanceDays += 1;
        }
      });
    });
    return order.map(function (employeeId) {
      var aggregate = byId[employeeId];
      aggregate.status = aggregate.pendingAllocationDays || aggregate.missingAttendanceDays ? '待补录' : '已完成';
      return aggregate;
    });
  }

  function resolveSummaryView(historyState, queryView) {
    var saved = readSummaryHistoryState(historyState);
    if (saved) return saved.activeView === 'employee' ? 'employee' : 'date';
    return queryView === 'employee' ? 'employee' : 'date';
  }

  function buildEmployeeReconciliationDetailUrl(context) {
    var query = [
      'employeeId=' + encodeURIComponent(context.employeeId || ''),
      'store=' + encodeURIComponent(context.store || ''),
      'start=' + encodeURIComponent(context.dateStart || ''),
      'end=' + encodeURIComponent(context.dateEnd || ''),
      'from=summary',
      'return=history'
    ];
    return 'employee-reconciliation-detail.html?' + query.join('&');
  }

  function buildEmployeeReconciliationSnapshot(values) {
    return {
      version: 1,
      employeeId: String(values.employeeId || ''),
      name: String(values.name || ''),
      role: String(values.role || ''),
      store: String(values.store || ''),
      dateStart: String(values.dateStart || ''),
      dateEnd: String(values.dateEnd || ''),
      createdAt: Number(values.createdAt) || Date.now(),
      dailyRows: Array.isArray(values.dailyRows)
        ? values.dailyRows.map(function (row) { return Object.assign({}, row); })
        : [],
      summary: Object.assign({}, values.summary || {}),
      status: values.status === '已完成' ? '已完成' : '待补录'
    };
  }

  function readEmployeeReconciliationSnapshot(raw, context) {
    try {
      var value = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!value || value.version !== 1 || !Array.isArray(value.dailyRows)) return null;
      ['employeeId', 'name', 'role', 'store', 'dateStart', 'dateEnd'].forEach(function (key) {
        if (typeof value[key] !== 'string') throw new Error('invalid snapshot scalar');
      });
      if (!value.employeeId || !value.dateStart || !value.dateEnd) return null;
      if (!value.summary || typeof value.summary !== 'object') return null;
      if (value.status !== '已完成' && value.status !== '待补录') return null;
      var validRows = value.dailyRows.every(function (row) {
        return row && typeof row.dateKey === 'string' && typeof row.allocated === 'boolean' &&
          typeof row.requiresAttendance === 'boolean' && typeof row.employeeId === 'string' &&
          row.employeeId === value.employeeId && typeof row.name === 'string' && typeof row.role === 'string' &&
          ['before', 'deducted', 'received', 'after', 'hours'].every(function (key) {
            return isFinite(Number(row[key]));
          }) && typeof row.clockStatus === 'string';
      });
      if (!validRows) return null;
      if (!context || value.employeeId !== context.employeeId || value.store !== context.store ||
          value.dateStart !== context.dateStart || value.dateEnd !== context.dateEnd) return null;
      return value;
    } catch (error) {
      return null;
    }
  }

  root.TipOutSummaryUi = {
    summarizeDailyResults: summarizeDailyResults,
    countPendingDates: countPendingDates,
    buildDetailUrl: buildDetailUrl,
    buildSummaryHistoryState: buildSummaryHistoryState,
    readSummaryHistoryState: readSummaryHistoryState,
    isParticipatingEmployeeRecord: isParticipatingEmployeeRecord,
    resolveRequiresAttendance: resolveRequiresAttendance,
    aggregateEmployeeDailyDatasets: aggregateEmployeeDailyDatasets,
    resolveSummaryView: resolveSummaryView,
    buildEmployeeReconciliationDetailUrl: buildEmployeeReconciliationDetailUrl,
    buildEmployeeReconciliationSnapshot: buildEmployeeReconciliationSnapshot,
    readEmployeeReconciliationSnapshot: readEmployeeReconciliationSnapshot,
    EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY: EMPLOYEE_RECONCILIATION_SNAPSHOT_KEY
  };
})(window);
