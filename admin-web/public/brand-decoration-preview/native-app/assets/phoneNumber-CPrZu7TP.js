var normalizePhoneDigits = (value) => String(value || "").replace(/\D/g, "").slice(0, 10);
var formatUSPhoneInput = (value) => {
	const digits = normalizePhoneDigits(value);
	if (digits.length <= 3) return digits;
	if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
	return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
};
var isValidUSPhone = (value) => normalizePhoneDigits(value).length === 10;
var getUSPhoneDigits = (value) => {
	const phone = Array.isArray(value) ? value[0]?.number : value?.number ?? value;
	return String(phone || "").replace(/\D/g, "").replace(/^1(?=\d{10}$)/, "");
};
var isPhoneBlacklisted = (phone, selfConfig) => {
	const digits = getUSPhoneDigits(phone);
	const blacklist = selfConfig?.configMap?.[`id_73`];
	return digits.length === 10 && Array.isArray(blacklist) && blacklist.some((value) => getUSPhoneDigits(value) === digits);
};
var getOrderPhoneDigits = (currentOrder) => getUSPhoneDigits(currentOrder?.customer?.phone) || getUSPhoneDigits(currentOrder?.saveOrderResult?.customer?.phone);
var isCRMPhoneVerified = (crm, phone) => {
	const member = crm?.memberCRMInfo;
	const digits = getUSPhoneDigits(phone);
	return !!((member?.userId || member?.id) && digits.length === 10 && crm?.isCRMAuthCodeVerified === true && getUSPhoneDigits(crm?.crmAuthCodeVerifiedPhone) === digits && getUSPhoneDigits(member.phone) === digits);
};
//#endregion
export { isPhoneBlacklisted as a, isCRMPhoneVerified as i, getOrderPhoneDigits as n, isValidUSPhone as o, getUSPhoneDigits as r, normalizePhoneDigits as s, formatUSPhoneInput as t };
