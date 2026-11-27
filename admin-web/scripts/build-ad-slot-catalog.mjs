import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
await build({entryPoints:[fileURLToPath(new URL('../src/marketing-display/ad-material-batch.ts',import.meta.url))],bundle:true,format:'iife',globalName:'KioskAdMaterialBatch',outfile:fileURLToPath(new URL('../dist/Configuration center/assets/kiosk-ad-material-batch.js',import.meta.url))});
await build({entryPoints:[fileURLToPath(new URL('../src/marketing-display/default-ads.ts',import.meta.url))],bundle:true,format:'iife',globalName:'KioskDefaultAds',outfile:fileURLToPath(new URL('../dist/Configuration center/assets/kiosk-default-ads.js',import.meta.url))});
await build({entryPoints:[fileURLToPath(new URL('../src/marketing-display/ad-slot-catalog.ts',import.meta.url))],bundle:true,format:'iife',globalName:'KioskAdSlots',outfile:fileURLToPath(new URL('../dist/Configuration center/assets/kiosk-ad-slot-catalog.js',import.meta.url))});
console.log('Built shared advertising slot contract for native pages');
await build({entryPoints:[fileURLToPath(new URL('../src/marketing-display/ad-activity-actions.ts',import.meta.url))],bundle:true,format:'iife',globalName:'KioskAdActivities',outfile:fileURLToPath(new URL('../dist/Configuration center/assets/kiosk-ad-activities.js',import.meta.url))});
await build({entryPoints:[fileURLToPath(new URL('../src/marketing-display/ad-target-policy.ts',import.meta.url))],bundle:true,format:'iife',globalName:'KioskAdTargetPolicy',outfile:fileURLToPath(new URL('../dist/Configuration center/assets/kiosk-ad-target-policy.js',import.meta.url))});
