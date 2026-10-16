import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NAV_MODULES, DEVICE_MANAGEMENT_HARDWARE_SUBNAV, navModuleChildrenAsSheetSubnav, getActiveNavModuleSheetSubPath, getDeviceManagementHardwareDefaultPath } from '../src/config/navigation';

const module = NAV_MODULES.find(m => m.id === 'device-management')!;
const items = navModuleChildrenAsSheetSubnav(module);
const hardware = items.find(i => i.id === 'dm-hardware')!;
assert.deepEqual(hardware.sidebarChildren?.map(i => i.title), ['支付设备','税控机','钱箱','来电显示','路由器','POS','POS GO','KDS','叫号屏','打印机','电子秤','Kiosk','CDS','eMenu']);
assert.deepEqual(hardware.sidebarChildren?.map(i => i.path), DEVICE_MANAGEMENT_HARDWARE_SUBNAV.map(i => i.path));
assert.equal(items.find(i => i.id === 'dm-settings')!.sidebarChildren, undefined);
assert.equal(getDeviceManagementHardwareDefaultPath(), '/device-management/hardware/payments');
for (const leaf of DEVICE_MANAGEMENT_HARDWARE_SUBNAV) assert.equal(getActiveNavModuleSheetSubPath(leaf.path,module),hardware.path);
const main = readFileSync(new URL('../src/main.ts',import.meta.url),'utf8');
assert.ok(!main.includes('renderDeviceManagementHardwareSidebar'));
assert.ok(!main.includes('device-management-hardware-subnav'));
assert.ok(main.includes('renderDeviceManagementFiscalHardwarePage(path)'));
assert.ok(main.includes('renderDeviceManagementPrinterHardwarePage(path)'));
console.log('hardware secondary navigation: PASS');
