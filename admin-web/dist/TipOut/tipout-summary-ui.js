(function (root) {
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
  function buildDetailUrl(context) {
    var query = ['date=' + encodeURIComponent(context.date || '')];
    if (context.store) query.push('store=' + encodeURIComponent(context.store));
    if (context.fromSummary) query.push('from=summary');
    return 'detail.html?' + query.join('&');
  }
  function buildSummaryHistoryState(values) {
    return { tipoutSummaryUiState: {
      dateStart: values.dateStart || '', dateEnd: values.dateEnd || '',
      store: values.store || '', roles: (values.roles || []).slice(),
      employees: (values.employees || []).slice(), scrollY: Number(values.scrollY) || 0,
      returnDate: values.returnDate || '',
    } };
  }
  function readSummaryHistoryState(state) {
    return state && state.tipoutSummaryUiState ? state.tipoutSummaryUiState : null;
  }
  root.TipOutSummaryUi = { summarizeDailyResults, buildDetailUrl, buildSummaryHistoryState, readSummaryHistoryState };
})(window);
