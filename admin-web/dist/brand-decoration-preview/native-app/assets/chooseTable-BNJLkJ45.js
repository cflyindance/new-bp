import { d as __toESM } from "./toast-C8a1ReSo.js";
import { C as getMarginappFetchConfig, r as getCookie } from "./utils-Cdx9DbDR.js";
import { da as require_cloneDeep } from "./actions-BwRPwnFF.js";
import { O as postMarginappConfig } from "./kioskConfigApi-68IKDHob.js";
//#region source-snapshot/src/utils/chooseTable.js
var import_cloneDeep = /* @__PURE__ */ __toESM(require_cloneDeep());
var getChooseTableStatus = async (clear) => {
	try {
		const res = await getMarginappFetchConfig();
		if (res.data?.result?.successful) {
			let obj = (res.data.marginAppConfigTypes || []).find((l) => l.product == "KIOSKLITE");
			if (obj && obj.data) {
				let arr = JSON.parse(obj.data);
				if (arr.configList) {
					const kioskTableInUseConfig = arr.configList.find((e) => e.id === 41);
					if (kioskTableInUseConfig) {
						const kioskTableInUse = kioskTableInUseConfig.value || [];
						const kioskLicense = getCookie("kioskLicense");
						const kioskTableInUseFiltered = kioskTableInUse.filter((_) => _.lisense !== kioskLicense);
						if (clear && kioskTableInUseFiltered.length < kioskTableInUse.length) {
							kioskTableInUseConfig.value = kioskTableInUseFiltered;
							await postMarginappConfig(JSON.stringify((0, import_cloneDeep.default)(arr)), getCookie("sessionKey"));
						}
						return kioskTableInUseFiltered;
					}
				}
			}
		}
	} catch (e) {}
};
//#endregion
export { getChooseTableStatus as t };
