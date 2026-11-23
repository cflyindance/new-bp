import { J as axios_default, K as serverURL, r as getCookie } from "./utils-Cdx9DbDR.js";
//#region source-snapshot/src/api/apiPos.js
function axiosXML(obj) {
	return new Promise((resolve, reject) => {
		axios_default({
			method: "post",
			url: obj.url,
			data: obj.data,
			timeout: 60 * 1e3,
			headers: { "Content-Type": "text/xml; charset=\"utf-8\"" }
		}).then((res) => {
			resolve(res);
		}).catch((err) => {
			reject(err);
		});
	});
}
function getLicenseList() {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FindAppInstancesType><app:fetchDetails>true</app:fetchDetails><app:ipAddress>${window.location.hostname}</app:ipAddress><app:type>KIOSK</app:type></app:FindAppInstancesType></soapenv:Body></soapenv:Envelope>`
	});
}
function getLicenseInfo() {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FindAppInstancesType><app:name>${getCookie("kioskLicense")}</app:name><app:fetchDetails>true</app:fetchDetails><app:ipAddress>${window.location.hostname}</app:ipAddress><app:type>KIOSK</app:type></app:FindAppInstancesType></soapenv:Body></soapenv:Envelope>`
	});
}
function getPayDevices() {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FindDevicesType><app:type>PAYMENT_TERMINAL</app:type></app:FindDevicesType></soapenv:Body></soapenv:Envelope>`
	});
}
function getChargeList() {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: "<?xml version=\"1.0\" encoding=\"UTF-8\"?><soapenv:Envelope xmlns:soapenv=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:app=\"http://ws.kpos.com/app\"><soapenv:Header/><soapenv:Body><app:ListChargesType></app:ListChargesType></soapenv:Body></soapenv:Envelope>"
	});
}
function getOrderInfo(orderId) {
	let sessionKey = getCookie("sessionKey");
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:FetchOrderType><app:orderId>${orderId}</app:orderId><app:fetchPayments>true</app:fetchPayments><app:userAuth><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:FetchOrderType></soapenv:Body></soapenv:Envelope>`
	});
}
function getKioskConfigFromPos() {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:ListSystemConfigurationsType><app:fetchDetails>true</app:fetchDetails><app:adminRequest>false</app:adminRequest></app:ListSystemConfigurationsType></soapenv:Body></soapenv:Envelope>`
	});
}
function saveKioskConfigFromPos(params, userId) {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:UpdateSystemConfigurationType>${params}<app:userAuth><app:userId>${userId}</app:userId></app:userAuth></app:UpdateSystemConfigurationType></soapenv:Body></soapenv:Envelope>`
	});
}
function savePaymentRecordType(params, userId, sessionKey) {
	return axiosXML({
		url: serverURL + "ws/kposService",
		data: `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:app="http://ws.kpos.com/app"><soapenv:Header/><soapenv:Body><app:SavePaymentRecordType>${params}<app:userAuth><app:userId>${userId}</app:userId><app:sessionKey>${sessionKey}</app:sessionKey></app:userAuth></app:SavePaymentRecordType></soapenv:Body></soapenv:Envelope>`
	});
}
//#endregion
export { getOrderInfo as a, savePaymentRecordType as c, getLicenseList as i, getKioskConfigFromPos as n, getPayDevices as o, getLicenseInfo as r, saveKioskConfigFromPos as s, getChargeList as t };
