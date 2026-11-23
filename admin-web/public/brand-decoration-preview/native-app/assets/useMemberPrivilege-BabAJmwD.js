import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { Vi as hasActiveMemberPrivilege } from "./actions-BwRPwnFF.js";
//#region source-snapshot/src/hooks/useMemberPrivilege.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useMemberPrivilege(crm) {
	const [, refresh] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		if (!hasActiveMemberPrivilege(crm)) return;
		let timer;
		const schedule = () => {
			const now = Date.now();
			const expiries = (crm.memberCRMInfo.privileges || []).filter((privilege) => privilege?.status === "ACTIVE").map((privilege) => privilege.expireTime).filter((expiry) => expiry != null && !(typeof expiry === "string" && expiry.trim() === "") && (typeof expiry === "number" || typeof expiry === "string") && Number.isFinite(Number(expiry)) && Number(expiry) >= now);
			if (!expiries.length) return;
			const delay = Math.min(Math.min(...expiries.map(Number)) - now + 1, 2147483647);
			timer = setTimeout(() => {
				refresh((value) => value + 1);
				schedule();
			}, delay);
		};
		schedule();
		return () => clearTimeout(timer);
	}, [crm]);
	return hasActiveMemberPrivilege(crm);
}
var withMemberPrivilege = (Component) => function MemberPrivilegeConsumer(props) {
	const hasMemberPrivilege = useMemberPrivilege(props.crm);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Component, {
		...props,
		hasMemberPrivilege
	});
};
//#endregion
export { withMemberPrivilege as n, useMemberPrivilege as t };
