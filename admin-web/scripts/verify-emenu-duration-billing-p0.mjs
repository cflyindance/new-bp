import { spawnSync } from "node:child_process";

const checks = [
  "scripts/verify-duration-billing-rules-store.mjs",
  "scripts/verify-floor-plan-duration-billing-bind.mjs",
  "scripts/verify-emenu-duration-billing-bridge.mjs",
  "scripts/verify-emenu-duration-billing-session.mjs",
  "scripts/verify-emenu-duration-billing-landing.mjs",
  "scripts/verify-emenu-duration-billing-end.mjs",
  "scripts/verify-emenu-duration-billing-surcharge.mjs",
];

for (const script of checks) {
  const result = spawnSync(process.execPath, [script], {
    cwd: process.cwd(),
    encoding: "utf8",
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) {
    if (result.error) console.error(result.error.message);
    console.error(`FAILED: ${script}`);
    process.exit(result.status ?? 1);
  }
}

console.log(`verify-emenu-duration-billing-p0: ${checks.length} suites passed`);
