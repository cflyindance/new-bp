import { q as serverURL, r as getCookie } from "./utils-Cdx9DbDR.js";
//#region source-snapshot/src/utils/getImageHost.js
var IMG_HOST = getCookie("kioskServerIP").includes("22080") ? getCookie("kioskServerIP") : serverURL;
//#endregion
export { IMG_HOST as t };
