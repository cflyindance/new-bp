import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync('src/team/tips/programs/distribution.js.txt', 'utf8');
const match = source.match(/    function setSummaryView\(view, options\) \{[\s\S]*?\n    \}/);
assert.ok(match, 'summary switch handler exists');

function exercise(initialView, nextView, mode = 'push') {
  const calls = [];
  const browser = {
    location: {
      hash: `#/team/tips/distribution${initialView === 'employee' ? '?view=employee' : ''}`,
      href: 'http://localhost/#/team/tips/distribution',
      replace() { calls.push('reload'); },
    },
  };
  const history = {
    state: { tipoutSummaryUiState: { activeView: initialView }, menusifuTeamTips: { viewHref: `/team/tips/distribution${initialView === 'employee' ? '?view=employee' : ''}` } },
    pushState(state, _title, url) { calls.push('push'); this.state = state; browser.location.hash = url.slice(url.indexOf('#')); },
    replaceState(state, _title, url) { calls.push('replace'); this.state = state; if (url) browser.location.hash = url.slice(url.indexOf('#')); },
  };
  const context = {
    activeSummaryView: initialView, window: browser, history,
    TipOutSummaryUi: { normalizeSummaryView: (value) => value === 'employee' ? 'employee' : 'date', buildSummaryViewHref: (value) => value === 'employee' ? 'index.html?view=employee' : 'index.html' },
    syncSummaryViewUi: () => calls.push('sync'),
    captureSummaryUiState: () => { calls.push('capture'); history.replaceState({ ...history.state, tipoutSummaryUiState: { activeView: context.activeSummaryView } }, ''); },
    renderSummaryViews: () => calls.push('render'),
  };
  vm.createContext(context);
  vm.runInContext(`${match[0]}; setSummaryView(${JSON.stringify(nextView)}, {historyMode:${JSON.stringify(mode)}});`, context);
  return { calls, browser, history, context };
}

const employee = exercise('date', 'employee');
assert.equal(employee.browser.location.hash, '#/team/tips/distribution?view=employee');
assert.deepEqual(employee.calls, ['capture', 'replace', 'sync', 'push', 'capture', 'replace', 'render']);
assert.equal(employee.history.state.tipoutSummaryUiState.activeView, 'employee');
assert.equal(employee.history.state.menusifuTeamTips.viewHref, '/team/tips/distribution?view=employee');
assert.equal(employee.context.activeSummaryView, 'employee');

const date = exercise('employee', 'date');
assert.equal(date.browser.location.hash, '#/team/tips/distribution');
assert.deepEqual(date.calls, ['capture', 'replace', 'sync', 'push', 'capture', 'replace', 'render']);

const same = exercise('date', 'date');
assert.deepEqual(same.calls, []);

const replace = exercise('date', 'date', 'replace');
assert.deepEqual(replace.calls, ['capture', 'replace', 'sync', 'replace', 'capture', 'replace', 'render']);

console.log('TipOut summary switch performance verification passed.');
