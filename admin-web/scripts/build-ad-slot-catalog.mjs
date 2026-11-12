import {build} from 'esbuild';
import {fileURLToPath} from 'node:url';
await build({entryPoints:[fileURLToPath(new URL('../src/marketing-display/ad-slot-catalog.ts',import.meta.url))],bundle:true,format:'iife',globalName:'KioskAdSlots',outfile:fileURLToPath(new URL('../dist/Configuration center/assets/kiosk-ad-slot-catalog.js',import.meta.url))});
console.log('Built shared advertising slot contract for native pages');
