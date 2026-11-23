import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { K as serverURL } from "./utils-Cdx9DbDR.js";
import { Dr as getSingleItemLanguageName, mr as getDishItemLanguage, ua as isMembershipCard } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
//#region source-snapshot/src/component/imgCard/imgCard.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var imgCard_module_default = {
	imgBox: "imgBox___Wj6yR",
	placeholder: "placeholder___bsL-f",
	imgBg: "imgBg___alHcZ",
	itemImg: "itemImg___RXgu-",
	imgCover: "imgCover___LBke-",
	imgContain: "imgContain___rKqC5"
};
//#endregion
//#region source-snapshot/src/assets/images/noimage-dish.png
var noimage_dish_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAMgBAMAAAApXhtbAAAAIVBMVEXt8PK9vb3a3N3Ky8vDw8TAwMHU1dfP0NHq7e/n6evh4+X++P65AAAFYklEQVR42uzBgQAAAACAoP2pF6kCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGD26BAJQSgKoKhJqS84LsBxAToyYzVodxVmt2ChsgYC64RhoAG//MY57eYLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAdhTn5/FWJzKh+d5fsSOLS/TeiVxTtGX0DMmjisFjPg9TLvuXEYbkc43BaT5/Uy5qP2FIRvsYdezdvW4TQRSG4SEEO97uJAYkKlukoMSIhi7b0S4FoozvAEvQBxGoHQSiJYJwneTHdgZpkzORrLOfrPftTruPVjuzxczIG9v7bQbIOvtui965Y7sHIOttbIt2vbHdA5A1N7FFe87Y1lcDZN01tmjojC1VNSBrz1Y5Y0tjAyQJgXw2QFLSARnUgKQkBPLHADlPBqRqADlPB+TMALlIBaRqALlIBuTMALlMBGRQA3KZCsixAXKVCMgEkEUaID0D5CoRkBNAlmmA1IAskwDpGSCLNEBOAFklATIBZJUCyJYBskwCZBuQVRIgY0CuUwCpAblOAKQyQFYpgPQBuU4B5BMgWQIgY0CyBEAmgGQJgBggWd2DVIBkCYD0AMkSALkPSJYAyD1AsgRATgHJ6x5kDEhe9yBTQPK6B5kBktc9yASQvO5BakDyANnw7g7SAJLXPYgBkgfIhgeIWICIBYhYgIgFiFiAiAWIWICIBYhYgIgFiFiAiAWIWICIBYhYgIgFiFiAiAWIWICIZbcGiBcgm15jRT0EJKjaihoCEtTEitoDJKgZIFpNrahHgAQ1tqJ2AQnqxIp6AkhQD6yoA0CC6ltRzwEJasuKGgES1I4VNQckqknZNgSQqE6toF1AnIKXWQeAhNWzgkaAhLXTmNtwDkhc05JPCCBxbZvbASCBVeY2AiSyqf/vHZDIjs3pNSChVY0DMgcktrG3xgIkMH9veAhIdLPbP+mARNe3W3oPSGD+K/I4ARKY/xU5BKSLpjcvsQDpoqq21oa/0lWcShrcT2vtVVrEub3R7VtLb9IyjhqPbjBr2YIcpWXcjhCQJ7I3T6u40CW+wUf7r7etHukLIFHtPLWsF0cpi1vaOumbrXp244sESGAlj3cGiFMwyA9AnIJBtgBxCgZJU0CcgkH6gDgFg6QZIE7BID1AnIJB0j4gTsEggxkgTrEgafABkJDKH+/flw0gTmEgeYDkAbLpASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYv1jj95tGggCAIhKJIhw+YgYUQF0QEgIFRBQgN2BE/dty9oKVnfSBO/lE40hMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBLzNaaXhYLtfYzpaaFge29jelwo2N55TN8LBdu7G9PfQsEOjuPmdaFgD/fj5rBQsIv/cfW7ULCPh/ef58/TQgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAX9uBAAAAAAADI/7URVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWlPTgQAAAAABDkbz3IFQAAAAAAAAAAAAAAAAAA8BIBwjQc6Y6DvQAAAABJRU5ErkJggg==";
//#endregion
//#region source-snapshot/src/assets/images/benefitIcon.png
var benefitIcon_default = "data:image/png;base64,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";
//#endregion
//#region source-snapshot/src/utils/imagePathCache.js
/**
* 全局图片路径缓存管理器
* 用于缓存商品id与图片路径的对应关系，避免重复查找
*/
var imagePathCache = /* @__PURE__ */ new Map();
var noImageCache = /* @__PURE__ */ new Set();
var checkedImageCache = /* @__PURE__ */ new Set();
var imageSourceCache = /* @__PURE__ */ new Map();
var pendingImageChecks = /* @__PURE__ */ new Map();
var possibleExtensions = [
	"png",
	"jpeg",
	"jpg",
	"PNG",
	"JPEG",
	"JPG"
];
var cacheGeneration = 0;
var getImageSourceKey = (item, baseURL) => JSON.stringify([
	baseURL,
	item?.thumbPath || "",
	item?.name || "",
	item?.fieldDisplayNameGroups || []
]);
function syncImageCacheSource(item, baseURL) {
	const id = item?.id || item?.oId;
	if (!id) return;
	const key = String(id);
	const source = getImageSourceKey(item, baseURL);
	if (imageSourceCache.has(key) && imageSourceCache.get(key) !== source) {
		imagePathCache.delete(key);
		noImageCache.delete(key);
		checkedImageCache.delete(key);
		pendingImageChecks.delete(key);
	}
	imageSourceCache.set(key, source);
}
function hasCheckedItemImage(item) {
	const id = item?.id || item?.oId;
	return !!id && checkedImageCache.has(String(id));
}
var checkImage = (url) => new Promise((resolve) => {
	const image = new Image();
	image.onload = () => resolve(true);
	image.onerror = () => resolve(false);
	image.src = url;
});
async function probeItemImagePath(item, baseURL) {
	if (!item) return null;
	syncImageCacheSource(item, baseURL);
	const id = item.id || item.oId;
	const key = id && String(id);
	if (key && checkedImageCache.has(key)) return getCachedImagePath(id);
	if (key && pendingImageChecks.has(key)) return pendingImageChecks.get(key);
	const source = getImageSourceKey(item, baseURL);
	const generation = cacheGeneration;
	const name = getSingleItemLanguageName(item.fieldDisplayNameGroups, "en") || item.name;
	const thumbPath = item.thumbPath;
	const urls = [];
	if (thumbPath) urls.push(/^(https?:)?\/\//i.test(thumbPath) ? thumbPath : baseURL + thumbPath);
	if (name) possibleExtensions.forEach((extension) => {
		urls.push(`${baseURL}img/gallery/kiosk/${encodeURIComponent(`${name}.${extension}`)}`);
	});
	const check = (async () => {
		let found = null;
		for (const url of urls) if (await checkImage(url)) {
			found = url;
			break;
		}
		if (key && generation === cacheGeneration && imageSourceCache.get(key) === source) {
			if (found) setCachedImagePath(id, found);
			else setCachedNoImage(id);
			checkedImageCache.add(key);
		}
		return found;
	})();
	if (key) pendingImageChecks.set(key, check);
	try {
		return await check;
	} finally {
		if (key && pendingImageChecks.get(key) === check) pendingImageChecks.delete(key);
	}
}
async function probeComboItemImages(groups, baseURL) {
	const items = groups.reduce((all, group) => all.concat(group.sideDishList || []), []);
	let nextIndex = 0;
	const workers = Array.from({ length: Math.min(4, items.length) }, async () => {
		while (nextIndex < items.length) {
			const item = items[nextIndex++];
			try {
				await probeItemImagePath(item, baseURL);
			} catch {}
		}
	});
	await Promise.all(workers);
}
/**
* 获取缓存的图片路径（仅返回真实图片路径，不含默认图）
* @param {string|number} itemId - 商品id
* @returns {string|null} 缓存的图片路径，如果不存在则返回null
*/
function getCachedImagePath(itemId) {
	if (!itemId || noImageCache.has(String(itemId))) return null;
	return imagePathCache.get(String(itemId)) || null;
}
/**
* 设置图片路径到缓存
* @param {string|number} itemId - 商品id
* @param {string} imagePath - 图片路径
*/
function setCachedImagePath(itemId, imagePath) {
	if (!itemId || !imagePath) return;
	const key = String(itemId);
	imagePathCache.set(key, imagePath);
	noImageCache.delete(key);
}
/**
* 标记商品已确认无真实图片（使用默认图），避免重复查找
* @param {string|number} itemId - 商品id
*/
function setCachedNoImage(itemId) {
	if (!itemId) return;
	const key = String(itemId);
	noImageCache.add(key);
	imagePathCache.delete(key);
}
function hasRealItemImage(itemInfo) {
	if (!itemInfo) return false;
	const itemId = itemInfo.id || itemInfo.oId;
	if (hasCheckedItemImage(itemInfo)) return !!getCachedImagePath(itemId);
	return !!itemInfo.thumbPath || !!getCachedImagePath(itemId);
}
//#endregion
//#region source-snapshot/src/component/imgCard/index.js
var import_jsx_runtime = require_jsx_runtime();
var ItemImage = (props) => {
	const { itemInfo, selfConfig, t, deferLoad = false, lazy = false, hideWhenMissing = false, wrapperClassName } = props;
	const [isLoading, setIsLoading] = (0, import_react.useState)(true);
	const [imgUrl, setImgUrl] = (0, import_react.useState)("");
	const membershipCard = isMembershipCard(itemInfo);
	const [missing, setMissing] = (0, import_react.useState)(false);
	const [visible, setVisible] = (0, import_react.useState)(false);
	const boxRef = (0, import_react.useRef)(null);
	const itemId = itemInfo?.id || itemInfo?.oId || null;
	const objectFit = selfConfig?.configMap?.id_18 ? "cover" : "contain";
	const itemName = (0, import_react.useMemo)(() => getDishItemLanguage(itemInfo.fieldDisplayNameGroups, "en") || itemInfo.name, [itemInfo.fieldDisplayNameGroups, itemInfo.name]);
	const canProbe = !deferLoad && (!lazy || visible);
	(0, import_react.useEffect)(() => {
		if (membershipCard || deferLoad || !lazy || visible) return;
		if (!window.IntersectionObserver) {
			setVisible(true);
			return;
		}
		let root = boxRef.current?.parentElement;
		while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) root = root.parentElement;
		const observer = new IntersectionObserver((entries) => {
			if (entries.some((entry) => entry.isIntersecting)) {
				setVisible(true);
				observer.disconnect();
			}
		}, {
			root,
			rootMargin: "300px 0px",
			threshold: 0
		});
		if (boxRef.current) observer.observe(boxRef.current);
		return () => observer.disconnect();
	}, [
		membershipCard,
		deferLoad,
		lazy,
		visible
	]);
	(0, import_react.useEffect)(() => {
		if (membershipCard) return;
		let active = true;
		setIsLoading(true);
		setImgUrl("");
		setMissing(false);
		if (!canProbe) return;
		probeItemImagePath(itemInfo, serverURL).then((path) => {
			if (!active) return;
			setImgUrl(path || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAyAAAAMgBAMAAAApXhtbAAAAIVBMVEXt8PK9vb3a3N3Ky8vDw8TAwMHU1dfP0NHq7e/n6evh4+X++P65AAAFYklEQVR42uzBgQAAAACAoP2pF6kCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGD26BAJQSgKoKhJqS84LsBxAToyYzVodxVmt2ChsgYC64RhoAG//MY57eYLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAdhTn5/FWJzKh+d5fsSOLS/TeiVxTtGX0DMmjisFjPg9TLvuXEYbkc43BaT5/Uy5qP2FIRvsYdezdvW4TQRSG4SEEO97uJAYkKlukoMSIhi7b0S4FoozvAEvQBxGoHQSiJYJwneTHdgZpkzORrLOfrPftTruPVjuzxczIG9v7bQbIOvtui965Y7sHIOttbIt2vbHdA5A1N7FFe87Y1lcDZN01tmjojC1VNSBrz1Y5Y0tjAyQJgXw2QFLSARnUgKQkBPLHADlPBqRqADlPB+TMALlIBaRqALlIBuTMALlMBGRQA3KZCsixAXKVCMgEkEUaID0D5CoRkBNAlmmA1IAskwDpGSCLNEBOAFklATIBZJUCyJYBskwCZBuQVRIgY0CuUwCpAblOAKQyQFYpgPQBuU4B5BMgWQIgY0CyBEAmgGQJgBggWd2DVIBkCYD0AMkSALkPSJYAyD1AsgRATgHJ6x5kDEhe9yBTQPK6B5kBktc9yASQvO5BakDyANnw7g7SAJLXPYgBkgfIhgeIWICIBYhYgIgFiFiAiAWIWICIBYhYgIgFiFiAiAWIWICIBYhYgIgFiFiAiAWIWICIZbcGiBcgm15jRT0EJKjaihoCEtTEitoDJKgZIFpNrahHgAQ1tqJ2AQnqxIp6AkhQD6yoA0CC6ltRzwEJasuKGgES1I4VNQckqknZNgSQqE6toF1AnIKXWQeAhNWzgkaAhLXTmNtwDkhc05JPCCBxbZvbASCBVeY2AiSyqf/vHZDIjs3pNSChVY0DMgcktrG3xgIkMH9veAhIdLPbP+mARNe3W3oPSGD+K/I4ARKY/xU5BKSLpjcvsQDpoqq21oa/0lWcShrcT2vtVVrEub3R7VtLb9IyjhqPbjBr2YIcpWXcjhCQJ7I3T6u40CW+wUf7r7etHukLIFHtPLWsF0cpi1vaOumbrXp244sESGAlj3cGiFMwyA9AnIJBtgBxCgZJU0CcgkH6gDgFg6QZIE7BID1AnIJB0j4gTsEggxkgTrEgafABkJDKH+/flw0gTmEgeYDkAbLpASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYgEiFiBiASIWIGIBIhYgYv1jj95tGggCAIhKJIhw+YgYUQF0QEgIFRBQgN2BE/dty9oKVnfSBO/lE40hMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBJjSIwhMYbEGBLzNaaXhYLtfYzpaaFge29jelwo2N55TN8LBdu7G9PfQsEOjuPmdaFgD/fj5rBQsIv/cfW7ULCPh/ef58/TQgEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAX9uBAAAAAAADI/7URVFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVWlPTgQAAAAABDkbz3IFQAAAAAAAAAAAAAAAAAA8BIBwjQc6Y6DvQAAAABJRU5ErkJggg==");
			if (!path) {
				setMissing(true);
				setIsLoading(false);
			}
		}).catch(() => {
			if (!active) return;
			setImgUrl(noimage_dish_default);
			setMissing(true);
			setIsLoading(false);
		});
		return () => {
			active = false;
		};
	}, [
		membershipCard,
		canProbe,
		itemId,
		itemInfo.thumbPath,
		itemName
	]);
	if (membershipCard) {
		const content = /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: imgCard_module_default.imgBox,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: benefitIcon_default,
				alt: itemName || t("label_dish"),
				className: `${imgCard_module_default.imgContain} ${imgCard_module_default.itemImg}`
			})
		});
		return wrapperClassName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: wrapperClassName,
			children: content
		}) : content;
	}
	if (hideWhenMissing && missing) return null;
	const content = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: boxRef,
		className: imgCard_module_default.imgBox,
		style: { visibility: isLoading ? "hidden" : "visible" },
		children: [objectFit === "contain" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: imgCard_module_default.imgBg,
			style: { backgroundImage: imgUrl ? `url(${JSON.stringify(imgUrl)})` : "none" }
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: imgUrl || void 0,
			alt: itemName || t("label_dish"),
			className: `${objectFit === "cover" ? imgCard_module_default.imgCover : imgCard_module_default.imgContain} ${imgCard_module_default.itemImg}`,
			onLoad: () => setIsLoading(false),
			onError: () => {
				setImgUrl(noimage_dish_default);
				setIsLoading(false);
			}
		})]
	});
	return wrapperClassName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: wrapperClassName,
		children: content
	}) : content;
};
var ImgCard = (props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ItemImage, { ...props }, JSON.stringify([
	serverURL,
	props.itemInfo?.id || props.itemInfo?.oId || "",
	props.itemInfo?.thumbPath || "",
	props.itemInfo?.name || "",
	props.itemInfo?.fieldDisplayNameGroups || []
]));
var imgCard_default = withTranslation()((0, import_react.memo)(ImgCard));
//#endregion
//#region source-snapshot/src/assets/images/star.png
var star_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADYAAAA2CAMAAAC7m5rvAAAAllBMVEUAAAD2kBLyiBH0kBP1khX0kRT1lRf4oRzxhA/xgg38siPtcwf7riH2lxfzjhPudgn4oBvxhA/0kxb7sCTucwfzkhX9tCT3nhvtbwX2nBnyiBDrcwj8tyb7riLvfQz8uCfrawT1kxX8siPscgf9tST9uif8tCXtcAb1lBXzjBL4oRv3mhjyhg76qR7wfwzvdwj8siLtcAZrWjNvAAAAKHRSTlMAEB/vj2A/398vjYzf39/fz8+/YF9QH+/vem9A7+/vv7+fT08/MJ+fS0oxsgAAAWtJREFUSMfN1mlzgjAQBmATbvCqCAhUW4+24cb//+dKkrFbBgSSmTLd78+82TWYXfybwliKWZYU8zQpFqpSbLeTYooio3RCdAl2JkSmuTUhChJWWkIIiSTCmlqJhyXUaWIKr5kigVh3asJZJjRML2mKsUwXOKJJFWcBnqqQmT/CmjLQRPWSc8ZdukUTVZtNctjMgVHVlDHaX3wqgVGXMncZRMgpS2AQVxS2/1ztT1WbZT+sWLpPkqJNRRVn4KiirhfGzqGi1ctSxup6+XmD0Vl75/1wv3PFWdKXVtN6fbMvHz5j1xbrpmVpi7mM8Yq/Nu1DgoK0o33rmSMfSd/vVrCRhKgNAHZH8kg7ugM3y+GqO0l7+F5ezb5DBvr4Ve6mGf70DwfYFv3BZwrO/N2bAWqksALMwAKPFDBP8O+VK7G3CincrbDwO0VLm+ehWkQQJtYdhAkNk5DzDAsGrDNzLk9qKMU0b5Y1dHzp/QZM7WiNGMfEbgAAAABJRU5ErkJggg==";
//#endregion
export { benefitIcon_default as a, probeComboItemImages as i, imgCard_default as n, hasRealItemImage as r, star_default as t };
