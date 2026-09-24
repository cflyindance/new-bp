import assert from 'node:assert/strict';
import { readStoredScenario, writeStoredScenario, readRuntimeOverrides, writeRuntimeOverrides } from '../src/demo-scenario/demo-scenario-storage';
import type { DemoScenario } from '../src/demo-scenario/demo-scenario-types';
const data = new Map<string, string>();
let full = true;
const storage = {
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => { if (full) throw new Error('QuotaExceededError'); data.set(key, value); },
  removeItem: () => { throw new Error('Must not delete existing data'); },
} as unknown as Storage;
const scenario = { metadata: { scenarioId: 'quota-test' } } as DemoScenario;
assert.doesNotThrow(() => writeStoredScenario(storage, scenario));
assert.deepEqual(readStoredScenario(storage), scenario);
writeRuntimeOverrides(storage, [{ overrideId: 'a', kind: 'test', entityId: 'e', patch: {} }]);
assert.equal(readRuntimeOverrides(storage)[0].overrideId, 'a');
full = false;
writeStoredScenario(storage, scenario);
assert.equal(data.size, 1);
assert.deepEqual(readStoredScenario(storage), scenario);
console.log('Quota fallback and persistence recovery passed without deleting data.');
